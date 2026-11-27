import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { ProjectStateService } from "./project_state.js";

/**
 * Fechamento de etapa com o hash do artefato que a encerra (linha 24 da FILA, trava 2).
 *
 * Quando uma etapa da trilha fecha (o artefato que a encerra está gravado e a regra do RV-04 deixou
 * avançar), o estado do projeto guarda o hash desse artefato. A etapa seguinte só lê esse insumo se
 * ele ainda for o mesmo: arquivo editado à mão, ou regravado fora da ordem, deixa de bater.
 *
 * Fica fora do `travas_etapa.ts` porque o `method_trail.ts` grava o fechamento, e o `travas_etapa.ts`
 * lê a trilha: num módulo só, os dois se importariam.
 */

export interface Fechamento {
    etapa: string;
    artefato: string;
    sha256: string;
    em: string;
}

const sha = (x: string | Buffer) => createHash("sha256").update(x).digest("hex");

function arquivosDaPasta(dir: string, base = ""): string[] {
    const out: string[] = [];
    for (const nome of fs.readdirSync(path.join(dir, base)).sort()) {
        const rel = base ? `${base}/${nome}` : nome;
        if (fs.statSync(path.join(dir, rel)).isDirectory()) out.push(...arquivosDaPasta(dir, rel));
        else out.push(rel);
    }
    return out;
}

/**
 * Hash do artefato de uma etapa. Arquivo: os bytes. Pasta (termina em "/"): o CONJUNTO dos registros
 * dos arquivos JSON que são listas, mais o hash de cada outro arquivo. É conjunto, e não a soma dos
 * arquivos, porque a etapa seguinte consolida a pasta (a deduplicação regrava `01_raw/` com os
 * registros de todas as fontes, sem mudar nenhum): o hash muda quando um registro entra, sai ou é
 * editado, e não muda com a consolidação. Limite declarado: registro repetido de propósito dentro de
 * um arquivo conta uma vez.
 *
 * `null` = o artefato não existe (pasta vazia conta como ausente).
 */
export function hashDoArtefato(projectDir: string, rel: string): string | null {
    const p = path.join(projectDir, rel);
    if (!fs.existsSync(p)) return null;
    if (!rel.endsWith("/")) return fs.statSync(p).isFile() ? sha(fs.readFileSync(p)) : null;
    const itens = new Set<string>();
    for (const f of arquivosDaPasta(p)) {
        const bruto = fs.readFileSync(path.join(p, f));
        let lista: unknown = null;
        if (f.endsWith(".json")) { try { lista = JSON.parse(bruto.toString("utf-8")); } catch { lista = null; } }
        if (Array.isArray(lista)) for (const r of lista) itens.add(`registro:${JSON.stringify(r)}`);
        else itens.add(`arquivo:${f}:${sha(bruto)}`);
    }
    if (!itens.size) return null;
    return sha([...itens].sort().join("\n"));
}

/** O último fechamento gravado de uma etapa. */
export function fechamentoDe(projectDir: string, etapa: string): Fechamento | null {
    const todos = ProjectStateService.read(projectDir)?.etapas_fechadas ?? [];
    for (let i = todos.length - 1; i >= 0; i--) if (todos[i].etapa === etapa) return todos[i];
    return null;
}

/** Grava o fechamento da etapa com o hash de hoje do artefato que a encerra. Sem artefato, não grava. */
export function registrarFechamento(projectDir: string, etapa: string, artefato: string): Fechamento | null {
    const st = ProjectStateService.read(projectDir);
    if (!st) return null;
    const h = hashDoArtefato(projectDir, artefato);
    if (!h) return null;
    const f: Fechamento = { etapa, artefato, sha256: h, em: new Date().toISOString() };
    ProjectStateService.patch(projectDir, { etapas_fechadas: [...(st.etapas_fechadas ?? []), f] });
    return f;
}
