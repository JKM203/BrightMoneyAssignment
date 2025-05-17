import express from 'express';
import { register, login, getProfile } from '../controllers/auth.controller.js';
import { authenticateToken } from '../utils/auth.middleware.js';

const router = express.Router();
//routing express

router.post('/register', register);
router.post('/login', login);

router.get('/profile', authenticateToken, getProfile);

export default router; 