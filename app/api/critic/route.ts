import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

const CRITIC_PROMPTS = `You are a strict, senior Principal Engineer acting as a Tech Stack Critic.
Your job is to review a provided tech stack and find its weak points, tradeoffs, or missing pieces.

Be highly critical but constructive. Do not just praise the stack. Point out real engineering risks, operational costs, or missing elements that Junior developers often overlook.

ALWAYS respond in this exact JSON format:
{
  "verdict": "string (1-2 sentence harsh but fair summary)",
  "tradeoffs": [
    { "aspect": "string (e.g. Scaling, Cost, Vendor Lock-in)", "comment": "string (specific issue)" }
  ],
  "missingPiece": "string (what crucial thing did they forget? e.g. monitoring, auth, backups)",
  "scalingBottleneck": "string (what is the first thing that will break at 10k users?)"
}

Rules:
- tradeoffs should have 2-3 items.
- Be concise and direct.
- Return ONLY valid JSON, no markdown fences or extra text.`;

async function callGemini(geminiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { customHeaders: { "Referer": "https://toolvise.vercel.app/" } });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    systemInstruction: systemPrompt,
  });
  return result.response.text();
}

async function callGroq(groqKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const groq = new Groq({ apiKey: groqKey });
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    model: "llama-3.1-8b-instant",
    response_format: { type: "json_object" },
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content || "";
}

function parseAIResponse(text: string): any {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { summary, tools, userInput } = body;

    if (!summary || !tools) {
      return NextResponse.json({ error: "Missing stack details." }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!geminiKey && !groqKey) {
      return NextResponse.json({ error: "API keys missing." }, { status: 500 });
    }

    const userPrompt = `
Original Project Goal: ${userInput || "Not provided"}

Proposed Stack Overview: ${summary}
Recommended Tools:
${tools.map((t: any) => `- ${t.name} (${t.category}): ${t.reason}`).join("\n")}

Criticize this stack. Remember to only return JSON.`;

    let text = "";
    try {
      if (!geminiKey) throw new Error("No Gemini");
      text = await callGemini(geminiKey, CRITIC_PROMPTS, userPrompt);
    } catch {
      if (!groqKey) throw new Error("No keys");
      text = await callGroq(groqKey, CRITIC_PROMPTS, userPrompt);
    }

    const payload = parseAIResponse(text);
    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("[critic] Error:", err);
    return NextResponse.json({ error: "Critic failed." }, { status: 500 });
  }
}
