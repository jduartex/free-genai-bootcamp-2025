import type { Express } from "express";
import { createServer } from "http";
import { Groq } from "groq-sdk";
import { vocabGenerationRequestSchema, vocabGenerationResponseSchema } from "@shared/schema";
import { ZodError } from "zod";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY environment variable is required");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const SYSTEM_PROMPT = `You are a Japanese language expert. Generate structured Japanese vocabulary based on a given theme. 
Output must be valid JSON array following this format:
[{
  "kanji": "漢字",
  "romaji": "romaji",
  "english": "english meaning",
  "parts": [
    {"kanji": "漢", "romaji": ["kan"]},
    {"kanji": "字", "romaji": ["ji"]}
  ]
}]
Always generate at least 5 words related to the theme.`;

export async function registerRoutes(app: Express) {
  app.post("/api/generate", async (req, res) => {
    try {
      const { theme } = vocabGenerationRequestSchema.parse(req.body);

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Generate Japanese vocabulary for the theme: ${theme}` }
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from Groq");
      }

      try {
        const jsonResponse = JSON.parse(response);
        // If response is not an array, wrap it in an array
        const arrayResponse = Array.isArray(jsonResponse) ? jsonResponse : jsonResponse.vocabulary || [jsonResponse];
        const parsedResponse = vocabGenerationResponseSchema.parse(arrayResponse);
        res.json(parsedResponse);
      } catch (parseError) {
        console.error("Error parsing Groq response:", response);
        throw new Error("Invalid JSON response from Groq");
      }
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid request format" });
      } else {
        console.error("Error generating vocabulary:", error);
        res.status(500).json({ message: "Failed to generate vocabulary" });
      }
    }
  });

  return createServer(app);
}