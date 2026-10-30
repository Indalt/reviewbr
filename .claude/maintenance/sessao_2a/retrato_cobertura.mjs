// Sessão 2a (DEBT-142) — retrato da saída do check_standard_coverage, por padrão e por método.
// Armadilha 1 do prompt: mudar ONDE o mapeamento mora não pode mudar O QUE ele diz. Grava o retrato
// antes e depois da migração; o diff tem de ser vazio, salvo as mudanças deliberadas, listadas.
// Uso: node retrato_cobertura.mjs <rotulo>   → grava retrato_<rotulo>.json ao lado deste arquivo.
// Reproduz o que o handler da tool faz (src/index.ts, check_standard_coverage), chamando o serviço
// compilado (dist/) — o CLI --tool não registra as tools de manutenção.
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "..", "..", "..");
const dist = path.join(raiz, "reviewbr", "reviewbr-mcp", "dist", "services");
const carregar = (f) => import(pathToFileURL(path.join(dist, f)).href);
const { StandardsService } = await carregar("standards.js");
const cobertura = await carregar("standard_coverage.js");
const { StandardCoverageService } = cobertura;

const rotulo = process.argv[2];
if (!rotulo) { console.error("uso: node retrato_cobertura.mjs <rotulo>"); process.exit(1); }
const metodos = fs.readdirSync(path.join(raiz, ".claude", "methodologies"), { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => e.name).sort();

// O render reproduz o ramo render=true do handler. Depois da migração o handler chama
// `StandardCoverageService.checklist`; antes, montava o checklist só do padrão.
function render(id, metodo) {
    if (typeof StandardCoverageService.checklist === "function") return StandardCoverageService.checklist(raiz, id, metodo);
    const std = StandardsService.read(raiz, id);
    if (!std) return `ERRO: padrão "${id}" não encontrado em .claude/standards/.`;
    const rel = StandardCoverageService.conferir(raiz, id, metodo);
    return StandardsService.renderChecklist(std, {
        contestados: Object.fromEntries(rel.contestados.map((c) => [c.item, c.por])),
        rodape: [
            `**Fração conferida:** ${rel.fracao}`,
            `**Premissa da falsificação:** ${rel.premissa_da_falsificacao}`,
            `**Limite da conferência:** ${rel.limite}`,
        ],
    });
}

const saida = {
    panorama: { available: StandardsService.list(raiz), padroes: StandardCoverageService.panorama(raiz) },
    conferir: {},
    render: {},
};
for (const id of StandardsService.list(raiz)) {
    saida.conferir[`${id} | (todos)`] = StandardCoverageService.conferir(raiz, id);
    saida.render[`${id} | (todos)`] = render(id, undefined);
    for (const m of metodos) {
        saida.conferir[`${id} | ${m}`] = StandardCoverageService.conferir(raiz, id, m);
        saida.render[`${id} | ${m}`] = render(id, m);
    }
}
const arq = path.join(aqui, `retrato_${rotulo}.json`);
fs.writeFileSync(arq, JSON.stringify(saida, null, 2) + "\n");
console.log("gravado:", arq, "—", Object.keys(saida.conferir).length, "relatórios,", Object.keys(saida.render).length, "checklists");
for (const [k, r] of Object.entries(saida.conferir)) console.log(k.padEnd(36), "valid", String(r.valid).padEnd(5), "fracao", r.fracao);
