import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { JWTPayload, AppError } from '@/types';
import { config } from '@/config';
import { logger } from '@/config/logger';

// Password utilities
export class PasswordUtils {
  static async hash(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async compare(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  static validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
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

// Email validation utilities
export class EmailUtils {
  static validateSchoolEmail(email: string): {
    isValid: boolean;
    grade?: number;
    studentId?: string;
    role?: 'student' | 'teacher' | 'principal';
    error?: string;
  } {
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

  private static determineRole(grade: number, studentId: string): 'student' | 'teacher' | 'principal' {
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

  static extractStudentId(email: string): string {
    const validation = this.validateSchoolEmail(email);
    if (!validation.isValid || !validation.studentId) {
      throw new AppError('Invalid email format', 400);
    }
    return validation.studentId;
  }
}

// JWT utilities
export class JWTUtils {
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  static generateRefreshToken(userId: string): string {
    return jwt.sign({ userId, type: 'refresh' }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Access token expired', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid access token', 401);
      }
      throw new AppError('Token verification failed', 401);
    }
  }

  static verifyRefreshToken(token: string): { userId: string; type: string } {
    try {
      return jwt.verify(token, config.jwt.refreshSecret) as { userId: string; type: string };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Refresh token expired', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401);
      }
      throw new AppError('Refresh token verification failed', 401);
    }
  }

  static extractTokenFromHeader(authorization?: string): string {
    if (!authorization) {
      throw new AppError('Authorization header missing', 401);
    }

    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError('Invalid authorization header format', 401);
    }

    return parts[1];
  }

  static decodeTokenWithoutVerification(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new AppError('Invalid token format', 400);
    }
  }
}

// Session utilities
export class SessionUtils {
  static generateSessionId(): string {
    return uuidv4();
  }

  static generateTokenPair(user: {
    id: string;
    email: string;
    role: 'student' | 'teacher' | 'principal';
    studentId: string;
  }): { accessToken: string; refreshToken: string } {
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

// Security utilities
export class SecurityUtils {
  static generateSecureToken(): string {
    return uuidv4() + Date.now().toString(36);
  }

  static isPasswordCompromised(password: string): boolean {
    // Common passwords to reject
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  static sanitizeUserData(user: any): any {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  static validateRole(role: string): role is 'student' | 'teacher' | 'principal' {
    return ['student', 'teacher', 'principal'].includes(role);
  }

  static validateHouse(house: string): house is 'red' | 'blue' | 'green' | 'yellow' {
    return ['red', 'blue', 'green', 'yellow'].includes(house);
  }
}

// Rate limiting utilities
export class RateLimitUtils {
  static getClientIdentifier(req: any): string {
    return req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  }

  static getRateLimitKey(prefix: string, identifier: string): string {
    return `rate_limit:${prefix}:${identifier}`;
  }
}

// Audit logging utilities
export class AuditUtils {
  static logAuthEvent(event: string, userId?: string, metadata?: any): void {
    logger.info('Auth Event', {
      event,
      userId,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  static logSecurityEvent(event: string, details: any): void {
    logger.warn('Security Event', {
      event,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  static logFailedAuth(email: string, reason: string, ip?: string): void {
    this.logSecurityEvent('failed_authentication', {
      email,
      reason,
      ip,
    });
  }
}