/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH & HIERARCHY
 * ------------------------
 * Path: /server/src/app.js
 * 
 * Why here?
 * This file resides in `src` (Source) because it contains the core logic of the application, separated from configuration per se.
 * It is the "Application Factory" – distinct from `server.js` (which starts the network server).
 * 
 * Fits into MERN:
 * - Express (The 'E' in MERN): This IS the Express application.
 * - Central Hub: It connects Middleware (Security, JSON parsing) -> Routes (API) -> Database (Connection).
 * 
 * 2. PURPOSE & RESPONSIBILITIES
 * -----------------------------
 * Mission: To initialize the Express app, configure global middleware, and define the primary API routes.
 * 
 * 💡 Real-World Analogy: The "Hotel Front Desk".
 * - It doesn't cook the food (Controller) or Change the sheets (Database).
 * - But EVERY guest (Request) must check in here first.
 * - It checks IDs (Middleware), asks where they want to go (Routing), and points them to the elevator.
 * 
 * 3. CONCEPTS & TECHNOLOGY
 * ------------------------
 * - **Express.js**: A minimal framework for Node.js. Without it, handling HTTP requests is verbose and hard.
 * - **Middleware**: Functions that run "in the middle" of the request-response cycle. (e.g., Parsing the JSON body of a request).
 * - **CORS (Cross-Origin Resource Sharing)**: A security rule. Browsers block React (Port 5173) from talking to Node (Port 5000) by default. CORS allows it.
 * 
 * ==========================================================================================================================================================
 */

// 1. Import Dependencies
// ----------------------
// 'express': The framework creating our server.
const express = require('express');
// 'cors': Middleware to allow our React Frontend to talk to this Backend.
const cors = require('cors');

// 2. Class/Function Definitions
// -----------------------------

/**
 * createApplication()
 * -------------------
 * Purpose: Encapsulates the app creation logic. This makes testing easier (we can create multiple test apps).
 * Returns: Configured Express Application.
 */
const createApplication = () => {
  // Initialize the app
  const app = express(); // 🏗️ This creates the actual "server" object.

  // 3. Middlewares (The Gatekeepers)
  // --------------------------------
  // These run on EVERY request before it hits the routes.

  // Teach: "What is express.json()?"
  // When User sends data (e.g., POST /login), it comes as a raw stream of 0s and 1s.
  // This middleware collects that stream and turns it into a JavaScript Object accessible via `req.body`.
  app.use(express.json());

  // Teach: "What is CORS?"
  // In production, we restrict this to our specific frontend domain.
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL // Will be added in Render/Railway dashboard
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));

  // 4. Routes (The Signs)
  // ---------------------
  
  // Health Check Endpoint
  app.get('/', (req, res) => {
    res.status(200).json({ 
      status: 'success',
      message: '🌍 Intelligent Travel Platform API is Online',
      timestamp: new Date().toISOString()
    });
  });

  // Mount Feature Routes
  const tripRoutes = require('./routes/tripRoutes');
  // [NEW] Authentication Routes
  const authRoutes = require('./routes/authRoutes');
  
  app.use('/api/v1/trips', tripRoutes);
  app.use('/api/v1/users', authRoutes); // Auth base: /api/v1/users/signup

  return app;
};

/**
 * ==========================================================================================================================================================
 * 🎓 KNOWLEDGE PROGRESS MARKERS
 * ==========================================================================================================================================================
 * 
 * What You Learned:
 * 1. **Separation of Concerns**: We separated `app.js` (Logic) from `server.js` (Execution/Port Listening).
 * 2. **Middleware Order**: Middleware like `express.json` MUST come before routes, otherwise the routes won't understand the request body.
 * 3. **API Standards**: Even the root route `/` returns JSON, not plain text. APIs should speak one language: JSON.
 * 
 * 🚀 Try It Yourself:
 * 1. Add a new route `app.get('/hello', ...)` that returns your name.
 * 2. Try removing `app.use(cors())` and see your Console Log errors when the Frontend tries to fetch data.
 * ==========================================================================================================================================================
 */

module.exports = createApplication;
