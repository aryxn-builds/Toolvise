import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";

// ── Detail level prompt fragments ──────────────────────────────────────────
const DETAIL_PROMPTS: Record<string, string> = {
  quick: `
DETAIL LEVEL: QUICK GLANCE
- summary: 1-2 sentences max, no fluff
- tools: 3-4 tools ONLY, reason = 1 sentence each
- roadmap: 3 steps max
- estimatedTime: just a number like "3 days"
- proTip: 1 sentence
- scoreCard: still required
- Do NOT include alternatives, warnings, or architecture fields`,

  balanced: `
DETAIL LEVEL: BALANCED
- summary: 2-3 sentences
- tools: 4-5 tools, reason = 2-3 sentences each
- roadmap: 4-5 steps
- estimatedTime: range like "1-2 weeks"
- proTip: 2-3 sentences
- scoreCard: required`,

  deep: `
DETAIL LEVEL: DEEP DIVE
- summary: 4-5 sentences with architecture overview
- tools: 5-6 tools, reason = 3-4 sentences each
  ALSO add for EACH tool:
  - "alternatives": ["alt tool 1", "alt tool 2"] (array of 2 alternative tool names)
  - "warnings": "string (gotchas or limitations of this tool)"
  - "bestFor": "string (when this tool really shines)"
- roadmap: 6-8 detailed steps with substeps
- estimatedTime: detailed breakdown by phase
- proTip: full paragraph with specific advice
- Add a top-level "architecture" field: string explaining how all the recommended tools connect together
- scoreCard: required`,
};

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
  "proTip": "string (one expert advice for their project)",
    "scoreCard": {
      "speedToShip": "number between 1-10",
      "costEfficiency": "number between 1-10",
      "scalability": "number between 1-10",
      "beginnerFriendly": "number between 1-10",
      "flexibility": "number between 1-10",
      "overallScore": "number calculated as: Math.round((speedToShip + costEfficiency + scalability + beginnerFriendly + flexibility) / 5 * 10). Example: if scores are 8,9,8,7,8, average = 8.0, overallScore = 80. IMPORTANT: overallScore MUST be between 1-100. NEVER return overallScore below 50 if individual scores are above 7. NEVER return overallScore as raw sum.",
      "verdict": "one line summary string"
    }
}

Rules:
- estimatedTime: must be a SHORT string like '2-3 weeks' or '1 month'. NEVER return an object for estimatedTime. NEVER return a long sentence. Maximum 30 characters.
- Recommend 4-6 tools maximum
- Prioritize free tools if budget is Free Only
- Match difficulty to skill level
- Be specific not generic
- Roadmap should have 4-5 clear steps
CRITICAL: roadmap MUST be an array of plain strings ONLY. Never use objects with name/substeps. Each item must be a single plain string like:
'Set up Next.js project with Tailwind'
- scoreCard is ALWAYS required — never omit it
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
Recommend 2-4 AI coding tools. Workflow should have 4-6 steps. The starter prompt should be detailed and actionable.

CRITICAL: When buildStyle is "vibe", the vibeCoding object is MANDATORY. You MUST include it in your response. NEVER return null or omit vibeCoding when buildStyle is vibe. If you cannot generate quality content, still return the structure with reasonable placeholder values rather than omitting it.`;

// ── Helpers ────────────────────────────────────────────────────────────────
interface AITool {
  name?: string; Name?: string; tool?: string;
  category?: string; Category?: string;
  reason?: string; Reason?: string; description?: string;
  isFree?: boolean; is_free?: boolean; IsFree?: boolean;
  learnUrl?: string; learn_url?: string; LearnUrl?: string; url?: string; link?: string;
  difficulty?: string; Difficulty?: string; level?: string;
  alternatives?: string[]; warnings?: string; bestFor?: string;
  best_for?: string; Warnings?: string; Alternatives?: string[];
}

interface ScoreCardRaw {
  speedToShip?: number; speed_to_ship?: number; SpeedToShip?: number;
  costEfficiency?: number; cost_efficiency?: number; CostEfficiency?: number;
  scalability?: number; Scalability?: number;
  beginnerFriendly?: number; beginner_friendly?: number; BeginnerFriendly?: number;
  flexibility?: number; Flexibility?: number;
  overallScore?: number; overall_score?: number; OverallScore?: number;
  verdict?: string; Verdict?: string;
}

function buildDefaultVibeCoding(userInput: string) {
  return {
    aiTools: [
      {
        name: "Cursor",
        purpose: "Primary AI coding IDE for building the full project",
        tip: "Describe your entire project in one prompt for best results"
      },
      {
        name: "v0.dev",
        purpose: "Generate UI components instantly from descriptions",
        tip: "Be specific about colors, layout and component behavior"
      }
    ],
    workflow: [
      "Open Cursor and paste the starter prompt below to scaffold the project",
      "Use v0.dev to generate main UI components",
      "Connect your database with AI assistance",
      "Deploy to Vercel with one click"
    ],
    starterPrompt: `Build a ${userInput} using modern web technologies. Set up the full project structure, install dependencies, and create the main pages with basic functionality.`
  };
}

async function callGemini(geminiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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

function parseAIResponse(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned);

  // Merge arrays into a single object
  let merged: Record<string, unknown> = {};
  if (Array.isArray(parsed)) {
    parsed.forEach(item => {
      if (typeof item === "object" && item !== null) {
        merged = { ...merged, ...item };
      }
    });
  } else {
    merged = parsed;
  }

  // Unwrap nested wrappers
  const m = merged as Record<string, unknown>;
  return (m.summary || m.tools || m.Tools
    ? m
    : (m.response || m.stack || m.data || m)) as Record<string, unknown>;
}

function normalizeRoadmap(roadmap: unknown[]): string[] {
  return (roadmap || []).map((step) => {
    if (typeof step === 'string') return step;
    if (typeof step === 'object' && step !== null) {
      const s = step as Record<string, unknown>;
      if (s.name) {
        let text = String(s.name);
        if (Array.isArray(s.substeps)) {
          text += ': ' + (s.substeps as string[]).join(', ');
        }
        return text;
      }
    }
    return String(step ?? '');
  });
}

function normalizeEstimatedTime(time: unknown): string {
  if (!time) return "TBD"
  if (typeof time === 'string') {
    if (time.length > 50) {
      return time.split(',')[0].split(':').pop()?.trim() || time.substring(0, 30)
    }
    return time
  }
  if (typeof time === 'object') {
    const values = Object.values(time as Record<string, string>)
    if (values.length === 0) return "TBD"
    return values.join(' – ')
  }
  return String(time)
}

function normalizeScoreCard(raw: ScoreCardRaw | null | undefined) {
  if (!raw) return null;
  const speed = raw.speedToShip ?? raw.speed_to_ship ?? raw.SpeedToShip ?? 0;
  const cost = raw.costEfficiency ?? raw.cost_efficiency ?? raw.CostEfficiency ?? 0;
  const scale = raw.scalability ?? raw.Scalability ?? 0;
  const beginner = raw.beginnerFriendly ?? raw.beginner_friendly ?? raw.BeginnerFriendly ?? 0;
  const flex = raw.flexibility ?? raw.Flexibility ?? 0;
  
  let overall = raw.overallScore ?? raw.overall_score ?? raw.OverallScore ?? 0;
  const sum = speed + cost + scale + beginner + flex;
  
  // Fix wrong overall score (e.g. raw sum, out of range, etc)
  if (overall > 100 || overall < 10 || overall === sum) {
    overall = Math.round((sum / 5) * 10);
  }

  return {
    speedToShip: speed,
    costEfficiency: cost,
    scalability: scale,
    beginnerFriendly: beginner,
    flexibility: flex,
    overallScore: overall,
    verdict: raw.verdict ?? raw.Verdict ?? "",
  };
}

// ── API Usage Logging ────────────────────────────────────────────────────────
async function logApiUsage(
  provider: string,
  model: string,
  durationMs: number,
  success: boolean,
  isFallback: boolean = false,
  errorMessage?: string,
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("api_usage_logs").insert({
      provider,
      model,
      duration_ms: durationMs,
      success,
      is_fallback: isFallback,
      error_message: errorMessage || null,
    });
    
    if (error) {
      console.error("[advisor] Supabase API log insert error:", error);
    }
  } catch (err) {
    console.error("[advisor] Failed to log API usage:", err);
  }
}

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
    const detailLevel: string = body.detailLevel || "balanced";

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

    // 2. Build system prompt conditionally
    const detailPrompt = DETAIL_PROMPTS[detailLevel] || DETAIL_PROMPTS.balanced;
    let SYSTEM_PROMPT = BASE_SYSTEM_PROMPT + "\n" + detailPrompt;
    if (buildStyle === "vibe") {
      SYSTEM_PROMPT += VIBE_CODING_ADDON;
    }

    // 3. Check for API key
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!geminiKey && !groqKey) {
      console.error("[advisor] Missing AI API keys");
      return NextResponse.json(
        { error: "Server configuration error. Please try again later." },
        { status: 500 }
      );
    }

    // 4. Build user prompt
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
Detail Level: ${detailLevel}

Based on this, recommend me the perfect tech stack.${vibeAddon}`;

    // 5. Call AI (Gemini primary, Groq fallback)
    let text = "";
    const startTime = Date.now();

    try {
      if (!geminiKey) throw new Error("No Gemini key available");
      text = await callGemini(geminiKey, SYSTEM_PROMPT, userPrompt);
      if (!text) throw new Error("AI returned an empty response");
      
      const durationMs = Date.now() - startTime;
      await logApiUsage("gemini", "gemini-1.5-flash", durationMs, true, false);
    } catch (geminiErr: unknown) {
      console.warn("[advisor] Gemini failed, falling back to Groq:", (geminiErr as Error).message);
      
      const geminiDuration = Date.now() - startTime;
      await logApiUsage("gemini", "gemini-1.5-flash", geminiDuration, false, false, (geminiErr as Error).message);

      const groqStartTime = Date.now();
      try {
        if (!groqKey) throw new Error("No Groq key available");
        text = await callGroq(groqKey, SYSTEM_PROMPT, userPrompt);
        if (!text) throw new Error("Groq returned an empty response");
        
        const groqDuration = Date.now() - groqStartTime;
        await logApiUsage("groq", "llama-3.1-8b-instant", groqDuration, true, true);
      } catch (groqErr: unknown) {
        console.error("[advisor] Groq also failed:", (groqErr as Error).message);
        
        const groqDuration = Date.now() - groqStartTime;
        await logApiUsage("groq", "llama-3.1-8b-instant", groqDuration, false, true, (groqErr as Error).message);

        return NextResponse.json(
          { error: "Our AI is taking a short break.\nPlease try again in a few minutes. 🚀" },
          { status: 503 }
        );
      }
    }

    // 6. Parse JSON from response
    let payload: Record<string, unknown>;
    try {
      payload = parseAIResponse(text);
      console.log("[advisor] FULL PARSED API RESPONSE:", JSON.stringify(payload, null, 2));
    } catch (parseErr) {
      console.error("[advisor] Failed to parse AI response:", parseErr);
      console.error("[advisor] Raw response:", text);
      return NextResponse.json(
        { error: "AI returned an invalid response format. Please try again." },
        { status: 502 }
      );
    }

    // 7. Vibe Coding retry: if buildStyle is vibe but vibeCoding is missing, retry once
    if (buildStyle === "vibe" && !payload.vibeCoding && !payload.vibe_coding && !payload.VibeCoding) {
      console.warn("[advisor] vibeCoding missing from response, retrying once...");
      const retryPrompt = userPrompt + `\n\nYour previous response was missing the vibeCoding object. Please include it this time. It is required. Include aiTools (2-4 tools), workflow (4-6 steps), and starterPrompt.`;

      try {
        let retryText = "";
        if (geminiKey) {
          retryText = await callGemini(geminiKey, SYSTEM_PROMPT, retryPrompt);
        } else if (groqKey) {
          retryText = await callGroq(groqKey, SYSTEM_PROMPT, retryPrompt);
        }
        if (retryText) {
          const retryPayload = parseAIResponse(retryText);
          const retryVibe = retryPayload.vibeCoding || retryPayload.vibe_coding || retryPayload.VibeCoding;
          if (retryVibe) {
            payload.vibeCoding = retryVibe;
            console.log("[advisor] vibeCoding recovered from retry");
          }
        }
      } catch (retryErr) {
        console.warn("[advisor] vibeCoding retry also failed:", retryErr);
      }
    }

    // 8. Generate share slug & normalize data
    const shareSlug = nanoid(10);

    const normalizedData = {
      summary: (payload.summary || payload.Summary || payload.overview || "") as string,
      tools: ((payload.tools || payload.Tools || payload.recommendedTools || []) as AITool[]).map((t: AITool) => ({
        name: t.name || t.Name || t.tool || "",
        category: t.category || t.Category || "Other",
        reason: t.reason || t.Reason || t.description || "",
        isFree: t.isFree ?? t.is_free ?? t.IsFree ?? true,
        learnUrl: t.learnUrl || t.learn_url || t.LearnUrl || t.url || t.link || "#",
        difficulty: t.difficulty || t.Difficulty || t.level || "Beginner",
        ...(detailLevel === "deep" ? {
          alternatives: t.alternatives || t.Alternatives || [],
          warnings: t.warnings || t.Warnings || "",
          bestFor: t.bestFor || t.best_for || "",
        } : {}),
      })),
      roadmap: normalizeRoadmap((payload.roadmap || payload.Roadmap || payload.steps || []) as unknown[]),
      estimatedTime: normalizeEstimatedTime(payload.estimatedTime || payload.estimated_time || payload.EstimatedTime || ""),
      proTip: (payload.proTip || payload.pro_tip || payload.ProTip || payload.tip || "") as string,
      vibeCoding: (payload.vibeCoding || payload.vibe_coding || payload.VibeCoding || null) as Record<string, unknown> | null,
      scoreCard: normalizeScoreCard(
        (payload.scoreCard || payload.score_card || payload.ScoreCard || null) as ScoreCardRaw | null
      ),
      architecture: detailLevel === "deep"
        ? ((payload.architecture || payload.Architecture || "") as string)
        : undefined,
    };

    // 9. If vibe coding is STILL null and buildStyle is vibe, inject default
    if (buildStyle === "vibe" && !normalizedData.vibeCoding) {
      console.warn("[advisor] Injecting default vibeCoding fallback");
      normalizedData.vibeCoding = buildDefaultVibeCoding(userInput.trim());
    }

    // 10. Save to Supabase
    try {
      const supabase = await createClient();

      // Get current user (null if not logged in — that's fine)
      const { data: { user } } = await supabase.auth.getUser();

      const { error: dbError } = await supabase.from("stacks").insert({
        share_slug: shareSlug,
        user_id: user?.id ?? null,
        is_public: true,
        user_input: userInput.trim(),
        skill_level: skillLevel,
        budget: budget,
        goal: goal,
        build_style: buildStyle,
        summary: normalizedData.summary || null,
        tools: normalizedData.tools.length ? normalizedData.tools : null,
        roadmap: normalizedData.roadmap.length ? normalizedData.roadmap : null,
        estimated_time: normalizedData.estimatedTime || null,
        pro_tip: normalizedData.proTip || null,
        vibe_coding: normalizedData.vibeCoding || null,
        score_card: normalizedData.scoreCard || null,
      });

      if (dbError) {
        console.error("[advisor] Supabase insert error:", dbError);
      } else if (user?.id) {
        await supabase.rpc('increment_stacks_count', {
          user_id: user.id
        });
      }
    } catch (dbErr) {
      console.error("[advisor] Supabase connection error:", dbErr);
    }

    // 11. Return full result to frontend
    return NextResponse.json({
      summary: normalizedData.summary,
      tools: normalizedData.tools,
      roadmap: normalizedData.roadmap,
      estimatedTime: normalizedData.estimatedTime,
      proTip: normalizedData.proTip,
      vibeCoding: normalizedData.vibeCoding,
      scoreCard: normalizedData.scoreCard,
      architecture: normalizedData.architecture,
      shareSlug,
    });
  } catch (err: unknown) {
    console.error("[advisor] Unhandled error:", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
