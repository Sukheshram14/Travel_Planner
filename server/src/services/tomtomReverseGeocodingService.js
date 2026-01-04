/**
 * ==========================================================================================================================================================
 * 📚 TOMTOM REVERSE GEOCODING SERVICE
 * ==========================================================================================================================================================
 * 
 * Purpose:
 * Convert GPS coordinates to human-readable addresses using TomTom's Reverse Geocoding API.
 * 
 * API Documentation:
 * https://developer.tomtom.com/search-api/documentation/reverse-geocoding
 * 
 * ==========================================================================================================================================================
 */

const axios = require('axios');
const logger = require('../utils/logger');

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
const TOMTOM_BASE_URL = 'https://api.tomtom.com/search/2';

/**
 * reverseGeocode
 * --------------
 * Converts GPS coordinates to a human-readable address.
 * 
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} - { address: "Chennai, Tamil Nadu, India", formatted: "Full address" }
 */
const reverseGeocode = async (lat, lng) => {
  if (!lat || !lng) return null;
  if (!TOMTOM_API_KEY) {
    logger.error("TomTom API Key Missing", new Error("TOMTOM_API_KEY not found in .env"));
    return null;
  }

  try {
    const url = `${TOMTOM_BASE_URL}/reverseGeocode/${lat},${lng}.json`;
    
    const response = await axios.get(url, {
      params: {
        key: TOMTOM_API_KEY,
        returnSpeedLimit: false,
        returnRoadUse: false
      },
      timeout: 5000
    });

    if (response.data.addresses && response.data.addresses.length > 0) {
      const place = response.data.addresses[0];
      const addr = place.address;
      
      // Build hierarchical address: City, State, Country
      const city = addr.municipality || addr.municipalitySubdivision || addr.localName;
      const state = addr.countrySubdivision;
      const country = addr.country;
      
      const shortAddress = [city, state, country].filter(Boolean).join(', ');
      
      return {
        address: shortAddress,
        formatted: addr.freeformAddress,
        city: city,
        state: state,
        country: country,
        postalCode: addr.postalCode,
        streetName: addr.streetName,
        streetNumber: addr.streetNumber
      };
    }

    return null;
  } catch (error) {
    logger.error("TomTom Reverse Geocoding Error", error);
    return null;
  }
};

module.exports = { reverseGeocode };
