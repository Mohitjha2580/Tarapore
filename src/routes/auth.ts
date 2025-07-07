import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import { validateRequest } from '@/utils/validation';
import { authRateLimiter, passwordResetRateLimiter } from '@/middleware/rateLimiter';
import { authenticate, optionalAuth } from '@/middleware/auth';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/utils/validation';

const router = Router();
const authController = new AuthController();

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  authController.register
);

/**
 * @route POST /api/v1/auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  authController.login
);

/**
 * @route POST /api/v1/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post(
  '/refresh',
  authRateLimiter,
  validateRequest({ body: refreshTokenSchema }),
  authController.refreshToken
);

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout user (invalidate refresh token)
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  authController.forgotPassword
);

/**
 * @route POST /api/v1/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validateRequest({ body: resetPasswordSchema }),
  authController.resetPassword
);

/**
 * @route GET /api/v1/auth/verify-token
 * @desc Verify if token is valid
 * @access Private
 */
router.get('/verify-token', authenticate, authController.verifyToken);

/**
 * @route GET /api/v1/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

export default router;