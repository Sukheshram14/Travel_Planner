/**
 * ==========================================================================================================================================================
 * 📚 TOMTOM ROUTING SERVICE
 * ==========================================================================================================================================================
 * 
 * Purpose:
 * TomTom Calculate Route API wrapper for premium routing with automatic fallback support.
 * 
 * API Documentation:
 * https://developer.tomtom.com/routing-api/documentation/routing/calculate-route
 * 
 * ==========================================================================================================================================================
 */

const axios = require('axios');
const logger = require('../utils/logger');

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
const TOMTOM_BASE_URL = 'https://api.tomtom.com/routing/1';
const TOMTOM_TIMEOUT = 30000; // 30 seconds (premium service gets more time)

/**
 * calculateRoute
 * --------------
 * Calculates a route between two points using TomTom's Calculate Route API.
 * 
 * @param {Object} startCoords - { lat, lng }
 * @param {Object} endCoords - { lat, lng }
 * @returns {Object} - GeoJSON LineString (normalized to ORS format)
 */
const calculateRoute = async (startCoords, endCoords, options = {}) => {
  if (!startCoords || !endCoords) return null;
  if (!TOMTOM_API_KEY) {
    logger.error("TomTom API Key Missing", new Error("TOMTOM_API_KEY not found in .env"));
    return null;
  }

  try {
    // TomTom format: lat,lng:lat,lng
    const locations = `${startCoords.lat},${startCoords.lng}:${endCoords.lat},${endCoords.lng}`;
    const url = `${TOMTOM_BASE_URL}/calculateRoute/${locations}/json`;

    const response = await axios.get(url, {
      params: {
        key: TOMTOM_API_KEY,
        traffic: true,
        routeType: options.routeType || 'fastest',
        travelMode: options.travelMode || 'car',
        vehicleEngineType: options.vehicleEngineType || 'combustion',
        ...(options.vehicleMaxSpeed && { vehicleMaxSpeed: options.vehicleMaxSpeed }),
        ...(options.vehicleWeight && { vehicleWeight: options.vehicleWeight }),
        ...(options.vehicleAxleLoad && { vehicleAxleLoad: options.vehicleAxleLoad }),
        ...(options.vehicleLength && { vehicleLength: options.vehicleLength }),
        ...(options.vehicleWidth && { vehicleWidth: options.vehicleWidth }),
        ...(options.vehicleHeight && { vehicleHeight: options.vehicleHeight })
      },
      timeout: TOMTOM_TIMEOUT
    });
    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      
      // Transform TomTom response to ORS-compatible GeoJSON
      return transformToGeoJSON(route);
    }

    return null;
  } catch (error) {
    logger.error("TomTom Routing Error", error);
    return null;
  }
};

/**
 * calculateMultiPointRoute
 * ------------------------
 * Calculates a route through multiple waypoints using TomTom.
 * 
 * @param {Array} coordsList - Array of { lat, lng } objects
 * @returns {Object} - GeoJSON LineString
 */
const calculateMultiPointRoute = async (coordsList, options = {}) => {
  if (!coordsList || coordsList.length < 2) return null;
  if (!TOMTOM_API_KEY) {
    logger.error("TomTom API Key Missing", new Error("TOMTOM_API_KEY not found in .env"));
    return null;
  }

  try {
    // TomTom format: lat1,lng1:lat2,lng2:lat3,lng3
    const locations = coordsList.map(c => `${c.lat},${c.lng}`).join(':');
    const url = `${TOMTOM_BASE_URL}/calculateRoute/${locations}/json`;

    const response = await axios.get(url, {
      params: {
        key: TOMTOM_API_KEY,
        traffic: true,
        routeType: options.routeType || 'fastest',
        travelMode: options.travelMode || 'car',
        vehicleEngineType: options.vehicleEngineType || 'combustion',
        ...(options.vehicleMaxSpeed && { vehicleMaxSpeed: options.vehicleMaxSpeed }),
        ...(options.vehicleWeight && { vehicleWeight: options.vehicleWeight }),
        ...(options.vehicleAxleLoad && { vehicleAxleLoad: options.vehicleAxleLoad }),
        ...(options.vehicleLength && { vehicleLength: options.vehicleLength }),
        ...(options.vehicleWidth && { vehicleWidth: options.vehicleWidth }),
        ...(options.vehicleHeight && { vehicleHeight: options.vehicleHeight })
      },
      timeout: TOMTOM_TIMEOUT
    });

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return transformToGeoJSON(route);
    }

    return null;
  } catch (error) {
    logger.error("TomTom Multi-Point Routing Error", error);
    return null;
  }
};

/**
 * transformToGeoJSON
 * ------------------
 * Transforms TomTom response format to ORS-compatible GeoJSON LineString.
 * 
 * TomTom Response Structure:
 * {
 *   routes: [{
 *     summary: { lengthInMeters, travelTimeInSeconds },
 *     legs: [{ points: [{ latitude, longitude }] }]
 *   }]
 * }
 * 
 * ORS-Compatible Output:
 * {
 *   type: "LineString",
 *   coordinates: [[lng, lat], [lng, lat], ...],
 *   metadata: { distance, duration, provider }
 * }
 */
const transformToGeoJSON = (tomtomRoute) => {
  try {
    const coordinates = [];

    // Extract all points from all legs
    if (tomtomRoute.legs && tomtomRoute.legs.length > 0) {
      tomtomRoute.legs.forEach(leg => {
        if (leg.points && leg.points.length > 0) {
          leg.points.forEach(point => {
            // TomTom uses {latitude, longitude}, GeoJSON uses [lng, lat]
            coordinates.push([point.longitude, point.latitude]);
          });
        }
      });
    }

    // If no points in legs, return null
    if (coordinates.length === 0) {
      return null;
    }

    return {
      type: 'LineString',
      coordinates: coordinates,
      metadata: {
        distance: tomtomRoute.summary?.lengthInMeters || 0,
        duration: tomtomRoute.summary?.travelTimeInSeconds || 0,
        provider: 'tomtom',
        legs: (tomtomRoute.legs || []).map(leg => ({
          distance: leg.summary?.lengthInMeters || 0,
          duration: leg.summary?.travelTimeInSeconds || 0
        }))
      }
    };
  } catch (error) {
    logger.error("TomTom Response Transformation Error", error);
    return null;
  }
};

module.exports = {
  calculateRoute,
  calculateMultiPointRoute
};
