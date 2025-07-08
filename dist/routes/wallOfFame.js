"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
// Placeholder routes - controllers will be implemented
router.get('/monthly', auth_1.authenticate, (req, res) => res.json({ message: 'Monthly wall of fame endpoint' }));
router.post('/upload', auth_1.authenticate, (0, auth_1.requireRole)(['teacher', 'principal']), (req, res) => res.json({ message: 'Upload to wall of fame endpoint' }));
router.put('/:id/approve', auth_1.authenticate, (0, auth_1.requireRole)(['principal']), (req, res) => res.json({ message: 'Approve wall of fame entry endpoint' }));
router.delete('/:id', auth_1.authenticate, (0, auth_1.requireRole)(['principal']), (req, res) => res.json({ message: 'Delete wall of fame entry endpoint' }));
exports.default = router;
//# sourceMappingURL=wallOfFame.js.map