"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = exports.disconnectRedis = exports.connectRedis = exports.redisClient = exports.redisConfig = void 0;
const redis_1 = require("redis");
const logger_1 = require("./logger");
// Redis configuration
exports.redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
};
// Create Redis client
exports.redisClient = (0, redis_1.createClient)({
    url: exports.redisConfig.url,
    password: exports.redisConfig.password,
});
// Redis event handlers
exports.redisClient.on('connect', () => {
    logger_1.logger.info('Redis client connected');
});
exports.redisClient.on('ready', () => {
    logger_1.logger.info('Redis client ready');
});
exports.redisClient.on('error', (err) => {
    logger_1.logger.error('Redis client error:', err);
});
exports.redisClient.on('end', () => {
    logger_1.logger.info('Redis client disconnected');
});
// Connect to Redis
const connectRedis = async () => {
    try {
        await exports.redisClient.connect();
        logger_1.logger.info('Connected to Redis successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to Redis:', error);
        throw error;
    }
};
exports.connectRedis = connectRedis;
// Disconnect from Redis
const disconnectRedis = async () => {
    try {
        await exports.redisClient.quit();
        logger_1.logger.info('Disconnected from Redis successfully');
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting from Redis:', error);
    }
};
exports.disconnectRedis = disconnectRedis;
// Cache utility functions
class CacheService {
    static async get(key) {
        try {
            return await exports.redisClient.get(key);
        }
        catch (error) {
            logger_1.logger.error(`Error getting cache key ${key}:`, error);
            return null;
        }
    }
    static async set(key, value, ttl) {
        try {
            if (ttl) {
                await exports.redisClient.setEx(key, ttl, value);
            }
            else {
                await exports.redisClient.set(key, value);
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error setting cache key ${key}:`, error);
            return false;
        }
    }
    static async del(key) {
        try {
            await exports.redisClient.del(key);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error deleting cache key ${key}:`, error);
            return false;
        }
    }
    static async exists(key) {
        try {
            const result = await exports.redisClient.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error(`Error checking cache key ${key}:`, error);
            return false;
        }
    }
    static async setJSON(key, value, ttl) {
        try {
            const jsonString = JSON.stringify(value);
            return await this.set(key, jsonString, ttl);
        }
        catch (error) {
            logger_1.logger.error(`Error setting JSON cache key ${key}:`, error);
            return false;
        }
    }
    static async getJSON(key) {
        try {
            const value = await this.get(key);
            if (!value)
                return null;
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.logger.error(`Error getting JSON cache key ${key}:`, error);
            return null;
        }
    }
    // Session management
    static async setSession(sessionId, sessionData, ttl = 86400) {
        return await this.setJSON(`session:${sessionId}`, sessionData, ttl);
    }
    static async getSession(sessionId) {
        return await this.getJSON(`session:${sessionId}`);
    }
    static async deleteSession(sessionId) {
        return await this.del(`session:${sessionId}`);
    }
    // Rate limiting
    static async incrementRateLimit(key, window) {
        try {
            const current = await exports.redisClient.incr(key);
            if (current === 1) {
                await exports.redisClient.expire(key, window);
            }
            return current;
        }
        catch (error) {
            logger_1.logger.error(`Error incrementing rate limit key ${key}:`, error);
            return 0;
        }
    }
    // Leaderboard caching
    static async cacheLeaderboard(timeframe, data, ttl = 3600) {
        return await this.setJSON(`leaderboard:${timeframe}`, data, ttl);
    }
    static async getLeaderboard(timeframe) {
        return await this.getJSON(`leaderboard:${timeframe}`);
    }
}
exports.CacheService = CacheService;
exports.default = exports.redisClient;
//# sourceMappingURL=redis.js.map