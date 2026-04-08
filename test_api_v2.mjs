import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function test() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("No key found in .env.local");
    return;
  }
  console.log("Key prefix:", key.substring(0, 8));

  const genAI = new GoogleGenerativeAI(key);
  
  // List models first
  try {
    const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await modelsRes.json();
    console.log("Available models (v1beta):", data.models?.map(m => m.name));
  } catch (e) {
    console.error("Failed to list models:", e.message);
  }

  const testModels = ["gemini-pro-latest", "gemini-2.0-flash-lite", "gemini-3-flash-preview", "gemini-3-pro-preview", "gemini-2.5-flash-lite"];
  
  for (const modelName of testModels) {
    console.log(`\nTesting model: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello, say 'Test Passed'");
      console.log(`Success with ${modelName}:`, result.response.text());
    } catch (e) {
      console.error(`Error with ${modelName}:`, e.message);
    }
  }
}

test();
