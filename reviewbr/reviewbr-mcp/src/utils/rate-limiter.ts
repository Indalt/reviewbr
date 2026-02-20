/**
 * Rate limiter using token bucket per domain.
 * Ensures polite crawling of institutional repositories.
 */

interface BucketState {
    tokens: number;
    lastRefill: number;
    ratePerSecond: number;
}

export class RateLimiter {
    private buckets: Map<string, BucketState> = new Map();
    private defaultRate: number;

    constructor(defaultRatePerSecond: number = 1) {
        this.defaultRate = defaultRatePerSecond;
    }

    /**
     * Extract domain from URL for per-domain rate limiting.
     */
    private getDomain(url: string): string {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    /**
     * Set custom rate for a specific domain.
     */
    setRate(domain: string, ratePerSecond: number): void {
        const bucket = this.buckets.get(domain);
        if (bucket) {
            bucket.ratePerSecond = ratePerSecond;
        } else {
            this.buckets.set(domain, {
                tokens: ratePerSecond,
                lastRefill: Date.now(),
                ratePerSecond,
            });
        }
    }

    /**
     * Wait until a request to this URL is allowed.
     */
    async acquire(url: string): Promise<void> {
        const domain = this.getDomain(url);

        if (!this.buckets.has(domain)) {
            this.buckets.set(domain, {
                tokens: this.defaultRate,
                lastRefill: Date.now(),
                ratePerSecond: this.defaultRate,
            });
        }

        const bucket = this.buckets.get(domain)!;

        // Refill tokens based on elapsed time
        const now = Date.now();
        const elapsed = (now - bucket.lastRefill) / 1000;
        bucket.tokens = Math.min(
            bucket.ratePerSecond,
            bucket.tokens + elapsed * bucket.ratePerSecond
        );
        bucket.lastRefill = now;

        if (bucket.tokens >= 1) {
            bucket.tokens -= 1;
            return;
        }

        // Wait for token to become available
        const waitMs = ((1 - bucket.tokens) / bucket.ratePerSecond) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        bucket.tokens = 0;
        bucket.lastRefill = Date.now();
    }
}

// Singleton instance
export const rateLimiter = new RateLimiter(1);
