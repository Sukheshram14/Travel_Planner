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
const { getTomTomKey, rotateTomTomKey, getKeyCount } = require('../utils/tomtomKeyManager');

const TOMTOM_BASE_URL = 'https://api.tomtom.com/routing/waypointoptimization/1';

/**
 * optimizeWaypoints
 */
const optimizeWaypoints = async (startPoint, waypoints, endPoint = null) => {
  if (!startPoint || !waypoints || waypoints.length < 2) return waypoints;

  const maxAttempts = getKeyCount() || 1;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const key = getTomTomKey();
      const url = `${TOMTOM_BASE_URL}?key=${key}`;
      
      const body = {
        waypoints: [
          { point: { latitude: startPoint.lat, longitude: startPoint.lng } },
          ...waypoints.map((wp) => ({
            point: { latitude: wp.lat, longitude: wp.lng }
          }))
        ]
      };

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
        const combined = [startPoint, ...waypoints];
        if (endPoint) combined.push(endPoint);
        
        return response.data.optimizedOrder
          .map(index => combined[index])
          .filter(wp => wp && wp !== startPoint && wp !== endPoint);
      }

      return waypoints;
    } catch (error) {
      attempts++;
      if ((error.response?.status === 403 || error.response?.status === 429) && attempts < maxAttempts) {
        logger.warn("TomTom Optimization Quota Exceeded. Rotating key...");
        rotateTomTomKey();
      } else {
        if (error.response) {
          logger.error(`TomTom Optimization Error (${error.response.status}):`, JSON.stringify(error.response.data, null, 2));
        } else {
          logger.error("TomTom Waypoint Optimization Error", error);
        }
        return waypoints;
      }
    }
  }
  return waypoints;
};

module.exports = { optimizeWaypoints };
