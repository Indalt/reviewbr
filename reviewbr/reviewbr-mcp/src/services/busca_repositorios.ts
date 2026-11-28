/**
 * A busca da `search_repository` em vários repositórios: um resultado por repositório, na ordem
 * do catálogo, com o erro de cada um em vez de derrubar os outros.
 *
 * Linha 26 da FILA, item 2 (28/11/2026): sem `repositories`, a tool consulta todos os ativos do
 * catálogo (94 em 28/11). Um atrás do outro, a busca de 12/11 passou de 1800 s sem resposta. Agora
 * vão em grupos de 5, como a `search_papers_optimized` já fazia (`search.ts`); o limite de pedidos
 * por endereço (`rate-limiter.ts`) continua valendo para cada servidor.
 */

export const REPOSITORIOS_EM_PARALELO = 5;

export type ResultadoPorRepositorio<I, T> = { item: I; valor: T; erro?: undefined } | { item: I; valor?: undefined; erro: string };

export async function buscarEmRepositorios<I, T>(
    itens: I[],
    buscar: (item: I) => Promise<T>,
    emParalelo: number = REPOSITORIOS_EM_PARALELO,
): Promise<ResultadoPorRepositorio<I, T>[]> {
    const saida: ResultadoPorRepositorio<I, T>[] = [];
    for (let i = 0; i < itens.length; i += emParalelo) {
        const grupo = itens.slice(i, i + emParalelo);
        saida.push(...await Promise.all(grupo.map(async (item): Promise<ResultadoPorRepositorio<I, T>> => {
            try {
                return { item, valor: await buscar(item) };
            } catch (e) {
                return { item, erro: (e as Error).message };
            }
        })));
    }
    return saida;
}
