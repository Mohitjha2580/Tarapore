import { Request } from 'express';
export interface JWTPayload {
    userId: string;
    email: string;
    role: 'student' | 'teacher' | 'principal';
    studentId: string;
    iat: number;
    exp: number;
}
export interface AuthRequest extends Request {
    user: JWTPayload;
    body: any;
    ip?: string;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    house?: 'red' | 'blue' | 'green' | 'yellow';
}
export interface PointsAward {
    studentId: string;
    amount: number;
    category: 'academic' | 'sports' | 'arts' | 'leadership' | 'participation';
    reason: string;
}
export interface Multiplier {
    factor: number;
    type: string;
}
export interface UserStats {
    totalPoints: number;
    longestStreak: number;
    eventParticipation: number;
    badgeCount: number;
}
export interface LeaderboardEntry {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    totalPoints: number;
    rank: number;
    house?: string;
}
export interface BadgeRequirement {
    type: string;
    value: number;
    description: string;
}
export interface BadgeProgress {
    badgeId: string;
    badgeName: string;
    progress: number;
    requirement: number;
    isCompleted: boolean;
}
export interface FriendRequest {
    fromUserId: string;
    toUserId: string;
}
export interface ActivityFeedItem {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    activityType: string;
    description: string;
    metadata?: any;
    createdAt: Date;
}
export interface EventData {
    title: string;
    description: string;
    eventType: 'academic' | 'sports' | 'cultural' | 'competition';
    startDate: Date;
    endDate: Date;
    pointsReward: number;
}
export interface ChallengeData {
    title: string;
    description: string;
    pointsReward: number;
    category: string;
    date: Date;
}
export interface FileUploadOptions {
    maxSize: number;
    allowedTypes: string[];
    destination: string;
}
export interface UploadedFile {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
}
export interface StudentAnalytics {
    points: {
        total: number;
        byCategory: Record<string, number>;
        trend: Array<{
            date: string;
            points: number;
        }>;
    };
    badges: {
        earned: number;
        available: number;
        progress: BadgeProgress[];
    };
    activities: {
        count: number;
        byType: Record<string, number>;
    };
    streaks: {
        current: Record<string, number>;
        longest: Record<string, number>;
    };
}
export interface SchoolAnalytics {
    totalStudents: number;
    totalPointsAwarded: number;
    activeUsers: number;
    topPerformers: LeaderboardEntry[];
    engagementMetrics: {
        dailyActiveUsers: number;
        weeklyActiveUsers: number;
        monthlyActiveUsers: number;
    };
    houseStandings: Array<{
        house: string;
        totalPoints: number;
        memberCount: number;
        averagePoints: number;
    }>;
}
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    timestamp: string;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
export interface EmailTemplate {
    to: string;
    subject: string;
    templateId: string;
    dynamicData: Record<string, any>;
}
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode: number);
}
export interface DatabaseConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
}
export interface CacheConfig {
    host: string;
    port: number;
    password?: string;
    ttl: number;
}
export interface SocketData {
    userId: string;
    userRole: string;
}
export interface SocketEvents {
    'join-user-room': (userId: string) => void;
    'points-awarded': (data: {
        points: number;
        reason: string;
    }) => void;
    'badge-earned': (data: {
        badgeId: string;
        badgeName: string;
    }) => void;
    'friend-request': (data: {
        fromUser: string;
        message: string;
    }) => void;
    'challenge-completed': (data: {
        challengeId: string;
        points: number;
    }) => void;
}
export interface ValidationSchema {
    body?: any;
    query?: any;
    params?: any;
}
export interface RequestValidation {
    [key: string]: ValidationSchema;
}
//# sourceMappingURL=index.d.ts.map