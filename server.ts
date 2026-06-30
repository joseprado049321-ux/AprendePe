import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Initialize Firebase Admin SDK
let db: FirebaseFirestore.Firestore | null = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // En AI Studio, a menudo podemos inicializar admin sin credenciales explícitas si el contenedor tiene ADC
  // o podemos usar el projectId
  initializeApp({
    projectId: firebaseConfig.projectId
  });
  db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  console.warn("Could not initialize Firebase Admin in server:", e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Use Gemini SDK
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.post("/api/generate-questions", async (req, res) => {
    try {
      const { subject, level, userId, userHistory, nodeId, lastAccuracy, lastLivesLost } = req.body;
      const diagnosticLevel = userHistory?.diagnosticLevel || level;
      const educationalStage = userHistory?.educationalStage || "Primaria";
      const grade = userHistory?.grade || "Desconocido";
      const diagnosticScore = userHistory?.diagnosticScore || 0;
      const xp = userHistory?.xp || 0;
      const targetLevel = nodeId || 1;

      // Base prompt logic
      let ddaInstruction = "";

      // 1. Check Cache in Firestore
      if (db && userId && userId !== 'guest') {
        try {
          const docRef = db.collection('users').doc(userId).collection('preguntasGeneradas').doc(`${subject}_${targetLevel}`);
          const docSnap = await docRef.get();
          
          if (docSnap.exists) {
            console.log(`[Cache HIT] Returning cached questions for ${userId} - ${subject} - Level ${targetLevel}`);
            const cachedData = docSnap.data();
            return res.json({ questions: cachedData?.questions || [], isNew: false });
          }
        } catch (dbErr) {
          console.warn("CACHE READ ERR:", dbErr);
        }
      }

      console.log(`Calling Gemini for ${subject} at level ${diagnosticLevel} with XP ${xp}`);
      if (lastAccuracy !== undefined && lastAccuracy < 50 || (lastLivesLost !== undefined && lastLivesLost >= 4)) {
        ddaInstruction = "IMPORTANTE: El estudiante está teniendo dificultades con este tema. Reduce silenciosamente la dificultad de las preguntas, utiliza un lenguaje más accesible y enfócate en los conceptos base para ayudarlo a recuperar la confianza, sin decírselo directamente.";
      }

      const prompt = `
        You are an adaptive learning AI for AprendePe.
        Create a new lesson of exactly 10 questions for the subject "${subject}".
        
        TONO Y LENGUAJE: Si la etapa es 'Inicial', usa un lenguaje extremadamente sencillo, historias con animales y palabras cortas. Si es 'Primaria', usa un tono alentador y ejemplos cotidianos. Si es 'Secundaria', usa un lenguaje académico, serio, retador y directo.
        
        DIFICULTAD BASE: El estudiante está en el grado ${grade} de ${educationalStage}. Ajusta el rigor del currículo estrictamente a este nivel oficial. Además, su puntaje diagnóstico fue de ${diagnosticScore}%. Si el puntaje es bajo, inicia enseñando los fundamentos de este grado. Si es alto, dale problemas avanzados o de pensamiento crítico correspondientes a su edad.

        CRITICAL: Estás generando preguntas para el Nivel ${targetLevel}. A mayor nivel, mayor debe ser la complejidad analítica de la pregunta dentro de la misma categoría.
        The user has a diagnostic level of "${diagnosticLevel}" y ${xp} puntos de XP. 
        Evalúa su XP:
        - Si el XP es menor a 500, genera preguntas estándar para su nivel.
        - Si el XP es entre 500 y 2000, aumenta la dificultad con problemas de pensamiento crítico.
        - Si el XP es mayor a 2000, genera preguntas de alta dificultad, nivel olimpiada o análisis profundo.

        ${ddaInstruction}

        Context of the user's past performance (strengths and weaknesses):
        ${JSON.stringify(userHistory || {})}

        Follow a 3-step validation process internally before providing the final result:
        1) Generate 10 tailored questions covering the subject.
        2) Review them to ensure the difficulty perfectly matches the "${diagnosticLevel}" profile and the XP rules.
        3) Validate the logic, spell-check, and ensure there is only one correct answer per question.

        Output only the final 10 validated questions following the exact schema.
      `;

      let generatedQuestions = [];
      let attempts = 0;
      const maxAttempts = 3;
      let delay = 1000;

      while (attempts < maxAttempts) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING, description: "The question text" },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Exactly 4 options"
                    },
                    correctAnswerIndex: { type: Type.NUMBER, description: "0-based index of the correct option" },
                    explanation: { type: Type.STRING, description: "Brief explanation of the answer" }
                  },
                  required: ["text", "options", "correctAnswerIndex", "explanation"]
                }
              }
            }
          });
          generatedQuestions = JSON.parse(response.text || "[]");
          break;
        } catch (error: any) {
          attempts++;
          console.warn(`Attempt ${attempts} failed:`, error?.message || error);
          if (attempts >= maxAttempts) throw error;
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }

      if (db && userId && userId !== 'guest' && generatedQuestions.length > 0) {
        try {
          const docRef = db.collection('users').doc(userId).collection('preguntasGeneradas').doc(`${subject}_${targetLevel}`);
          await docRef.set({
            userId, theme: subject, level: diagnosticLevel, nodeId: targetLevel, questions: generatedQuestions, createdAt: new Date()
          });
        } catch (cacheErr: any) {
          console.warn("CACHE SAVE ERR:", cacheErr?.message || cacheErr);
        }
      }

      res.json({ questions: generatedQuestions, isNew: true });
    } catch (error: any) {
      console.warn("Fallback triggered:", error?.message || "Unknown error");
      res.json({ questions: Array.from({ length: 10 }, (_, i) => ({ text: `Pregunta de ${req.body.subject} #${i + 1}`, options: ["A", "B", "C", "D"], correctAnswerIndex: 1, explanation: "Fallback" })), isFallback: true });
    }
  });

  app.post("/api/generate-diagnostic", async (req, res) => {
    try {
      const { educationalStage, grade, selfAssessedLevel } = req.body;
      
      const prompt = `Actúa como un profesor experto de Perú. Genera una prueba diagnóstica de 5 preguntas de cultura general, razonamiento matemático y comprensión lectora para un estudiante de ${educationalStage}, en el grado ${grade}, que se considera de nivel ${selfAssessedLevel}. 
  REGLAS ESTRICTAS:
  - Si es 'Inicial', usa conceptos básicos (colores, formas, animales).
  - Si es 'Secundaria' en nivel 'Avanzado', haz preguntas retadoras.
  - Devuelve ÚNICAMENTE un arreglo JSON puro con 5 objetos. Cada objeto debe tener: 'text' (la pregunta), 'options' (arreglo de 4 opciones de texto), y 'correctAnswerIndex' (número del 0 al 3).`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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
      const generatedQuestions = JSON.parse(response.text || "[]");
      res.json({ questions: generatedQuestions });
    } catch (error: any) {
      console.warn("Diagnostic fallback triggered:", error?.message);
      res.json({ questions: Array.from({ length: 5 }, (_, i) => ({ text: `Pregunta diagnóstica #${i + 1} (Modo sin conexión)`, options: ["Opción A", "Opción B", "Opción C", "Opción D"], correctAnswerIndex: 1 })) });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
