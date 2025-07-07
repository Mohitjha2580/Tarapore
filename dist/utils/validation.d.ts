import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const uuidSchema: z.ZodString;
export declare const houseSchema: z.ZodEnum<["red", "blue", "green", "yellow"]>;
export declare const roleSchema: z.ZodEnum<["student", "teacher", "principal"]>;
export declare const pointCategorySchema: z.ZodEnum<["academic", "sports", "arts", "leadership", "participation"]>;
export declare const eventTypeSchema: z.ZodEnum<["academic", "sports", "cultural", "competition"]>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
}, {
    password: string;
    email: string;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    house: z.ZodOptional<z.ZodEnum<["red", "blue", "green", "yellow"]>>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    house?: "red" | "blue" | "green" | "yellow" | undefined;
}, {
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    house?: "red" | "blue" | "green" | "yellow" | undefined;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    house: z.ZodOptional<z.ZodEnum<["red", "blue", "green", "yellow"]>>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    house?: "red" | "blue" | "green" | "yellow" | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    house?: "red" | "blue" | "green" | "yellow" | undefined;
}>;
export declare const userSearchSchema: z.ZodObject<{
    query: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<["student", "teacher", "principal"]>>;
    house: z.ZodOptional<z.ZodEnum<["red", "blue", "green", "yellow"]>>;
    grade: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query: string;
    role?: "student" | "teacher" | "principal" | undefined;
    house?: "red" | "blue" | "green" | "yellow" | undefined;
    grade?: number | undefined;
}, {
    query: string;
    role?: "student" | "teacher" | "principal" | undefined;
    house?: "red" | "blue" | "green" | "yellow" | undefined;
    grade?: number | undefined;
}>;
export declare const awardPointsSchema: z.ZodObject<{
    studentId: z.ZodString;
    amount: z.ZodNumber;
    category: z.ZodEnum<["academic", "sports", "arts", "leadership", "participation"]>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    amount: number;
    category: "academic" | "sports" | "arts" | "leadership" | "participation";
    reason: string;
}, {
    studentId: string;
    amount: number;
    category: "academic" | "sports" | "arts" | "leadership" | "participation";
    reason: string;
}>;
export declare const pointsHistorySchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["academic", "sports", "arts", "leadership", "participation"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    category?: "academic" | "sports" | "arts" | "leadership" | "participation" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    category?: "academic" | "sports" | "arts" | "leadership" | "participation" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const createBadgeSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    icon: z.ZodString;
    category: z.ZodString;
    pointsRequired: z.ZodNumber;
    isSecret: z.ZodDefault<z.ZodBoolean>;
    rarity: z.ZodDefault<z.ZodEnum<["common", "rare", "epic", "legendary"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    category: string;
    description: string;
    icon: string;
    pointsRequired: number;
    isSecret: boolean;
    rarity: "common" | "rare" | "epic" | "legendary";
}, {
    name: string;
    category: string;
    description: string;
    icon: string;
    pointsRequired: number;
    isSecret?: boolean | undefined;
    rarity?: "common" | "rare" | "epic" | "legendary" | undefined;
}>;
export declare const createEventSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    eventType: z.ZodEnum<["academic", "sports", "cultural", "competition"]>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    pointsReward: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    description: string;
    title: string;
    eventType: "academic" | "sports" | "cultural" | "competition";
    pointsReward: number;
}, {
    startDate: string;
    endDate: string;
    description: string;
    title: string;
    eventType: "academic" | "sports" | "cultural" | "competition";
    pointsReward: number;
}>;
export declare const updateEventSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    eventType: z.ZodOptional<z.ZodEnum<["academic", "sports", "cultural", "competition"]>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    pointsReward: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    startDate?: string | undefined;
    endDate?: string | undefined;
    description?: string | undefined;
    title?: string | undefined;
    eventType?: "academic" | "sports" | "cultural" | "competition" | undefined;
    pointsReward?: number | undefined;
}, {
    startDate?: string | undefined;
    endDate?: string | undefined;
    description?: string | undefined;
    title?: string | undefined;
    eventType?: "academic" | "sports" | "cultural" | "competition" | undefined;
    pointsReward?: number | undefined;
}>;
export declare const createChallengeSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    pointsReward: z.ZodNumber;
    category: z.ZodString;
    date: z.ZodString;
}, "strip", z.ZodTypeAny, {
    category: string;
    description: string;
    title: string;
    pointsReward: number;
    date: string;
}, {
    category: string;
    description: string;
    title: string;
    pointsReward: number;
    date: string;
}>;
export declare const wallOfFameSchema: z.ZodObject<{
    studentId: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    category: z.ZodString;
    month: z.ZodNumber;
    year: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    year: number;
    category: string;
    description: string;
    title: string;
    month: number;
}, {
    studentId: string;
    year: number;
    category: string;
    description: string;
    title: string;
    month: number;
}>;
export declare const friendRequestSchema: z.ZodObject<{
    toUserId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    toUserId: string;
}, {
    toUserId: string;
}>;
export declare const friendActionSchema: z.ZodObject<{
    friendshipId: z.ZodString;
    action: z.ZodEnum<["accept", "reject", "block"]>;
}, "strip", z.ZodTypeAny, {
    friendshipId: string;
    action: "accept" | "reject" | "block";
}, {
    friendshipId: string;
    action: "accept" | "reject" | "block";
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
}, {
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const leaderboardQuerySchema: z.ZodObject<{
    timeframe: z.ZodDefault<z.ZodEnum<["weekly", "monthly", "yearly"]>>;
    house: z.ZodOptional<z.ZodEnum<["red", "blue", "green", "yellow"]>>;
    grade: z.ZodOptional<z.ZodNumber>;
} & {
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    timeframe: "weekly" | "monthly" | "yearly";
    house?: "red" | "blue" | "green" | "yellow" | undefined;
    grade?: number | undefined;
}, {
    house?: "red" | "blue" | "green" | "yellow" | undefined;
    grade?: number | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    timeframe?: "weekly" | "monthly" | "yearly" | undefined;
}>;
export declare const analyticsQuerySchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    granularity: z.ZodDefault<z.ZodEnum<["day", "week", "month"]>>;
}, "strip", z.ZodTypeAny, {
    granularity: "week" | "day" | "month";
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    startDate?: string | undefined;
    endDate?: string | undefined;
    granularity?: "week" | "day" | "month" | undefined;
}>;
export declare const fileUploadSchema: z.ZodObject<{
    fieldname: z.ZodString;
    originalname: z.ZodString;
    encoding: z.ZodString;
    mimetype: z.ZodEnum<["image/jpeg", "image/png", "image/gif"]>;
    size: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    encoding: string;
    fieldname: string;
    originalname: string;
    mimetype: "image/jpeg" | "image/png" | "image/gif";
    size: number;
}, {
    encoding: string;
    fieldname: string;
    originalname: string;
    mimetype: "image/jpeg" | "image/png" | "image/gif";
    size: number;
}>;
export declare function validateRequest(schema: {
    body?: z.ZodSchema;
    query?: z.ZodSchema;
    params?: z.ZodSchema;
}): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateUUID: (value: string) => boolean;
export declare const validateEmail: (value: string) => boolean;
export declare const validatePassword: (value: string) => {
    isValid: boolean;
    errors?: string[];
};
export declare const sanitizeInput: (input: string) => string;
export declare const sanitizeSearchQuery: (query: string) => string;
export declare const rateLimitKeySchema: z.ZodObject<{
    ip: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    action: z.ZodString;
}, "strip", z.ZodTypeAny, {
    action: string;
    ip: string;
    userId?: string | undefined;
}, {
    action: string;
    ip: string;
    userId?: string | undefined;
}>;
declare const _default: {
    loginSchema: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        password: string;
        email: string;
    }, {
        password: string;
        email: string;
    }>;
    registerSchema: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        house: z.ZodOptional<z.ZodEnum<["red", "blue", "green", "yellow"]>>;
    }, "strip", z.ZodTypeAny, {
        password: string;
        email: string;
        firstName: string;
        lastName: string;
        house?: "red" | "blue" | "green" | "yellow" | undefined;
    }, {
        password: string;
        email: string;
        firstName: string;
        lastName: string;
        house?: "red" | "blue" | "green" | "yellow" | undefined;
    }>;
    updateProfileSchema: z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        house: z.ZodOptional<z.ZodEnum<["red", "blue", "green", "yellow"]>>;
    }, "strip", z.ZodTypeAny, {
        firstName?: string | undefined;
        lastName?: string | undefined;
        house?: "red" | "blue" | "green" | "yellow" | undefined;
    }, {
        firstName?: string | undefined;
        lastName?: string | undefined;
        house?: "red" | "blue" | "green" | "yellow" | undefined;
    }>;
    awardPointsSchema: z.ZodObject<{
        studentId: z.ZodString;
        amount: z.ZodNumber;
        category: z.ZodEnum<["academic", "sports", "arts", "leadership", "participation"]>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        studentId: string;
        amount: number;
        category: "academic" | "sports" | "arts" | "leadership" | "participation";
        reason: string;
    }, {
        studentId: string;
        amount: number;
        category: "academic" | "sports" | "arts" | "leadership" | "participation";
        reason: string;
    }>;
    createEventSchema: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        eventType: z.ZodEnum<["academic", "sports", "cultural", "competition"]>;
        startDate: z.ZodString;
        endDate: z.ZodString;
        pointsReward: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        startDate: string;
        endDate: string;
        description: string;
        title: string;
        eventType: "academic" | "sports" | "cultural" | "competition";
        pointsReward: number;
    }, {
        startDate: string;
        endDate: string;
        description: string;
        title: string;
        eventType: "academic" | "sports" | "cultural" | "competition";
        pointsReward: number;
    }>;
    validateRequest: typeof validateRequest;
    validateUUID: (value: string) => boolean;
    validateEmail: (value: string) => boolean;
    validatePassword: (value: string) => {
        isValid: boolean;
        errors?: string[];
    };
};
export default _default;
//# sourceMappingURL=validation.d.ts.map