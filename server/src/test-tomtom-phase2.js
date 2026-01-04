/**
 * 🧪 TEST SCRIPT: TOMTOM PHASE 2 - ENHANCED NAVIGATION
 * --------------------------------------------------
 * This script verifies the Matrix Routing and Waypoint Optimization services.
 */

require('dotenv').config();
const tomtomMatrixService = require('./services/tomtomMatrixService');
const tomtomOptimizationService = require('./services/tomtomOptimizationService');
const logger = require('./utils/logger');

async function runTests() {
  console.log("🚀 Starting TomTom Phase 2 Tests...");

  // --- TEST 1: Matrix Routing ---
  console.log("\n--- Test 1: Matrix Routing (All-to-All) ---");
  const origins = [
    { lat: 12.9249, lng: 80.1000 }, // Tambaram, Chennai
    { lat: 13.0827, lng: 80.2707 }  // Central, Chennai
  ];
  const destinations = [
    { lat: 12.9716, lng: 77.5946 }, // Bangalore
    { lat: 11.0168, lng: 76.9558 }  // Coimbatore
  ];

  try {
    const matrixResults = await tomtomMatrixService.calculateMatrix(origins, destinations);
    if (matrixResults) {
      console.log(`✅ Matrix Result Count: ${matrixResults.length} (Expected 4)`);
      matrixResults.forEach((res, i) => {
        const time = (res.routeSummary?.travelTimeInSeconds / 60).toFixed(0);
        const dist = (res.routeSummary?.lengthInMeters / 1000).toFixed(1);
        console.log(`   [${i}] Time: ${time} mins, Dist: ${dist} km`);
      });
    } else {
      console.error("❌ Matrix Routing failed (Check API Key/Quota)");
    }
  } catch (err) {
    console.error("❌ Matrix Error:", err.message);
  }

  // --- TEST 2: Waypoint Optimization ---
  console.log("\n--- Test 2: Waypoint Optimization (TSP) ---");
  const start = { lat: 11.9416, lng: 79.8083 }; // Puducherry (Home)
  const stops = [
    { id: '1', lat: 11.9139, lng: 79.8144 }, // stop A (Further south)
    { id: '2', lat: 11.9500, lng: 79.8300 }, // stop B (Further North)
    { id: '3', lat: 11.9300, lng: 79.7900 }  // stop C (West)
  ];
  
  // Scramble the order
  const scrambledStops = [stops[0], stops[1], stops[2]];

  try {
    const optimized = await tomtomOptimizationService.optimizeWaypoints(start, scrambledStops);
    if (optimized) {
      console.log("✅ Optimization Success!");
      console.log("   Original Order IDs:", scrambledStops.map(s => s.id).join(' -> '));
      console.log("   Optimized Order IDs:", optimized.map(s => s.id).join(' -> '));
    } else {
      console.error("❌ Optimization failed");
    }
  } catch (err) {
    console.error("❌ Optimization Error:", err.message);
  }

  console.log("\n🏁 Phase 2 Tests Complete.");
}

runTests();
