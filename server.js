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
    const { score, persona, questions } = req.body;
    const correctQuestions = questions.filter((q) => q.correct).map((q) => q.q);
    const wrongQuestions = questions.filter((q) => !q.correct).map((q) => q.q);

    if (score === undefined || !persona) {
      return res.status(400).json({ error: "Missing score or persona" });
    }

    const prompt = `
You are a friendly, warm California estate planning attorney.

Write a **personalized estate planning guide (30 words)** for a quiz taker based on:

**Score:** ${score}/10  
**Persona:** ${persona}  
**Questions the user got wrong and made a mistake with are. ${correctQuestions}
**Questions the user got wrong and made a mistake with are. ${wrongQuestions}

Create a supportive, educational summary that feels tailored to the quiz taker.  
Include: (everything based on correctQuestions and wrongQuestions they answered)

First include whether they are High risk < 3 score, moderate risk <7 >3 , or Low Risk.

### **1. What their score suggests about their current understanding**  
- What they seem to know  
- What gaps may still exist  

### **3. A short, actionable next-step section**  
- What they should prioritize now based on their persona  
- How proper planning can simplify things for loved ones  
- A warm, no-pressure invitation to schedule a complimentary call with DeCosimo Law  

Finally ask the user to Enter your email below to get a full answers with explanations.

Tone guidelines:  
- No fear tactics  
- Reassuring, clear, personable  
- Empower the reader with knowledge, not worry  

return html so I can embed it.
don't include any input or backtick html tag
for high risk, show a red stop sign emoji. for moderate show yellow, for ither show green
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
