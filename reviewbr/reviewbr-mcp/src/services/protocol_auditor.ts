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
    /**
     * Campos que a spec marca como obrigatórios e que o auditor não olhava.
     *
     * F0.3 é a justificativa da revisão — por que ela é necessária, que revisões já existem,
     * que lacuna resta e para que serve. O sistema declarava os quatro obrigatórios e travava
     * o protocolo sem ler nenhum: verificava a SINTAXE da busca antes de verificar se havia
     * pergunta. Uma revisão metodologicamente impecável sobre pergunta que não resolve nada
     * é desperdício rigoroso.
     */
    private static readonly SECOES_F03 = [
        "Justificativa",
        "Revisões Anteriores",
        "Lacuna",
        "Relevância"
    ];

    /**
     * F4.1.2/F4.1.3 — o processo de seleção. A spec marca os dois como obrigatórios
     * (`prisma-sr/spec.md`: F4.1.2 "Processo de triagem — Individual/Duplo/Com desempate",
     * F4.1.3 "Ferramenta utilizada", ambos mapeados ao item 8 do PRISMA 2020), e o auditor
     * nunca olhou a seção que os carrega: validava só Critérios de Inclusão/Exclusão. Um
     * protocolo travava [LOCKED] com o método de triagem "A definir pelo pesquisador".
     *
     * Isso permitia escolher o método DEPOIS de ver os registros — exatamente o viés que o
     * pré-registro existe para impedir (RV-01). Declarar quem aplica os critérios é o que o
     * item 8 cobra; a ferramenta é campo SEPARADO, e foi a confusão entre os dois que fez a
     * triagem ser oferecida como menu de software.
     *
     * Rótulos, não nomes de seção: os três vivem dentro de "## Processo de Seleção".
     */
    private static readonly ROTULOS_F41 = [
        "F4.1.2 Processo de triagem",
        "F4.1.3 Ferramenta utilizada",
        "Resolução de discordâncias"
    ];

    /**
     * `[TBD]` é conduta legítima durante o rascunho — a RV-03 manda usá-lo em vez de inventar
     * valor. O que não pode é um protocolo TRAVADO com `[TBD]` em campo obrigatório: a skill
     * de gates declara literalmente "sem [TBD] obrigatório", e o código nunca testou isso.
     */
    private temTBD(texto: string): boolean {
        return /\[TBD\]|\[PREENCHIMENTO OBRIGAT/i.test(texto);
    }

    public auditContent(content: string): ProtocolAuditResult {
        const errors: string[] = [];
        const suggestions: string[] = [];
        let score = 0;
        const maxScore = 3;

        // 1. Check Inclusion Criteria
        const hasReplacedInclusion = !content.includes("[PREENCHIMENTO OBRIGATÓRIO: Liste 2 a 3 critérios claros do que DEVE estar no artigo para ele ser aceito.");
        const hasContentInclusion = this.extractSection(content, "Critérios de Inclusão").trim().length > 20;

        const inclusaoSec = this.extractSection(content, "Critérios de Inclusão");
        if (hasReplacedInclusion && hasContentInclusion && !this.temTBD(inclusaoSec)) {
            score++;
        } else if (this.temTBD(inclusaoSec)) {
            errors.push("🚫 Critérios de Inclusão contêm [TBD]. Um protocolo TRAVADO não pode ter campo obrigatório por preencher — a skill de gates exige 'sem [TBD] obrigatório'.");
        } else {
            errors.push("🚫 Critérios de Inclusão pendentes. Substitua o texto [PREENCHIMENTO OBRIGATÓRIO] por critérios reias que determinem a seleção dos artigos.");
        }

        // 2. Check Exclusion Criteria
        const hasReplacedExclusion = !content.includes("[PREENCHIMENTO OBRIGATÓRIO: Liste 2 a 3 critérios claros do que ELIMINA o artigo.");
        const hasContentExclusion = this.extractSection(content, "Critérios de Exclusão").trim().length > 20;

        const exclusaoSec = this.extractSection(content, "Critérios de Exclusão");
        if (hasReplacedExclusion && hasContentExclusion && !this.temTBD(exclusaoSec)) {
            score++;
        } else if (this.temTBD(exclusaoSec)) {
            errors.push("🚫 Critérios de Exclusão contêm [TBD]. Preencha antes de travar o protocolo.");
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

            if (this.temTBD(syntaxSection)) {
                errors.push("🚫 A estratégia de busca contém [TBD]. Uma string com [TBD] não é executável: o librarian buscaria o literal.");
            } else if (hasBooleans || hasParentheses) {
                validSyntaxParams = true;
                score++;
            } else {
                errors.push("⚠️ Operadores lógicos não encontrados. A estratégia de busca requer o uso de conectores booleanos (AND, OR) para formulação de queries corretas nas bases de dados.");
                suggestions.push("Exemplo de FORMA, não de tema: (<termo> OR <sinônimo>) AND (<conceito> OR <variante>)");
            }
        } else {
            errors.push("🚫 Estratégia de busca de sintaxe textual ausente ou incompleta. Defina a string exata a ser utilizada.");
        }

        // F0.3 — a justificativa. Não entra no score (que é a trava histórica de 0–3), mas
        // BLOQUEIA: um protocolo sem justificativa nem lacuna é um tema, não uma pergunta.
        const f03Faltando: string[] = [];
        for (const nome of ProtocolDesignAuditor.SECOES_F03) {
            const sec = this.extractSection(content, nome);
            if (sec.trim().length < 20 || this.temTBD(sec)) f03Faltando.push(nome);
        }
        if (f03Faltando.length > 0) {
            errors.push(
                `🚫 Justificativa incompleta (F0.3): ${f03Faltando.join(", ")} — ausente(s), vazia(s) ou com [TBD]. ` +
                `A spec marca os quatro como obrigatórios e o gate nunca os lia. Sem eles, o protocolo trava ` +
                `sobre um tema em vez de uma pergunta: não diz por que a revisão é necessária agora, que ` +
                `revisões já existem, que lacuna resta nem para que serve responder.`
            );
            suggestions.push(
                "As quatro seções vêm da spec (F0.3.1 a F0.3.4). Se alguma não se aplicar ao seu método, " +
                "escreva a razão no lugar — declarar que não se aplica é diferente de deixar em branco."
            );
        }

        // F4.1.2/F4.1.3 — o processo de seleção. Também fora do score (a trava histórica de
        // 0–3), e também BLOQUEIA: sem declarar quem tria, o item 8 do PRISMA fica indeclarável
        // e o método pode ser escolhido depois de ver os registros.
        const selecaoSec = this.extractSection(content, "Processo de Seleção");
        const f41Faltando: string[] = [];
        for (const rotulo of ProtocolDesignAuditor.ROTULOS_F41) {
            const linha = this.extrairLinhaDoRotulo(selecaoSec, rotulo);
            if (linha === null || linha.length < 10 || this.temTBD(linha)) f41Faltando.push(rotulo);
        }
        if (f41Faltando.length > 0) {
            errors.push(
                `🚫 Processo de seleção incompleto (F4.1.2/F4.1.3): ${f41Faltando.join(", ")} — ` +
                `ausente(s), vazio(s) ou com [TBD]. O PRISMA 2020 item 8 exige declarar quantos ` +
                `triadores aplicam os critérios, se trabalham de forma independente e como as ` +
                `divergências se resolvem. Sem isso o protocolo travaria com o método "a definir", ` +
                `permitindo escolhê-lo depois de ver os registros.`
            );
            suggestions.push(
                "O processo (F4.1.2) e a ferramenta (F4.1.3) são campos SEPARADOS: nomear o software " +
                "não declara o procedimento, e nenhuma ferramenta torna a triagem mais publicável. " +
                "Triagem individual é escolha legítima — basta declará-la como tal."
            );
        }

        return {
            valid: score === maxScore && f03Faltando.length === 0 && f41Faltando.length === 0,
            score,
            maxScore,
            errors,
            suggestions
        };
    }

    /**
     * Devolve o que vem DEPOIS de um rótulo, dentro de uma seção — ou `null` se o rótulo
     * não existe ali. Os campos de F4.1 são itens de lista dentro de "## Processo de
     * Seleção", não seções próprias, então `extractSection` não os alcança.
     *
     * Distinguir "rótulo ausente" de "rótulo vazio" importa: protocolo gerado por versão
     * antiga do template não tem os rótulos, e precisa falhar com a mesma clareza que um
     * rótulo deixado em branco — não passar por omissão.
     */
    private extrairLinhaDoRotulo(secao: string, rotulo: string): string | null {
        const escaped = rotulo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Tolera negrito markdown em volta do rótulo e dois-pontos opcionalmente fora dele.
        const regex = new RegExp(`^.*?\\*{0,2}${escaped}\\*{0,2}\\s*:?\\s*(.*)$`, "im");
        const match = secao.match(regex);
        if (!match) return null;
        return match[1].trim();
    }

    /**
     * Helper to grab content between headers
     */
    private extractSection(content: string, headerName: string): string {
        // Escapa caracteres especiais de regex no nome do cabeçalho — headers como
        // "Estratégia de Busca (Sintaxe)" têm parênteses LITERAIS que, sem escape,
        // o motor de regex interpretaria como grupo de captura e nunca casariam.
        const escaped = headerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`###? ${escaped}[\\s\\S]*?(?=###? |$)`, "i");
        const match = content.match(regex);
        if (match) {
            return match[0].replace(new RegExp(`^###? ${escaped}`, "i"), "").trim();
        }
        return "";
    }
}
