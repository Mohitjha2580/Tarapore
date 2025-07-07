"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
exports.config = {
    // Server configuration
    server: {
        port: parseInt(process.env.PORT || '3000'),
        nodeEnv: process.env.NODE_ENV || 'development',
        apiVersion: process.env.API_VERSION || 'v1',
    },
    // Database configuration
    database: {
        url: process.env.DATABASE_URL || '',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || '',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'school_engagement',
        ssl: process.env.NODE_ENV === 'production',
    },
    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret-key',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    // Redis configuration
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
    },
    // AWS S3 configuration
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'us-east-1',
        s3Bucket: process.env.S3_BUCKET || 'school-engagement-files',
    },
    // Email configuration
    email: {
        sendgridApiKey: process.env.SENDGRID_API_KEY || '',
        fromEmail: process.env.FROM_EMAIL || 'noreply@taraporeschool.com',
    },
    // Frontend configuration
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:3001',
        corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3001,http://localhost:3000').split(','),
    },
    // File upload configuration
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
        allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif').split(','),
    },
    // Rate limiting configuration
    rateLimit: {
        auth: {
            windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
            max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5'),
        },
        api: {
            windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
            max: parseInt(process.env.API_RATE_LIMIT_MAX || '100'),
        },
    },
    // School configuration
    school: {
        domain: process.env.SCHOOL_DOMAIN || 'taraporeschool.com',
        name: process.env.SCHOOL_NAME || 'Tarapore School',
    },
    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'logs/app.log',
    },
    // Cache TTL values (in seconds)
    cache: {
        session: 86400, // 24 hours
        leaderboard: 3600, // 1 hour
        userProfile: 1800, // 30 minutes
        badges: 7200, // 2 hours
    },
    // Pagination defaults
    pagination: {
        defaultLimit: 20,
        maxLimit: 100,
    },
    // Points and gamification
    gamification: {
        dailyPointsLimit: 100,
        maxStreakBonus: 2.0,
        badgePointsThresholds: {
            bronze: 100,
            silver: 500,
            gold: 1000,
            platinum: 2500,
        },
    },
};
// Validate required environment variables
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
];
const validateConfig = () => {
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    // Validate JWT secrets are long enough
    if (exports.config.jwt.secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    if (exports.config.jwt.refreshSecret.length < 32) {
        throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
    }
};
exports.validateConfig = validateConfig;
exports.default = exports.config;
//# sourceMappingURL=index.js.map