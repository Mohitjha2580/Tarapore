import { PrismaClient } from '@prisma/client';
declare global {
    var __prisma: PrismaClient | undefined;
}
export declare const databaseConfig: {
    host: string;
    port: number;
    username: string | undefined;
    password: string | undefined;
    database: string | undefined;
    ssl: boolean;
};
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const checkDatabaseConnection: () => Promise<boolean>;
export declare const closeDatabaseConnection: () => Promise<void>;
export declare const getDatabaseMetrics: () => Promise<{
    users: number;
    points: number;
    badges: number;
    connectionStatus: string;
    timestamp: string;
    error?: undefined;
} | {
    connectionStatus: string;
    error: string;
    timestamp: string;
    users?: undefined;
    points?: undefined;
    badges?: undefined;
}>;
//# sourceMappingURL=database.d.ts.map