/**
 * TomTom Phase 1 APIs Test
 * Run with: node src/test-tomtom-phase1.js
 */
require('dotenv').config();
const tomtomReverseGeocodingService = require('./services/tomtomReverseGeocodingService');
const tomtomGeocodingService = require('./services/tomtomGeocodingService');
const tomtomSearchService = require('./services/tomtomSearchService');
const logger = require('./utils/logger');

console.log("🔍 Starting TomTom Phase 1 API Tests...\n");

const runTests = async () => {
    // Test 1: Reverse Geocoding (GPS → Address)
    logger.start("Test 1: Reverse Geocoding");
    try {
        const lat = 13.0827;
        const lng = 80.2707;
        console.log(`📍 Input: ${lat}, ${lng}`);
        
        const result = await tomtomReverseGeocodingService.reverseGeocode(lat, lng);
        
        if (result) {
            console.log(`✅ Reverse Geocoding Success`);
            console.log(`   Address: ${result.address}`);
            console.log(`   Formatted: ${result.formatted}`);
            console.log(`   City: ${result.city}`);
            console.log(`   State: ${result.state}`);
        } else {
            console.error("❌ No result returned");
        }
    } catch (error) {
        console.error("❌ Test 1 Failed:", error.message);
    }
    logger.end("Test 1: Reverse Geocoding");

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 2: Geocoding (Address → GPS)
    logger.start("Test 2: Geocoding");
    try {
        const query = "Chennai, Tamil Nadu";
        console.log(`📍 Input: "${query}"`);
        
        const result = await tomtomGeocodingService.geocode(query);
        
        if (result) {
            console.log(`✅ Geocoding Success`);
            console.log(`   Coordinates: ${result.lat}, ${result.lng}`);
            console.log(`   Formatted: ${result.formatted}`);
            console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        } else {
            console.error("❌ No result returned");
        }
    } catch (error) {
        console.error("❌ Test 2 Failed:", error.message);
    }
    logger.end("Test 2: Geocoding");

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 3: Geocode Multiple Results
    logger.start("Test 3: Geocode Multiple");
    try {
        const query = "Tirupati";
        console.log(`📍 Input: "${query}" (limit: 3)`);
        
        const results = await tomtomGeocodingService.geocodeMultiple(query, 3);
        
        if (results.length > 0) {
            console.log(`✅ Found ${results.length} results:`);
            results.forEach((r, i) => {
                console.log(`   ${i + 1}. ${r.formatted} (${r.lat}, ${r.lng})`);
            });
        } else {
            console.error("❌ No results returned");
        }
    } catch (error) {
        console.error("❌ Test 3 Failed:", error.message);
    }
    logger.end("Test 3: Geocode Multiple");

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 4: POI Search
    logger.start("Test 4: POI Search");
    try {
        const query = "restaurants";
        const lat = 13.0827;
        const lng = 80.2707;
        console.log(`📍 Searching for "${query}" near Chennai`);
        
        const results = await tomtomSearchService.searchPOI(query, lat, lng, { limit: 5 });
        
        if (results.length > 0) {
            console.log(`✅ Found ${results.length} POIs:`);
            results.forEach((r, i) => {
                console.log(`   ${i + 1}. ${r.name}`);
                console.log(`      Category: ${r.categoryName || r.category}`);
                console.log(`      Distance: ${(r.distance / 1000).toFixed(2)} km`);
            });
        } else {
            console.error("❌ No POIs found");
        }
    } catch (error) {
        console.error("❌ Test 4 Failed:", error.message);
    }
    logger.end("Test 4: POI Search");

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 5: Search Nearby by Category
    logger.start("Test 5: Search Nearby (Hotels)");
    try {
        const category = tomtomSearchService.POI_CATEGORIES.HOTEL;
        const lat = 13.0827;
        const lng = 80.2707;
        console.log(`📍 Searching for hotels (category: ${category}) near Chennai`);
        
        const results = await tomtomSearchService.searchNearby(category, lat, lng, 5000);
        
        if (results.length > 0) {
            console.log(`✅ Found ${results.length} hotels:`);
            results.forEach((r, i) => {
                console.log(`   ${i + 1}. ${r.name}`);
                console.log(`      Address: ${r.address}`);
                console.log(`      Distance: ${(r.distance / 1000).toFixed(2)} km`);
            });
        } else {
            console.error("❌ No hotels found");
        }
    } catch (error) {
        console.error("❌ Test 5 Failed:", error.message);
    }
    logger.end("Test 5: Search Nearby (Hotels)");

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ TomTom Phase 1 API Tests Complete!");
    console.log("\n📊 Summary:");
    console.log("   - Reverse Geocoding: Tested");
    console.log("   - Geocoding (Single): Tested");
    console.log("   - Geocoding (Multiple): Tested");
    console.log("   - POI Search: Tested");
    console.log("   - Nearby Search: Tested");
};

runTests();
