import { Request, Response, NextFunction } from 'express';
import { CacheService } from '@/config/redis';
import { RateLimitUtils } from '@/utils/auth';
import { config } from '@/config';
import { logger } from '@/config/logger';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

/**
 * Redis-based rate limiter middleware
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    keyGenerator,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const identifier = keyGenerator ? keyGenerator(req) : RateLimitUtils.getClientIdentifier(req);
      const key = RateLimitUtils.getRateLimitKey('general', identifier);
      
      const current = await CacheService.incrementRateLimit(key, Math.ceil(windowMs / 1000));
      
      // Set headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - current).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString(),
      });

      if (current > maxRequests) {
        logger.warn('Rate limit exceeded', {
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
        res.send = function (body: any) {
          if (res.statusCode >= 400) {
            // Only count failed requests
            return originalSend.call(this, body);
          }
          // Decrement counter for successful requests
          CacheService.get(key).then(value => {
            if (value) {
              const newCount = Math.max(0, parseInt(value) - 1);
              CacheService.set(key, newCount.toString(), Math.ceil(windowMs / 1000));
            }
          });
          return originalSend.call(this, body);
        };
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error:', error);
      // If rate limiter fails, allow the request to proceed
      next();
    }
  };
};

/**
 * Authentication-specific rate limiter
 */
export const authRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.auth.windowMs,
  maxRequests: config.rateLimit.auth.max,
  message: 'Too many authentication attempts, please try again later',
  keyGenerator: (req: Request) => {
    // Use IP + email for more specific rate limiting
    const email = req.body?.email || '';
    return `${RateLimitUtils.getClientIdentifier(req)}:${email}`;
  },
});

/**
 * API rate limiter
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.api.windowMs,
  maxRequests: config.rateLimit.api.max,
  skipSuccessfulRequests: true,
});

/**
 * File upload rate limiter
 */
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: 'Too many file uploads, please try again later',
});

/**
 * Password reset rate limiter
 */
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  message: 'Too many password reset attempts, please try again later',
  keyGenerator: (req: Request) => {
    const email = req.body?.email || '';
    return `password_reset:${email}`;
  },
});