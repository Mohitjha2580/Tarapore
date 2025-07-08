import { AchievementEngine } from './achievementEngine';
import { SocketManager } from './socketManager';
import { ActivityService } from './activityService';
import { PointsAward, Multiplier } from '@/types';
export declare class PointsEngine {
    private achievementEngine;
    private socketManager;
    private activityService;
    constructor(achievementEngine: AchievementEngine, socketManager: SocketManager, activityService: ActivityService);
    /**
     * Calculate points with various multipliers
     */
    calculatePoints(basePoints: number, multipliers?: Multiplier[]): number;
    /**
     * Award points to a student with full gamification logic
     */
    awardPoints(awardData: PointsAward, awardedById: string): Promise<{
        success: boolean;
        pointsAwarded: number;
        newBadges?: string[];
        streakInfo?: any;
    }>;
    /**
     * Get user's points summary
     */
    getPointsSummary(userId: string): Promise<{
        total: number;
        byCategory: Record<string, number>;
        rank: number;
        trend: Array<{
            date: string;
            points: number;
        }>;
    }>;
    /**
     * Get points history with pagination
     */
    getPointsHistory(userId: string, options?: {
        limit?: number;
        offset?: number;
        category?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        points: ({
            awardedByUser: {
                role: import(".prisma/client").$Enums.UserRole;
                firstName: string;
                lastName: string;
                id: string;
            };
        } & {
            studentId: string;
            id: string;
            createdAt: Date;
            amount: number;
            category: import(".prisma/client").$Enums.PointCategory;
            reason: string;
            awardedBy: string;
        })[];
        total: number;
        hasMore: boolean;
    }>;
    /**
     * Validate student and check if they can receive points
     */
    private validateStudent;
    /**
     * Get active multipliers for a student and category
     */
    private getActiveMultipliers;
    /**
     * Check if student has exceeded daily points limit
     */
    private checkDailyPointsLimit;
    /**
     * Update streak information
     */
    private updateStreaks;
    /**
     * Get house competition multiplier
     */
    private getHouseMultiplier;
    /**
     * Get user's rank in the leaderboard
     */
    private getUserRank;
    /**
     * Get points trend over specified number of days
     */
    private getPointsTrend;
    /**
     * Clear user-related caches
     */
    private clearUserCaches;
}
//# sourceMappingURL=pointsEngine.d.ts.map