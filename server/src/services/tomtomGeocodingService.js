/**
 * ==========================================================================================================================================================
 * 📚 TOMTOM GEOCODING SERVICE
 * ==========================================================================================================================================================
 * 
 * Purpose:
 * Convert addresses/place names to GPS coordinates using TomTom's Geocoding API.
 * Replaces Geoapify for consistent TomTom integration.
 * 
 * API Documentation:
 * https://developer.tomtom.com/search-api/documentation/geocoding-service
 * 
 * ==========================================================================================================================================================
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { getTomTomKey, rotateTomTomKey, getKeyCount } = require('../utils/tomtomKeyManager');

const TOMTOM_BASE_URL = 'https://api.tomtom.com/search/2';

/**
 * geocode
 * -------
 * Converts a place name/address to GPS coordinates.
 */
const geocode = async (query, options = {}) => {
  if (!query) return null;

  const maxAttempts = getKeyCount() || 1;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const url = `${TOMTOM_BASE_URL}/search/${encodeURIComponent(query)}.json`;
      const key = getTomTomKey();
      
      const params = {
        key,
        limit: options.limit || 1,
        countrySet: options.countrySet || 'IN',
        language: 'en-US'
      };

      if (options.lat && options.lon) {
        params.lat = options.lat;
        params.lon = options.lon;
        params.radius = options.radius || 20000;
      }

      const response = await axios.get(url, { params, timeout: 5000 });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        const pos = result.position;
        const addr = result.address;
        
        return {
          lat: pos.lat,
          lng: pos.lon,
          formatted: addr.freeformAddress,
          city: addr.municipality || addr.municipalitySubdivision,
          state: addr.countrySubdivision,
          country: addr.country,
          postalCode: addr.postalCode,
          confidence: result.score,
          dist: result.dist
        };
      }
      return null;
    } catch (error) {
      attempts++;
      if ((error.response?.status === 403 || error.response?.status === 429) && attempts < maxAttempts) {
        logger.warn("TomTom Quota Exceeded. Rotating key...");
        rotateTomTomKey();
      } else {
        logger.error("TomTom Geocoding Error", error);
        return null;
      }
    }
  }
  return null;
};

/**
 * geocodeMultiple
 */
const geocodeMultiple = async (query, options = {}) => {
  if (!query) return [];

  const maxAttempts = getKeyCount() || 1;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const url = `${TOMTOM_BASE_URL}/search/${encodeURIComponent(query)}.json`;
      const key = getTomTomKey();
      
      const params = {
        key,
        limit: options.limit || 5,
        countrySet: options.countrySet || 'IN',
        language: 'en-US'
      };

      if (options.lat && options.lon) {
        params.lat = options.lat;
        params.lon = options.lon;
        params.radius = options.radius || 50000;
      }

      const response = await axios.get(url, { params, timeout: 5000 });

      if (response.data.results && response.data.results.length > 0) {
        return response.data.results.map(result => ({
          lat: result.position.lat,
          lng: result.position.lon,
          formatted: result.address.freeformAddress,
          city: result.address.municipality || result.address.municipalitySubdivision,
          state: result.address.countrySubdivision,
          country: result.address.country,
          confidence: result.score,
          dist: result.dist
        }));
      }
      return [];
    } catch (error) {
      attempts++;
      if ((error.response?.status === 403 || error.response?.status === 429) && attempts < maxAttempts) {
        logger.warn("TomTom Quota Exceeded (Multiple). Rotating key...");
        rotateTomTomKey();
      } else {
        logger.error("TomTom Geocoding Multiple Error", error);
        return [];
      }
    }
  }
  return [];
};

module.exports = { geocode, geocodeMultiple };


module.exports = { geocode, geocodeMultiple };
