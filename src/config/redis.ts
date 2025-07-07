import { createClient } from 'redis';
import { logger } from './logger';

// Redis configuration
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
};

// Create Redis client
export const redisClient = createClient({
  url: redisConfig.url,
  password: redisConfig.password,
});

// Redis event handlers
redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redisClient.on('end', () => {
  logger.info('Redis client disconnected');
});

// Connect to Redis
export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Disconnect from Redis
export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info('Disconnected from Redis successfully');
  } catch (error) {
    logger.error('Error disconnecting from Redis:', error);
  }
};

// Cache utility functions
export class CacheService {
  static async get(key: string): Promise<string | null> {
    try {
      return await redisClient.get(key);
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  static async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await redisClient.setEx(key, ttl, value);
      } else {
        await redisClient.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  static async setJSON(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value);
      return await this.set(key, jsonString, ttl);
    } catch (error) {
      logger.error(`Error setting JSON cache key ${key}:`, error);
      return false;
    }
  }

  static async getJSON<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Error getting JSON cache key ${key}:`, error);
      return null;
    }
  }

  // Session management
  static async setSession(sessionId: string, sessionData: any, ttl: number = 86400): Promise<boolean> {
    return await this.setJSON(`session:${sessionId}`, sessionData, ttl);
  }

  static async getSession<T>(sessionId: string): Promise<T | null> {
    return await this.getJSON<T>(`session:${sessionId}`);
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
    return await this.del(`session:${sessionId}`);
  }

  // Rate limiting
  static async incrementRateLimit(key: string, window: number): Promise<number> {
    try {
      const current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, window);
      }
      return current;
    } catch (error) {
      logger.error(`Error incrementing rate limit key ${key}:`, error);
      return 0;
    }
  }

  // Leaderboard caching
  static async cacheLeaderboard(timeframe: string, data: any, ttl: number = 3600): Promise<boolean> {
    return await this.setJSON(`leaderboard:${timeframe}`, data, ttl);
  }

  static async getLeaderboard<T>(timeframe: string): Promise<T | null> {
    return await this.getJSON<T>(`leaderboard:${timeframe}`);
  }
}

export default redisClient;