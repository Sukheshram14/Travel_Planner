/**
 * Standalone ORS Test Diagnostic
 * Run with: node src/test-ors.js
 */
require('dotenv').config();
const axios = require('axios');

const ORS_API_KEY = process.env.ORS_API_KEY;

console.log("🔍 Starting ORS Diagnostic...");
console.log("🔑 API Key Found:", ORS_API_KEY ? "MATCHED (Check if correct)" : "MISSING ❌");

if (!ORS_API_KEY) {
    console.error("⛔ Error: ORS_API_KEY not found in .env file.");
    process.exit(1);
}

const testRoute = async () => {
    // Test coordinates: Tirupati (approx)
    const start = [79.4192, 13.6285]; // Lng, Lat
    const end = [79.3474, 13.6826];   // Lng, Lat (Tirumala area)

    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${start.join(',')}&end=${end.join(',')}`;

    const config = { timeout: 20000 };

    try {
        console.log("📡 Sending GET request to ORS (Simple Route)...");
        const response = await axios.get(url, config);
        
        if (response.data.features && response.data.features.length > 0) {
            const distance = response.data.features[0].properties.summary.distance;
            console.log("✅ ORS GET Connection Successful!");
            console.log(`📏 Distance: ${(distance / 1000).toFixed(2)} km`);
        }
    } catch (error) {
        console.error("❌ ORS GET Error:", error.message);
    }

    // 2. Test POST Matrix Routing (used for multi-point paths)
    const matrixUrl = `https://api.openrouteservice.org/v2/directions/driving-car/geojson`;
    const body = {
        coordinates: [
            [79.4192, 13.6285],
            [79.3900, 13.6500],
            [79.3474, 13.6826]
        ]
        // Removed radiuses for simplicity
    };

    try {
        console.log("\n📡 Sending POST request to ORS (Matrix/Multi-point)...");
        const response = await axios.post(matrixUrl, body, {
            ...config,
            headers: { 'Authorization': ORS_API_KEY, 'Content-Type': 'application/json' }
        });

        if (response.data.features && response.data.features.length > 0) {
            console.log("✅ ORS POST Connection Successful!");
            console.log(`🛣️ Coordinates returned: ${response.data.features[0].geometry.coordinates.length} points.`);
        }
    } catch (error) {
        console.error("❌ ORS POST Error:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
};

testRoute();
