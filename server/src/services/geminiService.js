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
      
      SEARCH QUERY RULES (CRITICAL):
      - Your 'searchQuery' must be a CLEAN entity name.
      - ❌ NO action words: "timings", "aarti", "lunch", "dinner", "meditation", "events".
      - ❌ NO instructions: "near", "schedule", "view".
      - ✅ GOOD: "Govindaraja Swamy Temple", "Iskcon Temple Tirupati".
      - ❌ BAD: "Govindaraja Swamy Temple evening aarti", "Restaurants near temple".
      
      CONTEXT:
      - Origin: ${tripDetails.origin || "Not specified"}
      - Travelers: ${tripDetails.travelers}
      - Budget: ${tripDetails.budget}
      - Interests: ${tripDetails.interests}
      ${originText}
      ${ragContext}
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
