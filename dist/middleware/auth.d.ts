import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
/**
 * Authentication middleware to verify JWT tokens
 */
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * Authorization middleware to check user roles
 */
export declare const requireRole: (allowedRoles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * Optional authentication middleware - doesn't fail if no token
 */
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware to ensure user can only access their own resources
 */
export declare const requireSelfOrRole: (allowedRoles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map