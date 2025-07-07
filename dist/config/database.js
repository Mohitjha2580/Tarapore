"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseMetrics = exports.closeDatabaseConnection = exports.checkDatabaseConnection = exports.prisma = exports.databaseConfig = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
// Database configuration
exports.databaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === 'production'
};
// Prisma Client configuration
const prismaClientConfig = {
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'event',
            level: 'error',
        },
        {
            emit: 'event',
            level: 'info',
        },
        {
            emit: 'event',
            level: 'warn',
        },
    ],
};
// Create Prisma client instance
exports.prisma = globalThis.__prisma || new client_1.PrismaClient(prismaClientConfig);
// Set up logging for database queries in development
if (process.env.NODE_ENV === 'development') {
    exports.prisma.$on('query', (e) => {
        logger_1.logger.debug('Database Query:', {
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
        });
    });
}
// Set up error logging
exports.prisma.$on('error', (e) => {
    logger_1.logger.error('Database Error:', {
        message: e.message,
        target: e.target,
    });
});
// Set up info logging
exports.prisma.$on('info', (e) => {
    logger_1.logger.info('Database Info:', {
        message: e.message,
        target: e.target,
    });
});
// Set up warning logging
exports.prisma.$on('warn', (e) => {
    logger_1.logger.warn('Database Warning:', {
        message: e.message,
        target: e.target,
    });
});
// Store in global for development hot reloading
if (process.env.NODE_ENV === 'development') {
    globalThis.__prisma = exports.prisma;
}
// Database health check
const checkDatabaseConnection = async () => {
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        logger_1.logger.info('Database connection established successfully');
        return true;
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to database:', error);
        return false;
    }
};
exports.checkDatabaseConnection = checkDatabaseConnection;
// Graceful shutdown
const closeDatabaseConnection = async () => {
    try {
        await exports.prisma.$disconnect();
        logger_1.logger.info('Database connection closed successfully');
    }
    catch (error) {
        logger_1.logger.error('Error closing database connection:', error);
    }
};
exports.closeDatabaseConnection = closeDatabaseConnection;
// Database metrics for health checks
const getDatabaseMetrics = async () => {
    try {
        const userCount = await exports.prisma.user.count();
        const pointsCount = await exports.prisma.point.count();
        const badgesCount = await exports.prisma.badge.count();
        return {
            users: userCount,
            points: pointsCount,
            badges: badgesCount,
            connectionStatus: 'connected',
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        logger_1.logger.error('Error getting database metrics:', error);
        return {
            connectionStatus: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
};
exports.getDatabaseMetrics = getDatabaseMetrics;
//# sourceMappingURL=database.js.map