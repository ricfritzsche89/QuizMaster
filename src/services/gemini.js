import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateQuestion = async (category, age) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Generiere eine Quizfrage zum Thema "${category}" für einen Spieler im Alter von ${age} Jahren.
    Die Antwortmöglichkeiten sollen als JSON-Objekt zurückgegeben werden.
    Das Format muss EXAKT so aussehen:
    {
      "question": "Die Frage hier",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Kurze Erklärung"
    }
    Stelle sicher, dass die Schwierigkeit für das Alter ${age} angemessen ist.
    Gib ausschließlich das JSON-Objekt zurück, ohne Markdown-Formatierung (keine \`\`\`json Blöcke).
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Falls die KI doch Markdown-Blöcke liefert, bereinigen wir diese
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
