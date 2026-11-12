import { describe, it, expect, beforeEach, afterAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CatalogWriter } from "../src/services/maintenance_writes.js";
import { MethodologyCatalogService } from "../src/services/methodology_catalog.js";
import { ProjectInitService } from "../src/services/project_init.js";
import { lerTrilha } from "../src/services/method_trail.js";

// FILA linha 8, item 5 (decisão de 12/11/2026: metodologia se aponta, não se copia). A entrada do
// catálogo guarda a data em que a fonte oficial foi lida; quando um projeto escolhe o método, o
// protocolo dele grava o método, a fonte e essa data.

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..", "..", "..");
let RAIZ: string;
const criados: string[] = [];
beforeEach(() => {
    RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), "reviewbr-leitura-"));
    criados.push(RAIZ);
});
afterAll(() => { for (const d of criados) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { } } });

const entrada = (o: Record<string, unknown> = {}) => ({
    id: "m1", name: "M1", kind: "review_method", what_it_is: "o que é", when_to_use: "quando usar",
    requires: "o que exige", source_url: "https://exemplo.org/m1", read_at: "2026-11-12", ...o,
});

describe("data de leitura da fonte no catálogo", () => {
    it("entrada NOVA sem a data de leitura é recusada", () => {
        const { read_at: _r, ...sem } = entrada();
        const r = CatalogWriter.absorver(RAIZ, sem);
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/read_at/);
    });

    it("data fora do formato AAAA-MM-DD é recusada", () => {
        const r = CatalogWriter.absorver(RAIZ, entrada({ read_at: "12/11/2026" }));
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/AAAA-MM-DD/);
    });

    it("com a data, a entrada é gravada e a guarda", () => {
        expect(CatalogWriter.absorver(RAIZ, entrada()).ok).toBe(true);
        expect(MethodologyCatalogService.read(RAIZ)!.entries[0].read_at).toBe("2026-11-12");
    });

    it("atualizar entrada antiga sem data não exige a data — ela não se inventa", () => {
        const p = MethodologyCatalogService.catalogPath(RAIZ);
        fs.mkdirSync(path.dirname(p), { recursive: true });
        const { read_at: _r, ...antiga } = entrada();
        fs.writeFileSync(p, JSON.stringify({ schemaVersion: 1, entries: [antiga] }));
        const r = CatalogWriter.absorver(RAIZ, { id: "m1", when_to_use: "corrigido" }, true);
        expect(r.ok).toBe(true);
        expect(MethodologyCatalogService.read(RAIZ)!.entries[0].read_at).toBe("");
    });
});

describe("o protocolo grava o método, a fonte e a data de leitura", () => {
    it("o catálogo do repositório liga o prisma-sr à sua fonte", () => {
        const f = MethodologyCatalogService.fonteDoMetodo(REPO, "prisma-sr");
        expect(f?.id).toBe("prisma-2020");
        expect(f?.source_url).toMatch(/^https?:\/\//);
    });

    const meta = { label: "Revisão", prismaStandard: "", registrationPlatform: "N/A", description: "" };
    const gerar = (fonte: unknown) => (new ProjectInitService() as any).generateProtocol(
        { name: "p", userId: "u", researchType: "systematic_review", topic: "t" }, meta, "padrão", "prisma-sr",
        lerTrilha(REPO, "prisma-sr").etapas, fonte,
    ) as string;

    it("com a entrada do catálogo: método, fonte e data", () => {
        const txt = gerar({ id: "prisma-2020", source_url: "https://exemplo.org/prisma", read_at: "2026-10-30" });
        expect(txt).toMatch(/\*\*Método:\*\* `prisma-sr` — fonte: https:\/\/exemplo\.org\/prisma \(entrada `prisma-2020` do catálogo, lida em 2026-10-30\)/);
    });

    it("sem data de leitura ou sem entrada, o protocolo diz isso em vez de inventar", () => {
        expect(gerar({ id: "prisma-2020", source_url: "https://exemplo.org/prisma", read_at: "" })).toMatch(/sem data de leitura no catálogo/);
        expect(gerar(null)).toMatch(/\*\*Método:\*\* `prisma-sr` — \[sem entrada no catálogo\]/);
    });
});
