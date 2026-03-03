/**
 * Protocol Design Auditor Service
 * 
 * Analyzes `draft_protocol.md` files to ensure researchers have properly
 * defined Eligibility Criteria and Search Syntax before allowing the system
 * to perform any automated mining or screening.
 */

import * as fs from "fs";

export interface ProtocolAuditResult {
    valid: boolean;
    score: number;
    maxScore: number;
    errors: string[];
    suggestions: string[];
}

export class ProtocolDesignAuditor {

    /**
     * Parse and audit a markdown protocol draft.
     */
    public auditFile(filePath: string): ProtocolAuditResult {
        if (!fs.existsSync(filePath)) {
            return {
                valid: false,
                score: 0,
                maxScore: 3,
                errors: [`Arquivo de protocolo não encontrado: ${filePath}`],
                suggestions: []
            };
        }

        const content = fs.readFileSync(filePath, "utf-8");
        return this.auditContent(content);
    }

    /**
     * Audit raw markdown content.
     */
    public auditContent(content: string): ProtocolAuditResult {
        const errors: string[] = [];
        const suggestions: string[] = [];
        let score = 0;
        const maxScore = 3;

        // 1. Check Inclusion Criteria
        const hasReplacedInclusion = !content.includes("[PREENCHIMENTO OBRIGATÓRIO: Liste 2 a 3 critérios claros do que DEVE estar no artigo para ele ser aceito.");
        const hasContentInclusion = this.extractSection(content, "Critérios de Inclusão").trim().length > 20;

        if (hasReplacedInclusion && hasContentInclusion) {
            score++;
        } else {
            errors.push("🚫 Critérios de Inclusão pendentes. Substitua o texto [PREENCHIMENTO OBRIGATÓRIO] por critérios reias que determinem a seleção dos artigos.");
        }

        // 2. Check Exclusion Criteria
        const hasReplacedExclusion = !content.includes("[PREENCHIMENTO OBRIGATÓRIO: Liste 2 a 3 critérios claros do que ELIMINA o artigo.");
        const hasContentExclusion = this.extractSection(content, "Critérios de Exclusão").trim().length > 20;

        if (hasReplacedExclusion && hasContentExclusion) {
            score++;
        } else {
            errors.push("🚫 Critérios de Exclusão pendentes. Defina claramente os limites que desqualificam um artigo para o estudo.");
        }

        // 3. Check Search Syntax
        const hasReplacedSyntax = !content.includes("[PREENCHIMENTO OBRIGATÓRIO: Escreva a string de busca exata utilizando operadores booleanos");
        const syntaxSection = this.extractSection(content, "Estratégia de Busca (Sintaxe)");

        let validSyntaxParams = false;
        if (hasReplacedSyntax) {
            const hasBooleans = /\b(AND|OR|NOT)\b/.test(syntaxSection);
            const hasParentheses = /[()]/.test(syntaxSection);

            if (hasBooleans || hasParentheses) {
                validSyntaxParams = true;
                score++;
            } else {
                errors.push("⚠️ Operadores lógicos não encontrados. A estratégia de busca requer o uso de conectores booleanos (AND, OR) para formulação de queries corretas nas bases de dados.");
                suggestions.push("Exemplo de sintaxe aceita: (cashew OR anacardium) AND (disease OR pest)");
            }
        } else {
            errors.push("🚫 Estratégia de busca de sintaxe textual ausente ou incompleta. Defina a string exata a ser utilizada.");
        }

        return {
            valid: score === maxScore,
            score,
            maxScore,
            errors,
            suggestions
        };
    }

    /**
     * Helper to grab content between headers
     */
    private extractSection(content: string, headerName: string): string {
        const regex = new RegExp(`###? ${headerName}[\\s\\S]*?(?=###? |$)`, "i");
        const match = content.match(regex);
        if (match) {
            return match[0].replace(new RegExp(`^###? ${headerName}`, "i"), "").trim();
        }
        return "";
    }
}
