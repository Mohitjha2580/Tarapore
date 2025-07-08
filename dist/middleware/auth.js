"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSelfOrRole = exports.optionalAuth = exports.requireRole = exports.authenticate = void 0;
const auth_1 = require("@/utils/auth");
const types_1 = require("@/types");
const logger_1 = require("@/config/logger");
/**
 * Authentication middleware to verify JWT tokens
 */
const authenticate = (req, res, next) => {
    try {
        const token = auth_1.JWTUtils.extractTokenFromHeader(req.headers.authorization);
        const payload = auth_1.JWTUtils.verifyAccessToken(token);
        req.user = payload;
        auth_1.AuditUtils.logAuthEvent('token_verified', payload.userId, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        next();
    }
    catch (error) {
        logger_1.logger.warn('Authentication failed:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        if (error instanceof types_1.AppError) {
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
exports.authenticate = authenticate;
/**
 * Authorization middleware to check user roles
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                timestamp: new Date().toISOString(),
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            auth_1.AuditUtils.logSecurityEvent('unauthorized_access_attempt', {
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
exports.requireRole = requireRole;
/**
 * Optional authentication middleware - doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        if (!authorization) {
            return next();
        }
        const token = auth_1.JWTUtils.extractTokenFromHeader(authorization);
        const payload = auth_1.JWTUtils.verifyAccessToken(token);
        req.user = payload;
        next();
    }
    catch (error) {
        // Ignore authentication errors for optional auth
        next();
    }
};
exports.optionalAuth = optionalAuth;
/**
 * Middleware to ensure user can only access their own resources
 */
const requireSelfOrRole = (allowedRoles) => {
    return (req, res, next) => {
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
exports.requireSelfOrRole = requireSelfOrRole;
//# sourceMappingURL=auth.js.map