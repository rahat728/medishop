export interface RateLimitOptions {
    limit: number;
    windowMs: number;
}

interface RateLimitInfo {
    count: number;
    resetTime: number;
}

const cache = new Map<string, RateLimitInfo>();

export async function rateLimit(identifier: string, options: RateLimitOptions) {
    const now = Date.now();
    const info = cache.get(identifier);

    if (!info || now > info.resetTime) {
        const newInfo = {
            count: 1,
            resetTime: now + options.windowMs,
        };
        cache.set(identifier, newInfo);
        return {
            success: true,
            limit: options.limit,
            remaining: options.limit - 1,
            reset: newInfo.resetTime,
        };
    }

    if (info.count >= options.limit) {
        return {
            success: false,
            limit: options.limit,
            remaining: 0,
            reset: info.resetTime,
        };
    }

    info.count += 1;
    return {
        success: true,
        limit: options.limit,
        remaining: options.limit - info.count,
        reset: info.resetTime,
    };
}

/**
 * Cleanup cache periodically to avoid memory leaks
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, info] of cache.entries()) {
        if (now > info.resetTime) {
            cache.delete(key);
        }
    }
}, 60000); // Every minute
