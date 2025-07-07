"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
// Placeholder routes - controllers will be implemented
router.get('/list', auth_1.authenticate, (req, res) => res.json({ message: 'Friends list endpoint' }));
router.post('/request', auth_1.authenticate, (req, res) => res.json({ message: 'Send friend request endpoint' }));
router.put('/accept', auth_1.authenticate, (req, res) => res.json({ message: 'Accept friend request endpoint' }));
router.delete('/remove', auth_1.authenticate, (req, res) => res.json({ message: 'Remove friend endpoint' }));
exports.default = router;
//# sourceMappingURL=friends.js.map