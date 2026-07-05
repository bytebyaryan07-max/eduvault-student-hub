import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const app = express();
const PORT = 3000;

// Middleware for JSON parsing with increased limits
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in environment variables. AI features may fail.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 2. AI Recommendation Endpoint
app.post("/api/recommendations", async (req, res) => {
  try {
    const { userProfile, bookmarks, allResources, query } = req.body;
    
    const client = getAiClient();
    
    const prompt = `
You are the AI Recommendation Engine for "EduVault", India's largest student resource-sharing platform.
Based on the user's details and active resources, generate study recommendations in JSON format.

User Profile:
- Role: ${userProfile?.role || 'student'}
- College: ${userProfile?.college || 'General College'}
- Course/Stream: ${userProfile?.course || 'General Studies'}

User Bookmarked Resources Count: ${bookmarks?.length || 0}
Active Search Query (if any): "${query || ''}"

Available Resources on the platform:
${JSON.stringify(allResources?.map((r: any) => ({
  id: r.id,
  title: r.title,
  category: r.category,
  subject: r.subject,
  course: r.course,
  college: r.college,
  year: r.year
})) || [])}

Please output a valid JSON object ONLY, containing:
1. "suggestedSubjectKeys": An array of 3 string subject names most relevant to the user's course or search.
2. "recommendedResourceIds": An array of up to 4 resource IDs from the list of available resources that are highly recommended.
3. "studyAdvice": A short, motivational study tip (1-2 sentences) tailored to their profile (e.g. engineering, BCA, BCom, board exams, etc.).
4. "trendingTopics": An array of 3 string trending topic names for their field.

Return ONLY the raw JSON string. Do not wrap it in markdown code blocks like \`\`\`json.
`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    res.json(JSON.parse(responseText));
  } catch (error: any) {
    console.error("Error in AI Recommendations:", error);
    // Fallback safe recommendations if API fails or is not configured
    res.json({
      suggestedSubjectKeys: ["Mathematics", "Physics", "Computer Science"],
      recommendedResourceIds: [],
      studyAdvice: "Keep organizing your notes daily! Active recall and spaced repetition are your best friends.",
      trendingTopics: ["Artificial Intelligence", "Quantum Computing", "Data Structures"]
    });
  }
});

// 3. AI Smart Assistant Study Planner / Summary
app.post("/api/study-assistant", async (req, res) => {
  try {
    const { resourceTitle, resourceContent, userMessage, history } = req.body;
    const client = getAiClient();

    const prompt = `
You are the "EduVault AI Study Assistant", helping a student learn from their uploaded educational materials.
You are friendly, academic, concise, and explain difficult concepts in a simple way.

Resource being viewed:
- Title: ${resourceTitle || 'General Notes'}
- Material Content/Context: ${resourceContent || 'No written content has been attached. The student is asking general questions.'}

User's Query: "${userMessage}"

Chat History:
${JSON.stringify(history || [])}

Provide a helpful, highly formatted response in Markdown format. Limit your response to 2-3 paragraphs or structured bullet points so it is fast and easy to read. Include visual subheadings.
`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in AI Study Assistant:", error);
    res.json({ text: "I'm sorry, I encountered an issue connecting to my brain. Please try again! But remember: reviewing your material systematically is key!" });
  }
});

// 4. Vite Dev Server Integration & Static Assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduVault Fullstack Server running on http://localhost:${PORT}`);
  });
}

startServer();
