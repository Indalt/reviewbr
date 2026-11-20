/**
 * HTTP client utility with retry and timeout. Shared across all access layers.
 *
 * O ReviewBR se identifica: User-Agent com o nome e o endereço do projeto, como já faziam o
 * CORE, o Europe PMC e o Semantic Scholar. Até 19/11/2026 este cliente sorteava um User-Agent
 * de navegador, o que faz um robô passar por pessoa e anula o robots.txt e os bloqueios que o
 * repositório aplica a robôs. Conferência jurídica e ética de 19/11/2026:
 * `.claude/maintenance/CONFERENCIA_acesso_2026-11-19.md`.
 */

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

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retry (exponential backoff) and configurable timeout.
 * Uses NODE_TLS_REJECT_UNAUTHORIZED for self-signed cert support.
 */
export async function fetchWithRetry(
    url: string,
    options?: HttpOptions & { method?: string; body?: string }
): Promise<Response> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Allow self-signed certificates for Brazilian repos
    if (opts.acceptSelfSigned) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

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
            });

            clearTimeout(timeoutId);
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

    // Restore TLS setting
    if (opts.acceptSelfSigned) {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
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
