import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Hola",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The question text" },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactly 4 options" },
              correctAnswerIndex: { type: Type.NUMBER, description: "0-based index of the correct option" }
            },
            required: ["text", "options", "correctAnswerIndex"]
          }
        }
      }
    });
    console.log("SUCCESS");
    console.log(response.text);
  } catch (e) {
    console.error("FAILED", e);
  }
}
run();
