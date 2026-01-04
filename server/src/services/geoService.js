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

const tomtomGeocodingService = require('./tomtomGeocodingService');
const tomtomSearchService = require('./tomtomSearchService');
const logger = require('../utils/logger');

/**
 * getCoordinates
 * --------------
 * Uses TomTom Geocoding API to find coordinates for a location.
 * @param {string} locationName 
 * @param {number} proximityLat 
 * @param {number} proximityLng 
 * @returns {Object} 
 */
const getCoordinates = async (locationName, proximityLat = null, proximityLng = null) => {
  if (!locationName) return null;
  
  try {
    // TomTom Geocoding Service handles the API call and normalization
    const result = await tomtomGeocodingService.geocode(locationName, {
      limit: 1,
      countrySet: 'IN',
      lat: proximityLat,
      lon: proximityLng
    });

    if (result) {
      return {
        lat: result.lat,
        lng: result.lng,
        formatted: result.formatted
      };
    }
    return null;
  } catch (error) {
    logger.error(`TomTom Geocoding Error for ${locationName}:`, error);
    return null;
  }
};

/**
 * getTouristPlaces (RAG Feature)
 * ------------------------------
 * Uses TomTom Search API to fetch attractions near a location.
 * @param {number} lat 
 * @param {number} lng 
 * @returns {Array} 
 */
const getTouristPlaces = async (lat, lng) => {
  if (!lat || !lng) return [];

  try {
    // Search for "attractions" near the coordinates
    const results = await tomtomSearchService.searchPOI('tourist attractions', lat, lng, {
      radius: 10000, // 10km
      limit: 30
    });

    return results.map(poi => ({
      name: poi.name,
      lat: poi.lat,
      lng: poi.lng,
      address: poi.address,
      category: poi.categoryName || poi.category
    }));
  } catch (error) {
    logger.error("TomTom POI Search Error:", error);
    return [];
  }
};

module.exports = { getCoordinates, getTouristPlaces };
