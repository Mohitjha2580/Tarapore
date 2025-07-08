"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointsEngine = void 0;
const database_1 = require("@/config/database");
const logger_1 = require("@/config/logger");
const redis_1 = require("@/config/redis");
const types_1 = require("@/types");
class PointsEngine {
    constructor(achievementEngine, socketManager, activityService) {
        this.achievementEngine = achievementEngine;
        this.socketManager = socketManager;
        this.activityService = activityService;
    }
    /**
     * Calculate points with various multipliers
     */
    calculatePoints(basePoints, multipliers = []) {
        let totalPoints = basePoints;
        for (const multiplier of multipliers) {
            totalPoints *= multiplier.factor;
        }
        // Ensure we don't award negative points or excessive points
        return Math.max(1, Math.min(totalPoints, 100));
    }
    /**
     * Award points to a student with full gamification logic
     */
    async awardPoints(awardData, awardedById) {
        try {
            // Validate student exists and is active
            const student = await this.validateStudent(awardData.studentId);
            // Get current multipliers (streak bonuses, house competitions, etc.)
            const multipliers = await this.getActiveMultipliers(awardData.studentId, awardData.category);
            // Calculate final points
            const finalPoints = this.calculatePoints(awardData.amount, multipliers);
            // Check daily points limit
            await this.checkDailyPointsLimit(awardData.studentId, finalPoints);
            // Begin transaction
            const result = await database_1.prisma.$transaction(async (tx) => {
                // Create points record
                const pointsRecord = await tx.point.create({
                    data: {
                        studentId: awardData.studentId,
                        awardedBy: awardedById,
                        category: awardData.category,
                        amount: finalPoints,
                        reason: awardData.reason,
                    },
                });
                // Update streaks
                const streakInfo = await this.updateStreaks(awardData.studentId, awardData.category, tx);
                return { pointsRecord, streakInfo };
            });
            // Post-transaction operations
            const promises = [
                // Check for new badge eligibility
                this.achievementEngine.checkBadgeEligibility(awardData.studentId),
                // Update activity feed
                this.activityService.logActivity({
                    userId: awardData.studentId,
                    activityType: 'points_earned',
                    description: `Earned ${finalPoints} points for ${awardData.category}`,
                    metadata: {
                        points: finalPoints,
                        category: awardData.category,
                        reason: awardData.reason,
                        awardedBy: awardedById,
                    },
                }),
                // Clear relevant caches
                this.clearUserCaches(awardData.studentId),
            ];
            const [newBadges] = await Promise.all(promises);
            // Real-time notifications
            this.socketManager.broadcastPointsUpdate(awardData.studentId, {
                points: finalPoints,
                reason: awardData.reason,
                category: awardData.category,
            });
            if (newBadges && newBadges.length > 0) {
                for (const badge of newBadges) {
                    this.socketManager.broadcastBadgeEarned(awardData.studentId, badge);
                }
            }
            logger_1.logger.info('Points awarded successfully', {
                studentId: awardData.studentId,
                points: finalPoints,
                category: awardData.category,
                awardedBy: awardedById,
            });
            return {
                success: true,
                pointsAwarded: finalPoints,
                newBadges: newBadges?.map(b => b.id),
                streakInfo: result.streakInfo,
            };
        }
        catch (error) {
            logger_1.logger.error('Error awarding points:', error);
            throw error;
        }
    }
    /**
     * Get user's points summary
     */
    async getPointsSummary(userId) {
        const cacheKey = `points_summary:${userId}`;
        const cached = await redis_1.CacheService.getJSON(cacheKey);
        if (cached)
            return cached;
        try {
            // Get total points
            const totalResult = await database_1.prisma.point.aggregate({
                where: { studentId: userId },
                _sum: { amount: true },
            });
            const total = totalResult._sum.amount || 0;
            // Get points by category
            const categoryPoints = await database_1.prisma.point.groupBy({
                by: ['category'],
                where: { studentId: userId },
                _sum: { amount: true },
            });
            const byCategory = categoryPoints.reduce((acc, item) => {
                acc[item.category] = item._sum.amount || 0;
                return acc;
            }, {});
            // Get user rank
            const rank = await this.getUserRank(userId);
            // Get points trend (last 30 days)
            const trend = await this.getPointsTrend(userId, 30);
            const summary = {
                total,
                byCategory,
                rank,
                trend,
            };
            await redis_1.CacheService.setJSON(cacheKey, summary, 1800); // 30 minutes
            return summary;
        }
        catch (error) {
            logger_1.logger.error('Error getting points summary:', error);
            throw new types_1.AppError('Failed to get points summary', 500);
        }
    }
    /**
     * Get points history with pagination
     */
    async getPointsHistory(userId, options = {}) {
        const { limit = 20, offset = 0, category, startDate, endDate, } = options;
        try {
            const where = { studentId: userId };
            if (category)
                where.category = category;
            if (startDate)
                where.createdAt = { ...where.createdAt, gte: startDate };
            if (endDate)
                where.createdAt = { ...where.createdAt, lte: endDate };
            const [points, total] = await Promise.all([
                database_1.prisma.point.findMany({
                    where,
                    include: {
                        awardedByUser: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    skip: offset,
                }),
                database_1.prisma.point.count({ where }),
            ]);
            return {
                points,
                total,
                hasMore: offset + limit < total,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting points history:', error);
            throw new types_1.AppError('Failed to get points history', 500);
        }
    }
    /**
     * Validate student and check if they can receive points
     */
    async validateStudent(studentId) {
        const student = await database_1.prisma.user.findUnique({
            where: { id: studentId, isActive: true },
        });
        if (!student) {
            throw new types_1.AppError('Student not found or inactive', 404);
        }
        if (student.role !== 'student') {
            throw new types_1.AppError('Points can only be awarded to students', 400);
        }
        return student;
    }
    /**
     * Get active multipliers for a student and category
     */
    async getActiveMultipliers(studentId, category) {
        const multipliers = [];
        try {
            // Get streak multiplier
            const streak = await database_1.prisma.streak.findUnique({
                where: {
                    userId_activityType: {
                        userId: studentId,
                        activityType: category,
                    },
                },
            });
            if (streak && streak.currentStreak > 0) {
                const streakMultiplier = Math.min(1 + (streak.currentStreak * 0.1), 2.0);
                multipliers.push({
                    factor: streakMultiplier,
                    type: 'streak',
                });
            }
            // House competition multiplier (if active)
            const houseMultiplier = await this.getHouseMultiplier(studentId);
            if (houseMultiplier > 1) {
                multipliers.push({
                    factor: houseMultiplier,
                    type: 'house_competition',
                });
            }
            return multipliers;
        }
        catch (error) {
            logger_1.logger.error('Error getting multipliers:', error);
            return [];
        }
    }
    /**
     * Check if student has exceeded daily points limit
     */
    async checkDailyPointsLimit(studentId, pointsToAward) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayPoints = await database_1.prisma.point.aggregate({
            where: {
                studentId,
                createdAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            _sum: { amount: true },
        });
        const currentTotal = todayPoints._sum.amount || 0;
        const dailyLimit = 100; // from config
        if (currentTotal + pointsToAward > dailyLimit) {
            throw new types_1.AppError(`Daily points limit exceeded. Current: ${currentTotal}, Limit: ${dailyLimit}`, 400);
        }
    }
    /**
     * Update streak information
     */
    async updateStreaks(studentId, category, tx) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        try {
            const existingStreak = await tx.streak.findUnique({
                where: {
                    userId_activityType: {
                        userId: studentId,
                        activityType: category,
                    },
                },
            });
            if (!existingStreak) {
                // Create new streak
                return await tx.streak.create({
                    data: {
                        userId: studentId,
                        activityType: category,
                        currentStreak: 1,
                        longestStreak: 1,
                        lastActivity: today,
                    },
                });
            }
            const lastActivity = new Date(existingStreak.lastActivity);
            lastActivity.setHours(0, 0, 0, 0);
            let newCurrentStreak = existingStreak.currentStreak;
            let newLongestStreak = existingStreak.longestStreak;
            if (lastActivity.getTime() === yesterday.getTime()) {
                // Consecutive day - increment streak
                newCurrentStreak += 1;
                newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
            }
            else if (lastActivity.getTime() !== today.getTime()) {
                // Streak broken - reset to 1
                newCurrentStreak = 1;
            }
            // If lastActivity is today, don't change streak (already counted)
            return await tx.streak.update({
                where: { id: existingStreak.id },
                data: {
                    currentStreak: newCurrentStreak,
                    longestStreak: newLongestStreak,
                    lastActivity: today,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating streaks:', error);
            return null;
        }
    }
    /**
     * Get house competition multiplier
     */
    async getHouseMultiplier(studentId) {
        // Placeholder for house competition logic
        // This would check if there's an active house competition and return appropriate multiplier
        return 1.0;
    }
    /**
     * Get user's rank in the leaderboard
     */
    async getUserRank(userId) {
        try {
            const userTotal = await database_1.prisma.point.aggregate({
                where: { studentId: userId },
                _sum: { amount: true },
            });
            const userPoints = userTotal._sum.amount || 0;
            const higherRanked = await database_1.prisma.point.groupBy({
                by: ['studentId'],
                _sum: { amount: true },
                having: {
                    amount: {
                        _sum: {
                            gt: userPoints,
                        },
                    },
                },
            });
            return higherRanked.length + 1;
        }
        catch (error) {
            logger_1.logger.error('Error getting user rank:', error);
            return 0;
        }
    }
    /**
     * Get points trend over specified number of days
     */
    async getPointsTrend(userId, days) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const points = await database_1.prisma.point.findMany({
                where: {
                    studentId: userId,
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                select: {
                    amount: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'asc' },
            });
            // Group by date
            const dailyPoints = {};
            for (const point of points) {
                const dateKey = point.createdAt.toISOString().split('T')[0];
                dailyPoints[dateKey] = (dailyPoints[dateKey] || 0) + point.amount;
            }
            // Fill in missing dates with 0
            const trend = [];
            for (let i = 0; i < days; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const dateKey = date.toISOString().split('T')[0];
                trend.push({
                    date: dateKey,
                    points: dailyPoints[dateKey] || 0,
                });
            }
            return trend;
        }
        catch (error) {
            logger_1.logger.error('Error getting points trend:', error);
            return [];
        }
    }
    /**
     * Clear user-related caches
     */
    async clearUserCaches(userId) {
        const cacheKeys = [
            `points_summary:${userId}`,
            `user_profile:${userId}`,
            `leaderboard:weekly`,
            `leaderboard:monthly`,
            `leaderboard:yearly`,
        ];
        await Promise.all(cacheKeys.map(key => redis_1.CacheService.del(key)));
    }
}
exports.PointsEngine = PointsEngine;
//# sourceMappingURL=pointsEngine.js.map