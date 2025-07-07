"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const http_1 = require("http");
const config_1 = require("@/config");
const logger_1 = require("@/config/logger");
const redis_1 = require("@/config/redis");
const database_1 = require("@/config/database");
const rateLimiter_1 = require("@/middleware/rateLimiter");
const errorHandler_1 = require("@/middleware/errorHandler");
const requestLogger_1 = require("@/middleware/requestLogger");
// Import routes
const auth_1 = __importDefault(require("@/routes/auth"));
const users_1 = __importDefault(require("@/routes/users"));
const points_1 = __importDefault(require("@/routes/points"));
const badges_1 = __importDefault(require("@/routes/badges"));
const events_1 = __importDefault(require("@/routes/events"));
const challenges_1 = __importDefault(require("@/routes/challenges"));
const wallOfFame_1 = __importDefault(require("@/routes/wallOfFame"));
const friends_1 = __importDefault(require("@/routes/friends"));
const analytics_1 = __importDefault(require("@/routes/analytics"));
// Create Express app
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Validate environment configuration
try {
    (0, config_1.validateConfig)();
    logger_1.logger.info('Configuration validated successfully');
}
catch (error) {
    logger_1.logger.error('Configuration validation failed:', error);
    process.exit(1);
}
// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: config_1.config.frontend.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
// Compression middleware
app.use((0, compression_1.default)());
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
app.use(requestLogger_1.requestLogger);
// Rate limiting
app.use('/api/', rateLimiter_1.apiRateLimiter);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
    });
});
// API routes
const apiPrefix = `/api/${config_1.config.server.apiVersion}`;
app.use(`${apiPrefix}/auth`, auth_1.default);
app.use(`${apiPrefix}/users`, users_1.default);
app.use(`${apiPrefix}/points`, points_1.default);
app.use(`${apiPrefix}/badges`, badges_1.default);
app.use(`${apiPrefix}/events`, events_1.default);
app.use(`${apiPrefix}/challenges`, challenges_1.default);
app.use(`${apiPrefix}/wall-of-fame`, wallOfFame_1.default);
app.use(`${apiPrefix}/friends`, friends_1.default);
app.use(`${apiPrefix}/analytics`, analytics_1.default);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        timestamp: new Date().toISOString(),
    });
});
// Error handling middleware (must be last)
app.use(errorHandler_1.errorHandler);
// Initialize services and start server
async function startServer() {
    try {
        // Connect to Redis
        await (0, redis_1.connectRedis)();
        logger_1.logger.info('Redis connected successfully');
        // Check database connection
        const dbConnected = await (0, database_1.checkDatabaseConnection)();
        if (!dbConnected) {
            throw new Error('Database connection failed');
        }
        // Start server
        const port = config_1.config.server.port;
        server.listen(port, () => {
            logger_1.logger.info(`🚀 Server running on port ${port}`);
            logger_1.logger.info(`📚 API documentation: http://localhost:${port}/api-docs`);
            logger_1.logger.info(`🏥 Health check: http://localhost:${port}/health`);
            logger_1.logger.info(`🌍 Environment: ${config_1.config.server.nodeEnv}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger_1.logger.info('Server closed');
        process.exit(0);
    });
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger_1.logger.info('Server closed');
        process.exit(0);
    });
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Start the server
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map