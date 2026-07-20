import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function run() {
  try {
    const prompt = `Actúa como un profesor experto de Perú evaluando bajo los estándares del Currículo Nacional de Educación Básica (CNEB). Genera una prueba diagnóstica de exactamente 10 preguntas que integren cultura general, resolución de problemas (matemáticas) y comprensión lectora para un estudiante de Primaria, en el grado 5, que se considera de nivel Intermedio. 
REGLAS ESTRICTAS:
- Asegúrate de evaluar competencias clave adaptadas a los lineamientos de la RVM N.° 094-2020-MINEDU.
- Si es 'Inicial', usa conceptos básicos (colores, formas, animales, entorno).
- Si es 'Primaria' o 'Secundaria', formula preguntas contextualizadas a la realidad peruana.
- Devuelve ÚNICAMENTE un arreglo JSON puro con 10 objetos. Cada objeto debe tener: 'text' (la pregunta), 'options' (arreglo de exactamente 4 opciones de texto), y 'correctAnswerIndex' (número del 0 al 3).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
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
