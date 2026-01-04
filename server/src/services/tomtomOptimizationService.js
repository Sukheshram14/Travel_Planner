/**
 * ==========================================================================================================================================================
 * 📚 TOMTOM WAYPOINT OPTIMIZATION SERVICE
 * ==========================================================================================================================================================
 * 
 * Purpose:
 * Reorders a list of waypoints to find the most efficient route (Solving the TSP - Traveling Salesperson Problem).
 * This replaces basic Nearest Neighbor logic with industry-grade optimization.
 * 
 * API Documentation:
 * https://developer.tomtom.com/routing-api/documentation/waypoint-optimization/waypoint-optimization-service
 * 
 * ==========================================================================================================================================================
 */

const axios = require('axios');
const logger = require('../utils/logger');

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
const TOMTOM_BASE_URL = 'https://api.tomtom.com/routing/waypointoptimization/1';

/**
 * optimizeWaypoints
 * -----------------
 * Optimized the order of waypoints between a start and end point.
 * 
 * @param {Object} startPoint - { lat, lng }
 * @param {Array} waypoints - Array of { lat, lng, id }
 * @param {Object} endPoint - { lat, lng } (Optional, if null it assumes a round trip or open end)
 * @returns {Array} - Reordered array of waypoint IDs or indices
 */
const optimizeWaypoints = async (startPoint, waypoints, endPoint = null) => {
  if (!startPoint || !waypoints || waypoints.length < 2) return waypoints;
  if (!TOMTOM_API_KEY) {
    logger.error("TomTom API Key Missing", new Error("TOMTOM_API_KEY not found in .env"));
    return waypoints;
  }

  try {
    const url = `${TOMTOM_BASE_URL}?key=${TOMTOM_API_KEY}`;
    
    // TomTom Waypoint Optimization v1 Minimal Body
    const body = {
      waypoints: [
        { point: { latitude: startPoint.lat, longitude: startPoint.lng } },
        ...waypoints.map((wp) => ({
          point: { latitude: wp.lat, longitude: wp.lng }
        }))
      ]
    };

    // If we have a specific end point, add it
    if (endPoint) {
      body.waypoints.push({
        point: { latitude: endPoint.lat, longitude: endPoint.lng }
      });
    }

    const response = await axios.post(url, body, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.optimizedOrder) {
      // TomTom indices refer to the input waypoints array (including start/end)
      // We want to return only the 'intermediate' waypoints in their new order
      const combined = [startPoint, ...waypoints];
      if (endPoint) combined.push(endPoint);
      
      const result = response.data.optimizedOrder
        .map(index => combined[index])
        .filter(wp => wp && wp !== startPoint && wp !== endPoint);
        
      return result;
    }

    return waypoints;
  } catch (error) {
    if (error.response) {
      logger.error(`TomTom Optimization Error (${error.response.status}):`, JSON.stringify(error.response.data, null, 2));
    } else {
      logger.error("TomTom Waypoint Optimization Error", error);
    }
    return waypoints;
  }
};

module.exports = { optimizeWaypoints };
