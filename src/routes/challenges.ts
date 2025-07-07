import { Router } from 'express';
import { authenticate, requireRole } from '@/middleware/auth';

const router = Router();

// Placeholder routes - controllers will be implemented
router.get('/daily', authenticate, (req, res) => res.json({ message: 'Daily challenges endpoint' }));
router.post('/complete', authenticate, (req, res) => res.json({ message: 'Complete challenge endpoint' }));
router.post('/', authenticate, requireRole(['teacher', 'principal']), (req, res) => res.json({ message: 'Create challenge endpoint' }));

export default router;