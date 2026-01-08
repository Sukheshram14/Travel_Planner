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
const { getTomTomKey, rotateTomTomKey, getKeyCount } = require('../utils/tomtomKeyManager');

const TOMTOM_BASE_URL = 'https://api.tomtom.com/search/2';

/**
 * searchPOI
 */
const searchPOI = async (query, lat, lng, options = {}) => {
  if (!query || !lat || !lng) return [];

  const maxAttempts = getKeyCount() || 1;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const url = `${TOMTOM_BASE_URL}/poiSearch/${encodeURIComponent(query)}.json`;
      const key = getTomTomKey();
      
      const response = await axios.get(url, {
        params: {
          key,
          lat,
          lon: lng,
          radius: options.radius || 10000,
          limit: options.limit || 20,
          language: 'en-US',
          categorySet: options.categorySet
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
          distance: result.dist,
          rating: result.rating?.value
        }));
      }
      return [];
    } catch (error) {
      attempts++;
      if ((error.response?.status === 403 || error.response?.status === 429) && attempts < maxAttempts) {
        logger.warn("TomTom Search POI Quota Exceeded. Rotating key...");
        rotateTomTomKey();
      } else {
        logger.error("TomTom POI Search Error", error);
        return [];
      }
    }
  }
  return [];
};

/**
 * searchNearby
 */
const searchNearby = async (category, lat, lng, radius = 5000, limit = 20) => {
  if (!category || !lat || !lng) return [];

  const maxAttempts = getKeyCount() || 1;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const url = `${TOMTOM_BASE_URL}/nearbySearch/.json`;
      const key = getTomTomKey();
      
      const response = await axios.get(url, {
        params: {
          key,
          lat,
          lon: lng,
          radius,
          limit: Math.min(limit, 100),
          categorySet: category,
          language: 'en-US'
        },
        timeout: 10000
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
      attempts++;
      if ((error.response?.status === 403 || error.response?.status === 429) && attempts < maxAttempts) {
        logger.warn("TomTom Nearby Search Quota Exceeded. Rotating key...");
        rotateTomTomKey();
      } else {
        logger.error("TomTom Nearby Search Error", error);
        return [];
      }
    }
  }
  return [];
};

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

module.exports = { searchPOI, searchNearby, POI_CATEGORIES };

