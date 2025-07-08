"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("@/controllers/userController");
const auth_1 = require("@/middleware/auth");
const rateLimiter_1 = require("@/middleware/rateLimiter");
const validation_1 = require("@/utils/validation");
const validation_2 = require("@/utils/validation");
const router = (0, express_1.Router)();
const userController = new userController_1.UserController();
/**
 * @route GET /api/v1/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', auth_1.authenticate, userController.getProfile);
/**
 * @route PUT /api/v1/users/profile
 * @desc Update current user profile
 * @access Private
 */
router.put('/profile', auth_1.authenticate, (0, validation_1.validateRequest)({ body: validation_2.updateProfileSchema }), userController.updateProfile);
/**
 * @route POST /api/v1/users/upload-avatar
 * @desc Upload profile picture
 * @access Private
 */
router.post('/upload-avatar', auth_1.authenticate, rateLimiter_1.uploadRateLimiter, userController.uploadAvatar);
/**
 * @route GET /api/v1/users/leaderboard
 * @desc Get leaderboard
 * @access Private
 */
router.get('/leaderboard', auth_1.authenticate, (0, validation_1.validateRequest)({ query: validation_2.leaderboardQuerySchema }), userController.getLeaderboard);
/**
 * @route GET /api/v1/users/search
 * @desc Search users
 * @access Private
 */
router.get('/search', auth_1.authenticate, (0, validation_1.validateRequest)({ query: validation_2.userSearchSchema }), userController.searchUsers);
/**
 * @route GET /api/v1/users/:userId
 * @desc Get user by ID
 * @access Private
 */
router.get('/:userId', auth_1.authenticate, userController.getUserById);
/**
 * @route GET /api/v1/users/:userId/stats
 * @desc Get user statistics
 * @access Private - Self or Teacher/Principal
 */
router.get('/:userId/stats', auth_1.authenticate, (0, auth_1.requireSelfOrRole)(['teacher', 'principal']), userController.getUserStats);
/**
 * @route PUT /api/v1/users/:userId/activate
 * @desc Activate/deactivate user
 * @access Private - Principal only
 */
router.put('/:userId/activate', auth_1.authenticate, (0, auth_1.requireRole)(['principal']), userController.toggleUserStatus);
/**
 * @route GET /api/v1/users
 * @desc Get all users (paginated)
 * @access Private - Teacher/Principal only
 */
router.get('/', auth_1.authenticate, (0, auth_1.requireRole)(['teacher', 'principal']), (0, validation_1.validateRequest)({ query: validation_2.paginationSchema }), userController.getAllUsers);
exports.default = router;
//# sourceMappingURL=users.js.map