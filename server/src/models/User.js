/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH & HIERARCHY
 * ------------------------
 * Path: /server/src/models/User.js
 * 
 * Purpose:
 * Defines the "User" entity. It stores login credentials (securely) and profile info.
 * 
 * 2. CONCEPTS USED
 * ----------------
 * - **bcryptjs**: Password Hashing. NEVER store passwords in plain text.
 *   - "password123" -> "$2a$10$wO3..."
 * - **Pre-save Hook**: A function that runs *before* saving to MongoDB. We use it to auto-hash the password.
 * - **Instance Methods**: Helper functions attached to each user object (e.g., checkPassword).
 * 
 * ==========================================================================================================================================================
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please tell us your name'] 
  },
  email: { 
    type: String, 
    required: [true, 'Please provide your email'], 
    unique: true, 
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 
      'Please provide a valid email'
    ]
  },
  username: {
    type: String,
    unique: true,
    sparse: true // Allows multiple nulls if we don't enforce it everywhere, but index seems to exist
  },
  password: { 
    type: String, 
    required: [true, 'Please provide a password'], 
    minlength: 6,
    select: false // 🛡️ SECURITY: Don't return password by default in queries
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

/**
 * 🔒 PASSWORD ENCRYPTION (Middleware)
 * Runs automatically before .save() / .create()
 */
UserSchema.pre('save', async function(next) {
  // Only run if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

/**
 * 🔑 PASSWORD VERIFICATION (Instance Method)
 * Helper to compare candidate password with stored hash
 */
UserSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
