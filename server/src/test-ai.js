require('dotenv').config({ path: '../.env' });
// Try importing the new SDK
const { GoogleGenAI } = require("@google/genai");

async function testGemini() {
  const key = process.env.GEMINI_API_KEY;
  console.log("🔑 API Key Length:", key ? key.length : "MISSING");

  if (!key) return;

  const ai = new GoogleGenAI({ apiKey: key });

  const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-pro"];

  for (const modelName of modelsToTry) {
    try {
      console.log(`\n🤖 Testing Model (New SDK): ${modelName}...`);
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: "Say hello",
      });
      
      console.log(`✅ ${modelName} WORKED! Response:`, response.text());
      return; 
    } catch (error) {
      console.error(`❌ ${modelName} Failed:`, error.message);
    }
  }
}

testGemini();
