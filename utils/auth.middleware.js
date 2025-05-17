import jwt from 'jsonwebtoken';
import { createError } from './response.util.js';
import db from '../database/index.js';

const authenticateToken = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    
    if (!token) {
      return next(createError('Authentication required', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1 AND is_closed = false', [decoded.id]);
    
    if (rows.length === 0) {
      return next(createError('User not found or inactive', 401));
    }

    const user = rows[0];
    delete user.password;
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(createError('Invalid or expired token', 401));
    }
    next(error);
  }
};


export { authenticateToken}; 