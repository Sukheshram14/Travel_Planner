/**
 * ==========================================================================================================================================================
 * 📚 TOMTOM SEARCH SERVICE (POI Discovery)
 * ==========================================================================================================================================================
 * 
 * Purpose:
 * Search for Points of Interest (POIs) like restaurants, hotels, attractions using TomTom's Search API.
 * Replaces Geoapify for POI discovery.
 * 
 * API Documentation:
 * https://developer.tomtom.com/search-api/documentation/search-service/points-of-interest-search
 * 
 * ==========================================================================================================================================================
 */

const axios = require('axios');
const logger = require('../utils/logger');

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
const TOMTOM_BASE_URL = 'https://api.tomtom.com/search/2';

/**
 * searchPOI
 * ---------
 * Search for Points of Interest near a location.
 * 
 * @param {string} query - Search query (e.g., "restaurants", "hotels", "temples")
 * @param {number} lat - Latitude of search center
 * @param {number} lng - Longitude of search center
 * @param {Object} options - Optional filters
 * @returns {Array} - Array of POIs with coordinates
 */
const searchPOI = async (query, lat, lng, options = {}) => {
  if (!query || !lat || !lng) return [];
  if (!TOMTOM_API_KEY) {
    logger.error("TomTom API Key Missing", new Error("TOMTOM_API_KEY not found in .env"));
    return [];
  }

  try {
    const url = `${TOMTOM_BASE_URL}/poiSearch/${encodeURIComponent(query)}.json`;
    
    const response = await axios.get(url, {
      params: {
        key: TOMTOM_API_KEY,
        lat,
        lon: lng,
        radius: options.radius || 10000, // 10km default
        limit: options.limit || 20,
        language: 'en-US',
        categorySet: options.categorySet // Optional category filter
      },
      timeout: 5000
    });

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results.map(result => ({
        name: result.poi?.name || result.address?.freeformAddress,
        category: result.poi?.categories?.[0] || 'general',
        categoryName: result.poi?.categorySet?.[0]?.name,
        lat: result.position.lat,
        lng: result.position.lon,
        address: result.address?.freeformAddress,
        phone: result.poi?.phone,
        url: result.poi?.url,
        distance: result.dist, // Distance from search center in meters
        rating: result.rating?.value
      }));
    }

    return [];
  } catch (error) {
    logger.error("TomTom POI Search Error", error);
    return [];
  }
};

/**
 * searchNearby
 * ------------
 * Search for POIs by category near a location.
 * 
 * @param {string} category - Category ID (e.g., "7315" for restaurants)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Search radius in meters
 * @returns {Array} - Array of POIs
 */
const searchNearby = async (category, lat, lng, radius = 5000) => {
  if (!category || !lat || !lng) return [];
  if (!TOMTOM_API_KEY) {
    logger.error("TomTom API Key Missing", new Error("TOMTOM_API_KEY not found in .env"));
    return [];
  }

  try {
    const url = `${TOMTOM_BASE_URL}/nearbySearch/.json`;
    
    const response = await axios.get(url, {
      params: {
        key: TOMTOM_API_KEY,
        lat,
        lon: lng,
        radius,
        limit: 20,
        categorySet: category,
        language: 'en-US'
      },
      timeout: 5000
    });

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results.map(result => ({
        name: result.poi?.name || result.address?.freeformAddress,
        category: result.poi?.categories?.[0] || category,
        categoryName: result.poi?.categorySet?.[0]?.name,
        lat: result.position.lat,
        lng: result.position.lon,
        address: result.address?.freeformAddress,
        phone: result.poi?.phone,
        url: result.poi?.url,
        distance: result.dist
      }));
    }

    return [];
  } catch (error) {
    logger.error("TomTom Nearby Search Error", error);
    return [];
  }
};

/**
 * Common POI Categories
 */
const POI_CATEGORIES = {
  RESTAURANT: '7315',
  HOTEL: '7314',
  ATTRACTION: '7376',
  MUSEUM: '7317',
  TEMPLE: '7339',
  SHOPPING: '7374',
  HOSPITAL: '7321',
  GAS_STATION: '7311',
  PARKING: '7369',
  ATM: '7397'
};

module.exports = { 
  searchPOI, 
  searchNearby,
  POI_CATEGORIES 
};
