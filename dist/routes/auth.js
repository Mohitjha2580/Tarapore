"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("@/controllers/authController");
const validation_1 = require("@/utils/validation");
const rateLimiter_1 = require("@/middleware/rateLimiter");
const auth_1 = require("@/middleware/auth");
const validation_2 = require("@/utils/validation");
const router = (0, express_1.Router)();
const authController = new authController_1.AuthController();
/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', rateLimiter_1.authRateLimiter, (0, validation_1.validateRequest)({ body: validation_2.registerSchema }), authController.register);
/**
 * @route POST /api/v1/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', rateLimiter_1.authRateLimiter, (0, validation_1.validateRequest)({ body: validation_2.loginSchema }), authController.login);
/**
 * @route POST /api/v1/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', rateLimiter_1.authRateLimiter, (0, validation_1.validateRequest)({ body: validation_2.refreshTokenSchema }), authController.refreshToken);
/**
 * @route POST /api/v1/auth/logout
 * @desc Logout user (invalidate refresh token)
 * @access Private
 */
router.post('/logout', auth_1.authenticate, authController.logout);
/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post('/forgot-password', rateLimiter_1.passwordResetRateLimiter, (0, validation_1.validateRequest)({ body: validation_2.forgotPasswordSchema }), authController.forgotPassword);
/**
 * @route POST /api/v1/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', rateLimiter_1.passwordResetRateLimiter, (0, validation_1.validateRequest)({ body: validation_2.resetPasswordSchema }), authController.resetPassword);
/**
 * @route GET /api/v1/auth/verify-token
 * @desc Verify if token is valid
 * @access Private
 */
router.get('/verify-token', auth_1.authenticate, authController.verifyToken);
/**
 * @route GET /api/v1/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me', auth_1.authenticate, authController.getCurrentUser);
exports.default = router;
//# sourceMappingURL=auth.js.map