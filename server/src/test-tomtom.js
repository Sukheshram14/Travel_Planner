/**
 * TomTom Routing Service Test
 * Run with: node src/test-tomtom.js
 */
require('dotenv').config();
const tomtomService = require('./services/tomtomRoutingService');
const logger = require('./utils/logger');

console.log("🔍 Starting TomTom Routing Diagnostic...\n");

const testTomTom = async () => {
    // Test coordinates: Tirupati area
    const start = { lat: 13.6285, lng: 79.4192 };
    const end = { lat: 13.6826, lng: 79.3474 };

    // Test 1: Simple 2-point route
    logger.start("Test 1: Simple Route (2 points)");
    try {
        const route = await tomtomService.calculateRoute(start, end);
        
        if (route && route.coordinates) {
            console.log(`✅ Route calculated successfully`);
            console.log(`📏 Distance: ${(route.metadata.distance / 1000).toFixed(2)} km`);
            console.log(`⏱️  Duration: ${Math.round(route.metadata.duration / 60)} minutes`);
            console.log(`📍 Coordinates: ${route.coordinates.length} points`);
            console.log(`🏢 Provider: ${route.metadata.provider}`);
        } else {
            console.error("❌ No route returned");
        }
    } catch (error) {
        console.error("❌ Test 1 Failed:", error.message);
    }
    logger.end("Test 1: Simple Route (2 points)");

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 2: Multi-point route
    logger.start("Test 2: Multi-Point Route (3 points)");
    const waypoint = { lat: 13.6500, lng: 79.3900 };
    try {
        const route = await tomtomService.calculateMultiPointRoute([start, waypoint, end]);
        
        if (route && route.coordinates) {
            console.log(`✅ Multi-point route calculated successfully`);
            console.log(`📏 Distance: ${(route.metadata.distance / 1000).toFixed(2)} km`);
            console.log(`⏱️  Duration: ${Math.round(route.metadata.duration / 60)} minutes`);
            console.log(`📍 Coordinates: ${route.coordinates.length} points`);
        } else {
            console.error("❌ No route returned");
        }
    } catch (error) {
        console.error("❌ Test 2 Failed:", error.message);
    }
    logger.end("Test 2: Multi-Point Route (3 points)");

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ TomTom Diagnostic Complete!");
};

testTomTom();
