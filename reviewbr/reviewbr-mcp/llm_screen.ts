import * as fs from "node:fs";
import * as path from "node:path";

// Note: Ensure the API key is passed in the script environment
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("GEMINI_API_KEY must be set");
    process.exit(1);
}

const searchDir = "c:/Users/Vicente/reviewbr/reviewbr/reviewbr-mcp/projects/caju_beverages/02_search";
const screeningDir = "c:/Users/Vicente/reviewbr/reviewbr/reviewbr-mcp/projects/caju_beverages/03_screening";
if (!fs.existsSync(screeningDir)) fs.mkdirSync(screeningDir, { recursive: true });

const originalJson = JSON.parse(fs.readFileSync(path.join(searchDir, "search_results.json"), 'utf8'));

// Criteria
const criteria = "O artigo DEVE tratar especificamente sobre a produção de bebidas ou fermentados à base de caju (suco, vinho, cajuína, kefir de caju, etc). Artigos apenas botânicos, médicos genéricos, ou sobre outros usos não-alimentares/não-bebidas do caju devem ser excluídos.";

// We will batch call the standard REST API
async function screenBatch(records: any[]) {
    const results = [];
    const BATCH_SIZE = 10;

    // We send them individually but concurrently in small batches
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        console.log(`Processando lote ${i / BATCH_SIZE + 1} de ${Math.ceil(records.length / BATCH_SIZE)}...`);

        const promises = batch.map(async (record) => {
            const prompt = `Você é um avaliador sistemático sênior.
            
CRITÉRIO OBRIGATÓRIO: ${criteria}

TÍTULO: ${record.title}
RESUMO: ${record.description || "N/A"}

Sua tarefa:
Responda APENAS com um objeto JSON válido. Responda 'YES' se trata da produção de bebidas e fermentados de caju, e 'NO' caso contrário.

Formato:
{
  "decision": "YES" | "NO",
  "reasoning_steps": ["passo 1", "passo 2"]
}`;

            try {
                const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            responseMimeType: "application/json",
                            temperature: 0.1
                        }
                    })
                });

                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error("Sem texto");
                const parsed = JSON.parse(text);

                return {
                    ...record,
                    screening_decision: parsed.decision.toLowerCase(),
                    screening_reason: parsed.reasoning_steps.join(" "),
                    screening_method: "llm_generative"
                };
            } catch (err: any) {
                console.error(`Erro no artigo ${record.title}: ${err.message}`);
                return {
                    ...record,
                    screening_decision: "error",
                    screening_reason: err.message,
                    screening_method: "llm_generative"
                };
            }
        });

        const resolved = await Promise.all(promises);
        results.push(...resolved);

        // Pequena pausa para rate limit
        await new Promise(r => setTimeout(r, 2000));
    }

    return results;
}

async function main() {
    console.log("=== INICIANDO TRIAGEM AUTÔNOMA (LLM) ===");
    console.log(`Total de artigos a triar: ${originalJson.length}`);

    const start = Date.now();
    const screened = await screenBatch(originalJson);
    const end = Date.now();

    const included = screened.filter(r => r.screening_decision === "yes");
    const excluded = screened.filter(r => r.screening_decision === "no");

    fs.writeFileSync(path.join(screeningDir, "llm_screened_dataset.json"), JSON.stringify(screened, null, 2));

    console.log("\n=== RELATÓRIO DO LLM ===");
    console.log(`Tempo: ${((end - start) / 1000).toFixed(1)} segundos`);
    console.log(`Relevantes (YES): ${included.length}`);
    console.log(`Irrelevantes (NO): ${excluded.length}`);

    console.log("\nTop 5 Aprovados:");
    included.slice(0, 5).forEach(r => console.log(`- ${r.title}\n  Motivo: ${r.screening_reason}`));
}

main().catch(console.error);
