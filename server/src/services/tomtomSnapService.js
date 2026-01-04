/**
 * ==========================================================================================================================================================
 * 📚 TOMTOM SNAP TO ROADS SERVICE
 * ==========================================================================================================================================================
 * 
 * Purpose:
 * Takes "raw" coordinates (which might be slightly off the road due to GPS drift) and snaps them to the nearest actual road.
 * This makes route lines look perfect on the map.
 * 
 * API Documentation:
 * https://developer.tomtom.com/snap-roads-api/documentation/snap-roads/snap-to-roads
 * 
 * ==========================================================================================================================================================
 */

const axios = require('axios');
const logger = require('../utils/logger');

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
const TOMTOM_BASE_URL = 'https://api.tomtom.com/snapToRoads/1';

/**
 * snapToRoads
 * -----------
 * Snaps a list of coordinates to the road network.
 * 
 * @param {Array} points - Array of { lat, lng }
 * @returns {Array} - Array of snapped { lat, lng }
 */
const snapToRoads = async (points) => {
  if (!points || points.length === 0) return points;
  if (!TOMTOM_API_KEY) return points;

  try {
    // TomTom Snap to Roads supports up to 100 points per request
    // Format: lat,lon;lat,lon;...
    const pointStr = points.map(p => `${p.lat},${p.lng}`).join(';');
    const url = `${TOMTOM_BASE_URL}?key=${TOMTOM_API_KEY}&points=${encodeURIComponent(pointStr)}&fields=point`;

    const response = await axios.get(url, { timeout: 10000 });

    if (response.data.snappedPoints) {
      return response.data.snappedPoints.map(sp => ({
        lat: sp.point.latitude,
        lng: sp.point.longitude
      }));
    }

    return points;
  } catch (error) {
    logger.error("TomTom Snap to Roads Error", error);
    return points;
  }
};

module.exports = { snapToRoads };
