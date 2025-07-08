import { JWTPayload } from '@/types';
export declare class PasswordUtils {
    static hash(password: string): Promise<string>;
    static compare(password: string, hashedPassword: string): Promise<boolean>;
    static validate(password: string): {
        isValid: boolean;
        errors: string[];
    };
}
export declare class EmailUtils {
    static validateSchoolEmail(email: string): {
        isValid: boolean;
        grade?: number;
        studentId?: string;
        role?: 'student' | 'teacher' | 'principal';
        error?: string;
    };
    private static determineRole;
    static extractStudentId(email: string): string;
}
export declare class JWTUtils {
    static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string;
    static generateRefreshToken(userId: string): string;
    static verifyAccessToken(token: string): JWTPayload;
    static verifyRefreshToken(token: string): {
        userId: string;
        type: string;
    };
    static extractTokenFromHeader(authorization?: string): string;
    static decodeTokenWithoutVerification(token: string): any;
}
export declare class SessionUtils {
    static generateSessionId(): string;
    static generateTokenPair(user: {
        id: string;
        email: string;
        role: 'student' | 'teacher' | 'principal';
        studentId: string;
    }): {
        accessToken: string;
        refreshToken: string;
    };
}
export declare class SecurityUtils {
    static generateSecureToken(): string;
    static isPasswordCompromised(password: string): boolean;
    static sanitizeUserData(user: any): any;
    static validateRole(role: string): role is 'student' | 'teacher' | 'principal';
    static validateHouse(house: string): house is 'red' | 'blue' | 'green' | 'yellow';
}
export declare class RateLimitUtils {
    static getClientIdentifier(req: any): string;
    static getRateLimitKey(prefix: string, identifier: string): string;
}
export declare class AuditUtils {
    static logAuthEvent(event: string, userId?: string, metadata?: any): void;
    static logSecurityEvent(event: string, details: any): void;
    static logFailedAuth(email: string, reason: string, ip?: string): void;
}
//# sourceMappingURL=auth.d.ts.map