/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH & HIERARCHY
 * ------------------------
 * Path: /server/src/routes/tripRoutes.js
 * 
 * Purpose:
 * The "Switchboard". It maps URL paths (like /trips) to the specific Controller functions.
 * 
 * 2. CONCEPTS USED
 * ----------------
 * - **Express Router**: A mini-app that only handles routing. Modularizes the code so `app.js` doesn't get huge.
 * - **HTTP Methods**:
 *    - POST: Create (Plan a new trip)
 *    - GET: Read (View a trip)
 * 
 * ==========================================================================================================================================================
 */

const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

// Define Routes
// -------------

// 1. Create a Trip
// Route: POST http://localhost:5000/api/v1/trips
router.post('/', tripController.createTrip);

// 2. Get a Trip
// Route: GET http://localhost:5000/api/v1/trips/:id
// ':id' is a URL parameter (e.g., trips/12345)
router.get('/:id', tripController.getTrip);

module.exports = router;

/**
 * ==========================================================================================================================================================
 * 🎓 KNOWLEDGE PROGRESS MARKERS
 * ==========================================================================================================================================================
 * 
 * What You Learned:
 * 1. **Router Module**: We export the `router` and import it in `app.js`.
 * 2. **RESTful Design**:
 *    - POST /trips -> Create
 *    - GET /trips/:id -> Read specific
 * 
 * 🚀 Try It Yourself:
 * Add a PUT route to update user preferences on an existing trip.
 * ==========================================================================================================================================================
 */
