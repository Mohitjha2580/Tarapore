import { Router } from 'express';
import { UserController } from '@/controllers/userController';
import { authenticate, requireRole, requireSelfOrRole } from '@/middleware/auth';
import { uploadRateLimiter } from '@/middleware/rateLimiter';
import { validateRequest } from '@/utils/validation';
import {
  updateProfileSchema,
  userSearchSchema,
  paginationSchema,
  leaderboardQuerySchema,
} from '@/utils/validation';

const router = Router();
const userController = new UserController();

/**
 * @route GET /api/v1/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route PUT /api/v1/users/profile
 * @desc Update current user profile
 * @access Private
 */
router.put(
  '/profile',
  authenticate,
  validateRequest({ body: updateProfileSchema }),
  userController.updateProfile
);

/**
 * @route POST /api/v1/users/upload-avatar
 * @desc Upload profile picture
 * @access Private
 */
router.post(
  '/upload-avatar',
  authenticate,
  uploadRateLimiter,
  userController.uploadAvatar
);

/**
 * @route GET /api/v1/users/leaderboard
 * @desc Get leaderboard
 * @access Private
 */
router.get(
  '/leaderboard',
  authenticate,
  validateRequest({ query: leaderboardQuerySchema }),
  userController.getLeaderboard
);

/**
 * @route GET /api/v1/users/search
 * @desc Search users
 * @access Private
 */
router.get(
  '/search',
  authenticate,
  validateRequest({ query: userSearchSchema }),
  userController.searchUsers
);

/**
 * @route GET /api/v1/users/:userId
 * @desc Get user by ID
 * @access Private
 */
router.get(
  '/:userId',
  authenticate,
  userController.getUserById
);

/**
 * @route GET /api/v1/users/:userId/stats
 * @desc Get user statistics
 * @access Private - Self or Teacher/Principal
 */
router.get(
  '/:userId/stats',
  authenticate,
  requireSelfOrRole(['teacher', 'principal']),
  userController.getUserStats
);

/**
 * @route PUT /api/v1/users/:userId/activate
 * @desc Activate/deactivate user
 * @access Private - Principal only
 */
router.put(
  '/:userId/activate',
  authenticate,
  requireRole(['principal']),
  userController.toggleUserStatus
);

/**
 * @route GET /api/v1/users
 * @desc Get all users (paginated)
 * @access Private - Teacher/Principal only
 */
router.get(
  '/',
  authenticate,
  requireRole(['teacher', 'principal']),
  validateRequest({ query: paginationSchema }),
  userController.getAllUsers
);

export default router;