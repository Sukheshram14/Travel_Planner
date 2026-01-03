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
 * Calculates driving directions between two points.
 * @param {Object} startCoords - { lat, lng }
 * @param {Object} endCoords - { lat, lng }
 * @returns {Object} - GeoJSON LineString
 */
const getRoute = async (startCoords, endCoords) => {
  if (!startCoords || !endCoords) return null;

  try {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${startCoords.lng},${startCoords.lat}&end=${endCoords.lng},${endCoords.lat}`;
    const response = await axios.get(url);
    if (response.data.features && response.data.features.length > 0) {
      return response.data.features[0].geometry;
    }
    return null;
  } catch (error) {
    console.error("❌ ORS Routing Error:", error.message);
    return null;
  }
};

/**
 * getFullRoute
 * ------------
 * Calculates a route connecting multiple points.
 * @param {Array} coordsList - Array of { lat, lng }
 * @returns {Object} - GeoJSON LineString
 */
const getFullRoute = async (coordsList) => {
  if (!coordsList || coordsList.length < 2) return null;

  try {
    // Format coordinates for ORS POST request [[lng, lat]]
    const coordinates = coordsList.map(c => [c.lng, c.lat]);
    
    // 💡 FIX: Increase search radius to 2000 meters for each point
    // This prevents errors when a place (like a park) is far from a routable road.
    const radiuses = coordinates.map(() => 2000); 

    const response = await axios.post(
      `https://api.openrouteservice.org/v2/directions/driving-car/geojson`,
      { 
        coordinates,
        radiuses 
      },
      {
        headers: {
          'Authorization': ORS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.features && response.data.features.length > 0) {
      return response.data.features[0].geometry;
    }
    return null;

  } catch (error) {
    console.error("❌ ORS Matrix Routing Error:", error.response?.data || error.message);
    return null;
  }
};

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
 * getOptimizedSequence
 * --------------------
 * Sorts a list of points to minimize travel distance (Nearest Neighbor TSP).
 * @param {Array} coordsList - Array of { lat, lng }
 * @returns {Array} - Optimized Array of { lat, lng }
 */
const getOptimizedSequence = (coordsList) => {
  if (!coordsList || coordsList.length < 3) return coordsList; 

  // We assume coordsList[0] is the designated 'Anchor' (Origin or Hotel)
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

module.exports = { getRoute, getFullRoute, getOptimizedSequence };
