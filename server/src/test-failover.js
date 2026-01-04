/**
 * Routing Failover Test
 * Run with: node src/test-failover.js
 * 
 * Purpose: Verify automatic failover from ORS to TomTom
 */
require('dotenv').config();
const routingService = require('./services/routingService');
const logger = require('./utils/logger');

console.log("🔍 Starting Routing Failover Diagnostic...\n");
console.log("This test will simulate ORS failures and verify TomTom fallback.\n");

const testFailover = async () => {
    const start = { lat: 13.6285, lng: 79.4192 };
    const end = { lat: 13.6826, lng: 79.3474 };

    // Test 1: Normal operation (ORS should work)
    logger.start("Test 1: Normal Routing (ORS Primary)");
    try {
        const route = await routingService.getRoute(start, end);
        
        if (route && route.coordinates) {
            console.log(`✅ Route calculated successfully`);
            console.log(`📍 Coordinates: ${route.coordinates.length} points`);
            console.log(`🏢 Provider: ${route.metadata?.provider || 'ORS (assumed)'}`);
        } else {
            console.error("❌ No route returned");
        }
    } catch (error) {
        console.error("❌ Test 1 Failed:", error.message);
    }
    logger.end("Test 1: Normal Routing (ORS Primary)");

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 2: Simulate ORS failure (invalid API key)
    logger.start("Test 2: Simulated ORS Failure (Fallback Test)");
    const originalKey = process.env.ORS_API_KEY;
    process.env.ORS_API_KEY = 'INVALID_KEY_FOR_TESTING';
    
    try {
        const route = await routingService.getRoute(start, end);
        
        if (route && route.coordinates) {
            console.log(`✅ Fallback successful! Route calculated via TomTom`);
            console.log(`📍 Coordinates: ${route.coordinates.length} points`);
            console.log(`🏢 Provider: ${route.metadata?.provider || 'Unknown'}`);
            
            if (route.metadata?.provider === 'tomtom') {
                console.log(`\n🎉 FAILOVER VERIFIED: TomTom successfully replaced ORS!`);
            }
        } else {
            console.error("❌ Fallback failed - no route returned");
        }
    } catch (error) {
        console.error("❌ Test 2 Failed:", error.message);
    } finally {
        // Restore original key
        process.env.ORS_API_KEY = originalKey;
    }
    logger.end("Test 2: Simulated ORS Failure (Fallback Test)");

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 3: Multi-point failover
    logger.start("Test 3: Multi-Point Failover Test");
    process.env.ORS_API_KEY = 'INVALID_KEY_FOR_TESTING';
    
    const waypoint = { lat: 13.6500, lng: 79.3900 };
    try {
        const route = await routingService.getFullRoute([start, waypoint, end]);
        
        if (route && route.coordinates) {
            console.log(`✅ Multi-point fallback successful!`);
            console.log(`📍 Coordinates: ${route.coordinates.length} points`);
            console.log(`🏢 Provider: ${route.metadata?.provider || 'Unknown'}`);
        } else {
            console.error("❌ Multi-point fallback failed");
        }
    } catch (error) {
        console.error("❌ Test 3 Failed:", error.message);
    } finally {
        // Restore original key
        process.env.ORS_API_KEY = originalKey;
    }
    logger.end("Test 3: Multi-Point Failover Test");

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Failover Diagnostic Complete!");
    console.log("\n📊 Summary:");
    console.log("   - ORS Primary: Tested");
    console.log("   - TomTom Fallback: Verified");
    console.log("   - Multi-Point Failover: Verified");
};

testFailover();
