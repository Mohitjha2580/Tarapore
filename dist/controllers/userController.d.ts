import { Response } from 'express';
import { AuthRequest } from '@/types';
export declare class UserController {
    getProfile(req: AuthRequest, res: Response): Promise<void>;
    updateProfile(req: AuthRequest, res: Response): Promise<void>;
    uploadAvatar(req: AuthRequest, res: Response): Promise<void>;
    getLeaderboard(req: AuthRequest, res: Response): Promise<void>;
    searchUsers(req: AuthRequest, res: Response): Promise<void>;
    getUserById(req: AuthRequest, res: Response): Promise<void>;
    getUserStats(req: AuthRequest, res: Response): Promise<void>;
    toggleUserStatus(req: AuthRequest, res: Response): Promise<void>;
    getAllUsers(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=userController.d.ts.map