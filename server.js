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

Write a **personalized estate planning guide (1000 words)** for a quiz taker based on:

**Score:** ${score}/10  
**Persona:** ${persona}  

Create a supportive, educational summary that feels tailored to the quiz taker.  
Include:

### **1. What their score suggests about their current understanding**  
- What they seem to know  
- What gaps may still exist  

### **2. A helpful explanation of key California estate planning concepts**  
- Why a properly drafted **and fully funded** Living Trust often matters  
- How **probate costs, delays, and public court filings** can impact families  
- Why **parents, homeowners, and blended families** especially benefit from planning  
- Common mistakes Californians make (gently stated)

### **3. A short, actionable next-step section**  
- What they should prioritize now based on their persona  
- How proper planning can simplify things for loved ones  
- A warm, no-pressure invitation to schedule a complimentary call with DeCosimo Law  

Tone guidelines:  
- No fear tactics  
- Reassuring, clear, personable  
- Empower the reader with knowledge, not worry  
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
