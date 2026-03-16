// Rate limiting middleware for API endpoints
const rateLimit = new Map();

// Clear old entries every minute
setInterval(() => {
    const now = Date.now();
    for (const [key, entries] of rateLimit.entries()) {
        const filtered = entries.filter(timestamp => now - timestamp < 60000);
        if (filtered.length === 0) {
            rateLimit.delete(key);
        } else {
            rateLimit.set(key, filtered);
        }
    }
}, 60000);

/**
 * Rate limiting middleware
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds (default: 1 minute)
 * @returns {Function} Express middleware function
 */
const rateLimitMiddleware = (maxRequests = 20, windowMs = 60000) => {
    return (req, res, next) => {
        const key = `${req.user?.userId || req.ip}:${req.originalUrl}`;
        const now = Date.now();

        if (!rateLimit.has(key)) {
            rateLimit.set(key, []);
        }

        const entries = rateLimit.get(key);
        const recentEntries = entries.filter(timestamp => now - timestamp < windowMs);

        if (recentEntries.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
                retryAfter: Math.ceil((recentEntries[0] + windowMs - now) / 1000)
            });
        }

        recentEntries.push(now);
        rateLimit.set(key, recentEntries);
        next();
    };
};

module.exports = {
    rateLimitMiddleware
};
