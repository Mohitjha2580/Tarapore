"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
// Placeholder routes - controllers will be implemented
router.get('/daily', auth_1.authenticate, (req, res) => res.json({ message: 'Daily challenges endpoint' }));
router.post('/complete', auth_1.authenticate, (req, res) => res.json({ message: 'Complete challenge endpoint' }));
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)(['teacher', 'principal']), (req, res) => res.json({ message: 'Create challenge endpoint' }));
exports.default = router;
//# sourceMappingURL=challenges.js.map