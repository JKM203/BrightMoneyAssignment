import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../database/index.js';
import { successResponse, createError } from '../utils/response.util.js';

//registration
const register = async (req, res, next) => {
  try {
    const { aadhar_id, name, email, annual_income, password } = req.body;

    if (!aadhar_id || !name || !email || !annual_income || !password) {
      return next(createError('All fields are required: aadhar_id, name, email, annual_income, password', 400));
    }

    const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return next(createError('Email already in use', 400));
    }
    //mail checking

    const aadharCheck = await db.query('SELECT * FROM users WHERE aadhar_id = $1', [aadhar_id]);
    if (aadharCheck.rows.length > 0) {
      return next(createError('Aadhar ID already registered', 400));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let credit_score = 300;
    const income = Number(annual_income);
    if (income >= 1000000) {
      credit_score = 900;
    } else if (income <= 100000) {
      credit_score = 300;
    } else {
      credit_score = 300 + Math.round(((income - 100000) / 15000) * 10);
    }

    const now = new Date();
    const next_billing_date = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const result = await db.query(
      'INSERT INTO users (aadhar_id, name, email, annual_income, password, is_closed, credit_score, next_billing_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, aadhar_id, name, email, annual_income, is_closed, credit_score, next_billing_date',
      [aadhar_id, name, email, annual_income, hashedPassword, false, credit_score, next_billing_date]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const cookieOptions = {
      expires: new Date(
        Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '1') * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    };

    res.cookie('jwt', token, cookieOptions);

    res.status(201).json(successResponse({
      user,
      token
    }, 'User registered successfully', 201));
  } catch (error) {
    next(error);
  }
};


const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return next(createError('Invalid credentials', 401));
    }

    const user = result.rows[0];

    if (user.is_closed){
      return next(createError('Account is inactive', 401));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return next(createError('Invalid credentials', 401));
    }

    delete user.password;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const cookieOptions = {
      expires: new Date(
        Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '1') * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    };

    res.cookie('jwt', token, cookieOptions);

    res.status(200).json(successResponse({
      user,
      token
    }, 'Login successful'));
  } catch (error) {
    next(error);
  }
};


const getProfile = async (req, res, next) => {
  try {
    res.status(200).json(successResponse(req.user, 'User profile retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export { register, login, getProfile }; 