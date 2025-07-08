"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementEngine = void 0;
const database_1 = require("@/config/database");
const logger_1 = require("@/config/logger");
const redis_1 = require("@/config/redis");
const types_1 = require("@/types");
class AchievementEngine {
    /**
     * Check if user has earned any new badges
     */
    async checkBadgeEligibility(userId) {
        try {
            const [userStats, availableBadges, earnedBadgeIds] = await Promise.all([
                this.getUserStats(userId),
                this.getAvailableBadges(),
                this.getEarnedBadgeIds(userId),
            ]);
            const newBadges = [];
            for (const badge of availableBadges) {
                if (!earnedBadgeIds.includes(badge.id)) {
                    if (await this.meetsBadgeRequirements(userStats, badge)) {
                        const newBadge = await this.awardBadge(userId, badge.id);
                        if (newBadge) {
                            newBadges.push(newBadge);
                        }
                    }
                }
            }
            return newBadges;
        }
        catch (error) {
            logger_1.logger.error('Error checking badge eligibility:', error);
            return [];
        }
    }
    /**
     * Award a badge to a user
     */
    async awardBadge(userId, badgeId) {
        try {
            // Check if user already has this badge
            const existingUserBadge = await database_1.prisma.userBadge.findUnique({
                where: {
                    userId_badgeId: {
                        userId,
                        badgeId,
                    },
                },
            });
            if (existingUserBadge) {
                return null; // Already earned
            }
            // Award the badge
            const userBadge = await database_1.prisma.userBadge.create({
                data: {
                    userId,
                    badgeId,
                },
                include: {
                    badge: true,
                },
            });
            // Clear cache
            await this.clearUserBadgeCache(userId);
            logger_1.logger.info('Badge awarded', {
                userId,
                badgeId,
                badgeName: userBadge.badge.name,
            });
            return userBadge.badge;
        }
        catch (error) {
            logger_1.logger.error('Error awarding badge:', error);
            return null;
        }
    }
    /**
     * Get user's badge progress
     */
    async getBadgeProgress(userId) {
        const cacheKey = `badge_progress:${userId}`;
        const cached = await redis_1.CacheService.getJSON(cacheKey);
        if (cached)
            return cached;
        try {
            const [userStats, availableBadges, earnedBadgeIds] = await Promise.all([
                this.getUserStats(userId),
                this.getAvailableBadges(),
                this.getEarnedBadgeIds(userId),
            ]);
            const progress = [];
            for (const badge of availableBadges) {
                const isCompleted = earnedBadgeIds.includes(badge.id);
                const currentProgress = await this.calculateBadgeProgress(userStats, badge);
                progress.push({
                    badgeId: badge.id,
                    badgeName: badge.name,
                    progress: isCompleted ? badge.pointsRequired : currentProgress,
                    requirement: badge.pointsRequired,
                    isCompleted,
                });
            }
            await redis_1.CacheService.setJSON(cacheKey, progress, 7200); // 2 hours
            return progress;
        }
        catch (error) {
            logger_1.logger.error('Error getting badge progress:', error);
            throw new types_1.AppError('Failed to get badge progress', 500);
        }
    }
    /**
     * Get user's earned badges
     */
    async getEarnedBadges(userId) {
        try {
            const userBadges = await database_1.prisma.userBadge.findMany({
                where: { userId },
                include: {
                    badge: true,
                },
                orderBy: { earnedAt: 'desc' },
            });
            return userBadges.map(ub => ({
                ...ub.badge,
                earnedAt: ub.earnedAt,
            }));
        }
        catch (error) {
            logger_1.logger.error('Error getting earned badges:', error);
            throw new types_1.AppError('Failed to get earned badges', 500);
        }
    }
    /**
     * Get all available badges
     */
    async getAvailableBadges() {
        const cacheKey = 'available_badges';
        const cached = await redis_1.CacheService.getJSON(cacheKey);
        if (cached)
            return cached;
        try {
            const badges = await database_1.prisma.badge.findMany({
                where: { isSecret: false },
                orderBy: [{ category: 'asc' }, { pointsRequired: 'asc' }],
            });
            await redis_1.CacheService.setJSON(cacheKey, badges, 7200); // 2 hours
            return badges;
        }
        catch (error) {
            logger_1.logger.error('Error getting available badges:', error);
            return [];
        }
    }
    /**
     * Get user statistics for badge calculations
     */
    async getUserStats(userId) {
        try {
            const [pointsResult, eventsCount, streaksResult, badgeCount] = await Promise.all([
                // Total points by category
                database_1.prisma.point.groupBy({
                    by: ['category'],
                    where: { studentId: userId },
                    _sum: { amount: true },
                }),
                // Event participation count
                database_1.prisma.point.count({
                    where: {
                        studentId: userId,
                        reason: { contains: 'event' },
                    },
                }),
                // Longest streaks
                database_1.prisma.streak.findMany({
                    where: { userId },
                    select: {
                        activityType: true,
                        longestStreak: true,
                    },
                }),
                // Badge count
                database_1.prisma.userBadge.count({
                    where: { userId },
                }),
            ]);
            const totalPoints = pointsResult.reduce((sum, item) => sum + (item._sum.amount || 0), 0);
            const longestStreak = Math.max(...streaksResult.map(s => s.longestStreak), 0);
            return {
                totalPoints,
                longestStreak,
                eventParticipation: eventsCount,
                badgeCount,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting user stats:', error);
            return {
                totalPoints: 0,
                longestStreak: 0,
                eventParticipation: 0,
                badgeCount: 0,
            };
        }
    }
    /**
     * Get list of badge IDs user has already earned
     */
    async getEarnedBadgeIds(userId) {
        try {
            const userBadges = await database_1.prisma.userBadge.findMany({
                where: { userId },
                select: { badgeId: true },
            });
            return userBadges.map(ub => ub.badgeId);
        }
        catch (error) {
            logger_1.logger.error('Error getting earned badge IDs:', error);
            return [];
        }
    }
    /**
     * Check if user meets requirements for a specific badge
     */
    async meetsBadgeRequirements(stats, badge) {
        try {
            switch (badge.category) {
                case 'points':
                    return stats.totalPoints >= badge.pointsRequired;
                case 'streak':
                    return stats.longestStreak >= badge.pointsRequired;
                case 'participation':
                    return stats.eventParticipation >= badge.pointsRequired;
                case 'academic':
                    return await this.checkAcademicRequirements(badge);
                case 'sports':
                    return await this.checkSportsRequirements(badge);
                case 'leadership':
                    return await this.checkLeadershipRequirements(badge);
                case 'social':
                    return await this.checkSocialRequirements(badge);
                default:
                    return false;
            }
        }
        catch (error) {
            logger_1.logger.error('Error checking badge requirements:', error);
            return false;
        }
    }
    /**
     * Calculate current progress towards a badge
     */
    async calculateBadgeProgress(stats, badge) {
        switch (badge.category) {
            case 'points':
                return stats.totalPoints;
            case 'streak':
                return stats.longestStreak;
            case 'participation':
                return stats.eventParticipation;
            default:
                return 0;
        }
    }
    /**
     * Check academic-specific badge requirements
     */
    async checkAcademicRequirements(badge) {
        // Implement academic-specific logic
        // This could check for specific academic achievements, test scores, etc.
        return false;
    }
    /**
     * Check sports-specific badge requirements
     */
    async checkSportsRequirements(badge) {
        // Implement sports-specific logic
        // This could check for sports event participation, achievements, etc.
        return false;
    }
    /**
     * Check leadership-specific badge requirements
     */
    async checkLeadershipRequirements(badge) {
        // Implement leadership-specific logic
        // This could check for leadership roles, organizing events, etc.
        return false;
    }
    /**
     * Check social-specific badge requirements
     */
    async checkSocialRequirements(badge) {
        // Implement social-specific logic
        // This could check for friend connections, collaboration, etc.
        return false;
    }
    /**
     * Create a new badge (admin function)
     */
    async createBadge(badgeData) {
        try {
            const badge = await database_1.prisma.badge.create({
                data: {
                    name: badgeData.name,
                    description: badgeData.description,
                    icon: badgeData.icon,
                    category: badgeData.category,
                    pointsRequired: badgeData.pointsRequired,
                    isSecret: badgeData.isSecret || false,
                    rarity: badgeData.rarity || 'common',
                },
            });
            // Clear cache
            await redis_1.CacheService.del('available_badges');
            logger_1.logger.info('Badge created', {
                badgeId: badge.id,
                name: badge.name,
                category: badge.category,
            });
            return badge;
        }
        catch (error) {
            logger_1.logger.error('Error creating badge:', error);
            throw new types_1.AppError('Failed to create badge', 500);
        }
    }
    /**
     * Update an existing badge
     */
    async updateBadge(badgeId, updateData) {
        try {
            const badge = await database_1.prisma.badge.update({
                where: { id: badgeId },
                data: updateData,
            });
            // Clear cache
            await redis_1.CacheService.del('available_badges');
            logger_1.logger.info('Badge updated', {
                badgeId: badge.id,
                name: badge.name,
            });
            return badge;
        }
        catch (error) {
            logger_1.logger.error('Error updating badge:', error);
            throw new types_1.AppError('Failed to update badge', 500);
        }
    }
    /**
     * Delete a badge
     */
    async deleteBadge(badgeId) {
        try {
            // Check if any users have this badge
            const userBadgeCount = await database_1.prisma.userBadge.count({
                where: { badgeId },
            });
            if (userBadgeCount > 0) {
                throw new types_1.AppError('Cannot delete badge that has been awarded to users', 400);
            }
            await database_1.prisma.badge.delete({
                where: { id: badgeId },
            });
            // Clear cache
            await redis_1.CacheService.del('available_badges');
            logger_1.logger.info('Badge deleted', { badgeId });
        }
        catch (error) {
            logger_1.logger.error('Error deleting badge:', error);
            throw error;
        }
    }
    /**
     * Get badge statistics
     */
    async getBadgeStatistics() {
        try {
            const [totalBadges, totalAwarded, popularBadges] = await Promise.all([
                database_1.prisma.badge.count(),
                database_1.prisma.userBadge.count(),
                database_1.prisma.userBadge.groupBy({
                    by: ['badgeId'],
                    _count: { badgeId: true },
                    orderBy: { _count: { badgeId: 'desc' } },
                    take: 10,
                }),
            ]);
            // Get badge details for popular badges
            const popularBadgeDetails = await Promise.all(popularBadges.map(async (item) => {
                const badge = await database_1.prisma.badge.findUnique({
                    where: { id: item.badgeId },
                });
                return {
                    badge,
                    count: item._count.badgeId,
                };
            }));
            // Get rare badges (least awarded)
            const rareBadges = popularBadgeDetails.slice(-5).reverse();
            return {
                totalBadges,
                totalAwarded,
                popularBadges: popularBadgeDetails,
                rareBadges,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting badge statistics:', error);
            throw new types_1.AppError('Failed to get badge statistics', 500);
        }
    }
    /**
     * Clear user badge cache
     */
    async clearUserBadgeCache(userId) {
        const cacheKeys = [
            `badge_progress:${userId}`,
            `user_profile:${userId}`,
        ];
        await Promise.all(cacheKeys.map(key => redis_1.CacheService.del(key)));
    }
}
exports.AchievementEngine = AchievementEngine;
//# sourceMappingURL=achievementEngine.js.map