const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * 🛡️ PROTECT MIDDLEWARE
 * Verifies JWT token and attaches user to request.
 */
exports.protect = async (req, res, next) => {
  try {
    // 1. Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        status: 'fail', 
        message: 'You are not logged in! Please log in to get access.' 
      });
    }

    // 2. Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET || 'dev-secret-do-not-use-prod');

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer does exist.'
      });
    }

    // 4. Grant Access
    req.user = currentUser;
    next();

  } catch (error) {
    logger.error("Auth Middleware Error", error);
    return res.status(401).json({ status: 'fail', message: 'Invalid Token' });
  }
};
