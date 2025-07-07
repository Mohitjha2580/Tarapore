import { Router } from 'express';
import { authenticate, requireRole } from '@/middleware/auth';

const router = Router();

// Placeholder routes - controllers will be implemented
router.get('/monthly', authenticate, (req, res) => res.json({ message: 'Monthly wall of fame endpoint' }));
router.post('/upload', authenticate, requireRole(['teacher', 'principal']), (req, res) => res.json({ message: 'Upload to wall of fame endpoint' }));
router.put('/:id/approve', authenticate, requireRole(['principal']), (req, res) => res.json({ message: 'Approve wall of fame entry endpoint' }));
router.delete('/:id', authenticate, requireRole(['principal']), (req, res) => res.json({ message: 'Delete wall of fame entry endpoint' }));

export default router;