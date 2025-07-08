import { Router } from 'express';
import { authenticate, requireRole } from '@/middleware/auth';

const router = Router();

// Placeholder routes - controllers will be implemented
router.get('/available', authenticate, (req, res) => res.json({ message: 'Available badges endpoint' }));
router.get('/my-badges', authenticate, (req, res) => res.json({ message: 'My badges endpoint' }));
router.post('/claim', authenticate, (req, res) => res.json({ message: 'Claim badge endpoint' }));
router.post('/', authenticate, requireRole(['principal']), (req, res) => res.json({ message: 'Create badge endpoint' }));

export default router;