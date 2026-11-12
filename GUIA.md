# Guia do ReviewBR para quem está começando

Escrito em 12/11/2026. Vale para o ReviewBR como ele está neste repositório nessa data.

## 1. O que o ReviewBR é

O ReviewBR é um apoio à pesquisa que roda dentro de um assistente de IA. Você conversa com o assistente; ele usa as
ferramentas do ReviewBR para buscar, guardar, contar e conferir, e para em cada etapa para você decidir.

Ele tem duas partes:

| parte | o que é | onde fica |
|---|---|---|
| o servidor | 44 ferramentas (busca em bases, deduplicação, triagem, contagem do funil, exportação) | `reviewbr/reviewbr-mcp/` |
| os agentes e os procedimentos | 8 agentes, 9 procedimentos, o catálogo de metodologias e as regras de rigor | `.claude/` |

O que ele faz hoje, e o que não faz:

- **Conduz do começo ao fim dois tipos de pesquisa:** a revisão sistemática e a revisão de escopo, pelo PRISMA.
- **Conhece cerca de cem outras metodologias e normas** no catálogo, só como indicação da fonte oficial. Para essas ele informa e
  sugere, mas não conduz.
- **Faz busca exploratória**, sem projeto, para você entender um campo antes de decidir o que pesquisar.
- **Não decide por você.** Critério de inclusão, escolha de metodologia e síntese são decisões suas, e ficam
  registradas com o seu nome e a data.
- **Não prova que um estudo é verdadeiro.** Ele confere a forma, as contas e a origem de cada dado.

## 2. Onde usar

**Use no Claude Code, dentro do VS Code.** É o único lugar em que as duas partes funcionam juntas: os agentes e os
procedimentos da pasta `.claude/` só são lidos pelo Claude Code.

**Não use o `reviewbr-web`.** A página da pasta `reviewbr-web/` não acompanhou as mudanças: a última alteração de
função é de março de 2026, ela declara à mão 25 das 44 ferramentas, e pelo menos uma com parâmetros que o servidor
já não aceita. Ela não tem os agentes nem as travas.

Em outro assistente (Claude Desktop, Cursor e semelhantes) só o servidor funciona. Veja a seção 7.

## 3. Instalar, uma vez

Você precisa de: Node.js 20 ou mais novo, Git, VS Code com a extensão Claude Code e uma conta Claude.

1. Baixe o repositório para `C:\reviewbr`:
   ```
   git clone https://github.com/Indalt/reviewbr.git C:\reviewbr
   ```
2. Monte o servidor:
   ```
   cd C:\reviewbr\reviewbr\reviewbr-mcp
   npm install
   npm run build
   ```
3. Crie o arquivo `C:\reviewbr\reviewbr\reviewbr-mcp\.env` com as suas chaves. Só a primeira é necessária, e só
   para a triagem e a extração feitas por IA:
   ```
   GOOGLE_API_KEY=sua-chave
   ZOTERO_USER=opcional
   ZOTERO_API_KEY=opcional
   ```
   Esse arquivo não vai para o GitHub. Nunca cole a chave numa conversa.
4. Abra a pasta `C:\reviewbr` no VS Code. Tem de ser essa pasta, e não uma subpasta: é nela que estão o
   `.mcp.json` e a `.claude/`.

Se você baixou o repositório em outro lugar, abra o `.mcp.json` e troque o caminho `c:/reviewbr/...` pelo seu.

## 4. Ligar e desligar o servidor

O arquivo `.mcp.json`, na raiz, diz ao Claude Code como iniciar o servidor. Você não inicia nada à mão.

| o que você quer | como fazer |
|---|---|
| ligar | abra `C:\reviewbr` no VS Code e inicie uma conversa no Claude Code. Na primeira vez ele pergunta se pode usar o servidor `reviewbr`: aceite |
| ver se está ligado | digite `/mcp` na conversa. O `reviewbr` deve aparecer como conectado |
| desligar ou religar | no mesmo `/mcp`, escolha o `reviewbr` e desative ou reconecte |
| desligar de vez | apague o bloco `reviewbr` do `.mcp.json` |
| atualizar depois de mudar o código | rode `npm run build` e reconecte pelo `/mcp`. Sem reconectar, o servidor antigo continua no ar |

Se o `reviewbr` aparecer com erro no `/mcp`, quase sempre falta o `npm run build` ou o caminho do `.mcp.json` está
errado.

## 5. Usar: o caminho de uma pesquisa

Você escreve em português, em frases comuns. Os exemplos abaixo são pedidos que você pode copiar.

### 5.1 Explorar, sem compromisso

> Quero entender o que já se publicou sobre cajuína e compostos fenólicos. Faça uma busca exploratória.

O assistente busca em bases abertas (OpenAlex, PubMed e repositórios brasileiros) e traz um panorama. Isso
ainda não é pesquisa com método: serve para você formular a pergunta.

### 5.2 Começar um projeto

> Quero começar uma revisão sobre o efeito do processamento nos compostos fenólicos da cajuína.

O que acontece, na ordem:

1. **Tipo e metodologia.** O ReviewBR mostra as metodologias que servem ao que você descreveu e diz o que cada uma
   exige. Você escolhe.
2. **Protocolo.** O assistente faz as perguntas que a metodologia pede (a pergunta de pesquisa, os critérios de
   inclusão e exclusão, as bases, o período). Você responde, lê o protocolo e o aprova. Aprovado, ele é travado:
   mudar depois exige registrar a mudança.
3. **Nível de controle.** Ele pergunta se você quer `estrito` (para a cada etapa e espera o seu "pode seguir";
   é o indicado para tese e publicação) ou `fluido` (segue sozinho nas etapas mecânicas).
4. **Busca.** As buscas aprovadas são executadas, e cada uma fica registrada com o texto exato, a base, a data e
   quantos resultados vieram.
5. **Deduplicação e triagem.** Ele remove os repetidos e aplica os seus critérios, primeiro pelo título e resumo,
   depois pelo texto completo. Você confere e decide os casos duvidosos.
6. **Extração e leitura.** Dos estudos incluídos ele extrai os dados para uma tabela e responde às suas perguntas
   citando o estudo e a página.
7. **Síntese e relato.** Ele propõe a síntese e o texto; você revisa e aprova. O funil de números é recalculado a
   partir dos arquivos, e a exportação é barrada se as contas não fecham.

### 5.3 Parar e voltar

Tudo fica em arquivos, na pasta do projeto. Você pode fechar a conversa a qualquer momento. Para voltar:

> Continue o projeto da cajuína. Em que etapa estamos?

### 5.4 Onde estão os seus arquivos

Cada projeto é uma pasta em `reviewbr/projects/<nome-do-projeto>/`:

| pasta ou arquivo | o que guarda |
|---|---|
| `protocol.md` | o protocolo que você aprovou |
| `project_state.json` | a etapa em que o projeto está e as suas decisões |
| `01_raw/` | os resultados brutos das buscas |
| `02_deduplicated/` | os resultados sem repetição |
| `03_screening/` | incluídos, excluídos e o motivo |
| `04_extraction/` | os dados extraídos |
| `05_synthesis/` | a síntese e o texto |
| `logs/` | o registro de cada busca e de cada execução |

## 6. O que você precisa conferir sempre

- **Leia o que a IA produziu antes de aprovar.** Aprovar é assinar: a decisão passa a ser sua.
- **Busca com zero resultado não prova que não existe.** Peça uma busca de controle por algo que você sabe que
  existe na mesma base.
- **Declare o uso de IA no seu texto**: onde foi usada e como. Se a revista ou a metodologia exigir mais, o que
  ela exigir.
- **O preenchimento do formulário oficial da norma (por exemplo, o checklist do PRISMA) é seu.** O ReviewBR ajuda,
  mas a correspondência que ele faz entre os itens da norma e as etapas não foi conferida contra a fonte.
- **A triagem por IA não dá sempre a mesma resposta.** O que vale é o registro de cada decisão e a sua
  conferência.

## 7. Usar o servidor em outra ferramenta

O servidor segue o padrão MCP, que vários assistentes aceitam. Em qualquer um deles a configuração tem os mesmos
três dados: um nome, o comando `node` e o caminho do arquivo `dist/index.js`.

No Claude Desktop, por exemplo, edite `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "reviewbr": {
      "command": "node",
      "args": ["C:/reviewbr/reviewbr/reviewbr-mcp/dist/index.js"]
    }
  }
}
```

Feche e abra o programa. Em outras ferramentas, procure "MCP" nas configurações e informe os mesmos dados; o nome
do arquivo de configuração muda de uma para outra.

**O limite:** fora do Claude Code você tem as 44 ferramentas, mas não os agentes, os procedimentos nem a condução
por etapas. O assistente pode chamar as ferramentas em qualquer ordem. As travas que estão no código continuam
valendo (protocolo travado antes da busca, contagem do funil, bloqueio da exportação).

## 8. Tornar o ReviewBR disponível para outras pessoas

Há três níveis. Só o primeiro funciona hoje.

### 8.1 Pelo GitHub — funciona hoje

O repositório é público. Qualquer pessoa segue as seções 3 e 4 deste guia. Para publicar uma mudança sua:

1. `npm run build` e `npx vitest run`, em `reviewbr/reviewbr-mcp/`: a suíte tem de passar inteira.
2. `git add`, `git commit` e `git push`.
3. Quem já usa roda `git pull`, `npm install`, `npm run build` e reconecta o servidor.

Antes de divulgar o endereço, veja o que está no repositório: a pasta `reviewbr/projects/` tem cerca de 380
arquivos de projetos de pesquisa.

### 8.2 Como pacote instalável (`npx reviewbr-mcp`) — ainda não funciona

Com um pacote no npm, a pessoa não precisaria baixar o repositório. O que impede hoje:

- o servidor procura o catálogo, as normas e as metodologias na pasta `.claude/` da raiz do repositório, três
  níveis acima dele. Um pacote só com o servidor não as encontra;
- o `README.md` do servidor descreve uma versão antiga (outro nome, 7 ferramentas);
- o `package.json` não tem autor nem endereço do repositório.

### 8.3 No diretório de conectores da Anthropic — ainda não atende

O diretório tem regras de entrada. Pelo que foi conferido em 11/11/2026, falta:

- marcar cada ferramenta como "só lê" ou "altera/apaga" (nenhuma das 44 tem essa marca);
- uma política de privacidade publicada;
- descrições das ferramentas conferidas uma a uma contra o que elas fazem.

Os itens 8.2 e 8.3 são trabalho de manutenção e só entram em pauta quando forem pedidos.

## 9. Quando algo der errado

| o que aparece | o que costuma ser |
|---|---|
| o assistente diz que não tem as ferramentas do ReviewBR | servidor desligado: veja o `/mcp` |
| aviso de que o protocolo não está travado | a busca do projeto só roda depois de você aprovar o protocolo |
| a exportação é recusada | os números do funil não fecham; peça "mostre o funil e onde ele não fecha" |
| a triagem por IA falha | falta a chave no `.env`, ou a chave não tem crédito |
| nada muda depois de alterar o código | faltou `npm run build` e reconectar |
