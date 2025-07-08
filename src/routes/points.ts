import { Router } from 'express';
import { PointsController } from '@/controllers/pointsController';
import { authenticate, requireRole } from '@/middleware/auth';
import { validateRequest } from '@/utils/validation';
import {
  awardPointsSchema,
  pointsHistorySchema,
  paginationSchema,
} from '@/utils/validation';

const router = Router();
const pointsController = new PointsController();

/**
 * @route GET /api/v1/points/my-points
 * @desc Get current user's points summary
 * @access Private
 */
router.get('/my-points', authenticate, pointsController.getMyPoints);

/**
 * @route POST /api/v1/points/award
 * @desc Award points to a student
 * @access Private - Teacher/Principal only
 */
router.post(
  '/award',
  authenticate,
  requireRole(['teacher', 'principal']),
  validateRequest({ body: awardPointsSchema }),
  pointsController.awardPoints
);

/**
 * @route GET /api/v1/points/history
 * @desc Get points history for current user
 * @access Private
 */
router.get(
  '/history',
  authenticate,
  validateRequest({ query: pointsHistorySchema }),
  pointsController.getPointsHistory
);

/**
 * @route GET /api/v1/points/user/:userId/history
 * @desc Get points history for specific user
 * @access Private - Teacher/Principal only
 */
router.get(
  '/user/:userId/history',
  authenticate,
  requireRole(['teacher', 'principal']),
  validateRequest({ query: pointsHistorySchema }),
  pointsController.getUserPointsHistory
);

/**
 * @route GET /api/v1/points/user/:userId/summary
 * @desc Get points summary for specific user
 * @access Private - Teacher/Principal only
 */
router.get(
  '/user/:userId/summary',
  authenticate,
  requireRole(['teacher', 'principal']),
  pointsController.getUserPointsSummary
);

/**
 * @route GET /api/v1/points/categories
 * @desc Get points by category for current user
 * @access Private
 */
router.get('/categories', authenticate, pointsController.getPointsByCategory);

/**
 * @route GET /api/v1/points/trending
 * @desc Get trending points data
 * @access Private
 */
router.get('/trending', authenticate, pointsController.getTrendingPoints);

/**
 * @route GET /api/v1/points/statistics
 * @desc Get overall points statistics
 * @access Private - Teacher/Principal only
 */
router.get(
  '/statistics',
  authenticate,
  requireRole(['teacher', 'principal']),
  pointsController.getPointsStatistics
);

export default router;