import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

interface ScoreCard {
  speedToShip: number;
  costEfficiency: number;
  scalability: number;
  beginnerFriendly: number;
  flexibility: number;
  overallScore: number;
}

interface StackInput {
  userInput: string;
  tools?: { name: string }[];
  scoreCard?: ScoreCard | null;
  estimatedTime?: string;
  buildStyle?: string;
}

interface CompareRequest {
  stackA: StackInput;
  stackB: StackInput;
}

async function callGemini(geminiKey: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel(
    {
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    },
    {
      customHeaders: {
        Referer: "https://toolvise.vercel.app/",
      },
    }
  );
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function callGroq(groqKey: string, prompt: string): Promise<string> {
  const groq = new Groq({ apiKey: groqKey });
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a helpful AI that strictly outputs valid JSON without markdown formatting.",
      },
      { role: "user", content: prompt },
    ],
    model: "llama-3.1-8b-instant",
    response_format: { type: "json_object" },
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content || "";
}

export async function POST(req: NextRequest) {
  try {
    const body: CompareRequest = await req.json();
    const { stackA, stackB } = body;

    if (!stackA || !stackB) {
      return NextResponse.json(
        { error: "Both stackA and stackB are required." },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!geminiKey && !groqKey) {
      return NextResponse.json(
        { error: "AI service not configured." },
        { status: 500 }
      );
    }

    const stackATools =
      (stackA.tools || []).map((t) => t.name).join(", ") || "Unknown";
    const stackBTools =
      (stackB.tools || []).map((t) => t.name).join(", ") || "Unknown";

    const prompt = `You are a senior software architect comparing two tech stacks for a developer.

## Stack A — "${stackA.userInput}"
Tools: ${stackATools}
Overall Score: ${stackA.scoreCard?.overallScore ?? "N/A"}/10
Estimated Time: ${stackA.estimatedTime ?? "N/A"}
Build Style: ${stackA.buildStyle ?? "N/A"}

## Stack B — "${stackB.userInput}"
Tools: ${stackBTools}
Overall Score: ${stackB.scoreCard?.overallScore ?? "N/A"}/10
Estimated Time: ${stackB.estimatedTime ?? "N/A"}
Build Style: ${stackB.buildStyle ?? "N/A"}

Compare these stacks and give a clear verdict. Be direct, specific, and practical.

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "winner": "A" or "B" or "Tie",
  "verdict": "2-3 sentence overall comparison verdict",
  "reasons": [
    "Reason 1 why the winner wins (or why it's a tie)",
    "Reason 2 — specific tradeoff",
    "Reason 3 — who should pick which stack"
  ],
  "bestForA": "One sentence: ideal use case for Stack A",
  "bestForB": "One sentence: ideal use case for Stack B"
}`;

    let raw = "";

    try {
      if (!geminiKey) throw new Error("No Gemini key");
      raw = await callGemini(geminiKey, prompt);
    } catch (geminiErr: unknown) {
      console.warn(
        "[compare] Gemini failed, falling back to Groq:",
        (geminiErr as Error).message
      );
      try {
        if (!groqKey) throw new Error("No Groq key available");
        raw = await callGroq(groqKey, prompt);
      } catch (groqErr: unknown) {
        console.error(
          "[compare] Groq also failed:",
          (groqErr as Error).message
        );
        return NextResponse.json(
          {
            error:
              "Our AI is taking a short break. Please try again in a few minutes. 🚀",
          },
          { status: 503 }
        );
      }
    }

    let cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("[compare] AI Response Parse Error. Raw:", raw, err);
      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      winner: parsed.winner ?? "Tie",
      verdict: parsed.verdict ?? "Both stacks are solid choices.",
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
      bestForA: parsed.bestForA ?? "",
      bestForB: parsed.bestForB ?? "",
    });
  } catch (err: unknown) {
    console.error("[compare] Error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
