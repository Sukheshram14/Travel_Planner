/**
 * ==========================================================================================================================================================
 * 📚 TOMTOM SEARCH ALONG ROUTE SERVICE
 * ==========================================================================================================================================================
 * 
 * Purpose:
 * Finds POIs (like fuel stations or EV chargers) that are within a certain detour time of a route.
 * 
 * API Documentation:
 * https://developer.tomtom.com/search-api/documentation/search-service/along-route-search
 * 
 * ==========================================================================================================================================================
 */

const axios = require('axios');
const logger = require('../utils/logger');

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
const TOMTOM_BASE_URL = 'https://api.tomtom.com/search/2';

/**
 * searchAlongRoute
 * ----------------
 * @param {string} query - POI name or category (e.g., "fuel", "electric vehicle station")
 * @param {Array} routePoints - Array of { lat, lon } representing the route
 * @param {Object} options - { maxDetourTime, limit }
 * @returns {Array} - Array of POIs found along the route
 */
const searchAlongRoute = async (query, routePoints, options = {}) => {
  if (!query || !routePoints || routePoints.length < 2) return [];
  if (!TOMTOM_API_KEY) {
    logger.error("TomTom API Key Missing", new Error("TOMTOM_API_KEY not found in .env"));
    return [];
  } else {
    logger.info(`🔑 TomTom Key Loaded: ${TOMTOM_API_KEY ? 'YES (Length: ' + TOMTOM_API_KEY.length + ')' : 'NO'}`);
  }

  try {
    // [FIX] Updated to match standard V2 endpoint: /searchAlongRoute
    const url = `${TOMTOM_BASE_URL}/searchAlongRoute/${encodeURIComponent(query)}.json`;
    
    // TomTom route body limit: max 30,000 points. 
    // We should downsample if it's too large, but for standard day routes, it should be fine.
    const body = {
      route: {
        points: routePoints.map(p => ({ lat: p.lat, lon: p.lon }))
      }
    };

    const response = await axios.post(url, body, {
      params: {
        key: TOMTOM_API_KEY,
        limit: options.limit || 20,
        maxDetourTime: options.maxDetourTime || 600, // 10 minutes max detour
      },
      timeout: 10000
    });

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results.map(poi => ({
        name: poi.poi.name,
        lat: poi.position.lat,
        lng: poi.position.lon,
        address: poi.address.freeformAddress,
        detourTime: poi.detourTime,
        category: poi.poi.categories?.[0] || 'POI'
      }));
    }

    return [];
  } catch (error) {
    logger.error(`TomTom SAR Error for ${query}:`, error);
    return [];
  }
};

module.exports = { searchAlongRoute };
