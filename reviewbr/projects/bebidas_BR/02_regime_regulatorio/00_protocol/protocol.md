# Protocolo de Busca: Regime Regulatório (02_regime_regulatorio)

> **Metodologia Formal Registrada:** Revisão de Escopo (Scoping Review)
> **Padrão Aplicável:** PRISMA-ScR (22 itens)
> **Motivação Metodológica:** Diferente de uma revisão sistemática clássica (focada em avaliar intervenções e desfechos clínicos), a Revisão de Escopo é o padrão-ouro (segundo o JBI) para *mapear* a literatura existente, identificar lacunas, e investigar como um conceito ("o que é bebida brasileira") é construído ao longo de diferentes bases de dados e ontologias.

## 1. Escopo e Justificativa

Este protocolo rege o segundo braço empírico do programa "Bebidas Brasileiras". Seu objetivo é realizar o mapeamento *estritamente* dentro do Regime Regulatório/Institucional do Estado.

O foco recai sobre o intersection: **Ceará + Caju + Comunidades Indígenas / Saberes Tradicionais**.

**Justificativa Teórica:** Busca mapear *como o Estado normatiza seu objeto*. O que o Estado chama de "Padrão de Identidade e Qualidade (PIQ)", restrições sanitárias, graduação alcoólica permitida, e categorias fiscais.

## 2. Bases de Dados a Consultar

O LIBRARIAN deve focar em portais governamentais e de regulação técnica:

- **MAPA** (Ministério da Agricultura e Pecuária) - Biblioteca Nacional de Agricultura (BINAGRI)
- **ANVISA** - Resoluções da Diretoria Colegiada (RDCs)
- **Diários Oficiais** (DOU) via scraping institucional se necessário.

## 3. Arquitetura da Busca Booleana (Estratégia)

O vocabulário usado nesta busca pertence ao regime regulatório do Estado brasileiro.

**Componente A (Matéria/Processo normatizado):**
`("bebida" OR "fermentado de fruta" OR "suco" OR "refresco" OR "licor" OR "aguardente" OR "padrao de identidade e qualidade" OR "PIQ" OR "bebida regional" OR "refrigerante" OR "vinho" OR "espumante" OR "mel de caju")`

**Componente B (Insumo tipificado):**
`("caju" OR "polpa de caju" OR "pseudofruto")`

**Componente C (Território/Agência no escopo da regra):**
`("ceara" OR "indigena" OR "tradicional" OR "artesanal" OR "agricultura familiar" OR "producao local")`

## 4. Critérios de Inclusão/Exclusão (Para o SCREENER)

- **Inclusão:** Leis, decretos, instruções normativas, RDCs, ofícios e manuais técnicos do Estado brasileiro que regulamentam a produção, venda ou classificação de bebidas derivadas do caju.
- **Exclusão:** Documentos de outros países; normas técnicas puramente industriais que não tangenciem a definição material da bebida em si (ex: normas apenas sobre o rótulo de plástico, sem tocar na bebida).
