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
const { getTomTomKey, rotateTomTomKey, getKeyCount } = require('../utils/tomtomKeyManager');

const TOMTOM_BASE_URL = 'https://api.tomtom.com/routing/matrix/2';

/**
 * calculateMatrix
 */
const calculateMatrix = async (origins, destinations) => {
  if (!origins || origins.length === 0 || !destinations || destinations.length === 0) return null;

  const maxAttempts = getKeyCount() || 1;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const key = getTomTomKey();
      const url = `${TOMTOM_BASE_URL}?key=${key}`;
      
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
        return response.data.data;
      }
      return null;
    } catch (error) {
      attempts++;
      if ((error.response?.status === 403 || error.response?.status === 429) && attempts < maxAttempts) {
        logger.warn("TomTom Matrix Quota Exceeded. Rotating key...");
        rotateTomTomKey();
      } else {
        if (error.response) {
          logger.error(`TomTom Matrix API Error (${error.response.status}):`, error.response.data);
        } else {
          logger.error("TomTom Matrix Routing Error", error);
        }
        return null;
      }
    }
  }
  return null;
};

module.exports = { calculateMatrix };

module.exports = { calculateMatrix };
