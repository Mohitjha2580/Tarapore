import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { PasswordUtils, EmailUtils, SessionUtils, SecurityUtils, AuditUtils } from '@/utils/auth';
import { AppError, AuthRequest } from '@/types';
import { logger } from '@/config/logger';
import { CacheService } from '@/config/redis';

export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, house } = req.body;

      // Validate email format and extract role/grade info
      const emailValidation = EmailUtils.validateSchoolEmail(email);
      if (!emailValidation.isValid) {
        res.status(400).json({
          success: false,
          error: emailValidation.error,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'User already exists with this email',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate password strength
      const passwordValidation = PasswordUtils.validate(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Password does not meet requirements',
          details: passwordValidation.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Check for compromised passwords
      if (SecurityUtils.isPasswordCompromised(password)) {
        res.status(400).json({
          success: false,
          error: 'Password is too common, please choose a stronger password',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Hash password
      const passwordHash = await PasswordUtils.hash(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: emailValidation.role!,
          studentId: emailValidation.studentId!,
          firstName,
          lastName,
          house: house || null,
          grade: emailValidation.grade,
        },
      });

      // Generate token pair
      const { accessToken, refreshToken } = SessionUtils.generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
      });

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Log successful registration
      AuditUtils.logAuthEvent('user_registered', user.id, {
        email: user.email,
        role: user.role,
        ip: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: SecurityUtils.sanitizeUserData(user),
          accessToken,
          refreshToken,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        AuditUtils.logFailedAuth(email, 'user_not_found', req.ip);
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!user.isActive) {
        AuditUtils.logFailedAuth(email, 'account_inactive', req.ip);
        res.status(401).json({
          success: false,
          error: 'Account is inactive',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Verify password
      const isPasswordValid = await PasswordUtils.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        AuditUtils.logFailedAuth(email, 'invalid_password', req.ip);
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Generate token pair
      const { accessToken, refreshToken } = SessionUtils.generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
      });

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Log successful login
      AuditUtils.logAuthEvent('user_login', user.id, {
        email: user.email,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: SecurityUtils.sanitizeUserData(user),
          accessToken,
          refreshToken,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      // Find and validate refresh token
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!tokenRecord.user.isActive) {
        res.status(401).json({
          success: false,
          error: 'Account is inactive',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Generate new token pair
      const { accessToken, refreshToken: newRefreshToken } = SessionUtils.generateTokenPair({
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
        studentId: tokenRecord.user.studentId,
      });

      // Replace old refresh token with new one
      await prisma.$transaction([
        prisma.refreshToken.delete({ where: { id: tokenRecord.id } }),
        prisma.refreshToken.create({
          data: {
            token: newRefreshToken,
            userId: tokenRecord.user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Token refresh failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Logout user
   */
  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Delete the specific refresh token
        await prisma.refreshToken.deleteMany({
          where: {
            token: refreshToken,
            userId: req.user.userId,
          },
        });
      } else {
        // Delete all refresh tokens for the user (logout from all devices)
        await prisma.refreshToken.deleteMany({
          where: { userId: req.user.userId },
        });
      }

      AuditUtils.logAuthEvent('user_logout', req.user.userId, {
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Always return success to prevent email enumeration
      if (!user) {
        res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // TODO: Implement password reset email sending
      // For now, just log the request
      logger.info('Password reset requested', {
        email: user.email,
        userId: user.id,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Password reset request failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      // TODO: Implement token validation logic
      // For now, return error
      res.status(400).json({
        success: false,
        error: 'Password reset not yet implemented',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Password reset failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Verify token
   */
  async verifyToken(req: AuthRequest, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get current user
   */
  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          role: true,
          studentId: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          house: true,
          grade: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        success: true,
        data: { user },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user information',
        timestamp: new Date().toISOString(),
      });
    }
  }
}