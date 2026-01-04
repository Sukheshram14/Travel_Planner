/**
 * ==========================================================================================================================================================
 * 📚 TOMTOM MATRIX ROUTING V2 SERVICE
 * ==========================================================================================================================================================
 * 
 * Purpose:
 * Calculate travel times and distances between multiple origins and destinations in a single request.
 * Crucial for optimization algorithms and "Nearest X" searches.
 * 
 * API Documentation:
 * https://developer.tomtom.com/routing-api/documentation/matrix-routing-v2/matrix-routing-service
 * 
 * ==========================================================================================================================================================
 */

const axios = require('axios');
const logger = require('../utils/logger');

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
const TOMTOM_BASE_URL = 'https://api.tomtom.com/routing/matrix/2';

/**
 * calculateMatrix
 * ---------------
 * Calculates a cost matrix (time/distance) between multiple origins and destinations.
 * 
 * @param {Array} origins - Array of { lat, lng }
 * @param {Array} destinations - Array of { lat, lng }
 * @returns {Array} - 2D array of results [originIndex][destinationIndex]
 */
const calculateMatrix = async (origins, destinations) => {
  if (!origins || origins.length === 0 || !destinations || destinations.length === 0) return null;
  if (!TOMTOM_API_KEY) {
    logger.error("TomTom API Key Missing", new Error("TOMTOM_API_KEY not found in .env"));
    return null;
  }

  try {
    const url = `${TOMTOM_BASE_URL}?key=${TOMTOM_API_KEY}`;
    
    const body = {
      origins: origins.map(o => ({ point: { latitude: o.lat, longitude: o.lng } })),
      destinations: destinations.map(d => ({ point: { latitude: d.lat, longitude: d.lng } })),
      options: {
        travelMode: 'car'
      }
    };

    const response = await axios.post(url, body, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.data && response.data.data.length > 0) {
      // TomTom returns a flat array, we might want to keep it flat or structure it
      // For simplicity, we'll return the raw matrix data which contains:
      // data[i].routeSummary { lengthInMeters, travelTimeInSeconds }
      return response.data.data;
    }

    return null;
  } catch (error) {
    if (error.response) {
      logger.error(`TomTom Matrix API Error (${error.response.status}):`, error.response.data);
    } else {
      logger.error("TomTom Matrix Routing Error", error);
    }
    return null;
  }
};

module.exports = { calculateMatrix };
