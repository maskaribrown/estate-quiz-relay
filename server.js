import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(cors()); // allow Squarespace frontend
app.use(express.json()); // parse JSON bodies

// ---------------- HEALTHCHECK ----------------
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ---------------- ROUTE: GPT RELAY ----------------
app.post("/generate-report", async (req, res) => {
  try {
    const { score, persona } = req.body;

    if (score === undefined || !persona) {
      return res.status(400).json({ error: "Missing score or persona" });
    }

    const prompt = `
You are a friendly, warm California estate planning attorney.

Write a personalized 130-word report for a quiz taker based on:

Score: ${score}/10
Persona: ${persona}

Focus on:
- What they might not know yet about California estate planning
- Why a properly drafted and funded Living Trust is often essential
- How probate cost & delays can impact families
- When parents especially benefit from planning
- A gentle encouragement to schedule a free call with DeCosimo Law

No fear tactics. Reassuring & helpful tone.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful estate planning attorney.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
      }),
    });

    const data = await response.json();
    console.log("datadata", data);

    const text =
      data?.choices?.[0]?.message?.content ||
      "We couldn't generate a report at this moment.";

    res.json({ report: text });
  } catch (err) {
    console.error("GPT Relay Error:", err);
    res.status(500).json({ error: "Server error generating report" });
  }
});

// ---------------- START SERVER ----------------
const port = process.env.PORT || 10000;
app.listen(port, () =>
  console.log(`Estate Quiz Relay running on port ${port}`)
);
