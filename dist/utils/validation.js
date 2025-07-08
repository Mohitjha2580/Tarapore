"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitKeySchema = exports.sanitizeSearchQuery = exports.sanitizeInput = exports.validatePassword = exports.validateEmail = exports.validateUUID = exports.fileUploadSchema = exports.analyticsQuerySchema = exports.leaderboardQuerySchema = exports.paginationSchema = exports.friendActionSchema = exports.friendRequestSchema = exports.wallOfFameSchema = exports.createChallengeSchema = exports.updateEventSchema = exports.createEventSchema = exports.createBadgeSchema = exports.pointsHistorySchema = exports.awardPointsSchema = exports.userSearchSchema = exports.updateProfileSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshTokenSchema = exports.registerSchema = exports.loginSchema = exports.eventTypeSchema = exports.pointCategorySchema = exports.roleSchema = exports.houseSchema = exports.uuidSchema = exports.passwordSchema = exports.emailSchema = void 0;
exports.validateRequest = validateRequest;
const zod_1 = require("zod");
const types_1 = require("@/types");
// Base validation schemas
exports.emailSchema = zod_1.z.string()
    .email('Invalid email format')
    .regex(/^(\d+)\/(\d+)@taraporeschool\.com$/, 'Email must follow format: grade/studentId@taraporeschool.com');
exports.passwordSchema = zod_1.z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character');
exports.uuidSchema = zod_1.z.string().uuid('Invalid UUID format');
exports.houseSchema = zod_1.z.enum(['red', 'blue', 'green', 'yellow']);
exports.roleSchema = zod_1.z.enum(['student', 'teacher', 'principal']);
exports.pointCategorySchema = zod_1.z.enum(['academic', 'sports', 'arts', 'leadership', 'participation']);
exports.eventTypeSchema = zod_1.z.enum(['academic', 'sports', 'cultural', 'competition']);
// Authentication schemas
exports.loginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.registerSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
    firstName: zod_1.z.string().min(1, 'First name is required').max(100, 'First name too long'),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
    house: exports.houseSchema.optional(),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: exports.emailSchema,
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    password: exports.passwordSchema,
});
// User schemas
exports.updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100).optional(),
    lastName: zod_1.z.string().min(1).max(100).optional(),
    house: exports.houseSchema.optional(),
});
exports.userSearchSchema = zod_1.z.object({
    query: zod_1.z.string().min(1, 'Search query is required'),
    role: exports.roleSchema.optional(),
    house: exports.houseSchema.optional(),
    grade: zod_1.z.number().int().min(1).max(12).optional(),
});
// Points schemas
exports.awardPointsSchema = zod_1.z.object({
    studentId: exports.uuidSchema,
    amount: zod_1.z.number().int().min(1).max(100, 'Cannot award more than 100 points at once'),
    category: exports.pointCategorySchema,
    reason: zod_1.z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
});
exports.pointsHistorySchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    category: exports.pointCategorySchema.optional(),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    offset: zod_1.z.number().int().min(0).default(0),
});
// Badge schemas
exports.createBadgeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().min(1).max(500),
    icon: zod_1.z.string().url('Invalid icon URL'),
    category: zod_1.z.string().min(1).max(50),
    pointsRequired: zod_1.z.number().int().min(1),
    isSecret: zod_1.z.boolean().default(false),
    rarity: zod_1.z.enum(['common', 'rare', 'epic', 'legendary']).default('common'),
});
// Event schemas
exports.createEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(1000),
    eventType: exports.eventTypeSchema,
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    pointsReward: zod_1.z.number().int().min(1).max(100),
});
exports.updateEventSchema = exports.createEventSchema.partial();
// Challenge schemas
exports.createChallengeSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(1000),
    pointsReward: zod_1.z.number().int().min(1).max(50),
    category: zod_1.z.string().min(1).max(50),
    date: zod_1.z.string().datetime(),
});
// Wall of Fame schemas
exports.wallOfFameSchema = zod_1.z.object({
    studentId: exports.uuidSchema,
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(1000),
    category: zod_1.z.string().min(1).max(50),
    month: zod_1.z.number().int().min(1).max(12),
    year: zod_1.z.number().int().min(2020).max(2030),
});
// Friend schemas
exports.friendRequestSchema = zod_1.z.object({
    toUserId: exports.uuidSchema,
});
exports.friendActionSchema = zod_1.z.object({
    friendshipId: exports.uuidSchema,
    action: zod_1.z.enum(['accept', 'reject', 'block']),
});
// Query parameter schemas
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
});
exports.leaderboardQuerySchema = zod_1.z.object({
    timeframe: zod_1.z.enum(['weekly', 'monthly', 'yearly']).default('monthly'),
    house: exports.houseSchema.optional(),
    grade: zod_1.z.number().int().min(1).max(12).optional(),
}).merge(exports.paginationSchema);
exports.analyticsQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    granularity: zod_1.z.enum(['day', 'week', 'month']).default('day'),
});
// File upload schemas
exports.fileUploadSchema = zod_1.z.object({
    fieldname: zod_1.z.string(),
    originalname: zod_1.z.string(),
    encoding: zod_1.z.string(),
    mimetype: zod_1.z.enum(['image/jpeg', 'image/png', 'image/gif']),
    size: zod_1.z.number().max(5242880, 'File size must be less than 5MB'),
});
// Validation middleware factory
function validateRequest(schema) {
    return (req, res, next) => {
        try {
            // Validate body
            if (schema.body) {
                req.body = schema.body.parse(req.body);
            }
            // Validate query parameters
            if (schema.query) {
                // Convert string numbers to actual numbers for query params
                const query = { ...req.query };
                Object.keys(query).forEach(key => {
                    const value = query[key];
                    if (typeof value === 'string') {
                        // Try to convert to number if it looks like a number
                        const numValue = Number(value);
                        if (!isNaN(numValue) && value.trim() !== '') {
                            query[key] = numValue;
                        }
                        // Convert 'true'/'false' strings to booleans
                        if (value === 'true')
                            query[key] = true;
                        if (value === 'false')
                            query[key] = false;
                    }
                });
                req.query = schema.query.parse(query);
            }
            // Validate params
            if (schema.params) {
                req.params = schema.params.parse(req.params);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errorMessages = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errorMessages,
                    timestamp: new Date().toISOString(),
                });
            }
            next(new types_1.AppError('Validation error', 400));
        }
    };
}
// Custom validation helpers
const validateUUID = (value) => {
    return exports.uuidSchema.safeParse(value).success;
};
exports.validateUUID = validateUUID;
const validateEmail = (value) => {
    return exports.emailSchema.safeParse(value).success;
};
exports.validateEmail = validateEmail;
const validatePassword = (value) => {
    const result = exports.passwordSchema.safeParse(value);
    if (result.success) {
        return { isValid: true };
    }
    return {
        isValid: false,
        errors: result.error.errors.map(err => err.message),
    };
};
exports.validatePassword = validatePassword;
// Sanitization helpers
const sanitizeInput = (input) => {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};
exports.sanitizeInput = sanitizeInput;
const sanitizeSearchQuery = (query) => {
    return query.trim().replace(/[^\w\s-]/g, '').substring(0, 100);
};
exports.sanitizeSearchQuery = sanitizeSearchQuery;
// Rate limiting validation
exports.rateLimitKeySchema = zod_1.z.object({
    ip: zod_1.z.string().ip(),
    userId: exports.uuidSchema.optional(),
    action: zod_1.z.string().min(1),
});
exports.default = {
    loginSchema: exports.loginSchema,
    registerSchema: exports.registerSchema,
    updateProfileSchema: exports.updateProfileSchema,
    awardPointsSchema: exports.awardPointsSchema,
    createEventSchema: exports.createEventSchema,
    validateRequest,
    validateUUID: exports.validateUUID,
    validateEmail: exports.validateEmail,
    validatePassword: exports.validatePassword,
};
//# sourceMappingURL=validation.js.map