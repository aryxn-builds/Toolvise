import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const stackATools = (stackA.tools || []).map((t) => t.name).join(", ") || "Unknown";
    const stackBTools = (stackB.tools || []).map((t) => t.name).join(", ") || "Unknown";

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

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
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
