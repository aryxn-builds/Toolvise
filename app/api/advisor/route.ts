import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { nanoid } from "nanoid";
import { createServerClient } from "@/lib/supabase-server";

// ── System prompt ──────────────────────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `You are Toolvise — an expert AI stack advisor for developers, students and startups.
Your job is to analyze what someone wants to build and recommend the perfect tools and tech stack.

Always respond in this exact JSON format:
{
  "summary": "string (2-3 sentence overview)",
  "tools": [
    {
      "name": "string",
      "category": "string (Frontend/Backend/Database/AI/Design/DevOps)",
      "reason": "string (why this tool for their project)",
      "isFree": true/false,
      "learnUrl": "string (best free learning resource URL)",
      "difficulty": "string (Beginner/Intermediate/Advanced)"
    }
  ],
  "roadmap": [
    "string (step by step what to build first)"
  ],
  "estimatedTime": "string (realistic time to build MVP)",
  "proTip": "string (one expert advice for their project)"
}

Rules:
- Recommend 4-6 tools maximum
- Prioritize free tools if budget is Free Only
- Match difficulty to skill level
- Be specific not generic
- Always include a learning resource URL
- Roadmap should have 4-5 clear steps
- Return ONLY valid JSON, no markdown fences or extra text`;

const VIBE_CODING_ADDON = `

Additionally, since the user selected "Vibe Coding" as their build style, add an extra "vibeCoding" object to your JSON response:
{
  "vibeCoding": {
    "aiTools": [
      {
        "name": "string (e.g. Cursor, v0.dev, Bolt, Antigravity)",
        "purpose": "string (what to use it for in this project)",
        "tip": "string (pro tip for using it effectively)"
      }
    ],
    "workflow": [
      "string (step by step vibe coding workflow specific to their project)"
    ],
    "starterPrompt": "string (exact first prompt they should give their AI coding tool to start building this project)"
  }
}
Recommend 2-4 AI coding tools. Workflow should have 4-6 steps. The starter prompt should be detailed and actionable.`;

// ── POST /api/advisor ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Parse & validate request body
    const body = await req.json();
    const userInput: string = body.description || body.userInput || "";
    const skillLevel: string = body.skillLevel || "";
    const budget: string = body.budget || "";
    const goal: string = body.goal || "";
    const buildStyle: string = body.buildStyle || "traditional";

    // Build system prompt conditionally
    const SYSTEM_PROMPT = buildStyle === "vibe"
      ? BASE_SYSTEM_PROMPT + VIBE_CODING_ADDON
      : BASE_SYSTEM_PROMPT;

    if (!userInput || userInput.trim().length < 20) {
      return NextResponse.json(
        { error: "Project description must be at least 20 characters." },
        { status: 400 }
      );
    }

    if (!skillLevel || !budget || !goal) {
      return NextResponse.json(
        { error: "All fields (skillLevel, budget, goal) are required." },
        { status: 400 }
      );
    }

    // 2. Check for API key
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    
    if (!geminiKey && !groqKey) {
      console.error("[advisor] Missing AI API keys");
      return NextResponse.json(
        { error: "Server configuration error. Please try again later." },
        { status: 500 }
      );
    }

    // 3. Build user prompt
    const vibeAddon = buildStyle === "vibe" ? `

IMPORTANT: Since I selected "Vibe Coding" as my build style, you MUST also include a "vibeCoding" object in your JSON response with this exact structure:
{
  "vibeCoding": {
    "aiTools": [
      { "name": "AI tool name like Cursor or v0.dev", "purpose": "what to use it for", "tip": "pro tip" }
    ],
    "workflow": ["step 1", "step 2", "step 3"],
    "starterPrompt": "The exact first prompt to give the AI coding tool to start building this project"
  }
}
Include 2-4 AI coding tools, 4-6 workflow steps, and a detailed actionable starter prompt.` : "";

    const userPrompt = `Here is the project I want to build:

Project Description: ${userInput.trim()}
My Skill Level: ${skillLevel}
Budget: ${budget}
Goal: ${goal}
Build Style: ${buildStyle}

Based on this, recommend me the perfect tech stack.${vibeAddon}`;

    // 4. Call Gemini API, fallback to Groq
    let text = "";

    try {
      if (!geminiKey) throw new Error("No Gemini key available");
      
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        systemInstruction: SYSTEM_PROMPT,
      });

      text = result.response.text();

      if (!text) {
        throw new Error("AI returned an empty response");
      }
    } catch (geminiErr: any) {
      console.warn("[advisor] Gemini failed, falling back to Groq:", geminiErr.message);
      
      try {
        if (!groqKey) throw new Error("No Groq key available");

        const groq = new Groq({ apiKey: groqKey });
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
          ],
          model: "llama-3.1-8b-instant",
          response_format: { type: "json_object" },
          temperature: 0.7,
        });
        
        text = completion.choices[0]?.message?.content || "";
        
        if (!text) {
          throw new Error("Groq returned an empty response");
        }
      } catch (groqErr: any) {
        console.error("[advisor] Groq also failed:", groqErr.message);
        return NextResponse.json(
          { error: "Our AI is taking a short break.\nPlease try again in a few minutes. 🚀" },
          { status: 503 }
        );
      }
    }

    // 5. Parse JSON from response (strip markdown fences if present)
    let parsed;
    try {
      const cleaned = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[advisor] Failed to parse Gemini response:", parseErr);
      console.error("[advisor] Raw response:", text);
      return NextResponse.json(
        { error: "AI returned an invalid response format. Please try again." },
        { status: 502 }
      );
    }

    // 6. Generate share slug
    const shareSlug = nanoid(10);

    // 7. Save to Supabase
    try {
      const supabase = createServerClient();
      const { error: dbError } = await supabase.from("stacks").insert({
        share_slug: shareSlug,
        user_input: userInput.trim(),
        skill_level: skillLevel,
        budget: budget,
        goal: goal,
        build_style: buildStyle,
        summary: parsed.summary || null,
        tools: parsed.tools || null,
        roadmap: parsed.roadmap || null,
        estimated_time: parsed.estimatedTime || null,
        pro_tip: parsed.proTip || null,
        vibe_coding: parsed.vibeCoding || null,
      });

      if (dbError) {
        // Log but don't fail the request — the AI result is still valid
        console.error("[advisor] Supabase insert error:", dbError);
      }
    } catch (dbErr) {
      console.error("[advisor] Supabase connection error:", dbErr);
    }

    // 8. Return full result to frontend
    return NextResponse.json({
      summary: parsed.summary,
      tools: parsed.tools,
      roadmap: parsed.roadmap,
      estimatedTime: parsed.estimatedTime,
      proTip: parsed.proTip,
      vibeCoding: parsed.vibeCoding || null,
      shareSlug,
    });
  } catch (err: unknown) {
    console.error("[advisor] Unhandled error:", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
