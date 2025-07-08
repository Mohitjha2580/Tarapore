import { Request, Response, NextFunction } from 'express';
import { JWTUtils, AuditUtils } from '@/utils/auth';
import { AppError, AuthRequest } from '@/types';
import { logger } from '@/config/logger';

/**
 * Authentication middleware to verify JWT tokens
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    const payload = JWTUtils.verifyAccessToken(token);
    
    req.user = payload;
    
    AuditUtils.logAuthEvent('token_verified', payload.userId, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    next();
  } catch (error) {
    logger.warn('Authentication failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Authorization middleware to check user roles
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      AuditUtils.logSecurityEvent('unauthorized_access_attempt', {
        userId: req.user.userId,
        role: req.user.role,
        requiredRoles: allowedRoles,
        ip: req.ip,
      });

      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return next();
    }

    const token = JWTUtils.extractTokenFromHeader(authorization);
    const payload = JWTUtils.verifyAccessToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

/**
 * Middleware to ensure user can only access their own resources
 */
export const requireSelfOrRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    const resourceUserId = req.params.userId || req.params.id;
    
    // Allow if user is accessing their own resource
    if (req.user.userId === resourceUserId) {
      return next();
    }

    // Allow if user has required role
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Access denied',
      timestamp: new Date().toISOString(),
    });
  };
};