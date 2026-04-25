const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getMe, updateApiKey } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', authMiddleware, getMe);
router.patch('/api-key', authMiddleware, updateApiKey);

module.exports = router;
