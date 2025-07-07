import { BadgeProgress } from '@/types';
export declare class AchievementEngine {
    /**
     * Check if user has earned any new badges
     */
    checkBadgeEligibility(userId: string): Promise<any[]>;
    /**
     * Award a badge to a user
     */
    awardBadge(userId: string, badgeId: string): Promise<any | null>;
    /**
     * Get user's badge progress
     */
    getBadgeProgress(userId: string): Promise<BadgeProgress[]>;
    /**
     * Get user's earned badges
     */
    getEarnedBadges(userId: string): Promise<any[]>;
    /**
     * Get all available badges
     */
    getAvailableBadges(): Promise<any[]>;
    /**
     * Get user statistics for badge calculations
     */
    private getUserStats;
    /**
     * Get list of badge IDs user has already earned
     */
    private getEarnedBadgeIds;
    /**
     * Check if user meets requirements for a specific badge
     */
    private meetsBadgeRequirements;
    /**
     * Calculate current progress towards a badge
     */
    private calculateBadgeProgress;
    /**
     * Check academic-specific badge requirements
     */
    private checkAcademicRequirements;
    /**
     * Check sports-specific badge requirements
     */
    private checkSportsRequirements;
    /**
     * Check leadership-specific badge requirements
     */
    private checkLeadershipRequirements;
    /**
     * Check social-specific badge requirements
     */
    private checkSocialRequirements;
    /**
     * Create a new badge (admin function)
     */
    createBadge(badgeData: {
        name: string;
        description: string;
        icon: string;
        category: string;
        pointsRequired: number;
        isSecret?: boolean;
        rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    }): Promise<any>;
    /**
     * Update an existing badge
     */
    updateBadge(badgeId: string, updateData: Partial<{
        name: string;
        description: string;
        icon: string;
        pointsRequired: number;
        isSecret: boolean;
        rarity: 'common' | 'rare' | 'epic' | 'legendary';
    }>): Promise<any>;
    /**
     * Delete a badge
     */
    deleteBadge(badgeId: string): Promise<void>;
    /**
     * Get badge statistics
     */
    getBadgeStatistics(): Promise<{
        totalBadges: number;
        totalAwarded: number;
        popularBadges: Array<{
            badge: any;
            count: number;
        }>;
        rareBadges: Array<{
            badge: any;
            count: number;
        }>;
    }>;
    /**
     * Clear user badge cache
     */
    private clearUserBadgeCache;
}
//# sourceMappingURL=achievementEngine.d.ts.map