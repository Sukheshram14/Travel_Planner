/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH & HIERARCHY
 * ------------------------
 * Path: /server/src/services/routingService.js
 * 
 * Purpose:
 * To calculate the ACTUAL driving path between two points.
 * 
 * 2. API USED
 * -----------
 * - **OpenRouteService (ORS)**: Free routing API based on OpenStreetMap.
 * 
 * ==========================================================================================================================================================
 */

const axios = require('axios');

const ORS_API_KEY = process.env.ORS_API_KEY;

/**
 * getRoute
 * --------
 * Calculates driving directions.
 * @param {Object} startCoords - { lat, lng }
 * @param {Object} endCoords - { lat, lng }
 * @returns {Object} - GeoJSON LineString of the route.
 */
const getRoute = async (startCoords, endCoords) => {
  if (!startCoords || !endCoords) return null;

  try {
    // Note: ORS takes [lng, lat] (Standard GeoJSON format) - Opposite of Leaflet [lat, lng]
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${startCoords.lng},${startCoords.lat}&end=${endCoords.lng},${endCoords.lat}`;
    
    const response = await axios.get(url);
    
    // ORS returns a FeatureCollection. We just want the geometry (LineString).
    if (response.data.features && response.data.features.length > 0) {
      return response.data.features[0].geometry;
    }
    return null;

  } catch (error) {
    console.error("❌ ORS Routing Error:", error.message);
    return null; // Fail gracefully (Frontend will just show straight line or markers)
  }
};

module.exports = { getRoute };
