import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 1. Generate Logo Image (using gemini-3-pro-image)
app.post("/api/generate-logo-image", async (req, res) => {
  try {
    const { prompt, size } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(400).json({ error: "Gemini API key is missing. Please configure it in Settings > Secrets." });
      return;
    }

    // Call the high-quality image generation model
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size || "1K", // "1K", "2K", "4K"
        },
      },
    });

    let imageUrl = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          imageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${base64Data}`;
          break;
        }
      }
    }

    if (imageUrl) {
      res.json({ imageUrl });
    } else {
      res.status(500).json({ error: "The model did not return any image data. Please try again with a more descriptive prompt." });
    }
  } catch (error: any) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate image logo" });
  }
});

// 2. Generate Creative Vector SVG Logo Config (using gemini-3.5-flash for rapid client-side rendering)
app.post("/api/generate-logo-config", async (req, res) => {
  try {
    const { prompt, companyName, slogan } = req.body;
    if (!prompt || !companyName) {
      res.status(400).json({ error: "Company name and description prompt are required" });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(400).json({ error: "Gemini API key is missing. Please configure it in Settings > Secrets." });
      return;
    }

    const systemInstruction = `You are an expert logo designer specializing in retro-futuristic, synthwave, dark neon, and modern minimalist vector art.
Based on the company name, slogan, and description, design a gorgeous, pure SVG structure.
You must return your response in raw, strict JSON format with no markdown blocks around it. The JSON must follow this exact typescript schema:

{
  "theme": "synthwave" | "cyberpunk" | "neon_minimalist" | "retro_arcade",
  "backgroundColor": string, // hex or rgb (dark, e.g. #0a0a0f)
  "primaryColor": string, // neon color, e.g. #ff007f
  "secondaryColor": string, // secondary neon, e.g. #00f0ff
  "accentColor": string, // accent glow, e.g. #ffff00
  "shapes": Array<{
    "type": "circle" | "rect" | "polygon" | "path" | "text",
    "cx"?: number, "cy"?: number, "r"?: number, // for circle
    "x"?: number, "y"?: number, "width"?: number, "height"?: number, "rx"?: number, "ry"?: number, // for rect/text
    "points"?: string, // for polygon
    "d"?: string, // for path (e.g. geometric shapes, mountains, retro grids, cassettes, wings)
    "fill"?: string, // "primary", "secondary", "accent", "none", or hex
    "stroke"?: string, // "primary", "secondary", "accent", "none", or hex
    "strokeWidth"?: number,
    "glow"?: boolean, // whether to apply a neon drop-shadow/glow effect
    "animation": "spin" | "pulse" | "float" | "flicker" | "none",
    "animationDuration"?: string, // e.g. "3s"
    "textContent"?: string, // for text
    "fontSize"?: number,
    "fontFamily"?: string,
    "fontWeight"?: string,
    "textAnchor"?: "start" | "middle" | "end"
  }>,
  "developerNotes": string
}

Ensure the designs are visually complex, incorporating beautiful neon accents, grids, geometric grids, triangles, or abstract icons matching the company description. Maintain a consistent coordinate space (0 0 500 500) for the viewport. Make sure the JSON is perfectly valid and does not have extra markdown. Only return the raw JSON object.`;

    const userPrompt = `Company Name: "${companyName}"
Slogan: "${slogan || ""}"
Description: "${prompt}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Logo config generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate logo config" });
  }
});

// 3. Start Video Generation (using veo-3.1-fast-generate-preview)
app.post("/api/generate-video", async (req, res) => {
  try {
    const { prompt, image, mimeType, aspectRatio } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(400).json({ error: "Gemini API key is missing." });
      return;
    }

    // Prepare image payload if provided
    let imagePayload = undefined;
    if (image) {
      // Remove data URL scheme prefix if present
      const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");
      imagePayload = {
        imageBytes: cleanBase64,
        mimeType: mimeType || "image/png",
      };
    }

    const operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt: prompt,
      image: imagePayload,
      config: {
        numberOfVideos: 1,
        resolution: "720p",
        aspectRatio: aspectRatio || "16:9", // "16:9" or "9:16"
      },
    });

    res.json({ operationName: operation.name });
  } catch (error: any) {
    console.error("Video start error:", error);
    res.status(500).json({ error: error.message || "Failed to start video generation" });
  }
});

// 4. Poll Video Status
app.post("/api/video-status", async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      res.status(400).json({ error: "operationName is required" });
      return;
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    res.json({
      done: updated.done,
      error: updated.error,
      metadata: updated.metadata,
    });
  } catch (error: any) {
    console.error("Video status polling error:", error);
    res.status(500).json({ error: error.message || "Failed to check video status" });
  }
});

// 5. Download Generated Video (as arrayBuffer to stream securely to client)
app.post("/api/video-download", async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      res.status(400).json({ error: "operationName is required" });
      return;
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      res.status(404).json({ error: "Video URI not found or video not ready" });
      return;
    }

    const videoRes = await fetch(uri, {
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY || "" },
    });

    if (!videoRes.ok) {
      res.status(videoRes.status).json({ error: `Failed to download video from storage: ${videoRes.statusText}` });
      return;
    }

    const arrayBuffer = await videoRes.arrayBuffer();
    res.setHeader("Content-Type", "video/mp4");
    res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error("Video download error:", error);
    res.status(500).json({ error: error.message || "Failed to download video" });
  }
});

// Serve frontend with Vite in dev, static files in prod
async function startServer() {
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
