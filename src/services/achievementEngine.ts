import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { CacheService } from '@/config/redis';
import { UserStats, BadgeProgress, AppError } from '@/types';

export class AchievementEngine {
  /**
   * Check if user has earned any new badges
   */
  async checkBadgeEligibility(userId: string): Promise<any[]> {
    try {
      const [userStats, availableBadges, earnedBadgeIds] = await Promise.all([
        this.getUserStats(userId),
        this.getAvailableBadges(),
        this.getEarnedBadgeIds(userId),
      ]);

      const newBadges: any[] = [];

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

    } catch (error) {
      logger.error('Error checking badge eligibility:', error);
      return [];
    }
  }

  /**
   * Award a badge to a user
   */
  async awardBadge(userId: string, badgeId: string): Promise<any | null> {
    try {
      // Check if user already has this badge
      const existingUserBadge = await prisma.userBadge.findUnique({
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
      const userBadge = await prisma.userBadge.create({
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

      logger.info('Badge awarded', {
        userId,
        badgeId,
        badgeName: userBadge.badge.name,
      });

      return userBadge.badge;

    } catch (error) {
      logger.error('Error awarding badge:', error);
      return null;
    }
  }

  /**
   * Get user's badge progress
   */
  async getBadgeProgress(userId: string): Promise<BadgeProgress[]> {
    const cacheKey = `badge_progress:${userId}`;
    const cached = await CacheService.getJSON<BadgeProgress[]>(cacheKey);
    if (cached) return cached;

    try {
      const [userStats, availableBadges, earnedBadgeIds] = await Promise.all([
        this.getUserStats(userId),
        this.getAvailableBadges(),
        this.getEarnedBadgeIds(userId),
      ]);

      const progress: BadgeProgress[] = [];

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

      await CacheService.setJSON(cacheKey, progress, 7200); // 2 hours
      return progress;

    } catch (error) {
      logger.error('Error getting badge progress:', error);
      throw new AppError('Failed to get badge progress', 500);
    }
  }

  /**
   * Get user's earned badges
   */
  async getEarnedBadges(userId: string): Promise<any[]> {
    try {
      const userBadges = await prisma.userBadge.findMany({
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

    } catch (error) {
      logger.error('Error getting earned badges:', error);
      throw new AppError('Failed to get earned badges', 500);
    }
  }

  /**
   * Get all available badges
   */
  async getAvailableBadges(): Promise<any[]> {
    const cacheKey = 'available_badges';
    const cached = await CacheService.getJSON(cacheKey);
    if (cached) return cached;

    try {
      const badges = await prisma.badge.findMany({
        where: { isSecret: false },
        orderBy: [{ category: 'asc' }, { pointsRequired: 'asc' }],
      });

      await CacheService.setJSON(cacheKey, badges, 7200); // 2 hours
      return badges;

    } catch (error) {
      logger.error('Error getting available badges:', error);
      return [];
    }
  }

  /**
   * Get user statistics for badge calculations
   */
  private async getUserStats(userId: string): Promise<UserStats> {
    try {
      const [pointsResult, eventsCount, streaksResult, badgeCount] = await Promise.all([
        // Total points by category
        prisma.point.groupBy({
          by: ['category'],
          where: { studentId: userId },
          _sum: { amount: true },
        }),
        
        // Event participation count
        prisma.point.count({
          where: {
            studentId: userId,
            reason: { contains: 'event' },
          },
        }),

        // Longest streaks
        prisma.streak.findMany({
          where: { userId },
          select: {
            activityType: true,
            longestStreak: true,
          },
        }),

        // Badge count
        prisma.userBadge.count({
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

    } catch (error) {
      logger.error('Error getting user stats:', error);
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
  private async getEarnedBadgeIds(userId: string): Promise<string[]> {
    try {
      const userBadges = await prisma.userBadge.findMany({
        where: { userId },
        select: { badgeId: true },
      });

      return userBadges.map(ub => ub.badgeId);

    } catch (error) {
      logger.error('Error getting earned badge IDs:', error);
      return [];
    }
  }

  /**
   * Check if user meets requirements for a specific badge
   */
  private async meetsBadgeRequirements(stats: UserStats, badge: any): Promise<boolean> {
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

    } catch (error) {
      logger.error('Error checking badge requirements:', error);
      return false;
    }
  }

  /**
   * Calculate current progress towards a badge
   */
  private async calculateBadgeProgress(stats: UserStats, badge: any): Promise<number> {
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
  private async checkAcademicRequirements(badge: any): Promise<boolean> {
    // Implement academic-specific logic
    // This could check for specific academic achievements, test scores, etc.
    return false;
  }

  /**
   * Check sports-specific badge requirements
   */
  private async checkSportsRequirements(badge: any): Promise<boolean> {
    // Implement sports-specific logic
    // This could check for sports event participation, achievements, etc.
    return false;
  }

  /**
   * Check leadership-specific badge requirements
   */
  private async checkLeadershipRequirements(badge: any): Promise<boolean> {
    // Implement leadership-specific logic
    // This could check for leadership roles, organizing events, etc.
    return false;
  }

  /**
   * Check social-specific badge requirements
   */
  private async checkSocialRequirements(badge: any): Promise<boolean> {
    // Implement social-specific logic
    // This could check for friend connections, collaboration, etc.
    return false;
  }

  /**
   * Create a new badge (admin function)
   */
  async createBadge(badgeData: {
    name: string;
    description: string;
    icon: string;
    category: string;
    pointsRequired: number;
    isSecret?: boolean;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  }): Promise<any> {
    try {
      const badge = await prisma.badge.create({
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
      await CacheService.del('available_badges');

      logger.info('Badge created', {
        badgeId: badge.id,
        name: badge.name,
        category: badge.category,
      });

      return badge;

    } catch (error) {
      logger.error('Error creating badge:', error);
      throw new AppError('Failed to create badge', 500);
    }
  }

  /**
   * Update an existing badge
   */
  async updateBadge(badgeId: string, updateData: Partial<{
    name: string;
    description: string;
    icon: string;
    pointsRequired: number;
    isSecret: boolean;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>): Promise<any> {
    try {
      const badge = await prisma.badge.update({
        where: { id: badgeId },
        data: updateData,
      });

      // Clear cache
      await CacheService.del('available_badges');

      logger.info('Badge updated', {
        badgeId: badge.id,
        name: badge.name,
      });

      return badge;

    } catch (error) {
      logger.error('Error updating badge:', error);
      throw new AppError('Failed to update badge', 500);
    }
  }

  /**
   * Delete a badge
   */
  async deleteBadge(badgeId: string): Promise<void> {
    try {
      // Check if any users have this badge
      const userBadgeCount = await prisma.userBadge.count({
        where: { badgeId },
      });

      if (userBadgeCount > 0) {
        throw new AppError('Cannot delete badge that has been awarded to users', 400);
      }

      await prisma.badge.delete({
        where: { id: badgeId },
      });

      // Clear cache
      await CacheService.del('available_badges');

      logger.info('Badge deleted', { badgeId });

    } catch (error) {
      logger.error('Error deleting badge:', error);
      throw error;
    }
  }

  /**
   * Get badge statistics
   */
  async getBadgeStatistics(): Promise<{
    totalBadges: number;
    totalAwarded: number;
    popularBadges: Array<{ badge: any; count: number }>;
    rareBadges: Array<{ badge: any; count: number }>;
  }> {
    try {
      const [totalBadges, totalAwarded, popularBadges] = await Promise.all([
        prisma.badge.count(),
        prisma.userBadge.count(),
        prisma.userBadge.groupBy({
          by: ['badgeId'],
          _count: { badgeId: true },
          orderBy: { _count: { badgeId: 'desc' } },
          take: 10,
        }),
      ]);

      // Get badge details for popular badges
      const popularBadgeDetails = await Promise.all(
        popularBadges.map(async (item) => {
          const badge = await prisma.badge.findUnique({
            where: { id: item.badgeId },
          });
          return {
            badge,
            count: item._count.badgeId,
          };
        })
      );

      // Get rare badges (least awarded)
      const rareBadges = popularBadgeDetails.slice(-5).reverse();

      return {
        totalBadges,
        totalAwarded,
        popularBadges: popularBadgeDetails,
        rareBadges,
      };

    } catch (error) {
      logger.error('Error getting badge statistics:', error);
      throw new AppError('Failed to get badge statistics', 500);
    }
  }

  /**
   * Clear user badge cache
   */
  private async clearUserBadgeCache(userId: string): Promise<void> {
    const cacheKeys = [
      `badge_progress:${userId}`,
      `user_profile:${userId}`,
    ];

    await Promise.all(cacheKeys.map(key => CacheService.del(key)));
  }
}