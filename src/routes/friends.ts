import { Router } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

// Placeholder routes - controllers will be implemented
router.get('/list', authenticate, (req, res) => res.json({ message: 'Friends list endpoint' }));
router.post('/request', authenticate, (req, res) => res.json({ message: 'Send friend request endpoint' }));
router.put('/accept', authenticate, (req, res) => res.json({ message: 'Accept friend request endpoint' }));
router.delete('/remove', authenticate, (req, res) => res.json({ message: 'Remove friend endpoint' }));

export default router;