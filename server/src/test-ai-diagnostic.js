const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

const test = async () => {
  try {
    const ai = new GoogleGenAI({});
    const MAX_RETRIES = 2;
    let attempt = 0;
    let response;

    console.log("📡 Connecting to gemini-2.5-flash with Retry Logic...");
    
    while (attempt <= MAX_RETRIES) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: "Hello",
        });
        console.log("✅ SUCCESS!");
        console.log("Response:", response.text);
        return;
      } catch (err) {
        if (err.message.includes("429") && attempt < MAX_RETRIES) {
          attempt++;
          console.warn(`🕒 Quota full (429). Retrying in 5s... (${attempt}/${MAX_RETRIES})`);
          await new Promise(r => setTimeout(r, 5000));
        } else {
          throw err;
        }
      }
    }
  } catch (err) {
    console.error("❌ Final Attempt Failed:", err.message);
    if (err.message.includes("429")) {
      console.log("\n💡 ANALYSIS: Your Google AI Studio Key is currently at its TOTAL QUOTA LIMIT.");
      console.log("1. Wait 60 seconds and try again.");
      console.log("2. Check your usage at: https://aistudio.google.com/app/plan_and_billing");
    }
  }
};

test();
