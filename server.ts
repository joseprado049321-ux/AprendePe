// @ts-ignore
import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Initialize Firebase Admin SDK
let db: FirebaseFirestore.Firestore | null = null;
try {
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'aprendepe-team'
  });
  db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  console.warn("Could not initialize Firebase Admin in server:", e);
}

const app = express();
const PORT = process.env.PORT || 3000;

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
      
      DIFICULTAD BASE Y CNEB: El estudiante está en el grado ${grade} de ${educationalStage}. Ajusta el rigor del currículo estrictamente a este nivel oficial basándote en el Currículo Nacional de la Educación Básica (CNEB) del Perú. 
      Asigna una "cnebCompetence" (Competencia del CNEB) oficial y específica a cada pregunta (ej. "Resuelve problemas de cantidad", "Lee diversos tipos de textos escritos", etc.) adecuada para el Nivel ${targetLevel}.
      Además, su puntaje diagnóstico fue de ${diagnosticScore}%. Si el puntaje es bajo, inicia enseñando los fundamentos de este grado. Si es alto, dale problemas avanzados.

      FORMATOS DE PREGUNTA: Para hacer la lección interactiva, debes generar una mezcla de los siguientes tipos de pregunta (type):
      1. 'multiple_choice': Pregunta estándar con 4 opciones.
      2. 'true_false': Pregunta de verdadero o falso. Debes proveer exactamente 2 opciones ("Verdadero", "Falso").
      3. 'fill_in_the_blanks': Una oración con un espacio en blanco. Debes proveer 'blankSentence' (ej. "El perro ___ rápido.") y 'correctWords' (ej. ["corre"]). Las 'options' pueden estar vacías o tener distractores.

      CRITICAL: Estás generando preguntas para el Nivel ${targetLevel}. A mayor nivel, mayor debe ser la complejidad analítica.
      The user has a diagnostic level of "${diagnosticLevel}" y ${xp} puntos de XP. 
      Evalúa su XP para ajustar la dificultad:
      - < 500 XP: estándar.
      - 500-2000 XP: problemas de pensamiento crítico.
      - > 2000 XP: nivel avanzado/olimpiada.

      ${ddaInstruction}

      Context of the user's past performance:
      ${JSON.stringify(userHistory || {})}

      Output only the final 10 validated questions following the exact schema.
    `;

    let generatedQuestions = [];
    let attempts = 0;
    const maxAttempts = 3;
    let delay = 1000;

    while (attempts < maxAttempts) {
      try {
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
                  type: { type: Type.STRING, description: "One of: 'multiple_choice', 'true_false', 'fill_in_the_blanks'" },
                  text: { type: Type.STRING, description: "The question text or instruction" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Options to choose from (4 for multiple_choice, 2 for true_false)"
                  },
                  correctAnswerIndex: { type: Type.NUMBER, description: "0-based index of the correct option (use 0 for fill_in_the_blanks if not applicable)" },
                  explanation: { type: Type.STRING, description: "Brief explanation of the answer" },
                  cnebCompetence: { type: Type.STRING, description: "The official CNEB competence evaluated here" },
                  blankSentence: { type: Type.STRING, description: "For fill_in_the_blanks: The sentence with '___' for the blank" },
                  correctWords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "For fill_in_the_blanks: The correct word(s) that go in the blank" }
                },
                required: ["type", "text", "options", "correctAnswerIndex", "explanation", "cnebCompetence"]
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
    console.error("Error crítico en la API:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
      stack: error.stack
    });
  }
});

app.post("/api/generate-diagnostic", async (req, res) => {
  try {
    const { educationalStage, grade, selfAssessedLevel } = req.body;

    const prompt = `Actúa como un profesor experto de Perú evaluando bajo los estándares del Currículo Nacional de Educación Básica (CNEB). Genera una prueba diagnóstica de exactamente 10 preguntas que integren cultura general, resolución de problemas (matemáticas) y comprensión lectora para un estudiante de ${educationalStage}, en el grado ${grade}, que se considera de nivel ${selfAssessedLevel}. 
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
    const generatedQuestions = JSON.parse(response.text || "[]");
    res.json({ questions: generatedQuestions });
  } catch (error: any) {
    console.error("Error crítico en la API:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
      stack: error.stack
    });
  }
});

app.post("/api/explain-mistake", async (req, res) => {
  try {
    const { questionText, options, userAnswer, correctAnswer, subject, stage } = req.body;
    const studentStage = stage || "Primaria";

    let toneInstruction = "Usa un tono alentador, pedagógico y comprensivo con ejemplos sencillos.";
    if (studentStage === "Inicial") {
      toneInstruction = "Usa un tono muy tierno y comprensible para niños de 3 a 5 años, usando metáforas con animalitos, colores o juegos.";
    } else if (studentStage === "Secundaria") {
      toneInstruction = "Usa un tono académico pero didáctico, explicando el principio lógico o científico de fondo de manera clara y directa.";
    }

    const prompt = `
      Actúa como el tutor pedagógico inteligente y empático de AprendePe (plataforma educativa del Perú).
      Un estudiante se ha equivocado al responder esta pregunta y necesita una EXPLICACIÓN DETALLADA, DIDÁCTICA Y MUY FÁCIL DE ENTENDER para dominar el concepto.

      DATOS DE LA PREGUNTA:
      - Materia: ${subject || "General"}
      - Nivel escolar: ${studentStage}
      - Pregunta planteada: "${questionText}"
      - Opciones disponibles: ${JSON.stringify(options || [])}
      - Respuesta que seleccionó el estudiante: "${userAnswer}"
      - Respuesta correcta: "${correctAnswer}"

      PAUTAS PEDAGÓGICAS CLAVE:
      ${toneInstruction}
      - La explicación debe ser MUY FÁCIL DE COMPRENDER y amena (adecuada a la edad del estudiante). Usa ejemplos cotidianos si aplica.
      - Desglosa el razonamiento con claridad:
        1. ¿Por qué la alternativa "${userAnswer}" no era la correcta (con empatía y ánimo)?
        2. ¿Por qué "${correctAnswer}" sí es la correcta, explicado paso a paso?
      - El consejo/tip debe ser un truco práctico o mnemotécnico memorable para resolver preguntas similares en el futuro.

      Genera una respuesta JSON con la siguiente estructura:
      1. 'explanation': Explicación detallada, clara, motivadora y paso a paso.
      2. 'tip': Consejo o truco práctico fácil de recordar.
      3. 'keyConcept': Tema o concepto principal en 2-4 palabras.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING, description: "Detailed and clear pedagogical explanation" },
            tip: { type: Type.STRING, description: "Quick memory tip or practical advice" },
            keyConcept: { type: Type.STRING, description: "Central topic or concept name" }
          },
          required: ["explanation", "tip", "keyConcept"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json({
      explanation: result.explanation || `La respuesta correcta es "${correctAnswer}". Recuerda repasar este tema con calma.`,
      tip: result.tip || "¡La práctica constante hace al maestro!",
      keyConcept: result.keyConcept || subject || "Concepto clave"
    });
  } catch (error: any) {
    console.error("Error en /api/explain-mistake:", error);
    // Fallback amigable si la IA falla
    const { correctAnswer, userAnswer } = req.body;
    res.json({
      explanation: `La respuesta correcta es "${correctAnswer}". Tu opción fue "${userAnswer}". ¡No te desanimes, equivocarse es parte fundamental de aprender!`,
      tip: "Lee atentamente cada alternativa antes de seleccionar tu respuesta.",
      keyConcept: "Refuerzo pedagógico"
    });
  }
});

if (process.env.NODE_ENV !== 'production') {
  import('vite').then(async (viteModule) => {
    const viteServer = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(viteServer.middlewares);
  }).catch((err) => console.error("Error cargando Vite dinámicamente:", err));
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*all', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Comentado para Vercel Serverless
// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

// Exportar la app para Vercel Serverless Functions
export default app;

