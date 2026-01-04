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

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
const TOMTOM_BASE_URL = 'https://api.tomtom.com/search/2';

/**
 * geocode
 * -------
 * Converts a place name/address to GPS coordinates.
 * 
 * @param {string} query - Place name (e.g., "Chennai", "Tirupati, Andhra Pradesh")
 * @param {Object} options - Optional filters
 * @returns {Object} - { lat, lng, formatted, city, state, country }
 */
const geocode = async (query, options = {}) => {
  if (!query) return null;
  if (!TOMTOM_API_KEY) {
    logger.error("TomTom API Key Missing", new Error("TOMTOM_API_KEY not found in .env"));
    return null;
  }

  try {
    // 🚀 Switch to Fuzzy Search (/search) because it supports strict 'radius'
    const url = `${TOMTOM_BASE_URL}/search/${encodeURIComponent(query)}.json`;
    
    const params = {
      key: TOMTOM_API_KEY,
      limit: options.limit || 1,
      countrySet: options.countrySet || 'IN',
      language: 'en-US'
    };

    // 🎯 ADD STRICT RADIUS: If lat/lon provided, force results within 20km
    if (options.lat && options.lon) {
      params.lat = options.lat;
      params.lon = options.lon;
      params.radius = options.radius || 20000; // 20km strict boundary (prevents drift to distant towns)
    }

    const response = await axios.get(url, {
      params,
      timeout: 5000
    });

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
        dist: result.dist // Distance from bias point
      };
    }

    return null;
  } catch (error) {
    logger.error("TomTom Geocoding Error", error);
    return null;
  }
};

/**
 * geocodeMultiple
 * ---------------
 * Geocode multiple queries and return all results.
 * 
 * @param {string} query - Place name
 * @param {number} limit - Number of results to return
 * @returns {Array} - Array of geocoded results
 */
const geocodeMultiple = async (query, options = {}) => {
  if (!query) return [];
  if (!TOMTOM_API_KEY) {
    logger.error("TomTom API Key Missing", new Error("TOMTOM_API_KEY not found in .env"));
    return [];
  }

  try {
    const url = `${TOMTOM_BASE_URL}/search/${encodeURIComponent(query)}.json`;
    
    const params = {
      key: TOMTOM_API_KEY,
      limit: options.limit || 5,
      countrySet: options.countrySet || 'IN',
      language: 'en-US'
    };

    if (options.lat && options.lon) {
      params.lat = options.lat;
      params.lon = options.lon;
      params.radius = options.radius || 50000;
    }

    const response = await axios.get(url, {
      params,
      timeout: 5000
    });

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
    logger.error("TomTom Geocoding Multiple Error", error);
    return [];
  }
};

module.exports = { geocode, geocodeMultiple };
