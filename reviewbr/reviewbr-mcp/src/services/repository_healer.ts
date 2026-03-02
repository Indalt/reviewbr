import fs from 'node:fs';
import path from 'node:path';

export class RepositoryHealerService {
    private catalogPath = path.join(process.cwd(), 'data', 'sources', 'repositories_catalog.json');

    public async healRepositories(): Promise<string> {
        let catalog: any[];
        try {
            catalog = JSON.parse(fs.readFileSync(this.catalogPath, 'utf8'));
        } catch (e) {
            return `**Erro Crítico:** Não foi possível ler o repositório em ${this.catalogPath}. Erro: ${e}`;
        }

        const brokenRepos = catalog.filter(r => !r.access?.oaiPmh?.available || !r.access?.oaiPmh?.endpoint);
        if (brokenRepos.length === 0) {
            return "✅ **Diagnóstico:** Todos os repositórios OAI-PMH no catálogo estão ativos e operantes. Nada a consertar.";
        }

        let report = `## 🛠️ Auto-Healer OAI-PMH Report\n\n`;
        report += `Iniciando varredura em **${brokenRepos.length} repositórios inativos** para descoberta profunda de Endpoints via HTML Scraping.\n\n`;

        let fixedCount = 0;

        for (const repo of brokenRepos) {
            const baseUrl = repo.repository?.url;
            if (!baseUrl) continue;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);

                // Fetch the HTML of the homepage
                const response = await fetch(baseUrl, {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
                });
                clearTimeout(timeoutId);

                if (!response.ok) continue;

                const html = await response.text();

                // Advanced Discovery: Look for <link> tags or hrefs common in DSpace/OJS/Eprints
                const possibleEndpoints = this.extractOaiEndpoints(html, baseUrl);

                // Fallback: Default standard paths if scraping fails
                if (possibleEndpoints.length === 0) {
                    const baseNoTrailing = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
                    possibleEndpoints.push(`${baseNoTrailing}/oai/request`);
                    possibleEndpoints.push(`${baseNoTrailing}/server/oai/request`);
                    possibleEndpoints.push(`${baseNoTrailing}/oai/snk`);
                    possibleEndpoints.push(`${baseNoTrailing}/oai`);
                }

                // Test discovered endpoints
                let recoveredEndpoint = null;
                for (const testUrl of possibleEndpoints) {
                    const isValid = await this.verifyEndpoint(testUrl);
                    if (isValid) {
                        recoveredEndpoint = testUrl;
                        break;
                    }
                }

                if (recoveredEndpoint) {
                    repo.access.oaiPmh = repo.access.oaiPmh || {};
                    repo.access.oaiPmh.endpoint = recoveredEndpoint;
                    repo.access.oaiPmh.available = true;
                    repo.access.oaiPmh.verified = true;
                    repo.access.oaiPmh.lastVerified = new Date().toISOString().split('T')[0];
                    report += `- ✅ **${repo.institution.acronym}:** Link resgatado -> \`${recoveredEndpoint}\`\n`;
                    fixedCount++;
                } else {
                    report += `- ❌ **${repo.institution.acronym}:** Falhou. Endpoint não detectável na raiz.\n`;
                }

            } catch (error) {
                report += `- ⚠️ **${repo.institution.acronym}:** Erro de conexão ao acessar a raiz (${error}).\n`;
            }
        }

        if (fixedCount > 0) {
            fs.writeFileSync(this.catalogPath, JSON.stringify(catalog, null, 2));
            report += `\n🎯 **Conclusão:** ${fixedCount} repositórios foram reabilitados na arquitetura e escritos no catálogo JSON com sucesso.`;
        } else {
            report += `\n☠️ **Conclusão:** Nenhum repositório pôde ser resgatado. Os servidores raiz destas instituições não estão respondendo ou desabilitaram o serviço OAI-PMH definitivamente.`;
        }

        return report;
    }

    private extractOaiEndpoints(html: string, baseUrl: string): string[] {
        const endpoints = new Set<string>();

        // Match <link rel="...oai..." href="URL">
        const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
            const href = match[1];
            if (href.includes('/oai') || href.toLowerCase().includes('oai-pmh')) {
                endpoints.add(this.resolveUrl(baseUrl, href));
            }
        }

        // Also do a blunt search for any href containing /oai/request
        const hrefRegex = /href=["']([^"']+\/oai(?:[^"']*)?)["']/gi;
        while ((match = hrefRegex.exec(html)) !== null) {
            endpoints.add(this.resolveUrl(baseUrl, match[1]));
        }

        return Array.from(endpoints);
    }

    private resolveUrl(base: string, relative: string): string {
        try {
            return new URL(relative, base).href;
        } catch {
            return relative; // if it's already absolute or malformed
        }
    }

    private async verifyEndpoint(url: string): Promise<boolean> {
        const testUrl = `${url}?verb=Identify`;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(testUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                const text = await response.text();
                return text.includes('<OAI-PMH') && text.includes('<Identify');
            }
        } catch (e) {
            return false;
        }
        return false;
    }
}
