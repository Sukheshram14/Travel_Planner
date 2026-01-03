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
    const originCoords = req.body.origin ? await geoService.getCoordinates(req.body.origin) : null;
    const destCoords = await geoService.getCoordinates(destination);

    // 🌟 2B. Routing: Get the Driving Path (If origin exists)
    let initialRoute = null;
    if (originCoords && destCoords) {
      console.log(`🛣️ Calculating Initial Route: ${originCoords.formatted} -> ${destCoords.formatted}`);
      initialRoute = await routingService.getRoute(originCoords, destCoords);
    }

    // 🌟 2. Weather & Real Places (Parallel for Speed)
    // FIX: Pass lat,lng to weather API for 100% accuracy (avoids 400 errors for vague names)
    const [weatherData, realPlaces] = await Promise.all([
      weatherService.getForecast(`${destCoords.lat},${destCoords.lng}`),
      geoService.getTouristPlaces(destCoords.lat, destCoords.lng)
    ]);
    console.log(`✅ Found ${realPlaces.length} real places.`);

    // 3. Call the AI Service (The "Brain") with Real Data Context
    const aiResponse = await generateItinerary({
      origin: req.body.origin,
      destination: destCoords ? destCoords.formatted : destination,
      days,
      budget,
      travelers,
      interests,
      realPlaces // <--- PASSING REAL DATA TO AI
    });

    // Attach our Real Data to the AI response
    aiResponse.route = initialRoute; 
    aiResponse.weather = weatherData;
    if (originCoords) aiResponse.originLocation = originCoords;
    if (destCoords) aiResponse.destinationLocation = destCoords;

    // 🌟 4. Hydration (Updated for RAG & High-Accuracy Search)
    const officialDestName = destCoords ? destCoords.formatted : destination;
    console.log(`🗺️ Hydrating Itinerary Locations for ${officialDestName}...`);
    
    for (const day of aiResponse.days) {
      console.log(`--- Day ${day.dayNumber}: ${day.theme} ---`);
      let activityOrder = 1;
      for (const activity of day.activities) {
        // Tag activity with its position
        activity.dayNumber = day.dayNumber;
        activity.orderInDay = activityOrder++;
        
        // Strategy A: Check if it's one of our Pre-fetched Real Places (Best Quality)
        // 💡 Better Matching: Ensure the name match is significant (not just "Arrival")
        const trustedPlace = realPlaces.find(p => {
            const cleanName = activity.name.toLowerCase();
            const pName = p.name.toLowerCase();
            return (pName === cleanName || (pName.length > 5 && cleanName.includes(pName)));
        });
        
        if (trustedPlace) {
            activity.location = { lat: trustedPlace.lat, lng: trustedPlace.lng, address: trustedPlace.address };
            console.log(`🎯 RAG Hit: Found "${activity.name}" in local verified list.`);
        } else {
            // Strategy B: Fallback to Geocoding Search
            const query = activity.searchQuery || activity.name; 
            console.log(`🔍 Searching: "${query}" (Leashed to ${officialDestName})...`);
            
            const coords = await geoService.getCoordinates(query, destCoords.lat, destCoords.lng);
            
            if (coords) {
              // 💡 Generate Google Maps Deep Link
              const gMapLink = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
              activity.location = { 
                lat: coords.lat, 
                lng: coords.lng, 
                address: coords.formatted,
                gMapLink 
              };
              console.log(`✅ Located: ${coords.formatted}`);
            } else {
              console.warn(`⚠️ Not Found: Could not locate "${query}" within 50km.`);
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
      famousThings: aiResponse.famousThings, // 💡 New Pro Field
      suggestedStay: aiResponse.suggestedStay, // 💡 New Pro Field
      itinerary: aiResponse.days, // Map AI "days" to Schema "days"
      isGenerated: true
    });

    await newTrip.save();
    console.log(`✅ Trip saved with ID: ${newTrip._id}`);

    // 4. Calculate Optimized Full Route (Day-Aware Hybrid)
    // 💡 NEW LOGIC: Calculate Route PER DAY to solve the 'Zigzag' error.
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

      // Every day starts from the Origin (or the last location of previous day)
      // For now, let's assume users start from Origin daily if provided
      if (originCoords) {
        dayCoords.push({ lat: originCoords.lat, lng: originCoords.lng });
      }

      day.activities.forEach(act => {
        if (act.location?.lat && act.location?.lng) {
          dayCoords.push({ lat: act.location.lat, lng: act.location.lng });
        }
      });

      if (dayCoords.length >= 2) {
        // 1. Optimize sequence for THIS day only
        const optimizedDay = routingService.getOptimizedSequence(dayCoords);
        
        // 2. Fetch road path for THIS day
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

    // Combine all day-routes into a FeatureCollection
    const routeGeoJSON = {
      type: 'FeatureCollection',
      features: routeFeatures
    };

    // 5. Send Response
    res.status(201).json({
      status: 'success',
      data: {
        trip: newTrip,
        weather: weatherData,
        routeGeoJSON: routeGeoJSON // 🌟 This provides the optimized Day-Aware path
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

    // Calculate route on the fly for the saved trip
    const routeFeatures = [];
    
    for (let i = 0; i < trip.itinerary.length; i++) {
      const day = trip.itinerary[i];
      const dayCoords = [];

      // Note: For saved trips, we'll focus on the itinerary points 
      // as we don't have the original originCoords stored in the Trip model yet.
      day.activities.forEach(act => {
        if (act.location?.lat && act.location?.lng) {
          dayCoords.push({ lat: act.location.lat, lng: act.location.lng });
        }
      });

      if (dayCoords.length >= 2) {
        const optimizedDay = routingService.getOptimizedSequence(dayCoords);
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

    res.status(200).json({
      status: 'success',
      data: { 
        trip,
        routeGeoJSON
      }
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * getNearbyFuel
 * -------------
 * Endpoint to fetch nearby fuel stations based on map center.
 */
const getNearbyFuel = async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: "Lat/Lng required" });
  }

  try {
    const fuelStations = await geoService.getNearbyFuelStations(lat, lng);
    res.json(fuelStations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createTrip,
  getTrip,
  getNearbyFuel
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
