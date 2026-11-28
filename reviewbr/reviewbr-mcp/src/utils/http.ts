/**
 * HTTP client utility with retry and timeout. Shared across all access layers.
 *
 * O ReviewBR se identifica: User-Agent com o nome e o endereço do projeto, como já faziam o
 * CORE, o Europe PMC e o Semantic Scholar. Até 19/11/2026 este cliente sorteava um User-Agent
 * de navegador, o que faz um robô passar por pessoa e anula o robots.txt e os bloqueios que o
 * repositório aplica a robôs. Conferência jurídica e ética de 19/11/2026:
 * `.claude/maintenance/CONFERENCIA_acesso_2026-11-19.md`.
 */

import { Agent } from "undici";

export const REVIEWBR_USER_AGENT = "ReviewBR-MCP/1.0 (+https://github.com/Indalt/reviewbr)";

export interface HttpOptions {
    timeout?: number;
    maxRetries?: number;
    headers?: Record<string, string>;
    acceptSelfSigned?: boolean;
}

const DEFAULT_OPTIONS: Required<HttpOptions> = {
    timeout: 30_000,
    maxRetries: 3,
    headers: {},
    acceptSelfSigned: true,
};

/**
 * Linha 26 da FILA (28/11/2026): o certificado sem verificação vale só para o pedido que o aceita.
 * Até então o cliente punha `NODE_TLS_REJECT_UNAUTHORIZED = "0"` no processo inteiro — e, no caminho
 * de sucesso, nunca o tirava: depois do primeiro pedido, nenhum pedido do servidor verificava
 * certificado. Agora o pedido que aceita certificado próprio (repositório brasileiro com cadeia
 * incompleta) leva um dispatcher só dele; os demais verificam.
 */
const SEM_VERIFICAR_CERTIFICADO = new Agent({ connect: { rejectUnauthorized: false } });

/** Status de sobrecarga momentânea: a fonte pede para tentar de novo (linha 26, item 3). */
const STATUS_DE_NOVA_TENTATIVA = new Set([429, 502, 503, 504]);
/** Teto do Retry-After que a fonte pede, em segundos. */
const TETO_RETRY_AFTER_S = 60;

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retry (exponential backoff) and configurable timeout. Tenta de novo em erro de rede e
 * nos status de sobrecarga (429, 502, 503, 504), respeitando o Retry-After até 60 s; outros status
 * voltam na hora, para quem chamou decidir.
 */
export async function fetchWithRetry(
    url: string,
    options?: HttpOptions & { method?: string; body?: string }
): Promise<Response> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
        // Create fresh controller per attempt (previous bug: shared across retries)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

        try {
            const response = await fetch(url, {
                method: options?.method ?? "GET",
                headers: {
                    "User-Agent": REVIEWBR_USER_AGENT,
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
                    ...opts.headers,
                },
                signal: controller.signal,
                body: options?.body,
                redirect: "follow",
                ...(opts.acceptSelfSigned ? { dispatcher: SEM_VERIFICAR_CERTIFICADO } : {}),
            } as RequestInit);

            clearTimeout(timeoutId);
            if (STATUS_DE_NOVA_TENTATIVA.has(response.status) && attempt < opts.maxRetries - 1) {
                const pedido = Number(response.headers.get("retry-after"));
                const esperaMs = Number.isFinite(pedido) && pedido > 0
                    ? Math.min(pedido, TETO_RETRY_AFTER_S) * 1000
                    : Math.pow(2, attempt) * 1000;
                await response.body?.cancel().catch(() => undefined);
                lastError = new Error(`HTTP ${response.status}`);
                await sleep(esperaMs);
                continue;
            }
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            lastError = error as Error;

            if (attempt < opts.maxRetries - 1) {
                const backoffMs = Math.pow(2, attempt) * 1000;
                await sleep(backoffMs);
            }
        }
    }

    throw new Error(
        `Failed after ${opts.maxRetries} attempts for ${url}: ${lastError?.message}`
    );
}

/**
 * Fetch text content with retry.
 */
export async function fetchText(
    url: string,
    options?: HttpOptions
): Promise<string> {
    const response = await fetchWithRetry(url, options);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return response.text();
}

/**
 * Fetch and return response + body as buffer (for downloads).
 */
export async function fetchBuffer(
    url: string,
    options?: HttpOptions
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
    const response = await fetchWithRetry(url, options);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
    }
    const buffer = await response.arrayBuffer();
    return {
        buffer,
        contentType: response.headers.get("content-type") ?? "application/octet-stream",
    };
}
