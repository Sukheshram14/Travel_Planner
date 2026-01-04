/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH: /server/src/controllers/authController.js
 * 
 * Purpose:
 * Handles User Registration (Signup) and Authentication (Login).
 * Issues JWTs (JSON Web Tokens) so the frontend can "remember" the user.
 * 
 * 2. CONCEPTS USED
 * ----------------
 * - **JWT (JSON Web Token)**: A digital passport.
 *   - Server signs it with a SECRET.
 *   - Client sends it with every request.
 *   - Server verifies signature to know who you are.
 * - **Stateless Auth**: The server doesn't store sessions. The token contains the info.
 * 
 * ==========================================================================================================================================================
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// 🔐 HELPER: Generate JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'dev-secret-do-not-use-prod', {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d'
  });
};

// 🔐 HELPER: Send Token Response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token, // 🎟️ The Ticket
    data: {
      user
    }
  });
};

/**
 * GOOGLE LOGIN (Find or Create)
 * Route: POST /api/v1/auth/google-login
 */
exports.googleLogin = async (req, res) => {
  try {
    const { email, name, googleId, avatar } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'fail', message: 'Email is required' });
    }

    // 1. Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // 2. If not, create new user (Passwordless for Google Users)
      // We set a random password because our Schema requires one (for now)
      // Strategy: User won't know this password, they only login via Google.
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      // Fix for duplicate username index error: Generate a unique username
      const baseName = email.split('@')[0];
      const uniqueUsername = `${baseName}_${Date.now()}`;
      
      user = await User.create({
        name: name || 'Traveler',
        email: email,
        password: randomPassword,
        username: uniqueUsername
        // We could store googleId in schema if we update User model
        // googleId: googleId,
        // avatar: avatar
      });
      
      logger.info(`👤 New Google User Created: ${email} (${uniqueUsername})`);
    } else {
       logger.info(`🔍 Google User Found: ${email}`);
    }

    // 3. Create Session Token
    createSendToken(user, 200, res);

  } catch (error) {
    logger.error("Google Login Error", error);
    res.status(500).json({ status: 'error', message: 'Google Auth Failed' });
  }
};

/**
 * 1. SIGNUP (Legacy / Backup)
 * Route: POST /api/v1/auth/signup
 */
exports.signup = async (req, res) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    });

    logger.info(`👤 New User Created: ${newUser.email}`);
    createSendToken(newUser, 201, res);

  } catch (error) {
    logger.error("Signup Error", error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Error creating user'
    });
  }
};

/**
 * 2. LOGIN
 * Route: POST /api/v1/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide email and password' });
    }

    // 2. Check if user exists & password is correct
    const user = await User.findOne({ email }).select('+password'); // Explicitly include password

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ status: 'fail', message: 'Incorrect email or password' });
    }

    // 3. If everything ok, send token
    logger.info(`🔓 User Logged In: ${user.email}`);
    createSendToken(user, 200, res);

  } catch (error) {
    logger.error("Login Error", error);
    res.status(500).json({ status: 'error', message: 'Something went wrong' });
  }
};
