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
const { getTomTomKey, rotateTomTomKey, getKeyCount } = require('../utils/tomtomKeyManager');

const TOMTOM_BASE_URL = 'https://api.tomtom.com/search/2';

/**
 * searchAlongRoute
 */
const searchAlongRoute = async (query, routePoints, options = {}) => {
  if (!query || !routePoints || routePoints.length < 2) return [];

  const maxAttempts = getKeyCount() || 1;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const url = `${TOMTOM_BASE_URL}/searchAlongRoute/${encodeURIComponent(query)}.json`;
      const key = getTomTomKey();
      
      const body = {
        route: {
          points: routePoints.map(p => ({ lat: p.lat, lon: p.lon }))
        }
      };

      const response = await axios.post(url, body, {
        params: {
          key,
          limit: options.limit || 20,
          maxDetourTime: options.maxDetourTime || 600,
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
      attempts++;
      if ((error.response?.status === 403 || error.response?.status === 429) && attempts < maxAttempts) {
        logger.warn("TomTom SAR Quota Exceeded. Rotating key...");
        rotateTomTomKey();
      } else {
        logger.error(`TomTom SAR Error for ${query}:`, error);
        return [];
      }
    }
  }
  return [];
};

module.exports = { searchAlongRoute };

module.exports = { searchAlongRoute };
