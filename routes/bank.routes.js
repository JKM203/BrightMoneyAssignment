import express from 'express';
import { authenticateToken } from '../utils/auth.middleware.js';
import { getloan , makePayment , getStatement } from '../controllers/bank.controller.js';

const router = express.Router();

router.post('/get-loan', authenticateToken , getloan);
router.post('/make-payment',authenticateToken , makePayment);
router.post('/get-statement',authenticateToken , getStatement);

export default router;