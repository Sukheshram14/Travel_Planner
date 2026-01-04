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
const authMiddleware = require('../middleware/authMiddleware'); // [NEW]
const tomtomReverseGeocodingService = require('../services/tomtomReverseGeocodingService');
const tomtomSearchService = require('../services/tomtomSearchService');
const tomtomSearchAlongRouteService = require('../services/tomtomSearchAlongRouteService');

// Define Routes
// -------------

// 1. Create a Trip
// Route: POST http://localhost:5000/api/v1/trips
router.post('/', authMiddleware.protect, tripController.createTrip);

// 2. Get My Trips (PROTECTED)
// ⚠️ IMPORTANT: This MUST come before /:id, otherwise "my-trips" is treated as an ID.
router.get('/my-trips', authMiddleware.protect, tripController.getMyTrips);

// 3. Reverse Geocode (GPS to Address)
router.post('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ status: 'error', message: 'Latitude and longitude are required' });
    }
    const result = await tomtomReverseGeocodingService.reverseGeocode(lat, lng);
    if (result) {
      res.status(200).json({ status: 'success', data: result });
    } else {
      res.status(404).json({ status: 'error', message: 'Could not determine address from coordinates' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 4. Search POI (Points of Interest)
router.post('/search-poi', async (req, res) => {
  try {
    const { query, lat, lng, radius, limit } = req.body;
    if (!query || !lat || !lng) {
      return res.status(400).json({ status: 'error', message: 'Query, latitude, and longitude are required' });
    }
    const results = await tomtomSearchService.searchPOI(query, lat, lng, { radius, limit });
    res.status(200).json({ status: 'success', count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 5. Search Nearby by Category
router.post('/search-nearby', async (req, res) => {
  try {
    const { category, lat, lng, radius } = req.body;
    if (!category || !lat || !lng) {
      return res.status(400).json({ status: 'error', message: 'Category, latitude, and longitude are required' });
    }
    const results = await tomtomSearchService.searchNearby(category, lat, lng, radius);
    res.status(200).json({ status: 'success', count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 6. Search Along Route
router.post('/search-along-route', async (req, res) => {
  try {
    const { query, routePoints, maxDetourTime } = req.body;
    if (!query || !routePoints) {
      return res.status(400).json({ status: 'error', message: 'Query and route points are required' });
    }
    const results = await tomtomSearchAlongRouteService.searchAlongRoute(query, routePoints, { maxDetourTime });
    res.status(200).json({ status: 'success', count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 7. Get Specific Trip (Dynamic Route)
// ⚠️ This captures anything not matched above (e.g., /abc, /123). Must be LAST.
router.get('/:id', tripController.getTrip);
router.delete('/:id', authMiddleware.protect, tripController.deleteTrip);

module.exports = router;
