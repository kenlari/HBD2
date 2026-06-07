import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());

// Lazy-loaded Gemini AI client helper
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("WARNING: GEMINI_API_KEY is not configured or has pre-filled placeholder content.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// REST template for fallback gift suggestions if Gemini fails or is unconfigured
const OFFLINE_FALLBACK_SUGGESTIONS = [
  {
    name: "Custom Acrylic Star Map",
    reason: "A beautiful, premium night-sky print showing the exact alignment of stars on the date of their birthday or another special milestone.",
    estimatedPrice: "$25 - $40",
    category: "Decor"
  },
  {
    name: "Noise-Isolating Desk Pad & Organizer",
    reason: "Perfect for workspace organization, visual comfort, and typing acoustics. Matches focus, tech, and studying interests.",
    estimatedPrice: "$20 - $35",
    category: "Office"
  },
  {
    name: "Cold Brew Maker & Premium Tasting Kit",
    reason: "An easy-to-use premium cold brew pitcher accompanied by single-origin coffee bean samplers. Ideal for coffee enthusiasts.",
    estimatedPrice: "$30 - $50",
    category: "Beverage"
  },
  {
    name: "Retro Styled Ambient Speaker",
    reason: "Combining nostalgia with modern Bluetooth audio fidelity. A great decorative accent piece containing long battery life.",
    estimatedPrice: "$35 - $60",
    category: "Electronics"
  },
  {
    name: "Handcrafted Scented Soy Candle Flight",
    reason: "A curated trio of hand-poured seasonal fragrances designed to elevate relaxation and ambient focus spaces.",
    estimatedPrice: "$18 - $30",
    category: "Relaxation"
  }
];

// Endpoint: Suggest Personalized Gifts using Gemini AI
app.post("/api/gift-suggestions", async (req, res) => {
  try {
    const { interests, relationship, age, budget } = req.body;

    const interestTags = Array.isArray(interests) ? interests : [];
    const rel = relationship || "Friend";
    const userAge = age || "Adult";
    const userBudget = budget || "under $30";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      console.log("Using offline fallback suggestions (no Gemini key configured)");
      return res.json({
        suggestions: OFFLINE_FALLBACK_SUGGESTIONS.slice(0, 3),
        note: "These are offline fallback recommendations. To see personalized live AI suggestions, configure your GEMINI_API_KEY secret in Settings."
      });
    }

    const ai = getGeminiClient();

    const prompt = `Suggest exactly 3 personalized, creative, and unique gift ideas for my friend with these details:
- Interests/Hobbies: ${interestTags.join(", ") || "No specific tags specified"}
- Relationship to me: ${rel}
- Age: ${userAge} years old
- Budget: ${userBudget}

Please make the suggestions look direct, inspiring, and thoughtful (no generic things like 'Amazon Gift Card').`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a creative and expert gift finder and personal shopping assistant. Generate highly tailored, exciting, and specific gift recommendations suited to the interests of the user. Be specific about items, explaining exactly why they suit the interests provided.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              description: "List of exactly 3 curated gift ideas",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Clear name or title of the suggested gift" },
                  reason: { type: Type.STRING, description: "Very engaging explanation explaining why this matches their specific interests & relationship" },
                  estimatedPrice: { type: Type.STRING, description: "Rough price estimate that fits inside the requested budget" },
                  category: { type: Type.STRING, description: "Gift style (e.g. Creative, Tech, Outdoor, Games, Craft, Cooking, Fashion)" }
                },
                required: ["name", "reason", "estimatedPrice", "category"]
              }
            }
          },
          required: ["suggestions"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini API");
    }

    const parsed = JSON.parse(text);
    return res.json({
      suggestions: parsed.suggestions,
      note: "Live suggestions generated by Gemini AI."
    });

  } catch (error: any) {
    console.error("Gemini API suggestion generation error:", error);
    // Graceful fallback to prevent app failure
    return res.json({
      suggestions: OFFLINE_FALLBACK_SUGGESTIONS.slice(0, 3),
      note: `Note: Failed to query Gemini API (${error.message || error}). Displaying fallback recommendations.`
    });
  }
});

// Setup development or production build configs
async function mountViteMiddleware() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running at http://localhost:${PORT}`);
  });
}

mountViteMiddleware();
