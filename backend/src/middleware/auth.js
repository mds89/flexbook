import jwt from 'jsonwebtoken';
import { query } from '../db/connection.js';

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'No token provided'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const userResult = await query(
      'SELECT id, name, email, role, concessions, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found'
      });
    }
    
    const user = userResult.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account disabled',
        message: 'Your account has been disabled'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please log in again'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }
    
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Token verification failed'
    });
  }
};

// Middleware to require admin role
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in first'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access forbidden',
      message: 'Admin access required'
    });
  }
  
  next();
};

// Middleware to require user role (not admin)
export const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in first'
    });
  }
  
  if (req.user.role !== 'user') {
    return res.status(403).json({
      error: 'Access forbidden',
      message: 'User access required'
    });
  }
  
  next();
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userResult = await query(
      'SELECT id, name, email, role, concessions, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
      req.user = userResult.rows[0];
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }
  
  next();
};