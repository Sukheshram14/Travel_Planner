/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH & HIERARCHY
 * ------------------------
 * Path: /server/src/services/geoService.js
 * 
 * Purpose:
 * The "Navigator". It takes a vague name like "Eiffel Tower" and finds its exact GPS coordinates (Lat/Lng).
 * 
 * 2. API USED
 * -----------
 * - **Geoapify**: A free Geocoding API.
 * 
 * ==========================================================================================================================================================
 */

const axios = require('axios');

const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY;

/**
 * getCoordinates
 * --------------
 * @param {string} locationName - e.g., "Munnar, Kerala"
 * @param {number} proximityLat - [Optional] Bias search near this latitude
 * @param {number} proximityLng - [Optional] Bias search near this longitude
 * @returns {Object} - { lat: 10.08, lng: 77.05, formatted: "Munnar, India" }
 */
const getCoordinates = async (locationName, proximityLat = null, proximityLng = null) => {
  if (!locationName) return null;

  try {
    let url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(locationName)}&apiKey=${GEOAPIFY_KEY}`;
    
    // 💡 FORCE: If we have a destination city, force the search to be within a 50km radius.
    // This physically prevents "Railway Station" from picking one in USA or Africa.
    if (proximityLat && proximityLng) {
      url += `&filter=circle:${proximityLng},${proximityLat},50000`; // 50,000 meters = 50km
      url += `&bias=proximity:${proximityLng},${proximityLat}|countrycode:in`;
    }

    const response = await axios.get(url);

    if (response.data.features && response.data.features.length > 0) {
      const bestMatch = response.data.features[0];
      return {
        lat: bestMatch.properties.lat,
        lng: bestMatch.properties.lon,
        formatted: bestMatch.properties.formatted
      };
    }
    return null; // Not found
  } catch (error) {
    console.error(`❌ Geoapify Error for ${locationName}:`, error.message);
    return null;
  }
};

/**
 * getTouristPlaces (RAG Feature)
 * ------------------------------
 * Fetches REAL tourist attractions near a location.
 * @param {number} lat 
 * @param {number} lng 
 * @returns {Array} - List of places [{name, lat, lng, address}]
 */
const getTouristPlaces = async (lat, lng) => {
  if (!lat || !lng) return [];

  try {
    // Radius: 10km (10000m), Limit: 30 places
    const url = `https://api.geoapify.com/v2/places?categories=tourism&filter=circle:${lng},${lat},10000&limit=30&apiKey=${GEOAPIFY_KEY}`;
    const response = await axios.get(url);

    if (response.data.features) {
      return response.data.features.map(f => ({
        name: f.properties.name || f.properties.formatted, // Fallback if name is empty
        lat: f.properties.lat,
        lng: f.properties.lon,
        address: f.properties.formatted,
        category: f.properties.categories[0] // e.g. "tourism.sights"
      })).filter(p => p.name); // Filter out unnamed places
    }
    return [];
  } catch (error) {
    console.error("❌ Geoapify Places Error:", error.message);
    return [];
  }
};

module.exports = { getCoordinates, getTouristPlaces };
