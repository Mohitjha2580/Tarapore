import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/types';

// Base validation schemas
export const emailSchema = z.string()
  .email('Invalid email format')
  .regex(
    /^(\d+)\/(\d+)@taraporeschool\.com$/,
    'Email must follow format: grade/studentId@taraporeschool.com'
  );

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character');

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const houseSchema = z.enum(['red', 'blue', 'green', 'yellow']);

export const roleSchema = z.enum(['student', 'teacher', 'principal']);

export const pointCategorySchema = z.enum(['academic', 'sports', 'arts', 'leadership', 'participation']);

export const eventTypeSchema = z.enum(['academic', 'sports', 'cultural', 'competition']);

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  house: houseSchema.optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

// User schemas
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  house: houseSchema.optional(),
});

export const userSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  role: roleSchema.optional(),
  house: houseSchema.optional(),
  grade: z.number().int().min(1).max(12).optional(),
});

// Points schemas
export const awardPointsSchema = z.object({
  studentId: uuidSchema,
  amount: z.number().int().min(1).max(100, 'Cannot award more than 100 points at once'),
  category: pointCategorySchema,
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
});

export const pointsHistorySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  category: pointCategorySchema.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// Badge schemas
export const createBadgeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  icon: z.string().url('Invalid icon URL'),
  category: z.string().min(1).max(50),
  pointsRequired: z.number().int().min(1),
  isSecret: z.boolean().default(false),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']).default('common'),
});

// Event schemas
export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  eventType: eventTypeSchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  pointsReward: z.number().int().min(1).max(100),
});

export const updateEventSchema = createEventSchema.partial();

// Challenge schemas
export const createChallengeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  pointsReward: z.number().int().min(1).max(50),
  category: z.string().min(1).max(50),
  date: z.string().datetime(),
});

// Wall of Fame schemas
export const wallOfFameSchema = z.object({
  studentId: uuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  category: z.string().min(1).max(50),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2030),
});

// Friend schemas
export const friendRequestSchema = z.object({
  toUserId: uuidSchema,
});

export const friendActionSchema = z.object({
  friendshipId: uuidSchema,
  action: z.enum(['accept', 'reject', 'block']),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const leaderboardQuerySchema = z.object({
  timeframe: z.enum(['weekly', 'monthly', 'yearly']).default('monthly'),
  house: houseSchema.optional(),
  grade: z.number().int().min(1).max(12).optional(),
}).merge(paginationSchema);

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  granularity: z.enum(['day', 'week', 'month']).default('day'),
});

// File upload schemas
export const fileUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif']),
  size: z.number().max(5242880, 'File size must be less than 5MB'),
});

// Validation middleware factory
export function validateRequest(schema: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
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
            if (value === 'true') query[key] = true;
            if (value === 'false') query[key] = false;
          }
        });
        req.query = schema.query.parse(query);
      }

      // Validate params
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
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

      next(new AppError('Validation error', 400));
    }
  };
}

// Custom validation helpers
export const validateUUID = (value: string): boolean => {
  return uuidSchema.safeParse(value).success;
};

export const validateEmail = (value: string): boolean => {
  return emailSchema.safeParse(value).success;
};

export const validatePassword = (value: string): { isValid: boolean; errors?: string[] } => {
  const result = passwordSchema.safeParse(value);
  if (result.success) {
    return { isValid: true };
  }
  return {
    isValid: false,
    errors: result.error.errors.map(err => err.message),
  };
};

// Sanitization helpers
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export const sanitizeSearchQuery = (query: string): string => {
  return query.trim().replace(/[^\w\s-]/g, '').substring(0, 100);
};

// Rate limiting validation
export const rateLimitKeySchema = z.object({
  ip: z.string().ip(),
  userId: uuidSchema.optional(),
  action: z.string().min(1),
});

export default {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  awardPointsSchema,
  createEventSchema,
  validateRequest,
  validateUUID,
  validateEmail,
  validatePassword,
};