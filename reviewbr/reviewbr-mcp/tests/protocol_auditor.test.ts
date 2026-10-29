import { describe, it, expect } from "vitest";
import { ProtocolDesignAuditor } from "../src/services/protocol_auditor.js";

const a = new ProtocolDesignAuditor();

/**
 * Protocolo completo e legítimo — a base sobre a qual cada defeito é injetado.
 *
 * DELIBERADAMENTE SEM TEMA. O sistema é agnóstico a domínio, e fixture temática contamina:
 * o exemplo que existia no código (`cashew OR anacardium`) foi copiado para cá na primeira
 * escrita deste arquivo, que é exatamente como o viés se propaga — cada um copia o anterior.
 */
const bom = `
## Critérios de Inclusão
Estudos primários publicados entre 2015 e 2025, em português, inglês ou espanhol,
que avaliem o desfecho de interesse na população definida no protocolo.

## Critérios de Exclusão
Revisões, editoriais, cartas ao editor e estudos sem grupo de comparação.

## Estratégia de Busca (Sintaxe)
(termoA OR sinonimoA) AND (termoB OR sinonimoB) AND (recorte OR contexto)

## Justificativa
Não há síntese recente sobre o tema, e as decisões vêm sendo tomadas com base em
estudos isolados e de escopo local.

## Revisões Anteriores
A revisão anterior cobriu recorte menor e não incluiu literatura cinzenta.

## Lacuna
Falta evidência consolidada sobre o efeito nas condições descritas no contexto.

## Relevância
Orienta a recomendação técnica que a revisão se propõe a informar.

## Processo de Seleção
3. **F4 — Triagem:**
   - **F4.1.2 Processo de triagem:** Duplo independente, com desempate por terceiro revisor
   - **F4.1.3 Ferramenta utilizada:** ReviewBR MCP, triagem assistida com conferência humana
   - **Resolução de discordâncias:** Terceiro revisor decide; concordância reportada
`;

const troca = (sec: string, novo: string) =>
    bom.replace(new RegExp(`## ${sec.replace(/[()]/g, "\\$&")}[\\s\\S]*?(?=\n## |$)`), `## ${sec}\n${novo}\n`);

describe("RV-01 — protocolo cheio de [TBD] NÃO pode ser travado como aprovado", () => {
    it("o protocolo completo passa — controle positivo do método", () => {
        const r = a.auditContent(bom);
        expect(r.errors).toEqual([]);
        expect(r.valid).toBe(true);
        expect(r.score).toBe(3);
    });

    it("REPROVA [TBD] nos critérios de inclusão", () => {
        // ESTE é o defeito: '[TBD]' não casa com o texto do template, então a checagem antiga
        // de 'template substituído' passava, e 5 repetições passavam os 20 caracteres.
        const r = a.auditContent(troca("Critérios de Inclusão", "[TBD] [TBD] [TBD] [TBD] [TBD]"));
        expect(r.valid).toBe(false);
        expect(r.errors.join(" ")).toMatch(/\[TBD\]/);
        expect(r.errors.join(" ")).toMatch(/sem \[TBD\] obrigatório/);
    });

    it("REPROVA [TBD] nos critérios de exclusão", () => {
        const r = a.auditContent(troca("Critérios de Exclusão", "[TBD] [TBD] [TBD] [TBD] [TBD]"));
        expect(r.valid).toBe(false);
        expect(r.score).toBeLessThan(3);
    });

    it("REPROVA [TBD] na string de busca, mesmo com booleano ao lado", () => {
        // '[TBD] AND [TBD]' tem booleano e passava na checagem de sintaxe
        const r = a.auditContent(troca("Estratégia de Busca (Sintaxe)", "[TBD] AND [TBD]"));
        expect(r.valid).toBe(false);
        expect(r.errors.join(" ")).toMatch(/não é executável/);
    });

    it("o protocolo INTEIRO de [TBD] é reprovado — era o caso que passava com 3/3", () => {
        // Todas as seções com marcação de pendência, e a busca com booleano ao lado do [TBD]:
        // a combinação exata que satisfazia as três checagens antigas.
        const t = [
            "## Critérios de Inclusão", "[TBD] [TBD] [TBD] [TBD] [TBD]",
            "## Critérios de Exclusão", "[TBD] [TBD] [TBD] [TBD] [TBD]",
            "## Estratégia de Busca (Sintaxe)", "[TBD] AND [TBD]",
            "## Justificativa", "[TBD] [TBD] [TBD] [TBD] [TBD]",
            "## Revisões Anteriores", "[TBD] [TBD] [TBD] [TBD] [TBD]",
            "## Lacuna", "[TBD] [TBD] [TBD] [TBD] [TBD]",
            "## Relevância", "[TBD] [TBD] [TBD] [TBD] [TBD]",
        ].join("\n");
        const r = a.auditContent(t);
        expect(r.valid).toBe(false);
        expect(r.score).toBe(0);
    });
});

describe("F0.3 — a justificativa, que o gate nunca lia", () => {
    for (const sec of ["Justificativa", "Revisões Anteriores", "Lacuna", "Relevância"]) {
        it(`REPROVA quando '${sec}' está ausente`, () => {
            const r = a.auditContent(bom.replace(new RegExp(`## ${sec}[\\s\\S]*?(?=\n## |$)`), ""));
            expect(r.valid).toBe(false);
            expect(r.errors.join(" ")).toMatch(/F0\.3/);
            expect(r.errors.join(" ")).toMatch(sec);
        });
    }

    it("REPROVA justificativa curta demais para dizer alguma coisa", () => {
        const r = a.auditContent(troca("Lacuna", "falta."));
        expect(r.valid).toBe(false);
        expect(r.errors.join(" ")).toMatch(/Lacuna/);
    });

    it("a mensagem explica o que está em jogo, não só o que falta", () => {
        const r = a.auditContent(bom.replace(/## Lacuna[\s\S]*?(?=\n## |$)/, ""));
        expect(r.errors.join(" ")).toMatch(/tema em vez de uma pergunta/);
    });

    it("a sugestão admite o método em que a seção não se aplica", () => {
        // declarar que não se aplica é diferente de deixar em branco
        const r = a.auditContent(bom.replace(/## Relevância[\s\S]*?(?=\n## |$)/, ""));
        expect(r.suggestions.join(" ")).toMatch(/não se aplicar/);
    });
});

describe("o score histórico 0–3 continua íntegro", () => {
    it("F0.3 bloqueia sem alterar o score — são travas distintas", () => {
        const r = a.auditContent(bom.replace(/## Lacuna[\s\S]*?(?=\n## |$)/, ""));
        expect(r.score).toBe(3);      // os três critérios históricos seguem satisfeitos
        expect(r.maxScore).toBe(3);
        expect(r.valid).toBe(false);  // mas o protocolo não está apto a travar
    });
});

/**
 * F4.1.2/F4.1.3 — o processo de seleção, que o auditor nunca olhava.
 *
 * O protocolo travava [LOCKED] com "Método: A definir pelo pesquisador": o item 8 do PRISMA
 * 2020 ficava indeclarável e o método podia ser escolhido DEPOIS de ver os registros — o viés
 * que o pré-registro existe para impedir. A causa de fundo é a mesma que fez a skill oferecer
 * software como método: processo (F4.1.2) e ferramenta (F4.1.3) eram a mesma coisa.
 */
describe("F4.1 — o processo de seleção, que o gate nunca lia", () => {
    const SELECAO = /## Processo de Seleção[\s\S]*?(?=\n## |$)/;
    const comSelecao = (corpo: string) =>
        bom.replace(SELECAO, `## Processo de Seleção\n${corpo}\n`);

    it("REPROVA o template recém-gerado, com os três campos por preencher", () => {
        const r = a.auditContent(comSelecao(
            `   - **F4.1.2 Processo de triagem:** [PREENCHIMENTO OBRIGATÓRIO: Individual | Duplo independente]\n` +
            `   - **F4.1.3 Ferramenta utilizada:** [PREENCHIMENTO OBRIGATÓRIO: que sistema executa]\n` +
            `   - **Resolução de discordâncias:** [PREENCHIMENTO OBRIGATÓRIO: como se resolvem]`
        ));
        expect(r.valid).toBe(false);
        expect(r.errors.join(" ")).toMatch(/F4\.1\.2/);
    });

    it("REPROVA o protocolo de template ANTIGO, que nem tem os rótulos", () => {
        // Rótulo ausente tem de falhar como rótulo vazio: senão o protocolo velho passa por omissão.
        const r = a.auditContent(comSelecao(`   - Método: A definir pelo pesquisador\n   - Fase 1: Título e resumo`));
        expect(r.valid).toBe(false);
        expect(r.errors.join(" ")).toMatch(/Processo de seleção incompleto/);
    });

    it("REPROVA quando falta só a resolução de discordâncias", () => {
        const r = a.auditContent(comSelecao(
            `   - **F4.1.2 Processo de triagem:** Duplo independente\n` +
            `   - **F4.1.3 Ferramenta utilizada:** Planilha conferida manualmente`
        ));
        expect(r.valid).toBe(false);
        expect(r.errors.join(" ")).toMatch(/Resolução de discordâncias/);
    });

    it("ACEITA triagem individual declarada — é escolha legítima, não defeito", () => {
        const r = a.auditContent(comSelecao(
            `   - **F4.1.2 Processo de triagem:** Individual — um triador aplica os critérios\n` +
            `   - **F4.1.3 Ferramenta utilizada:** Planilha revisada manualmente pelo pesquisador\n` +
            `   - **Resolução de discordâncias:** não se aplica (triagem individual)`
        ));
        expect(r.errors).toEqual([]);
        expect(r.valid).toBe(true);
    });

    it("bloqueia sem mexer no score — como o F0.3", () => {
        const r = a.auditContent(bom.replace(SELECAO, ""));
        expect(r.score).toBe(3);
        expect(r.valid).toBe(false);
    });

    it("a mensagem separa processo de ferramenta — é a confusão que originou o defeito", () => {
        const r = a.auditContent(bom.replace(SELECAO, ""));
        expect(r.suggestions.join(" ")).toMatch(/campos SEPARADOS/);
        expect(r.suggestions.join(" ")).toMatch(/nenhuma ferramenta torna a triagem mais publicável/);
    });
});
