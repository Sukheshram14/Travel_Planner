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
const { getTomTomKey, rotateTomTomKey, getKeyCount } = require('../utils/tomtomKeyManager');

const TOMTOM_BASE_URL = 'https://api.tomtom.com/search/2';

/**
 * reverseGeocode
 */
const reverseGeocode = async (lat, lng) => {
  if (!lat || !lng) return null;

  const maxAttempts = getKeyCount() || 1;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const url = `${TOMTOM_BASE_URL}/reverseGeocode/${lat},${lng}.json`;
      const key = getTomTomKey();
      
      const response = await axios.get(url, {
        params: {
          key,
          returnSpeedLimit: false,
          returnRoadUse: false
        },
        timeout: 5000
      });

      if (response.data.addresses && response.data.addresses.length > 0) {
        const place = response.data.addresses[0];
        const addr = place.address;
        
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
      attempts++;
      if ((error.response?.status === 403 || error.response?.status === 429) && attempts < maxAttempts) {
        logger.warn("TomTom Reverse Geocoding Quota Exceeded. Rotating key...");
        rotateTomTomKey();
      } else {
        logger.error("TomTom Reverse Geocoding Error", error);
        return null;
      }
    }
  }
  return null;
};

module.exports = { reverseGeocode };

module.exports = { reverseGeocode };
