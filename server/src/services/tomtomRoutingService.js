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
const { getTomTomKey, rotateTomTomKey, getKeyCount } = require('../utils/tomtomKeyManager');

const TOMTOM_BASE_URL = 'https://api.tomtom.com/routing/1';
const TOMTOM_TIMEOUT = 30000;

/**
 * calculateRoute
 */
const calculateRoute = async (startCoords, endCoords, options = {}) => {
  if (!startCoords || !endCoords) return null;

  const maxAttempts = getKeyCount() || 1;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const locations = `${startCoords.lat},${startCoords.lng}:${endCoords.lat},${endCoords.lng}`;
      const url = `${TOMTOM_BASE_URL}/calculateRoute/${locations}/json`;
      const key = getTomTomKey();

      const response = await axios.get(url, {
        params: {
          key,
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
        return transformToGeoJSON(response.data.routes[0]);
      }
      return null;
    } catch (error) {
      attempts++;
      if ((error.response?.status === 403 || error.response?.status === 429) && attempts < maxAttempts) {
        logger.warn("TomTom Routing Quota Exceeded. Rotating key...");
        rotateTomTomKey();
      } else {
        logger.error("TomTom Routing Error", error);
        return null;
      }
    }
  }
  return null;
};

/**
 * calculateMultiPointRoute
 */
const calculateMultiPointRoute = async (coordsList, options = {}) => {
  if (!coordsList || coordsList.length < 2) return null;

  const maxAttempts = getKeyCount() || 1;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const locations = coordsList.map(c => `${c.lat},${c.lng}`).join(':');
      const url = `${TOMTOM_BASE_URL}/calculateRoute/${locations}/json`;
      const key = getTomTomKey();

      const response = await axios.get(url, {
        params: {
          key,
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
        return transformToGeoJSON(response.data.routes[0]);
      }
      return null;
    } catch (error) {
      attempts++;
      if ((error.response?.status === 403 || error.response?.status === 429) && attempts < maxAttempts) {
        logger.warn("TomTom Multi-Point Routing Quota Exceeded. Rotating key...");
        rotateTomTomKey();
      } else {
        logger.error("TomTom Multi-Point Routing Error", error);
        return null;
      }
    }
  }
  return null;
};

/**
 * transformToGeoJSON
 */
const transformToGeoJSON = (tomtomRoute) => {
  try {
    const coordinates = [];
    if (tomtomRoute.legs && tomtomRoute.legs.length > 0) {
      tomtomRoute.legs.forEach(leg => {
        if (leg.points && leg.points.length > 0) {
          leg.points.forEach(point => {
            coordinates.push([point.longitude, point.latitude]);
          });
        }
      });
    }

    if (coordinates.length === 0) return null;

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

module.exports = { calculateRoute, calculateMultiPointRoute };
