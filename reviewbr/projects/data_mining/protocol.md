# Protocolo Padrão de Revisão (Metodologia Geral)

## 0) Informações Gerais

- **Status**: Protocolo Mestre (Aplicável a todas as execuções neste projeto)
- **Ferramenta**: PRISMAid System

## 1) Escopo Metodológico

### 1.1 Definição de Repositório

- [x] Instituição brasileira ou rede nacional (Oasisbr, BDTD, SciELO).

### 1.2 Regra de Acesso

- **Opção A (Acesso Aberto)**: Incluir apenas itens com texto completo disponível.

### 1.3 Estrutura da Pergunta

- **Tema**: Definido por execução (ver `search_log_prisma_s.csv`).
- **Delimitação Geográfica**: Definido por execução (ex.: Nordeste, Brasil, etc.).
- **Objetivo**: Identificar e caracterizar a produção científica disponível em repositórios nacionais.

### 1.4 Idiomas

- Português, Inglês, Espanhol.

---

## 2) Estratégia de Busca (Padrão)

### Bloco 1: Tema

- `("termo pesquisado")`

> *Nota*: O termo exato de cada busca será registrado automaticamente no Log de Auditoria (`search_log_prisma_s.csv`) para garantir reprodutibilidade (PRISMA-S).

### Bloco 2: Filtros

- Geográficos (Estados/Regiões) ou Temporais.

> *Aplicação*: Conforme parâmetros passados na CLI/Interface.

---

## 3) Registro e Transparência

Todas as buscas realizadas sob este protocolo gerarão:

1. **Entrada no Log** (`search_log_prisma_s.csv`): ID, Data, Termo, Filtros, Contagem.
2. **Lista de Strings** (`search_strings.md`): Histórico de estratégias completas.

> Este documento define as **regras do jogo** (Onde buscar, como tratar acesso). As **jogadas** (Termos específicos) ficam registradas nos Logs.
