/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH & HIERARCHY
 * ------------------------
 * Path: /server/src/services/geminiService.js
 * 
 * 2. STABLE AI IMPLEMENTATION (Controlled Generation)
 * --------------------------------------------------
 * - Using `@google/genai` (v1.0+)
 * - Model: `gemini-2.5-flash`
 * - Feature: Response Schema (Guarantees valid JSON)
 * 
 * Why this? 
 * - Standard JSON parsing often fails when AI adds conversational text.
 * - Response schemas force the model to output *exactly* what the code expects.
 * 
 * ==========================================================================================================================================================
 */

const { GoogleGenAI } = require("@google/genai");

// [KEY ROTATION] Load keys from .env (comma-separated list)
const keys = process.env.GEMINI_API_KEYS 
  ? process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()) 
  : [process.env.GEMINI_API_KEY];

let currentKeyIndex = 0;

console.log(`🔑 Loaded ${keys.length} Gemini API Keys for Rotation.`);

// Helper to get client with current key
const getAI = () => {
    const key = keys[currentKeyIndex];
    // console.log(`🤖 Using Gemini Key Index: ${currentKeyIndex} (Ends with ...${key.slice(-4)})`);
    return new GoogleGenAI({ apiKey: key });
};

// Helper: Rotate Key
const rotateKey = () => {
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    console.warn(`🔄 Switching to Gemini Key Index: ${currentKeyIndex}`);
};

/**
 * generateItinerary()
 * -------------------
 * @param {Object} tripDetails - { destination, days, budget, travelers, interests, origin, realPlaces }
 * @returns {Object} - Structured itinerary JSON
 */
const generateItinerary = async (tripDetails) => {
  try {
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
    `;

    // 🚀 CONTROLLED GENERATION with RETRY LOGIC (Handles 429 Rate Limits)
    // [KEY ROTATION] Increased retries to cycle through keys if needed
    const MAX_RETRIES = keys.length * 2; 
    let attempt = 0;
    let response;

    while (attempt < MAX_RETRIES) {
      try {
        // [ROTATION] Use current key client
        const currentAI = getAI();
        response = await currentAI.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                tripName: { type: "string" },
                travelAdvice: { type: "string" },
                estimatedCosts: {
                  type: "object",
                  properties: {
                    accommodation: { type: "number" },
                    food: { type: "number" },
                    activities: { type: "number" },
                    transport: { type: "number" },
                    total: { type: "number" }
                  }
                },
                famousAttractions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      bestTime: { type: "string" },
                      specialty: { type: "string" }
                    }
                  }
                },
                days: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      dayNumber: { type: "number" },
                      theme: { type: "string" },
                      activities: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            type: { type: "string" },
                            timeSlot: { type: "string" },
                            description: { type: "string" },
                            searchQuery: { type: "string" }
                          },
                          required: ["name", "type", "timeSlot", "description", "searchQuery"]
                        }
                      }
                    },
                    required: ["dayNumber", "theme", "activities"]
                  }
                }
              },
              required: ["tripName", "travelAdvice", "days"]
            }
          }
        });
        break; // Success! Break out of the loop.
      } catch (err) {
        attempt++;
        // Check for 429 (Too Many Requests) OR 403 (Quota Exceeded)
        if ((err.message.includes("429") || err.message.includes("403")) && attempt < MAX_RETRIES) {
          console.warn(`⚠️ Rate limited (429/403). Rotating Key...`);
          rotateKey();
          
          // Small backoff even after rotation to be safe
          const waitTime = 1000; 
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw err; // Not a rate limit or we ran out of retries
        }
      }
    }

    // With Controlled Generation, response.text is guaranteed to be valid JSON.
    const rawOutput = response.text || "";
    console.log("🤖 Raw Gemini Output:", rawOutput.substring(0, 500) + "...");

    return JSON.parse(rawOutput);

  } catch (error) {
    console.error("❌ AI Generation Error:", error.message);
    throw new Error("Failed to generate itinerary. " + error.message);
  }
};

/**
 * validateTripFeasibility()
 * -------------------------
 * Checks if a trip is realistic based on budget, days, and distance.
 * @returns {Object} - { isPossible: boolean, advice: string }
 */
const validateTripFeasibility = async (tripDetails) => {
  try {
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
    console.log(`🕒 [START] AI Feasibility Check: ${tripDetails.origin || 'Current Location'} -> ${tripDetails.destination} (Budget: ₹${tripDetails.budget})`);

    // [ROTATION] Attempt Logic
    let response;
    // Simple retry loop (shorter than itinerary generation)
    for (let i = 0; i < keys.length + 1; i++) { 
        try {
            const currentAI = getAI();
            response = await currentAI.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "object",
                  properties: {
                    isPossible: { type: "boolean" },
                    advice: { type: "string" },
                    recommendedBudget: { type: "number" }
                  },
                  required: ["isPossible", "advice", "recommendedBudget"]
                }
              }
            });
            break; // Success
        } catch (err) {
            if ((err.message.includes("429") || err.message.includes("403")) && i < keys.length) {
                console.warn(`⚠️ Feasibility Check Rate Limited. Rotating...`);
                rotateKey();
                await new Promise(r => setTimeout(r, 1000));
            } else {
                throw err;
            }
        }
    }

    const result = JSON.parse(response.text);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ [DONE] AI Feasibility Check. Possible: ${result.isPossible}. Took ${duration}s.`);

    return result;
  } catch (error) {
    console.error("❌ Feasibility Validation Error:", error);
    // Fallback to true to not block the user if AI fails
    return { isPossible: true, advice: "System validation skipped. Proceeding with caution." };
  }
};

module.exports = { generateItinerary, validateTripFeasibility };
