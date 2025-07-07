"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
// Placeholder routes - controllers will be implemented
router.get('/available', auth_1.authenticate, (req, res) => res.json({ message: 'Available badges endpoint' }));
router.get('/my-badges', auth_1.authenticate, (req, res) => res.json({ message: 'My badges endpoint' }));
router.post('/claim', auth_1.authenticate, (req, res) => res.json({ message: 'Claim badge endpoint' }));
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)(['principal']), (req, res) => res.json({ message: 'Create badge endpoint' }));
exports.default = router;
//# sourceMappingURL=badges.js.map