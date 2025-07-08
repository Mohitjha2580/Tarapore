"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditUtils = exports.RateLimitUtils = exports.SecurityUtils = exports.SessionUtils = exports.JWTUtils = exports.EmailUtils = exports.PasswordUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const types_1 = require("@/types");
const config_1 = require("@/config");
const logger_1 = require("@/config/logger");
// Password utilities
class PasswordUtils {
    static async hash(password) {
        const saltRounds = 12;
        return await bcryptjs_1.default.hash(password, saltRounds);
    }
    static async compare(password, hashedPassword) {
        return await bcryptjs_1.default.compare(password, hashedPassword);
    }
    static validate(password) {
        const errors = [];
        const minLength = 8;
        if (password.length < minLength) {
            errors.push(`Password must be at least ${minLength} characters long`);
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
exports.PasswordUtils = PasswordUtils;
// Email validation utilities
class EmailUtils {
    static validateSchoolEmail(email) {
        const pattern = /^(\d+)\/(\d+)@taraporeschool\.com$/;
        const match = email.match(pattern);
        if (!match) {
            return {
                isValid: false,
                error: 'Invalid school email format. Expected format: grade/studentId@taraporeschool.com',
            };
        }
        const [, gradeStr, studentIdStr] = match;
        const grade = parseInt(gradeStr);
        const studentId = studentIdStr;
        // Determine role based on email pattern
        const role = this.determineRole(grade, studentId);
        if (grade < 1 || grade > 12) {
            return {
                isValid: false,
                error: 'Grade must be between 1 and 12',
            };
        }
        return {
            isValid: true,
            grade,
            studentId,
            role,
        };
    }
    static determineRole(grade, studentId) {
        // Teachers might have specific student ID patterns (e.g., starting with 'T')
        if (studentId.startsWith('T') || studentId.startsWith('t')) {
            return 'teacher';
        }
        // Principal might have a specific pattern (e.g., starting with 'P')
        if (studentId.startsWith('P') || studentId.startsWith('p')) {
            return 'principal';
        }
        // Default to student
        return 'student';
    }
    static extractStudentId(email) {
        const validation = this.validateSchoolEmail(email);
        if (!validation.isValid || !validation.studentId) {
            throw new types_1.AppError('Invalid email format', 400);
        }
        return validation.studentId;
    }
}
exports.EmailUtils = EmailUtils;
// JWT utilities
class JWTUtils {
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
            expiresIn: config_1.config.jwt.expiresIn,
        });
    }
    static generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, config_1.config.jwt.refreshSecret, {
            expiresIn: config_1.config.jwt.refreshExpiresIn,
        });
    }
    static verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new types_1.AppError('Access token expired', 401);
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new types_1.AppError('Invalid access token', 401);
            }
            throw new types_1.AppError('Token verification failed', 401);
        }
    }
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.config.jwt.refreshSecret);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new types_1.AppError('Refresh token expired', 401);
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new types_1.AppError('Invalid refresh token', 401);
            }
            throw new types_1.AppError('Refresh token verification failed', 401);
        }
    }
    static extractTokenFromHeader(authorization) {
        if (!authorization) {
            throw new types_1.AppError('Authorization header missing', 401);
        }
        const parts = authorization.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new types_1.AppError('Invalid authorization header format', 401);
        }
        return parts[1];
    }
    static decodeTokenWithoutVerification(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            throw new types_1.AppError('Invalid token format', 400);
        }
    }
}
exports.JWTUtils = JWTUtils;
// Session utilities
class SessionUtils {
    static generateSessionId() {
        return (0, uuid_1.v4)();
    }
    static generateTokenPair(user) {
        const accessToken = JWTUtils.generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            studentId: user.studentId,
        });
        const refreshToken = JWTUtils.generateRefreshToken(user.id);
        return { accessToken, refreshToken };
    }
}
exports.SessionUtils = SessionUtils;
// Security utilities
class SecurityUtils {
    static generateSecureToken() {
        return (0, uuid_1.v4)() + Date.now().toString(36);
    }
    static isPasswordCompromised(password) {
        // Common passwords to reject
        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey'
        ];
        return commonPasswords.includes(password.toLowerCase());
    }
    static sanitizeUserData(user) {
        const { passwordHash, ...sanitizedUser } = user;
        return sanitizedUser;
    }
    static validateRole(role) {
        return ['student', 'teacher', 'principal'].includes(role);
    }
    static validateHouse(house) {
        return ['red', 'blue', 'green', 'yellow'].includes(house);
    }
}
exports.SecurityUtils = SecurityUtils;
// Rate limiting utilities
class RateLimitUtils {
    static getClientIdentifier(req) {
        return req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    }
    static getRateLimitKey(prefix, identifier) {
        return `rate_limit:${prefix}:${identifier}`;
    }
}
exports.RateLimitUtils = RateLimitUtils;
// Audit logging utilities
class AuditUtils {
    static logAuthEvent(event, userId, metadata) {
        logger_1.logger.info('Auth Event', {
            event,
            userId,
            timestamp: new Date().toISOString(),
            ...metadata,
        });
    }
    static logSecurityEvent(event, details) {
        logger_1.logger.warn('Security Event', {
            event,
            timestamp: new Date().toISOString(),
            ...details,
        });
    }
    static logFailedAuth(email, reason, ip) {
        this.logSecurityEvent('failed_authentication', {
            email,
            reason,
            ip,
        });
    }
}
exports.AuditUtils = AuditUtils;
//# sourceMappingURL=auth.js.map