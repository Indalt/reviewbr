# Protocolo de Busca: Regime Científico/Acadêmico (01_regime_cientifico)

> **Metodologia Formal Registrada:** Revisão de Escopo (Scoping Review)
> **Padrão Aplicável:** PRISMA-ScR (22 itens)
> **Motivação Metodológica:** Diferente de uma revisão sistemática clássica (focada em avaliar intervenções e desfechos clínicos), a Revisão de Escopo é o padrão-ouro (segundo o JBI) para *mapear* a literatura existente, identificar lacunas, e investigar como um conceito ("o que é bebida brasileira") é construído ao longo de diferentes bases de dados e ontologias.

## 1. Escopo e Justificativa

Este protocolo rege o primeiro braço empírico do programa "Bebidas Brasileiras". Seu objetivo é realizar o mapeamento *estritamente* dentro do Regime Científico/Acadêmico.

O foco recai sobre o intersection: **Ceará + Caju + Comunidades Indígenas / Saberes Tradicionais**.

**Justificativa Teórica:** Busca mapear *como a ciência constrói seu objeto*. O que os químicos chamam de "tecnologia de fermentação do pseudofruto" e o que os etnólogos chamam de "ritual do Torém" são, aqui, capturados pelas categorias de indexação acadêmica.

## 2. Bases de Dados a Consultar

O LIBRARIAN deve priorizar grandes agregadores acadêmicos:

- **OpenAlex** (Grafo massivo, altamente inclusivo)
- **PubMed/EuropePMC** (Foco biológico, nutricional e clínico)
- **SciELO / OasisBR** (Foco em teses e literatura local crítica) *(Buscas nativas via script)*

## 3. Arquitetura da Busca Booleana (Estratégia)

O vocabulário usado nesta busca pertence ao regime acadêmico.

**Componente A (Matéria/Processo):**
`("bebida" OR "beverage" OR "fermentado" OR "fermented" OR "vinho" OR "wine" OR "cajuina" OR "mocororo" OR "cauim" OR "suco" OR "juice" OR "refresco" OR "licor" OR "liqueur" OR "refrigerante" OR "espumante" OR "mel de caju")`

**Componente B (Insumo):**
`("caju" OR "cashew" OR "anacardium")`

**Componente C (Território/Agência):**
`("ceara" OR "indigena" OR "indigenous" OR "tradicional" OR "tremembe" OR "pitaguari" OR "tapeba" OR "jenipapo-kaninde" OR "quixelu")`

*Nota para o LIBRARIAN:* Como o Grafo (OpenAlex) indexa em inglês preponderantemente na camada abstract, as expressões de busca misturam termos locais com suas traduções na biologia econômica.

## 4. Critérios de Inclusão/Exclusão (Para o SCREENER)

Diferente de uma revisão médica, não há restrição de desenho de estudo.

- **Inclusão:** Qualquer registro científico, seja tese antropológica (etnografia) ou artigo de engenharia de alimentos (química da fermentação).
- **Exclusão:** Estudos sobre alergia alimentar da castanha sem relação com bebida; estudos agronômicos sobre pragas do cajueiro sem foco na transformação produtiva ou cultural.
