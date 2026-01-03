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

const Trip = require('../models/Trip');
const { generateItinerary } = require('../services/geminiService');

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
  try {
    const { destination, startDate, endDate, budget, travelers, interests } = req.body;

    // 1. Calculate Duration (Logic)
    // We need to know how many days to ask the AI for.
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1; // +1 to include start day

    console.log(`🤖 Generative AI: Planning ${days} days in ${destination}...`);

    // 🌟 2A. Pre-planning: Get Coords for Origin & Destination
    const geoService = require('../services/geoService');
    const originCoords = await geoService.getCoordinates(req.body.origin);
    const destCoords = await geoService.getCoordinates(destination);

    // 🌟 2B. Routing: Get the Driving Path (If origin exists)
    let routeGeoJSON = null;
    if (originCoords && destCoords) {
      const routingService = require('../services/routingService');
      console.log(`🛣️ Calculating Route: ${originCoords.formatted} -> ${destCoords.formatted}`);
      routeGeoJSON = await routingService.getRoute(originCoords, destCoords);
    }

    // 🌟 2C. Weather: Get Forecast for Destination
    const weatherService = require('../services/weatherService');
    const weatherData = await weatherService.getForecast(destination);

    // 🌟 2D. RAG Implementation (Search First Strategy)
    // Instead of letting AI hallucinate, we fetch REAL places first.
    let realPlaces = [];
    if (destCoords) {
      console.log(`🔎 RAG: Fetching real places for ${destCoords.formatted}...`);
      realPlaces = await geoService.getTouristPlaces(destCoords.lat, destCoords.lng);
      console.log(`✅ Found ${realPlaces.length} real places.`);
    }

    // 3. Call the AI Service (The "Brain") with Real Data Context
    const aiResponse = await generateItinerary({
      origin: req.body.origin,
      destination,
      days,
      budget,
      travelers,
      interests,
      realPlaces // <--- PASSING REAL DATA TO AI
    });

    // Attach our Real Data to the AI response
    aiResponse.route = routeGeoJSON; 
    aiResponse.weather = weatherData;
    if (originCoords) aiResponse.originLocation = originCoords;
    if (destCoords) aiResponse.destinationLocation = destCoords;

    // 🌟 4. Hydration (Updated for RAG)
    // The AI might select from our list OR suggest generic things. 
    // We try to match back to our `realPlaces` list first for perfect accuracy.
    console.log("🗺️ Hydrating Itinerary...");
    for (const day of aiResponse.days) {
      for (const activity of day.activities) {
        
        // Strategy A: Check if it's one of our Pre-fetched Real Places
        const trustedPlace = realPlaces.find(p => p.name.includes(activity.name) || activity.name.includes(p.name));
        
        if (trustedPlace) {
           activity.location = { lat: trustedPlace.lat, lng: trustedPlace.lng, address: trustedPlace.address };
           // console.log(`🎯 RAG Hit: ${activity.name}`);
        } else {
           // Strategy B: Fallback to Geocoding Search (Original Logic)
           const query = `${activity.name}, ${destination}`;
           const coords = await geoService.getCoordinates(query);
           if (coords) {
             activity.location = { lat: coords.lat, lng: coords.lng, address: coords.formatted };
           }
        }
      }
    }

    // 3. Save to Database (The "Memory")
    const newTrip = new Trip({
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      itinerary: aiResponse.days, // Map AI "days" to Schema "days"
      isGenerated: true
    });

    await newTrip.save();
    console.log(`✅ Trip saved with ID: ${newTrip._id}`);

    // 4. Send Response
    res.status(201).json({
      status: 'success',
      data: {
        trip: newTrip,
        weather: weatherData // <--- 🌟 FIX: Sending Weather to Frontend
      }
    });

  } catch (error) {
    console.error('❌ Controller Error:', error);
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
  try {
    const { id } = req.params;
    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({ status: 'fail', message: 'Trip not found' });
    }

    res.status(200).json({
      status: 'success',
      data: { trip }
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  createTrip,
  getTrip
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
