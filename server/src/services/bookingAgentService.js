/**
 * bookingAgentService.js
 * ----------------------
 * Real Hotel Search + AI Enhancement Service
 * Uses TomTom API for real hotel data, Gemini AI for pricing/amenities
 */

const { GoogleGenAI } = require('@google/genai');
const tomtomSearchService = require('./tomtomSearchService');
const geoService = require('./geoService');

// Initialize Gemini AI
const ai = new GoogleGenAI({});

/**
 * getRealHotelsFromTomTom()
 * Fetch real hotel POIs from TomTom Search API
 */
const getRealHotelsFromTomTom = async (destination, limit = 10) => {
  try {
    // First, geocode the destination to get coordinates
    const geocodeResult = await geoService.getCoordinates(destination);
    
    if (!geocodeResult || !geocodeResult.lat || !geocodeResult.lng) {
      console.log(`⚠️ Could not geocode ${destination}, using fallback`);
      return [];
    }

    const { lat, lng } = geocodeResult;
    console.log(`📍 Searching hotels near ${destination} (${lat}, ${lng})`);

    // Search for hotels using TomTom POI search
    const hotels = await tomtomSearchService.searchPOI(
      'hotel',
      lat,
      lng,
      { 
        radius: 15000, // 15km radius
        limit,
        categorySet: tomtomSearchService.POI_CATEGORIES.HOTEL
      }
    );

    console.log(`🏨 Found ${hotels.length} real hotels from TomTom`);
    return hotels;
  } catch (error) {
    console.error('❌ TomTom hotel search failed:', error.message);
    return [];
  }
};

/**
 * enhanceHotelsWithAI()
 * Use Gemini AI to add pricing, ratings, amenities to real hotel data
 */
const enhanceHotelsWithAI = async (realHotels, budgetTotal, days) => {
  if (!realHotels || realHotels.length === 0) {
    return getFallbackHotels('Unknown', budgetTotal, days);
  }

  try {
    const budgetPerNight = Math.floor(budgetTotal / days);
    
    // Prepare hotel list for AI
    const hotelList = realHotels.map((h, idx) => 
      `${idx + 1}. ${h.name} - ${h.address} (Lat: ${h.lat}, Lon: ${h.lng})`
    ).join('\n');

    const prompt = `
You are a hotel booking expert. I have these REAL hotels from TomTom API:

${hotelList}

TASK: Enhance these hotels with realistic booking data and select the TOP 5 best options.

CONSTRAINTS:
- Budget per night: ₹${budgetPerNight} (Total: ₹${budgetTotal} for ${days} days)
- Provide varied pricing: 2 budget (50-70%), 2 mid-range (70-90%), 1 premium (90-100%)
- Use EXACT names and coordinates from the list above
- Add realistic amenities based on hotel name/location

OUTPUT FORMAT (JSON only, no markdown):
{
  "hotels": [
    {
      "id": "h1",
      "name": "EXACT name from list above",
      "pricePerNight": number,
      "rating": 4.5,
      "amenities": ["Free WiFi", "Swimming Pool", "Restaurant"],
      "address": "EXACT address from list above",
      "coordinates": {"lat": number, "lon": number},
      "description": "Brief 1-2 sentence description",
      "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
    }
  ]
}

Return exactly 5 hotels. Use realistic Indian hotel pricing.
`;

    console.log(`🤖 [AI] Enhancing ${realHotels.length} real hotels with pricing/amenities...`);
    const startTime = Date.now();

    const result = await ai.generateContent({
      model: 'gemini-2.0-flash-exp',
      prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      }
    });

    const response = result.text || '';
    const data = JSON.parse(response);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ [AI] Enhanced ${data.hotels.length} hotels in ${duration}s`);

    return data.hotels;
  } catch (error) {
    console.error('❌ [AI] Hotel enhancement failed:', error.message);
    // Fallback: manually enhance the real hotels
    return manuallyEnhanceHotels(realHotels, budgetTotal, days);
  }
};

/**
 * manuallyEnhanceHotels()
 * Fallback if AI fails - add basic pricing/amenities to real hotels
 */
const manuallyEnhanceHotels = (realHotels, budgetTotal, days) => {
  const budgetPerNight = Math.floor(budgetTotal / days);
  const priceMultipliers = [0.5, 0.65, 0.75, 0.85, 0.95];
  
  return realHotels.slice(0, 5).map((hotel, idx) => ({
    id: `h${idx + 1}`,
    name: hotel.name,
    pricePerNight: Math.floor(budgetPerNight * priceMultipliers[idx]),
    rating: 3.5 + (Math.random() * 1.5),
    amenities: ['Free WiFi', 'AC', 'Restaurant', 'Room Service'].slice(0, 2 + idx),
    address: hotel.address,
    coordinates: { lat: hotel.lat, lon: hotel.lng },
    description: `Comfortable accommodation in ${hotel.name}`,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
  }));
};

/**
 * getFallbackHotels()
 * Complete fallback if both TomTom and AI fail
 */
const getFallbackHotels = (destination, budgetTotal, days) => {
  const budgetPerNight = Math.floor(budgetTotal / days);
  
  return [
    {
      id: 'h1',
      name: `${destination} Grand Hotel`,
      rating: 4.5,
      pricePerNight: Math.floor(budgetPerNight * 0.9),
      amenities: ["Free WiFi", "Pool", "Spa", "Restaurant"],
      description: "Luxury hotel with modern amenities and excellent service.",
      address: `Main Street, ${destination}`,
      coordinates: { lat: 13.0827, lon: 80.2707 },
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 'h2',
      name: `${destination} Comfort Inn`,
      rating: 4.0,
      pricePerNight: Math.floor(budgetPerNight * 0.7),
      amenities: ["Free WiFi", "Breakfast", "Parking"],
      description: "Comfortable mid-range hotel perfect for families.",
      address: `Station Road, ${destination}`,
      coordinates: { lat: 13.0830, lon: 80.2710 },
      image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 'h3',
      name: `${destination} Budget Stay`,
      rating: 3.5,
      pricePerNight: Math.floor(budgetPerNight * 0.5),
      amenities: ["WiFi", "AC", "24/7 Reception"],
      description: "Affordable option with essential amenities.",
      address: `Market Area, ${destination}`,
      coordinates: { lat: 13.0825, lon: 80.2705 },
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
    }
  ];
};

/**
 * getMockHotels()
 * Main entry point - combines TomTom real data + AI enhancement
 */
const getMockHotels = async (destination, budgetTotal, days = 3) => {
  console.log(`\n🏨 === Hotel Search Started for ${destination} ===`);
  
  // Step 1: Get real hotels from TomTom
  const realHotels = await getRealHotelsFromTomTom(destination, 10);
  
  // Step 2: Enhance with AI (pricing, ratings, amenities)
  const enhancedHotels = await enhanceHotelsWithAI(realHotels, budgetTotal, days);
  
  console.log(`✅ Returning ${enhancedHotels.length} enhanced hotels\n`);
  return enhancedHotels;
};

/**
 * processBooking()
 * Simulates a booking transaction (kept for backward compatibility)
 */
const processBooking = async (hotelId, userId, guestDetails = {}) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    bookingId: `BK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    confirmationCode: `CONF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    status: 'Confirmed',
    hotelId,
    userId,
    guestDetails,
    timestamp: new Date().toISOString()
  };
};

module.exports = { 
  getMockHotels, 
  processBooking,
  getRealHotelsFromTomTom,
  enhanceHotelsWithAI
};
