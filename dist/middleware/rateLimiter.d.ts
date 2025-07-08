import { Request, Response, NextFunction } from 'express';
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
export declare const createRateLimiter: (options: RateLimitOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Authentication-specific rate limiter
 */
export declare const authRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * API rate limiter
 */
export declare const apiRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * File upload rate limiter
 */
export declare const uploadRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Password reset rate limiter
 */
export declare const passwordResetRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=rateLimiter.d.ts.map