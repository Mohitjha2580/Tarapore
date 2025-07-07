import { Request, Response } from 'express';
import { AuthRequest } from '@/types';
export declare class AuthController {
    /**
     * Register a new user
     */
    register(req: Request, res: Response): Promise<void>;
    /**
     * Login user
     */
    login(req: Request, res: Response): Promise<void>;
    /**
     * Refresh access token
     */
    refreshToken(req: Request, res: Response): Promise<void>;
    /**
     * Logout user
     */
    logout(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Forgot password
     */
    forgotPassword(req: Request, res: Response): Promise<void>;
    /**
     * Reset password
     */
    resetPassword(req: Request, res: Response): Promise<void>;
    /**
     * Verify token
     */
    verifyToken(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get current user
     */
    getCurrentUser(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=authController.d.ts.map