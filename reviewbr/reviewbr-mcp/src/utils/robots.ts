/**
 * robots.txt (RFC 9309): o ReviewBR não busca por robô em caminho que o site proíbe.
 *
 * Conferência jurídica e ética de 19/11/2026 (`.claude/maintenance/CONFERENCIA_acesso_2026-11-19.md`),
 * decisão do Vicente no mesmo dia: o que não é possível não se força; declara-se o que foi visto e
 * onde, e o repositório é alcançado por uma plataforma de ciência aberta que o agrega.
 *
 * Regras aplicadas (RFC 9309): vale o grupo cujo User-agent casa com "reviewbr", senão o grupo "*";
 * vence a regra mais longa que casa com o caminho, e Allow vence Disallow de mesmo tamanho; "*" e "$"
 * são entendidos. robots.txt ausente (4xx) libera; servidor que não responde (5xx, rede) proíbe tudo
 * (RFC 9309, 2.3.1.4).
 */
import { REVIEWBR_USER_AGENT } from "./http.js";

export interface Veredito { permitido: boolean; motivo: string }

interface Regra { allow: boolean; padrao: string }

const cache = new Map<string, Promise<Regra[] | "tudo" | "nada">>();

/** Só para os testes. */
export function limparCacheRobots(): void { cache.clear(); }

export function lerGrupos(texto: string, agente = "reviewbr"): Regra[] {
    const grupos: Array<{ agentes: string[]; regras: Regra[] }> = [];
    let atual: { agentes: string[]; regras: Regra[] } | null = null;
    let lendoAgentes = false;
    for (const bruta of texto.split(/\r?\n/)) {
        const linha = bruta.replace(/#.*$/, "").trim();
        const m = linha.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
        if (!m) continue;
        const campo = m[1]!.toLowerCase();
        const valor = m[2]!.trim();
        if (campo === "user-agent") {
            if (!atual || !lendoAgentes) { atual = { agentes: [], regras: [] }; grupos.push(atual); }
            atual.agentes.push(valor.toLowerCase());
            lendoAgentes = true;
        } else if ((campo === "allow" || campo === "disallow") && atual) {
            lendoAgentes = false;
            if (valor) atual.regras.push({ allow: campo === "allow", padrao: valor });
        } else {
            lendoAgentes = false;
        }
    }
    const proprios = grupos.filter((g) => g.agentes.some((a) => a !== "*" && agente.includes(a)));
    const usados = proprios.length ? proprios : grupos.filter((g) => g.agentes.includes("*"));
    return usados.flatMap((g) => g.regras);
}

function casa(padrao: string, caminho: string): boolean {
    const ancorado = padrao.endsWith("$");
    const corpo = (ancorado ? padrao.slice(0, -1) : padrao)
        .split("*").map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
    return new RegExp("^" + corpo + (ancorado ? "$" : "")).test(caminho);
}

export function decidir(regras: Regra[], caminho: string): Veredito {
    let melhor: Regra | null = null;
    for (const r of regras) {
        if (!casa(r.padrao, caminho)) continue;
        if (!melhor || r.padrao.length > melhor.padrao.length || (r.padrao.length === melhor.padrao.length && r.allow)) melhor = r;
    }
    if (!melhor || melhor.allow) return { permitido: true, motivo: melhor ? `Allow: ${melhor.padrao}` : "nenhuma regra proíbe" };
    return { permitido: false, motivo: `Disallow: ${melhor.padrao}` };
}

async function carregar(origem: string): Promise<Regra[] | "tudo" | "nada"> {
    try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 20_000);
        const res = await fetch(`${origem}/robots.txt`, { headers: { "User-Agent": REVIEWBR_USER_AGENT }, signal: ctrl.signal, redirect: "follow" });
        clearTimeout(t);
        if (res.status >= 400 && res.status < 500) return "tudo";
        if (res.status >= 500) return "nada";
        const texto = await res.text();
        // Página HTML no lugar do robots.txt (servidor que devolve 200 para tudo): não há regra.
        if (/^\s*</.test(texto)) return "tudo";
        return lerGrupos(texto);
    } catch {
        return "nada";
    }
}

/** O robots.txt do site permite ao ReviewBR pedir este endereço? */
export async function robotsPermite(url: string): Promise<Veredito> {
    const u = new URL(url);
    const origem = `${u.protocol}//${u.host}`;
    if (!cache.has(origem)) cache.set(origem, carregar(origem));
    const regras = await cache.get(origem)!;
    if (regras === "nada") cache.delete(origem); // falha de rede: tenta de novo na próxima chamada
    if (regras === "tudo") return { permitido: true, motivo: "sem robots.txt" };
    if (regras === "nada") return { permitido: false, motivo: "robots.txt inalcançável (RFC 9309: proíbe tudo)" };
    const v = decidir(regras, u.pathname + u.search);
    return v.permitido ? v : { permitido: false, motivo: `o robots.txt de ${u.host} proíbe (${v.motivo})` };
}
