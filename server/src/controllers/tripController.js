/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH & HIERARCHY
 * ------------------------
 * Path: /server/src/controllers/tripController.js
 * 
 * Purpose:
 * The "Manager". It receives the work order (Request) from the Route,
 * delegates tasks to the AI Service and Database, and reports back the result (Response).
 * 
 * 2. CONCEPTS USED
 * ----------------
 * - **Async/Await**: We are dealing with slow things (AI generation, Database saving). We must "await" them.
 * - **Error Handling (Try/Catch)**: If the AI crashes or DB acts up, we must catch the error and tell the user nicely.
 * 
 * ==========================================================================================================================================================
 */

const geoService = require('../services/geoService');
const geminiService = require('../services/geminiService');
const weatherService = require('../services/weatherService');
const routingService = require('../services/routingService'); // 🚩 Import Routing
const Trip = require('../models/Trip');
const { generateItinerary } = require('../services/geminiService');
const logger = require('../utils/logger'); // 📊 Performance Logger

/**
 * createTrip
 * ----------
 * Purpose: Handles the "Plan my Trip" button click.
 * Flow: 
 * 1. User sends: { destination: "Paris", days: 3, budget: "cheap" }
 * 2. We ask Gemini: "Mke a 3 day Paris itinerary"
 * 3. We save it to MongoDB.
 * 4. We send it back to Frontend.
 */
const createTrip = async (req, res) => {
  const globalLabel = "Full Trip Generation Process";
  logger.start(globalLabel);

  try {
    const { 
      destination, 
      startDate, 
      endDate, 
      budget, 
      travelers, 
      interests,
      travelMode = 'car',
      vehicleType = 'passenger'
    } = req.body;

    const routingOptions = {
        travelMode: req.body.travelMode || 'car',
        vehicleEngineType: req.body.vehicleEngineType || 'combustion',
        // Optional advanced parameters (future proofing)
        vehicleMaxSpeed: req.body.vehicleMaxSpeed,
        vehicleWeight: req.body.vehicleWeight,
        vehicleLength: req.body.vehicleLength,
        vehicleWidth: req.body.vehicleWidth,
        vehicleHeight: req.body.vehicleHeight
    };

    // 1. Calculate Duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // 🌟 2A. Pre-planning
    logger.start("Ph1: Origin/Dest Geocoding");
    const originCoords = req.body.origin ? await geoService.getCoordinates(req.body.origin) : null;
    const destCoords = await geoService.getCoordinates(destination);
    logger.end("Ph1: Origin/Dest Geocoding");

    // 🌟 2B. Routing: Initial Path
    let initialRoute = null;
    if (originCoords && destCoords) {
      logger.start("Ph2: Initial Route Calculation");
      initialRoute = await routingService.getRoute(originCoords, destCoords, routingOptions);
      logger.end("Ph2: Initial Route Calculation");
    }

    // 🌟 2. Weather & Real Places (Parallel for Speed)
    logger.start("Ph3: Weather & RAG Context Discovery");
    const [weatherData, realPlaces] = await Promise.all([
      weatherService.getForecast(`${destCoords.lat},${destCoords.lng}`),
      geoService.getTouristPlaces(destCoords.lat, destCoords.lng)
    ]);
    logger.end("Ph3: Weather & RAG Context Discovery");

    // 3. Call the AI Service (The "Brain") with Real Data Context
    logger.start("Ph4: Gemini AI Generation");
    const aiResponse = await generateItinerary({
      origin: req.body.origin,
      destination: destCoords ? destCoords.formatted : destination,
      days,
      budget,
      travelers,
      interests,
      realPlaces // <--- PASSING REAL DATA TO AI
    });
    logger.end("Ph4: Gemini AI Generation");

    // Attach our Real Data to the AI response
    aiResponse.route = initialRoute; 
    aiResponse.weather = weatherData;
    if (originCoords) aiResponse.originLocation = originCoords;
    if (destCoords) aiResponse.destinationLocation = destCoords;

    // 🌟 4. Hydration (Updated for RAG & High-Accuracy Search)
    logger.start("Ph5: Itinerary Hydration (Geocoding Activities)");
    const officialDestName = destCoords ? destCoords.formatted : destination;
    
    for (const day of aiResponse.days) {
      let activityOrder = 1;
      for (const activity of day.activities) {
        // Tag activity with its position
        activity.dayNumber = day.dayNumber;
        activity.orderInDay = activityOrder++;
        
        // Strategy A: Check if it's one of our Pre-fetched Real Places (Best Quality)
        const trustedPlace = realPlaces.find(p => {
            const cleanName = activity.name.toLowerCase();
            const pName = p.name.toLowerCase();
            return (pName === cleanName || (pName.length > 5 && cleanName.includes(pName)));
        });
        
        if (trustedPlace) {
            activity.location = { lat: trustedPlace.lat, lng: trustedPlace.lng, address: trustedPlace.address };
        } else {
            // Strategy B: Fallback to Geocoding Search
            const query = (activity.searchQuery || activity.name || "").trim(); 
            const genericTerms = ["departure", "arrival", "check-in", "check-out", "leisure", "relaxation", "rest", "shopping", "lunch", "dinner", "breakfast"];
            const isGeneric = genericTerms.some(term => query.toLowerCase().includes(term));

            if (isGeneric || query.length < 3) {
              logger.info(`⏩ Skipping geocoding for generic activity: "${query}"`);
              // Use destination center for generic activities if no better option
              activity.location = { lat: destCoords.lat, lng: destCoords.lng, address: "Local Area" };
            } else {
              const coords = await geoService.getCoordinates(query, destCoords.lat, destCoords.lng);
              if (coords) {
                activity.location = { lat: coords.lat, lng: coords.lng, address: coords.formatted };
              }
            }
        }
      }
    }
    logger.end("Ph5: Itinerary Hydration (Geocoding Activities)");

    // 3. Save to Database (The "Memory")
    logger.start("Ph6: Database Save");
    const newTrip = new Trip({
      origin: req.body.origin || null, // [NEW] Save origin for route visualization
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      itinerary: aiResponse.days, // Map AI "days" to Schema "days"
      isGenerated: true,
      user: req.user ? req.user._id : null // [NEW] Attach User ID if logged in
    });

    await newTrip.save();
    logger.end("Ph6: Database Save");

    // 4. Calculate Optimized Full Route (Day-Aware Hybrid)
    logger.start("Ph7: Advanced Road Path Calculation (ORS)");
    const routeFeatures = [];

    // Add Initial Travel Route (if exists)
    if (initialRoute) {
      routeFeatures.push({
        type: 'Feature',
        properties: { day: 0, color: '#ffffff' }, // Neutral White for travel to destination
        geometry: initialRoute
      });
    }
    
    for (let i = 0; i < newTrip.itinerary.length; i++) {
        const day = newTrip.itinerary[i];
        const dayCoords = [];
        
        // 🚩 CRITICAL FIX: Do NOT add origin to daily routes
        // Each day should only show routes WITHIN the destination city
        // The initial travel route (origin → destination) is already shown as Day 0 (white route)
        
        day.activities.forEach(act => {
            if (act.location?.lat && act.location?.lng) {
                dayCoords.push({ lat: act.location.lat, lng: act.location.lng });
            }
        });

        if (dayCoords.length >= 2) {
            logger.start(`Ph7.1: TomTom Optimization (Day ${i + 1})`);
            const optimizedDay = await routingService.getOptimizedSequence(dayCoords);
            logger.end(`Ph7.1: TomTom Optimization (Day ${i + 1})`);
            
            const dayGeometry = await routingService.getFullRoute(optimizedDay, routingOptions);
            if (dayGeometry) {
                const dayColors = ['#00f7ff', '#ff00ff', '#00ff00', '#ffff00', '#ff8000', '#ff0000', '#8000ff'];
                routeFeatures.push({
                    type: 'Feature',
                    properties: { day: i + 1, color: dayColors[i % dayColors.length] },
                    geometry: dayGeometry
                });
            }
        }
    }

    const routeGeoJSON = {
      type: 'FeatureCollection',
      features: routeFeatures
    };
    logger.end("Ph7: Advanced Road Path Calculation (ORS)");

    logger.end(globalLabel);

    res.status(201).json({
      status: 'success',
      data: {
        trip: newTrip,
        weather: weatherData,
        routeGeoJSON: routeGeoJSON
      }
    });

  } catch (error) {
    logger.error("createTrip Global Catch", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Something went wrong while planning your trip.'
    });
  }
};

/**
 * getTrip
 * -------
 * Purpose: Retrieve a saved trip by ID.
 * Used when: User refreshes the page or clicks a "My Trips" link.
 */
const getTrip = async (req, res) => {
  const globalLabel = `Retrieve Trip: ${req.params.id}`;
  logger.start(globalLabel);

  try {
    const { id } = req.params;
    const trip = await Trip.findById(id);

    if (!trip) {
      logger.end(globalLabel);
      return res.status(404).json({ status: 'fail', message: 'Trip not found' });
    }

    // Calculate route on the fly for the saved trip
    logger.start("Saved Trip: Advanced Road Path Calculation");
    const routeFeatures = [];
    
    // [NEW] Add Initial Travel Route (Origin → Destination) if origin exists
    if (trip.origin && trip.destination) {
      try {
        logger.start("Saved Trip: Initial Route (Origin → Destination)");
        const originCoords = await geoService.getCoordinates(trip.origin);
        const destCoords = await geoService.getCoordinates(trip.destination);
        
        if (originCoords && destCoords) {
          const initialRoute = await routingService.getRoute(originCoords, destCoords);
          if (initialRoute) {
            routeFeatures.push({
              type: 'Feature',
              properties: { day: 0, color: '#ffffff' }, // White for travel route
              geometry: initialRoute
            });
          }
        }
        logger.end("Saved Trip: Initial Route (Origin → Destination)");
      } catch (err) {
        logger.error("Failed to generate initial route", err);
      }
    }
    
    // Daily routes within destination
    for (let i = 0; i < trip.itinerary.length; i++) {
      const day = trip.itinerary[i];
      const dayCoords = [];

      day.activities.forEach(act => {
        if (act.location?.lat && act.location?.lng) {
          dayCoords.push({ lat: act.location.lat, lng: act.location.lng });
        }
      });

      if (dayCoords.length >= 2) {
        logger.start(`Saved Trip: TomTom Optimization (Day ${i + 1})`);
        const optimizedDay = await routingService.getOptimizedSequence(dayCoords);
        logger.end(`Saved Trip: TomTom Optimization (Day ${i + 1})`);
        
        const dayGeometry = await routingService.getFullRoute(optimizedDay);
        
        if (dayGeometry) {
          const dayColors = ['#00f7ff', '#ff00ff', '#00ff00', '#ffff00', '#ff8000', '#ff0000', '#8000ff'];
          routeFeatures.push({
            type: 'Feature',
            properties: { 
                day: i + 1,
                color: dayColors[i % dayColors.length]
            },
            geometry: dayGeometry
          });
        }
      }
    }

    const routeGeoJSON = {
      type: 'FeatureCollection',
      features: routeFeatures
    };
    logger.end("Saved Trip: Advanced Road Path Calculation");

    logger.end(globalLabel);

    res.status(200).json({
      status: 'success',
      data: { 
        trip,
        routeGeoJSON
      }
    });

  } catch (error) {
    logger.error("getTrip Global Catch", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * getMyTrips
 * ----------
 * Purpose: Retrieve all trips for the authenticated user.
 */
const getMyTrips = async (req, res) => {
    try {
        // req.user is attached by authMiddleware
        const trips = await Trip.find({ user: req.user._id }).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: trips.length,
            data: trips
        });
    } catch (error) {
        logger.error("getMyTrips Error", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch your trips' });
    }
};

/**
 * deleteTrip
 * ----------
 * Purpose: Delete a specific trip (if owned by user).
 */
const deleteTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({ status: 'fail', message: 'Trip not found' });
        }

        // Check ownership
        // Note: trip.user is an ObjectId, req.user._id is an ObjectId.
        // We use .equals() or convert to string for comparison.
        if (trip.user && !trip.user.equals(req.user._id)) {
            return res.status(403).json({ 
                status: 'fail', 
                message: 'You do not have permission to delete this trip' 
            });
        }

        await Trip.findByIdAndDelete(req.params.id);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        logger.error("deleteTrip Error", error);
        res.status(500).json({ status: 'error', message: 'Failed to delete trip' });
    }
};

module.exports = {
  createTrip,
  getTrip,
  getMyTrips, // [NEW]
  deleteTrip  // [NEW]
};

/**
 * ==========================================================================================================================================================
 * 🎓 KNOWLEDGE PROGRESS MARKERS
 * ==========================================================================================================================================================
 * 
 * What You Learned:
 * 1. **Controller Pattern**: It coordinates everything. A good controller is "thin" (doesn't contain heavy logic, delegates it to services).
 * 2. **Status Codes**: 
 *    - 201: Created (Success!)
 *    - 404: Not Found (User error)
 *    - 500: Server Error (Our fault)
 * 
 * 🚀 Try It Yourself:
 * Add a function `deleteTrip` that deletes a trip from the database using `Trip.findByIdAndDelete(id)`.
 * ==========================================================================================================================================================
 */
