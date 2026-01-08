/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH & HIERARCHY
 * ------------------------
 * Path: /server/src/services/groqService.js
 * 
 * 2. GROQ AI IMPLEMENTATION (Cloud Inference)
 * -------------------------------------------
 * - Using `groq-sdk`
 * - Model: `llama-3.3-70b-versatile` (High speed/intelligence)
 * - Mode: JSON Mode (Guarantees valid JSON output)
 * 
 * Why this? 
 * - Groq offers near-instant inference speeds.
 * - llama-3.3-70b is highly capable for complex reasoning tasks like travel planning.
 * 
 * ==========================================================================================================================================================
 */

const Groq = require("groq-sdk");

// [KEY ROTATION] Load keys from .env (comma-separated list)
const keys = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "")
  .split(',')
  .map(k => k.trim())
  .filter(k => k);

let currentKeyIndex = 0;

console.log(`🔑 Loaded ${keys.length} Groq API Keys for Rotation.`);

// Helper to get client with current key
const getGroqClient = () => {
    const key = keys[currentKeyIndex];
    return new Groq({ apiKey: key });
};

// Helper: Rotate Key
const rotateKey = () => {
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    console.warn(`🔄 Switching to Groq Key Index: ${currentKeyIndex}`);
};

/**
 * generateItinerary()
 * -------------------
 * @param {Object} tripDetails - { destination, days, budget, travelers, interests, origin, realPlaces }
 * @returns {Object} - Structured itinerary JSON
 */
const generateItinerary = async (tripDetails) => {
  const originText = tripDetails.origin
    ? `Result must include travel advice from ${tripDetails.origin}.`
    : "";

  // Build RAG Context (grounding)
  let ragContext = "";
  if (tripDetails.realPlaces && tripDetails.realPlaces.length > 0) {
    const placesList = tripDetails.realPlaces
      .map((p) => `- ${p.name} (${p.category})`)
      .slice(0, 30)
      .join("\n");
    ragContext = `
      REAL AVAILABLE PLACES (Prioritize these in your plan):
      ${placesList}
      
      INSTRUCTION: You must select activities primarily from the list above to ensure map accuracy.
      `;
  }

  const prompt = `
      TASK: Create a ${tripDetails.days}-day itinerary for a trip to ${tripDetails.destination}.
      
      GEOGRAPHIC CONSTRAINTS (CRITICAL):
      1. All activities must be located within 50km of ${tripDetails.destination}.
      2. Do NOT plan cross-country tours or travel to other states.
      3. STRICT VALIDATION: If you suggest any place outside this radius, it will be rejected.
      
      PLANNING PHILOSOPHY - GEOGRAPHIC FLOW (CRITICAL):
      ❌ DO NOT assign fixed themes like "Day 1: Arrival", "Day 2: Main Attractions", etc.
      
      ✅ INSTEAD, follow this SPATIAL PLANNING approach:
      
      1. START WITH ARRIVAL AREA:
         - Identify the main entry point or city center of ${tripDetails.destination}
         - For Day 1, suggest places, experiences, and food options WITHIN or NEAR that arrival area
         - Prioritize depth over breadth — fully explore this zone before moving on
      
      2. SUBSEQUENT DAYS - GEOGRAPHIC EXPANSION:
         - If relocating to another area, FIRST explore the surroundings of the current location
         - Group nearby attractions on the same day (within 5-10km of each other)
         - Minimize backtracking — once you leave an area, don't return to it
         - Follow a natural geographic progression (e.g., North → East → South, or City Center → Outskirts)
      
      3. SPATIAL CONTINUITY:
         - Each day should feel like a coherent geographic cluster.
         - Activities should flow naturally from one to the next based on proximity.
         - Group attractions by their geographic direction (e.g., North, South, East, West clusters) to minimize travel time.
         - Avoid zigzagging across the city — maintain logical spatial flow.
      
      4. DEPTH OVER BREADTH:
         - Spend quality time in each area rather than rushing through many locations
         - Allow for immersion and spontaneous exploration
         - Balance efficiency with meaningful experiences
      
      5. THEME FLEXIBILITY:
         - Let the theme emerge organically from the geographic area (e.g., "Exploring the Old City Quarter" instead of "Cultural Day")
         - The 'theme' field should describe the GEOGRAPHIC AREA or SPATIAL JOURNEY, not an arbitrary concept
         - Examples: "Arrival & City Center Exploration", "Northern Temple Circuit", "Coastal Area & Beaches"
      
      95. SEARCH QUERY RULES (CRITICAL):
      - Your 'searchQuery' must be a CLEAN entity name.
      - ❌ FORBIDDEN WORDS: "Departure", "Arrival", "Check-in", "Check-out", "Leisure", "Relaxation", "Lunch", "Dinner", "Shopping".
      - ❌ NO action words: "timings", "aarti", "meditation", "events", "trekking".
      - ❌ NO instructions: "near", "schedule", "view".
      - ✅ GOOD: "Govindaraja Swamy Temple", "Iskcon Temple Tirupati".
      - ❌ BAD: "Departure from Chinnakanal", "Relaxation at resort", "Lunch at local restaurant".
      
      INSTRUCTION: If an activity is generic (like "Rest"), set 'searchQuery' to an empty string.
      
      CONTEXT:
      - Origin: ${tripDetails.origin || "Not specified"}
      - Travelers: ${tripDetails.travelers}
      - Total Budget Limit: ₹${tripDetails.budget} (INR)
      - Interests: ${tripDetails.interests}
      ${originText}
      ${ragContext}
      
      BUDGET ESTIMATION (Indian Rupees ₹):
      The user has a TOTAL budget of ₹${tripDetails.budget} for this entire trip.
      
      INSTRUCTION:
      1. Provide realistic cost estimates for accommodation, food, activities, and transport.
      2. Ensure the 'estimatedCosts.total' does NOT significantly exceed ₹${tripDetails.budget}.
      3. Suggest accommodation (Cheap/Moderate/Luxury) that fits within this financial constraint.
      4. If the budget is very low (e.g. < ₹1000/day), prioritize free activities and budget stays.
      5. If the budget is high, suggest premium experiences.
      
      FAMOUS ATTRACTIONS:
      List the top 5 must-see attractions in ${tripDetails.destination} with:
      - Name and brief description
      - Best time to visit
      - What makes it special/famous
      
      FINAL INSTRUCTION:
      Create an itinerary that feels like an organic, evolving journey across ${tripDetails.destination}.
      The traveler should experience each area fully before moving to the next.
      Prioritize spatial logic, minimize travel time, and maximize immersion.

      OUTPUT FORMAT: JSON ONLY according to this schema:
      {
        "tripName": string,
        "travelAdvice": string,
        "estimatedCosts": {
          "accommodation": number,
          "food": number,
          "activities": number,
          "transport": number,
          "total": number
        },
        "famousAttractions": [
          {
            "name": string,
            "description": string,
            "bestTime": string,
            "specialty": string
          }
        ],
        "days": [
          {
            "dayNumber": number,
            "theme": string,
            "activities": [
              {
                "name": string,
                "type": string,
                "timeSlot": string,
                "description": string,
                "searchQuery": string
              }
            ]
          }
        ]
      }
    `;

  const MAX_RETRIES = keys.length * 2;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const groq = getGroqClient();
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional travel planner API that outputs only structured JSON."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });

      const rawOutput = chatCompletion.choices[0].message.content;
      console.log("🤖 Raw Groq Output:", rawOutput.substring(0, 500) + "...");
      return JSON.parse(rawOutput);

    } catch (error) {
      attempt++;
      if ((error.message.includes("429") || error.message.includes("403")) && attempt < MAX_RETRIES) {
        console.warn(`⚠️ Groq Rate Limited (429/403). Rotating Key...`);
        rotateKey();
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.error("❌ Groq Generation Error:", error.message);
        throw new Error("Failed to generate itinerary with Groq. " + error.message);
      }
    }
  }
  // If all retries fail
  throw new Error("Failed to generate itinerary with Groq after multiple retries.");
};

/**
 * validateTripFeasibility()
 * -------------------------
 * Checks if a trip is realistic based on budget, days, and distance.
 * @returns {Object} - { isPossible: boolean, advice: string }
 */
const validateTripFeasibility = async (tripDetails) => {
  const prompt = `
      TASK: Judge if the following trip is financially and logistically realistic.
      
      TRIP DETAILS:
      - Origin: ${tripDetails.origin || 'Current Location'}
      - Destination: ${tripDetails.destination}
      - Duration: ${tripDetails.days} days
      - Budget: ₹${tripDetails.budget} (Total INR)
      - Travelers: ${tripDetails.travelers}
      - Interests: ${tripDetails.interests}

      CONSIDERATIONS:
      1. Distance: Calculate if the budget covers travel between origin and destination.
      2. Daily Costs: Local stay + 3 meals + entry fees in ${tripDetails.destination}.
      3. Total Logic: If (Budget / Duration) < ₹800, it's very difficult in India.

      OUTPUT FORMAT: JSON only.
      {
        "isPossible": boolean,
        "advice": "Short supportive explanation or suggestion if impossible",
        "recommendedBudget": number (Total INR recommended for this trip)
      }
    `;

  const startTime = Date.now();
  console.log(`🕒 [START] Groq Feasibility Check: ${tripDetails.origin || 'Current Location'} -> ${tripDetails.destination} (Budget: ₹${tripDetails.budget})`);

  const MAX_RETRIES = keys.length + 1;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const groq = getGroqClient();
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a travel feasibility validator that outputs only JSON."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(chatCompletion.choices[0].message.content);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [DONE] Groq Feasibility Check. Possible: ${result.isPossible}. Took ${duration}s.`);
      return result;

    } catch (error) {
      attempt++;
      if ((error.message.includes("429") || error.message.includes("403")) && attempt < MAX_RETRIES) {
        console.warn(`⚠️ Feasibility Check Rate Limited. Rotating...`);
        rotateKey();
        await new Promise(r => setTimeout(r, 1000));
      } else {
        console.error("❌ Feasibility Validation Error:", error);
        return { isPossible: true, advice: "System validation skipped. Proceeding with caution." };
      }
    }
  }
  // If all retries fail, return a default error object
  console.error("❌ Feasibility Validation Error: All retries failed.");
  return { isPossible: true, advice: "System validation skipped due to API errors. Proceeding with caution." };
};

module.exports = { generateItinerary, validateTripFeasibility };
