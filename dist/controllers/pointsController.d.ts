import { Response } from 'express';
import { AuthRequest } from '@/types';
export declare class PointsController {
    getMyPoints(req: AuthRequest, res: Response): Promise<void>;
    awardPoints(req: AuthRequest, res: Response): Promise<void>;
    getPointsHistory(req: AuthRequest, res: Response): Promise<void>;
    getUserPointsHistory(req: AuthRequest, res: Response): Promise<void>;
    getUserPointsSummary(req: AuthRequest, res: Response): Promise<void>;
    getPointsByCategory(req: AuthRequest, res: Response): Promise<void>;
    getTrendingPoints(req: AuthRequest, res: Response): Promise<void>;
    getPointsStatistics(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=pointsController.d.ts.map