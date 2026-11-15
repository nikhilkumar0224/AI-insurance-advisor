import "dotenv/config.js";
import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
const genai = new GoogleGenAI({ apiKey: process.env.API_KEY_GEMINI });

app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: "Invalid request." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
