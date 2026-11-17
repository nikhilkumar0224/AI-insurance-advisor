import "dotenv/config";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { buildTinaPrompt, buildRecommendationPrompt } from "./prompts.js";

const TOTAL_CUSTOMER_MESSAGES = 7;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

if (!process.env.API_KEY_GEMINI) {
  console.error("Missing API_KEY_GEMINI in backend/.env");
  process.exit(1);
}

const app = express();
const genai = new GoogleGenAI({ apiKey: process.env.API_KEY_GEMINI });

app.use(express.json({ limit: "20kb" }));

// A simple route to check the server is running
app.get("/", (req, res) => {
  res.send("Backend running");
});

// for the flow of question and answer one by one
function chatIsValid(messages) {
  if (!Array.isArray(messages)) return false;
  if (messages.length < 2 || messages.length % 2 !== 0) return false;
  if (messages.length > TOTAL_CUSTOMER_MESSAGES * 2) return false;

  return messages.every((m, index) => {
    const expectedRole = index % 2 === 0 ? "tina" : "user";
    return (
      m &&
      m.role === expectedRole &&
      typeof m.text === "string" &&
      m.text.trim() !== "" &&
      m.text.length <= 1000
    );
  });
}

// Recieve messages and send back reply
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body ?? {};

  // Check the data
  if (!chatIsValid(messages)) {
    return res.status(400).json({ error: "Invalid conversation." });
  }

  const customerMessages = messages.filter(
    (message) => message.role === "user",
  ).length;

  // Decide what Tina does now: ask another question, or give the recommendation
  const isFinalTurn = customerMessages >= TOTAL_CUSTOMER_MESSAGES;
  const systemInstruction = isFinalTurn
    ? buildRecommendationPrompt()
    : buildTinaPrompt(customerMessages, TOTAL_CUSTOMER_MESSAGES);

  // simple Hi from the user first
  const contents = [{ role: "user", parts: [{ text: "Hi" }] }];
  for (const m of messages) {
    contents.push({
      role: m.role === "tina" ? "model" : "user",
      parts: [{ text: m.text }],
    });
  }

  // Ask Gemini and send its reply back to the page
  try {
    const response = await genai.models.generateContent({
      model: MODEL,
      contents: contents,
      config: { systemInstruction },
    });

    if (!response.text) {
      throw new Error("Empty reply from Gemini");
    }

    res.json({ reply: response.text.trim(), finished: isFinalTurn });
  } catch (err) {
    console.error("Gemini error:", err);
    console.error("Status:", err.status);
    console.error("Message:", err.message);
    console.error("Details:", err.response?.data);
    if (err.status === 429) {
      return res.status(429).json({
        error: "Too many requests. Please wait a minute and try again.",
      });
    }
    res.status(500).json({ error: "Tina could not reply. Please try again." });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: "Invalid request." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
