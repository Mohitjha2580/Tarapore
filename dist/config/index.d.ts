export declare const config: {
    server: {
        port: number;
        nodeEnv: string;
        apiVersion: string;
    };
    database: {
        url: string;
        host: string;
        port: number;
        username: string;
        password: string;
        name: string;
        ssl: boolean;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    redis: {
        url: string;
        host: string;
        port: number;
        password: string | undefined;
    };
    aws: {
        accessKeyId: string;
        secretAccessKey: string;
        region: string;
        s3Bucket: string;
    };
    email: {
        sendgridApiKey: string;
        fromEmail: string;
    };
    frontend: {
        url: string;
        corsOrigins: string[];
    };
    upload: {
        maxFileSize: number;
        allowedTypes: string[];
    };
    rateLimit: {
        auth: {
            windowMs: number;
            max: number;
        };
        api: {
            windowMs: number;
            max: number;
        };
    };
    school: {
        domain: string;
        name: string;
    };
    logging: {
        level: string;
        file: string;
    };
    cache: {
        session: number;
        leaderboard: number;
        userProfile: number;
        badges: number;
    };
    pagination: {
        defaultLimit: number;
        maxLimit: number;
    };
    gamification: {
        dailyPointsLimit: number;
        maxStreakBonus: number;
        badgePointsThresholds: {
            bronze: number;
            silver: number;
            gold: number;
            platinum: number;
        };
    };
};
export declare const validateConfig: () => void;
export default config;
//# sourceMappingURL=index.d.ts.map