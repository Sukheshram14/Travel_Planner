/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: RESILIENT ROUTING SERVICE
 * ==========================================================================================================================================================
 * 
 * Purpose:
 * Multi-provider routing with automatic failover for maximum reliability.
 * 
 * Providers:
 * - **Primary**: TomTom Calculate Route API - Premium tier with real-time traffic
 * - **Fallback**: OpenRouteService (ORS) - Free tier
 * 
 * Failover Triggers:
 * - Timeout (>20s for TomTom, >15s for ORS)
 * - Rate limiting (429)
 * - Service errors (5xx)
 * - Network failures
 * 
 * ==========================================================================================================================================================
 */

const axios = require('axios');
const logger = require('../utils/logger');
const tomtomService = require('./tomtomRoutingService');

const ORS_API_KEY = process.env.ORS_API_KEY;
const ORS_TIMEOUT = parseInt(process.env.ROUTING_TIMEOUT_MS) || 25000;
const FALLBACK_ENABLED = process.env.ROUTING_FALLBACK_ENABLED !== 'false'; // Default true

/**
 * getRoute
 * --------
 * Calculates driving directions between two points with automatic failover.
 * @param {Object} startCoords - { lat, lng }
 * @param {Object} endCoords - { lat, lng }
 * @returns {Object} - GeoJSON LineString
 */
const getRoute = async (startCoords, endCoords, options = {}) => {
  if (!startCoords || !endCoords) return null;

  // Try TomTom first (premium tier with traffic)
  try {
    logger.info(`🛣️ Attempting TomTom routing (Mode: ${options.travelMode || 'car'})...`);
    const tomtomRoute = await tomtomService.calculateRoute(startCoords, endCoords, options);
    
    if (tomtomRoute) {
      logger.info(`✅ TomTom routing succeeded`);
      return tomtomRoute;
    }
  } catch (tomtomError) {
    const errorReason = tomtomError.code === 'ECONNABORTED' ? 'Timeout' : 
                       tomtomError.response?.status === 429 ? 'Rate Limit' : 
                       tomtomError.response?.status >= 500 ? 'Service Error' : 'Network Failure';
    
    logger.error(`TomTom Routing Failed (${errorReason})`, tomtomError);
  }

  // Automatic fallback to ORS (free tier)
  if (FALLBACK_ENABLED) {
    try {
      logger.info(`🔄 Falling back to ORS (free tier)...`);
      const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${startCoords.lng},${startCoords.lat}&end=${endCoords.lng},${endCoords.lat}`;
      const response = await axios.get(url, { timeout: ORS_TIMEOUT });
      
      if (response.data.features && response.data.features.length > 0) {
        logger.info(`✅ ORS routing succeeded`);
        return response.data.features[0].geometry;
      }
    } catch (orsError) {
      logger.error("ORS Fallback Failed", orsError);
    }
  }

  return null;
};

/**
 * getFullRoute
 * ------------
 * Calculates a route connecting multiple points with automatic failover.
 * @param {Array} coordsList - Array of { lat, lng }
 * @param {Object} options - Vehicle and routing options
 * @returns {Object} - GeoJSON LineString
 */
const getFullRoute = async (coordsList, options = {}) => {
  if (!coordsList || coordsList.length < 2) return null;

  // Try TomTom first (premium tier with traffic)
  try {
    logger.info(`🛣️ Attempting TomTom multi-point routing (Mode: ${options.travelMode || 'car'})...`);
    const tomtomRoute = await tomtomService.calculateMultiPointRoute(coordsList, options);
    
    if (tomtomRoute) {
      logger.info(`✅ TomTom multi-point routing succeeded`);
      return tomtomRoute;
    }
  } catch (tomtomError) {
    const errorReason = tomtomError.code === 'ECONNABORTED' ? 'Timeout' : 
                       tomtomError.response?.status === 429 ? 'Rate Limit' : 
                       tomtomError.response?.status >= 500 ? 'Service Error' : 'Network Failure';
    
    logger.error(`TomTom Multi-Point Routing Failed (${errorReason})`, tomtomError);
  }

  // Automatic fallback to ORS (free tier)
  if (FALLBACK_ENABLED) {
    try {
      logger.info(`🔄 Falling back to ORS multi-point routing...`);
      
      const coordinates = coordsList.map(c => [c.lng, c.lat]);
      const radiuses = coordinates.map(() => 2000); 

      const response = await axios.post(
        `https://api.openrouteservice.org/v2/directions/driving-car/geojson`,
        { coordinates, radiuses },
        {
          headers: {
            'Authorization': ORS_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: ORS_TIMEOUT
        }
      );

      if (response.data.features && response.data.features.length > 0) {
        logger.info(`✅ ORS multi-point routing succeeded`);
        return response.data.features[0].geometry;
      }
    } catch (orsError) {
      logger.error("ORS Multi-Point Fallback Failed", orsError);
    }
  }

  return null;
};

const tomtomOptimizationService = require('./tomtomOptimizationService');

/**
 * calculateHaversine
 * ------------------
 * Calculates the great-circle distance between two points on a sphere.
 */
const calculateHaversine = (p1, p2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lng - p1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * getNearestNeighborSequence
 * --------------------------
 * Basic TSP fallback using greedy nearest neighbor.
 */
const getNearestNeighborSequence = (coordsList) => {
  if (!coordsList || coordsList.length < 3) return coordsList;
  const optimized = [coordsList[0]];
  const remaining = coordsList.slice(1);
  while (remaining.length > 0) {
    let lastPoint = optimized[optimized.length - 1];
    let nearestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
        const d = calculateHaversine(lastPoint, remaining[i]);
        if (d < minDist) {
            minDist = d;
            nearestIdx = i;
        }
    }
    optimized.push(remaining.splice(nearestIdx, 1)[0]);
  }
  return optimized;
};

/**
 * getOptimizedSequence
 * --------------------
 * Sorts a list of points using TomTom Optimization API (Phase 2 Upgrade).
 * Falls back to Nearest Neighbor if API fails.
 * 
 * @param {Array} coordsList - Array of { lat, lng }
 * @returns {Array} - Optimized Array of { lat, lng }
 */
const getOptimizedSequence = async (coordsList) => {
  if (!coordsList || coordsList.length < 3) return coordsList; 

  try {
    const startPoint = coordsList[0];
    const waypoints = coordsList.slice(1);
    
    // Attempt TomTom Optimization
    const optimizedWaypoints = await tomtomOptimizationService.optimizeWaypoints(startPoint, waypoints);
    
    if (optimizedWaypoints && optimizedWaypoints.length > 0) {
      logger.info(`✨ TomTom Step-Level Optimization Succeeded (${coordsList.length} points)`);
      return [startPoint, ...optimizedWaypoints];
    }
    
    throw new Error("TomTom Optimization returned empty result");
  } catch (error) {
    logger.warn("Optimization API failed, falling back to Nearest Neighbor", error.message);
    return getNearestNeighborSequence(coordsList);
  }
};

module.exports = { getRoute, getFullRoute, getOptimizedSequence };
