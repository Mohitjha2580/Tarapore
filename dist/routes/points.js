"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pointsController_1 = require("@/controllers/pointsController");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/utils/validation");
const validation_2 = require("@/utils/validation");
const router = (0, express_1.Router)();
const pointsController = new pointsController_1.PointsController();
/**
 * @route GET /api/v1/points/my-points
 * @desc Get current user's points summary
 * @access Private
 */
router.get('/my-points', auth_1.authenticate, pointsController.getMyPoints);
/**
 * @route POST /api/v1/points/award
 * @desc Award points to a student
 * @access Private - Teacher/Principal only
 */
router.post('/award', auth_1.authenticate, (0, auth_1.requireRole)(['teacher', 'principal']), (0, validation_1.validateRequest)({ body: validation_2.awardPointsSchema }), pointsController.awardPoints);
/**
 * @route GET /api/v1/points/history
 * @desc Get points history for current user
 * @access Private
 */
router.get('/history', auth_1.authenticate, (0, validation_1.validateRequest)({ query: validation_2.pointsHistorySchema }), pointsController.getPointsHistory);
/**
 * @route GET /api/v1/points/user/:userId/history
 * @desc Get points history for specific user
 * @access Private - Teacher/Principal only
 */
router.get('/user/:userId/history', auth_1.authenticate, (0, auth_1.requireRole)(['teacher', 'principal']), (0, validation_1.validateRequest)({ query: validation_2.pointsHistorySchema }), pointsController.getUserPointsHistory);
/**
 * @route GET /api/v1/points/user/:userId/summary
 * @desc Get points summary for specific user
 * @access Private - Teacher/Principal only
 */
router.get('/user/:userId/summary', auth_1.authenticate, (0, auth_1.requireRole)(['teacher', 'principal']), pointsController.getUserPointsSummary);
/**
 * @route GET /api/v1/points/categories
 * @desc Get points by category for current user
 * @access Private
 */
router.get('/categories', auth_1.authenticate, pointsController.getPointsByCategory);
/**
 * @route GET /api/v1/points/trending
 * @desc Get trending points data
 * @access Private
 */
router.get('/trending', auth_1.authenticate, pointsController.getTrendingPoints);
/**
 * @route GET /api/v1/points/statistics
 * @desc Get overall points statistics
 * @access Private - Teacher/Principal only
 */
router.get('/statistics', auth_1.authenticate, (0, auth_1.requireRole)(['teacher', 'principal']), pointsController.getPointsStatistics);
exports.default = router;
//# sourceMappingURL=points.js.map