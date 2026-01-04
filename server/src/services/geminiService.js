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

// Client gets API key from environment variable GEMINI_API_KEY
const ai = new GoogleGenAI({});

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
      
      SEARCH QUERY RULES (CRITICAL):
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
      - Budget: ${tripDetails.budget}
      - Interests: ${tripDetails.interests}
      ${originText}
      ${ragContext}
      
      BUDGET ESTIMATION (Indian Rupees ₹):
      Provide realistic cost estimates in INR for:
      - Accommodation per night (based on budget level)
      - Food per day (breakfast, lunch, dinner)
      - Activity/entry fees
      - Local transport
      
      Budget Guidelines:
      - cheap: ₹800-2000/day total
      - moderate: ₹2000-5000/day total
      - luxury: ₹5000+/day total
      
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
    const MAX_RETRIES = 3;
    let attempt = 0;
    let response;

    while (attempt < MAX_RETRIES) {
      try {
        response = await ai.models.generateContent({
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
        if (err.message.includes("429") && attempt < MAX_RETRIES) {
          const waitTime = Math.pow(2, attempt) * 2000; // 4s, 8s
          console.warn(`⚠️ Rate limited (429). Retrying in ${waitTime/1000}s... (Attempt ${attempt}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw err; // Not a 429 or we ran out of retries
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

module.exports = { generateItinerary };
