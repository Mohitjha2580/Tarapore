"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetRateLimiter = exports.uploadRateLimiter = exports.apiRateLimiter = exports.authRateLimiter = exports.createRateLimiter = void 0;
const redis_1 = require("@/config/redis");
const auth_1 = require("@/utils/auth");
const config_1 = require("@/config");
const logger_1 = require("@/config/logger");
/**
 * Redis-based rate limiter middleware
 */
const createRateLimiter = (options) => {
    const { windowMs, maxRequests, message = 'Too many requests, please try again later', skipSuccessfulRequests = false, keyGenerator, } = options;
    return async (req, res, next) => {
        try {
            const identifier = keyGenerator ? keyGenerator(req) : auth_1.RateLimitUtils.getClientIdentifier(req);
            const key = auth_1.RateLimitUtils.getRateLimitKey('general', identifier);
            const current = await redis_1.CacheService.incrementRateLimit(key, Math.ceil(windowMs / 1000));
            // Set headers
            res.set({
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': Math.max(0, maxRequests - current).toString(),
                'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString(),
            });
            if (current > maxRequests) {
                logger_1.logger.warn('Rate limit exceeded', {
                    identifier,
                    current,
                    limit: maxRequests,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                });
                return res.status(429).json({
                    success: false,
                    error: message,
                    retryAfter: Math.ceil(windowMs / 1000),
                    timestamp: new Date().toISOString(),
                });
            }
            // Skip counting successful requests if option is enabled
            if (skipSuccessfulRequests) {
                const originalSend = res.send;
                res.send = function (body) {
                    if (res.statusCode >= 400) {
                        // Only count failed requests
                        return originalSend.call(this, body);
                    }
                    // Decrement counter for successful requests
                    redis_1.CacheService.get(key).then(value => {
                        if (value) {
                            const newCount = Math.max(0, parseInt(value) - 1);
                            redis_1.CacheService.set(key, newCount.toString(), Math.ceil(windowMs / 1000));
                        }
                    });
                    return originalSend.call(this, body);
                };
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Rate limiter error:', error);
            // If rate limiter fails, allow the request to proceed
            next();
        }
    };
};
exports.createRateLimiter = createRateLimiter;
/**
 * Authentication-specific rate limiter
 */
exports.authRateLimiter = (0, exports.createRateLimiter)({
    windowMs: config_1.config.rateLimit.auth.windowMs,
    maxRequests: config_1.config.rateLimit.auth.max,
    message: 'Too many authentication attempts, please try again later',
    keyGenerator: (req) => {
        // Use IP + email for more specific rate limiting
        const email = req.body?.email || '';
        return `${auth_1.RateLimitUtils.getClientIdentifier(req)}:${email}`;
    },
});
/**
 * API rate limiter
 */
exports.apiRateLimiter = (0, exports.createRateLimiter)({
    windowMs: config_1.config.rateLimit.api.windowMs,
    maxRequests: config_1.config.rateLimit.api.max,
    skipSuccessfulRequests: true,
});
/**
 * File upload rate limiter
 */
exports.uploadRateLimiter = (0, exports.createRateLimiter)({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many file uploads, please try again later',
});
/**
 * Password reset rate limiter
 */
exports.passwordResetRateLimiter = (0, exports.createRateLimiter)({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts, please try again later',
    keyGenerator: (req) => {
        const email = req.body?.email || '';
        return `password_reset:${email}`;
    },
});
//# sourceMappingURL=rateLimiter.js.map