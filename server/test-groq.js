require('dotenv').config({ path: './.env' });
const groqService = require('./src/services/groqService');

async function testGroq() {
    console.log("🚀 Starting Groq Diagnostic Test...");
    console.log(`🔑 API Key found: ${process.env.GROQ_API_KEY ? 'Yes' : 'No'}`);

    if (!process.env.GROQ_API_KEY) {
        console.error("❌ Error: GROQ_API_KEY is not defined in .env");
        return;
    }

    const testTrip = {
        destination: "New York City",
        days: 1,
        budget: "Moderate",
        travelers: 2,
        interests: "Museums, Coffee, Parks",
        origin: "London",
        realPlaces: [
            { name: "Metropolitan Museum of Art", category: "Museum" },
            { name: "Central Park", category: "Park" }
        ]
    };

    try {
        console.log("\n🧪 Testing validateTripFeasibility...");
        const validation = await groqService.validateTripFeasibility(testTrip);
        console.log("✅ Feasibility Result:", JSON.stringify(validation, null, 2));

        console.log("\n🧪 Testing generateItinerary...");
        const itinerary = await groqService.generateItinerary(testTrip);
        console.log("✅ Itinerary Result (Summary):", itinerary.tripName);
        console.log("📅 Days generated:", itinerary.days.length);
        console.log("🎨 First day theme:", itinerary.days[0].theme);
        
        console.log("\n✨ All Groq tests passed!");
    } catch (error) {
        console.error("\n❌ Groq Diagnostic Failed:", error.message);
        if (error.stack) console.error(error.stack);
    }
}

testGroq();
