import { describe, it, expect } from "vitest";
import { PdfExtractorService } from "../src/services/pdf_extractor.js";

/**
 * DEBT-102 — PDF digitalizado produzia texto VAZIO e nada percebia.
 *
 * `pdf-parse` extrai texto JÁ EMBUTIDO no arquivo; não faz OCR. O caminho da falha, ponta a
 * ponta: PDF-imagem entra → extração devolve quase nada → o .txt vazio é gravado →
 * `rag_index_corpus` indexa vazio → `rag_query` não acha → o `analyst` conclui que o estudo
 * NÃO TRATA DO TEMA. O estudo foi lido por ninguém e a revisão segue como se ele nada
 * dissesse: falso negativo silencioso, a classe mais cara.
 *
 * A guarda NÃO lê o PDF digitalizado — para isso é preciso OCR, que é outra decisão. O que
 * ela faz é o sistema parar de fingir que leu.
 */
describe("DEBT-102 — a extração recusa PDF sem texto útil, em vez de gravar vazio", () => {
    // `avaliarExtracao` é público e estático de propósito: a guarda é REGRA METODOLÓGICA
    // (o que conta como "o estudo foi lido"), não detalhe de implementação, e precisa ser
    // testável de frente — não por uma porta que o compilador fechou.
    const avaliar = PdfExtractorService.avaliarExtracao;

    it("RECUSA texto vazio — o caso do PDF-imagem", () => {
        const r = avaliar("", 12);
        expect(r).toBeTruthy();
        expect(r).toMatch(/sem texto extraível/);
        expect(r).toMatch(/OCR/);
    });

    it("RECUSA o quase-nada que o pdf-parse colhe de um digitalizado", () => {
        // Cabeçalho e numeração de página é o que sobra quando não há camada de texto.
        expect(avaliar("Journal of Something  12  2021", 20)).toBeTruthy();
    });

    it("RECUSA por DENSIDADE: muito texto no total, pouco por página", () => {
        // 300 caracteres passa no limite absoluto, mas em 40 páginas é 7/página —
        // assinatura de digitalizado, não de artigo.
        const r = avaliar("x".repeat(300), 40);
        expect(r).toBeTruthy();
        expect(r).toMatch(/texto insuficiente/);
        expect(r).toMatch(/página/);
    });

    it("ACEITA artigo real — controle positivo, para a guarda não virar falso negativo novo", () => {
        // ~4000 caracteres em 10 páginas = 400/página, densidade típica de artigo.
        expect(avaliar("Esta revisão sistemática avaliou ".repeat(120), 10)).toBeNull();
    });

    it("ACEITA documento curto mas denso — 1 página com texto de verdade", () => {
        expect(avaliar("a".repeat(800), 1)).toBeNull();
    });

    it("não divide por zero quando o PDF não declara páginas", () => {
        expect(avaliar("a".repeat(800), 0)).toBeNull();
    });

    it("a mensagem diz que o .txt NÃO foi gravado — o estudo não entra no corpus como vazio", () => {
        // Importa para quem lê o erro: o registro não virou um arquivo vazio em
        // 04_extraction/fulltext que o RAG indexaria depois.
        expect(avaliar("", 5)).toMatch(/NÃO foi gravado/);
    });
});
