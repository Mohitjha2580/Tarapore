import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { CacheService } from '@/config/redis';
import { AchievementEngine } from './achievementEngine';
import { SocketManager } from './socketManager';
import { ActivityService } from './activityService';
import { PointsAward, Multiplier, AppError } from '@/types';

export class PointsEngine {
  private achievementEngine: AchievementEngine;
  private socketManager: SocketManager;
  private activityService: ActivityService;

  constructor(
    achievementEngine: AchievementEngine,
    socketManager: SocketManager,
    activityService: ActivityService
  ) {
    this.achievementEngine = achievementEngine;
    this.socketManager = socketManager;
    this.activityService = activityService;
  }

  /**
   * Calculate points with various multipliers
   */
  calculatePoints(basePoints: number, multipliers: Multiplier[] = []): number {
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
  async awardPoints(awardData: PointsAward, awardedById: string): Promise<{
    success: boolean;
    pointsAwarded: number;
    newBadges?: string[];
    streakInfo?: any;
  }> {
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
      const result = await prisma.$transaction(async (tx) => {
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

      logger.info('Points awarded successfully', {
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

    } catch (error) {
      logger.error('Error awarding points:', error);
      throw error;
    }
  }

  /**
   * Get user's points summary
   */
  async getPointsSummary(userId: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    rank: number;
    trend: Array<{ date: string; points: number }>;
  }> {
    const cacheKey = `points_summary:${userId}`;
    const cached = await CacheService.getJSON(cacheKey);
    if (cached) return cached;

    try {
      // Get total points
      const totalResult = await prisma.point.aggregate({
        where: { studentId: userId },
        _sum: { amount: true },
      });

      const total = totalResult._sum.amount || 0;

      // Get points by category
      const categoryPoints = await prisma.point.groupBy({
        by: ['category'],
        where: { studentId: userId },
        _sum: { amount: true },
      });

      const byCategory = categoryPoints.reduce((acc, item) => {
        acc[item.category] = item._sum.amount || 0;
        return acc;
      }, {} as Record<string, number>);

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

      await CacheService.setJSON(cacheKey, summary, 1800); // 30 minutes
      return summary;

    } catch (error) {
      logger.error('Error getting points summary:', error);
      throw new AppError('Failed to get points summary', 500);
    }
  }

  /**
   * Get points history with pagination
   */
  async getPointsHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      category?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const {
      limit = 20,
      offset = 0,
      category,
      startDate,
      endDate,
    } = options;

    try {
      const where: any = { studentId: userId };

      if (category) where.category = category;
      if (startDate) where.createdAt = { ...where.createdAt, gte: startDate };
      if (endDate) where.createdAt = { ...where.createdAt, lte: endDate };

      const [points, total] = await Promise.all([
        prisma.point.findMany({
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
        prisma.point.count({ where }),
      ]);

      return {
        points,
        total,
        hasMore: offset + limit < total,
      };

    } catch (error) {
      logger.error('Error getting points history:', error);
      throw new AppError('Failed to get points history', 500);
    }
  }

  /**
   * Validate student and check if they can receive points
   */
  private async validateStudent(studentId: string) {
    const student = await prisma.user.findUnique({
      where: { id: studentId, isActive: true },
    });

    if (!student) {
      throw new AppError('Student not found or inactive', 404);
    }

    if (student.role !== 'student') {
      throw new AppError('Points can only be awarded to students', 400);
    }

    return student;
  }

  /**
   * Get active multipliers for a student and category
   */
  private async getActiveMultipliers(studentId: string, category: string): Promise<Multiplier[]> {
    const multipliers: Multiplier[] = [];

    try {
      // Get streak multiplier
      const streak = await prisma.streak.findUnique({
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

    } catch (error) {
      logger.error('Error getting multipliers:', error);
      return [];
    }
  }

  /**
   * Check if student has exceeded daily points limit
   */
  private async checkDailyPointsLimit(studentId: string, pointsToAward: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPoints = await prisma.point.aggregate({
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
      throw new AppError(
        `Daily points limit exceeded. Current: ${currentTotal}, Limit: ${dailyLimit}`,
        400
      );
    }
  }

  /**
   * Update streak information
   */
  private async updateStreaks(studentId: string, category: string, tx: any) {
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
      } else if (lastActivity.getTime() !== today.getTime()) {
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

    } catch (error) {
      logger.error('Error updating streaks:', error);
      return null;
    }
  }

  /**
   * Get house competition multiplier
   */
  private async getHouseMultiplier(studentId: string): Promise<number> {
    // Placeholder for house competition logic
    // This would check if there's an active house competition and return appropriate multiplier
    return 1.0;
  }

  /**
   * Get user's rank in the leaderboard
   */
  private async getUserRank(userId: string): Promise<number> {
    try {
      const userTotal = await prisma.point.aggregate({
        where: { studentId: userId },
        _sum: { amount: true },
      });

      const userPoints = userTotal._sum.amount || 0;

      const higherRanked = await prisma.point.groupBy({
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

    } catch (error) {
      logger.error('Error getting user rank:', error);
      return 0;
    }
  }

  /**
   * Get points trend over specified number of days
   */
  private async getPointsTrend(userId: string, days: number): Promise<Array<{ date: string; points: number }>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const points = await prisma.point.findMany({
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
      const dailyPoints: Record<string, number> = {};
      
      for (const point of points) {
        const dateKey = point.createdAt.toISOString().split('T')[0];
        dailyPoints[dateKey] = (dailyPoints[dateKey] || 0) + point.amount;
      }

      // Fill in missing dates with 0
      const trend: Array<{ date: string; points: number }> = [];
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

    } catch (error) {
      logger.error('Error getting points trend:', error);
      return [];
    }
  }

  /**
   * Clear user-related caches
   */
  private async clearUserCaches(userId: string): Promise<void> {
    const cacheKeys = [
      `points_summary:${userId}`,
      `user_profile:${userId}`,
      `leaderboard:weekly`,
      `leaderboard:monthly`,
      `leaderboard:yearly`,
    ];

    await Promise.all(cacheKeys.map(key => CacheService.del(key)));
  }
}