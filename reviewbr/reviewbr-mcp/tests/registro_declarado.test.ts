import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { lerTrilha } from "../src/services/method_trail.js";
import { ProjectInitService } from "../src/services/project_init.js";
import { ProtocolDesignAuditor } from "../src/services/protocol_auditor.js";

// DEBT-135: o sistema dizia ao pesquisador que o registro do protocolo (PROSPERO) era
// OBRIGATÓRIO antes da busca, para todo systematic_review e meta_analysis, de qualquer domínio.
// Nenhuma norma assimilada exige registro: o item 24a do PRISMA 2020 pede "fornecer as
// informações de registro da revisão, incluindo nome do registro e número de registro, OU
// declarar que a revisão não foi registrada" (catálogo). E o Vicente decidiu em 08/10/2026 que
// registro não é pré-condição. O conserto: o protocolo DECLARA — registrado ou não —, nenhuma
// das duas respostas reprova, e a omissão não passa em silêncio.

const MCP = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..");
const REPO = path.resolve(MCP, "..", "..");

// `requiresRegistration: true` é o que o tipo systematic_review tinha: o template não pode mais
// depender dele.
const meta = {
    label: "Revisão Sistemática", prismaStandard: "", requiresRegistration: true,
    registrationPlatform: "PROSPERO (saúde) ou OSF Registries (outros domínios)", description: "",
};
const gerar = () => (new ProjectInitService() as any).generateProtocol(
    { name: "p", userId: "u", researchType: "systematic_review", topic: "t" }, meta, "padrão", "prisma-sr",
    lerTrilha(REPO, "prisma-sr").etapas,
) as string;

/** Preenche tudo o que o template pede, menos (opcionalmente) o campo de registro. */
const preencher = (txt: string, registro: string | null) => txt
    .replace(/(## Estratégia de Busca \(Sintaxe\)\n)\[PREENCHIMENTO OBRIGATÓRIO:[^\]]*\]/, "$1(termo OR sinonimo) AND (conceito OR variante)")
    .replace(/\[PREENCHIMENTO OBRIGATÓRIO:[^\]]*\]/g, (m) =>
        /registrado em/.test(m)
            ? (registro ?? m)
            : "Declaração feita pelo pesquisador, com o conteúdo pedido por este campo do protocolo.");

describe("registro do protocolo — declarado, nunca imposto (DEBT-135)", () => {
    it("o protocolo gerado não diz que o registro é obrigatório nem que está pendente", () => {
        const txt = gerar();
        expect(txt).not.toMatch(/Pendente de registro/);
        // o marcador [PREENCHIMENTO OBRIGATÓRIO] é do campo a preencher, não do registro
        expect(txt.replace(/\[PREENCHIMENTO OBRIGATÓRIO:/g, "[")).not.toMatch(/registro[^\n]*obrigat/i);
        expect(txt).toMatch(/\*\*Registro:\*\* \[PREENCHIMENTO OBRIGATÓRIO:[^\]]*"não registrado"/);
    });

    it("as perguntas ao pesquisador não dizem que o PROSPERO é obrigatório", () => {
        const q = ProjectInitService.getProjectQuestions();
        expect(q).not.toMatch(/obrigatório para SR\/MA/);
        expect(q).toMatch(/não registrado/i);
    });

    it("nenhum código monta a exigência: o campo requiresRegistration saiu", () => {
        for (const f of ["src/index.ts", "src/services/project_init.ts"]) {
            const src = fs.readFileSync(path.join(MCP, f), "utf-8");
            expect(src).not.toMatch(/requiresRegistration/);
            expect(src).not.toMatch(/OBRIGATÓRIO antes da busca/);
        }
    });

    const a = new ProtocolDesignAuditor();

    it("ACEITA 'não registrado' — é escolha legítima", () => {
        const r = a.auditContent(preencher(gerar(), "não registrado"));
        expect(r.errors).toEqual([]);
        expect(r.valid).toBe(true);
    });

    it("ACEITA o registro declarado, com plataforma e número", () => {
        const r = a.auditContent(preencher(gerar(), "registrado em OSF Registries sob nº osf.io/abcde"));
        expect(r.errors).toEqual([]);
        expect(r.valid).toBe(true);
    });

    it("REPROVA o campo deixado por preencher — a omissão não passa em silêncio", () => {
        const r = a.auditContent(preencher(gerar(), null));
        expect(r.valid).toBe(false);
        expect(r.errors.join(" ")).toMatch(/Registro do protocolo não declarado/);
        expect(r.score).toBe(3); // bloqueia sem mexer no score histórico, como F0.3 e F4.1
    });

    it("REPROVA protocolo de template antigo, que só dizia 'Pendente de registro'", () => {
        const antigo = preencher(gerar(), "não registrado")
            .replace(/\*\*Registro:\*\* não registrado/, "**Status:** Pendente de registro no PROSPERO");
        const r = a.auditContent(antigo);
        expect(r.valid).toBe(false);
        expect(r.errors.join(" ")).toMatch(/Registro do protocolo não declarado/);
    });
});
