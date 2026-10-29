import { describe, it, expect } from "vitest";
import path from "path";
import { resolveDir } from "../src/services/project_artifacts.js";

/** DEBT-084 — as 6 tools search_* (index.ts) reusam esta função em vez de fazer
 *  path.join(process.cwd(), projectPath) direto, que quebra quando projectPath já é
 *  absoluto (path.join('C:/reviewbr', 'C:/proj/x') produz um caminho inválido no
 *  Windows: 'C:\\reviewbr\\C:\\proj\\x'). */
describe("DEBT-084 — resolveDir trata projectPath absoluto e relativo", () => {
    it("projectPath absoluto: devolve o próprio caminho, sem juntar com cwd", () => {
        const abs = path.resolve(path.sep === "\\" ? "C:\\reviewbr\\reviewbr\\projects\\roda_de_aromas" : "/reviewbr/reviewbr/projects/roda_de_aromas");
        expect(resolveDir(abs)).toBe(abs);
    });

    it("projectPath relativo: junta com process.cwd(), como antes", () => {
        const rel = "reviewbr/projects/exemplo";
        expect(resolveDir(rel)).toBe(path.join(process.cwd(), rel));
    });

    it("nunca produz um caminho com dois prefixos de unidade coladas (o bug original)", () => {
        // Reprodução direta do achado: path.join(cwd, absoluto) gerava 'cwd\\C:\\...'
        const abs = "C:/reviewbr/reviewbr/projects/roda_de_aromas";
        const r = resolveDir(abs);
        expect(r.match(/[a-zA-Z]:[\\/]/g)?.length).toBe(1); // um único prefixo de unidade
    });
});
