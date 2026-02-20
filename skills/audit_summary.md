---
name: Audit Summary
description: System Integrity Audit against PRISMA F0-F8 Specification (SUP.11 Requirement)
---

# Auditoria de Integridade do Sistema - PRISMA F0-F8

**Data da Auditoria:** 2026-02-19
**Objetivo:** Verificar a integridade das ferramentas atuais (prismAId + mcp-repos-br) frente à "Especificação Completa da Trilha de Pesquisa" fornecida e identificar lacunas para o fechamento do projeto.

## 1. Mapeamento de Ferramentas por Fase

O servidor MCP atual (`mcp-repos-br/src/index.ts`) expõe as seguintes rotas que cobrem a especificação:

| Fase PRISMA | Requisito Principal | Ferramenta/Recurso Disponível | Status |
|---|---|---|---|
| **F0 / F1** | Registro de Protocolo | Tratado via Template de Diretório e `Coordinator Agent`. | ✅ Atendido via Agente |
| **F2** | Execução de Busca (PRISMA-S) | `search_papers_optimized`, `search_pubmed`, `harvest_records`, `search_repository` | ✅ Atendido (Ferramentas robustas) |
| **F3** | Deduplicação | `deduplicate_dataset` | ✅ Atendido |
| **F4** | Triagem (IA) | `screen_candidates` | ✅ Atendido (Integração Gemini OK) |
| **F5 / F6** | Extração de Dados e Exportação| `export_dataset`, scripts TS em `scripts/` | ⚠️ Parcial (Falta validação rígida de extração do PDF) |
| **F7 / F8** | Síntese e Manuscrito | Geração automatizada via `Synthesis Agent`. | ⚠️ Parcial (Falta script para validar matemática do PRISMA Flow - RV-05) |

## 2. Lacunas Identificadas (Gaps)

1. **RV-05 (Inconsistências numéricas bloqueiam exportação):** A regra exige que o sistema impeça a emissão do manuscrito se a matemática do fluxograma F8.1 não bater perfeitamente. Atualmente não há uma ferramenta no MCP dedicada a auditar o JSON de contagem (`prisma_flow.json`).
2. **RV-02 (Números emergem do processo):** Precisamos garantir que os scripts de parsing que preenchem `prisma_flow.json` (através do Coordinator Agent) operem em arquivos log reais (`records_deduped.csv`, `screening_fulltext.csv`), não em estimativas.
3. **Download de Texto Completo (F4.2.2 / F1.3.2.6):** A especificação F4.2 exige a tentativa de obtenção de texto completo. O MVP lida com triagem de Título/Resumo (F4.1), mas a triagem Full-Text e Extração (F5) necessitam baixar os PDFs fisicamente para a pasta do projeto. No Go (`prismaid/download`), existem capacidades, mas elas não estão interligadas ao design de pasta restrita do Agente.

## 3. Riscos (5) e Correções (5)

| ID | Risco Identificado | Correção Proposta / Implementada |
|---|---|---|
| R1 | Agentes escreverem arquivos soltos no C:/ | **Regra Constrita:** O `SKILL.md` agora força os agentes a operarem apenas dentro da raiz do "Context Directory". |
| R2 | A matemática do Fluxograma PRISMA não bater | **Criação de Ferramenta Auxiliar:** Desenvolver um script TS em `mcp-repos-br` que audite de forma inflexível o `prisma_flow.json`. |
| R3 | A API de busca ocultar erros silenciosamente | Os logs em CSV do Mining Agent agora requerem uma coluna `Errors` que não pode ser omitida. |
| R4 | Extração (F5) ser feita apenas em metadados OAI | A extração deve ser alimentada pelo conteúdo do PDF / Tika Server (presente na raiz do projeto). |
| R5 | Protocolos incompletos gerando viés (RV-01) | O Coordinator Agent foi programado para varrer `[TBD]` no `protocol.md` e bloquear avanço recursivamente. |

## 4. Próximos Passos Imediatos para Finalização (Fechamento do Projeto)

1. Criar o **script de Validação do Fluxograma PRISMA (RV-05)** e disponibilizá-lo para uso do Coordinator Agent.
2. Interligar o sistema de Downloader em Go (`prismaid/download`) à lógica do Synthesis Agent, garantindo que a regra "F1.3.2.6 Texto completo indisponível" funcione.
3. Realizar um **Simulado Ponto-a-Ponto (End-to-End Run)** com os 4 agentes para testar a entrega de valor desde o F0 até o F8 usando o template recém-criado.
