const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

// Protect routes - Verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      error: error.message,
    });
  }
};

// Restrict to admin
const admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'This route is restricted to admin only',
    });
  }
  next();
};

// Restrict to authenticated user only (not admin)
const userOnly = (req, res, next) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admins cannot perform this action',
    });
  }
  next();
};

// Verify user owns the task or is admin
const verifyTaskOwnership = (req, res, next) => {
  // This will be used in task routes to verify ownership
  next();
};

module.exports = {
  protect,
  admin,
  userOnly,
  verifyTaskOwnership,
};
