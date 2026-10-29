import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { appendRawRecords, consolidateRaw } from "../src/services/project_artifacts.js";

/** DEBT-086 — import_dataset_ris e import_bvs_export passaram a chamar appendRawRecords,
 *  a mesma função que as tools de busca (e agora as 6 corrigidas em DEBT-084) usam para
 *  alimentar 01_raw/database_records.json, que é o que o funil PRISMA conta. Sem cobertura
 *  própria até aqui — esta é a primeira. */
describe("DEBT-086 — appendRawRecords (usado por import_dataset_ris/import_bvs_export)", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

    function mkProject(): string {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "append-raw-"));
        dirs.push(p);
        return p;
    }

    it("grava em 01_raw/database_records.json quando o projeto ainda não tem o arquivo", () => {
        const p = mkProject();
        const r = appendRawRecords(p, [{ identifier: "a", title: "Estudo A", doi: "10.1/a" } as any]);
        expect(r).toEqual({ total: 1, added: 1, file: path.join(p, "01_raw", "database_records.json") });
        expect(JSON.parse(fs.readFileSync(r.file, "utf-8"))).toHaveLength(1);
    });

    it("faz merge com o que já existe, sem duplicar por DOI (dedup leve)", () => {
        const p = mkProject();
        appendRawRecords(p, [{ identifier: "a", title: "Estudo A", doi: "10.1/a" } as any]);
        const r2 = appendRawRecords(p, [
            { identifier: "a-dup", title: "Estudo A (outra fonte)", doi: "10.1/a" } as any, // mesmo DOI = mesma chave
            { identifier: "b", title: "Estudo B", doi: "10.1/b" } as any,
        ]);
        expect(r2.added).toBe(1); // só o B é novo; o DOI 10.1/a já existia
        expect(r2.total).toBe(2);
    });

    it("kind='other' grava em 01_raw/other_records.json, separado do database", () => {
        const p = mkProject();
        appendRawRecords(p, [{ identifier: "a", title: "Base" } as any], "database");
        const rOther = appendRawRecords(p, [{ identifier: "b", title: "Snowball" } as any], "other");
        expect(rOther.file).toBe(path.join(p, "01_raw", "other_records.json"));
        expect(fs.existsSync(path.join(p, "01_raw", "database_records.json"))).toBe(true);
        expect(rOther.total).toBe(1);
    });

    it("projectPath absoluto é tratado corretamente (mesma classe de bug do DEBT-084)", () => {
        const p = mkProject(); // já é absoluto (mkdtemp devolve caminho absoluto)
        const r = appendRawRecords(p, [{ identifier: "a", title: "Estudo A" } as any]);
        expect(r.file.startsWith(p)).toBe(true);
    });
});

/**
 * `01_raw/` é território exclusivo da busca com metodologia declarada.
 *
 * `consolidateRaw` soma TUDO que estiver em `01_raw/*.json`, então o que cai ali entra no
 * funil PRISMA e conta no fluxograma. Resultado de busca exploratória — sem protocolo que o
 * autorize — não pode se misturar: contaminaria a contagem com registros que nenhuma
 * metodologia declarou, e o PRISMA-S exige declarar o que foi recuperado por base.
 *
 * Hoje a garantia é estrutural (`appendRawRecords` exige `projectPath`, e sem projeto o
 * `ProtocolGate` devolve SEM_PROJETO). Este teste existe para que ela deixe de depender de
 * alguém lembrar: se alguém tornar o `projectPath` opcional aqui, a suíte reprova.
 */
describe("a busca exploratória não contamina o funil", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
    function mkProject(): string {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "sem-contaminar-"));
        dirs.push(p);
        return p;
    }

    it("appendRawRecords EXIGE projectPath — não há gravação sem projeto", () => {
        // Sem projeto não há onde persistir. É a fronteira entre exploração e busca oficial.
        expect(() => appendRawRecords(undefined as any, [{ identifier: "a", title: "X" } as any]))
            .toThrow();
        expect(() => appendRawRecords("" as any, [{ identifier: "a", title: "X" } as any]))
            .toThrow();
    });

    it("consolidateRaw só enxerga o que está em 01_raw/ — o de fora não entra no funil", () => {
        const p = mkProject();
        appendRawRecords(p, [{ identifier: "oficial", title: "Veio da busca declarada" } as any]);

        // Exploratório guardado NO PROJETO, mas fora de 01_raw/: não pode ser contado.
        const explor = path.join(p, "exploratory");
        fs.mkdirSync(explor, { recursive: true });
        fs.writeFileSync(
            path.join(explor, "scout_results.json"),
            JSON.stringify([{ identifier: "exploratorio", title: "Veio do scout" }]),
            "utf-8",
        );

        const { database, other } = consolidateRaw(p);
        const ids = [...database, ...other].map((r: any) => r.identifier);
        expect(ids).toContain("oficial");
        expect(ids).not.toContain("exploratorio"); // controle: o de fora ficou de fora
    });
});
