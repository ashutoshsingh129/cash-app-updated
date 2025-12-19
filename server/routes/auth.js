const express = require('express');
const { login, verifyToken, logout } = require('../middleware/auth');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.get('/verify', authenticateToken, verifyToken);
router.post('/logout', authenticateToken, logout);

module.exports = router;

