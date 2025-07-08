import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Database configuration
export const databaseConfig = {
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
      emit: 'event' as const,
      level: 'query' as const,
    },
    {
      emit: 'event' as const,
      level: 'error' as const,
    },
    {
      emit: 'event' as const,
      level: 'info' as const,
    },
    {
      emit: 'event' as const,
      level: 'warn' as const,
    },
  ],
};

// Create Prisma client instance
export const prisma = globalThis.__prisma || new PrismaClient(prismaClientConfig);

// Set up logging for database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Database Query:', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });
}

// Set up error logging
prisma.$on('error', (e) => {
  logger.error('Database Error:', {
    message: e.message,
    target: e.target,
  });
});

// Set up info logging
prisma.$on('info', (e) => {
  logger.info('Database Info:', {
    message: e.message,
    target: e.target,
  });
});

// Set up warning logging
prisma.$on('warn', (e) => {
  logger.warn('Database Warning:', {
    message: e.message,
    target: e.target,
  });
});

// Store in global for development hot reloading
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Database health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    return false;
  }
};

// Graceful shutdown
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed successfully');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

// Database metrics for health checks
export const getDatabaseMetrics = async () => {
  try {
    const userCount = await prisma.user.count();
    const pointsCount = await prisma.point.count();
    const badgesCount = await prisma.badge.count();
    
    return {
      users: userCount,
      points: pointsCount,
      badges: badgesCount,
      connectionStatus: 'connected',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error getting database metrics:', error);
    return {
      connectionStatus: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};