/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH & HIERARCHY
 * ------------------------
 * Path: /server/src/server.js
 * 
 * Purpose:
 * The Entry Point. This is the file you actually run (node server.js).
 * It is responsible for "Spinning up" the machine.
 * 
 * 2. CONCEPTS USED
 * ----------------
 * - **Environment Variables (.env)**: Secrets (API Keys, Passwords) that should NEVER be in code.
 * - **Port Listening**: Binding the application to a specific "door" (port) on your computer so it can receive traffic.
 * 
 * ==========================================================================================================================================================
 */

// Load Environment Variables FIRST
require('dotenv').config(); // This loads .env from the root of the running process (e.g., /server)

const createApplication = require('./app');
const mongoose = require('mongoose');

// Constants
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Initialize App
const app = createApplication();

// 🚀 Database Connection & Server Start
// -------------------------------------
// We use an Async function (IIFE) to ensure DB connects BEFORE server accepts traffic.
// Concept: "Fail Fast". If DB is broken, don't even start the server.

const startServer = async () => {
  try {
    // 1. Connect to MongoDB (The Memory)
    if (!MONGODB_URI) {
      throw new Error("❌ MONGODB_URI is missing in .env file");
    }
    
    // Teach: Mongoose connects to our Atlas Cloud Database.
    await mongoose.connect(MONGODB_URI);

    console.log('✅ MongoDB Connected Successfully');

    // 2. Start the Network Listener
    app.listen(PORT, () => {
      console.log(`
      🚀 Server is running!
      📡 Listening on: http://localhost:${PORT}
      -----------------------------------------
      See the Health Check: http://localhost:${PORT}/
      `);
    });

  } catch (error) {
    console.error('❌ Server Startup Failed:', error.message);
    process.exit(1); // Exit with error code 1 (Standard for "Crash")
  }
};

startServer();

/**
 * ==========================================================================================================================================================
 * 🎓 KNOWLEDGE PROGRESS MARKERS
 * ==========================================================================================================================================================
 * 
 * What You Learned:
 * 1. **Dotenv**: `require('dotenv').config()` must be at the very top.
 * 2. **Process.env**: How Node.js accesses system variables.
 * 3. **Async Startup**: Always wait for Database connection before `app.listen`.
 * 
 * 🚀 Try It Yourself:
 * Change the `PORT` in your .env file to 8080 and restart the server.
 * ==========================================================================================================================================================
 */
