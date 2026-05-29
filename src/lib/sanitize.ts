/**
 * Deeply removes any keys starting with '$' to prevent NoSQL injection attacks.
 */
export function sanitizeQuery(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(sanitizeQuery);
    }

    const sanitized: any = {};
    for (const key in obj) {
        if (key.startsWith('$')) continue;

        const value = obj[key];
        sanitized[key] = (typeof value === 'object' && value !== null)
            ? sanitizeQuery(value)
            : value;
    }
    return sanitized;
}
