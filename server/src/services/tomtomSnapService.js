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
const { getTomTomKey, rotateTomTomKey, getKeyCount } = require('../utils/tomtomKeyManager');

const TOMTOM_BASE_URL = 'https://api.tomtom.com/snapToRoads/1';

/**
 * snapToRoads
 */
const snapToRoads = async (points) => {
  if (!points || points.length === 0) return points;

  const maxAttempts = getKeyCount() || 1;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const key = getTomTomKey();
      const pointStr = points.map(p => `${p.lat},${p.lng}`).join(';');
      const url = `${TOMTOM_BASE_URL}?key=${key}&points=${encodeURIComponent(pointStr)}&fields=point`;

      const response = await axios.get(url, { timeout: 10000 });

      if (response.data.snappedPoints) {
        return response.data.snappedPoints.map(sp => ({
          lat: sp.point.latitude,
          lng: sp.point.longitude
        }));
      }
      return points;
    } catch (error) {
      attempts++;
      if ((error.response?.status === 403 || error.response?.status === 429) && attempts < maxAttempts) {
        logger.warn("TomTom Snap Quota Exceeded. Rotating key...");
        rotateTomTomKey();
      } else {
        logger.error("TomTom Snap to Roads Error", error);
        return points;
      }
    }
  }
  return points;
};

module.exports = { snapToRoads };

module.exports = { snapToRoads };
