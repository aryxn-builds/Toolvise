const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const groqKey = env.match(/GROQ_API_KEY=(.*)/)[1].trim();
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: groqKey });

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

const userPrompt = `Here is the project I want to build:

Project Description: AI-powered web scraper for real estate data
My Skill Level: intermediate
Budget: mix
Goal: mvp
Build Style: vibe

Based on this, recommend me the perfect tech stack.

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
Include 2-4 AI coding tools, 4-6 workflow steps, and a detailed actionable starter prompt.`;

async function main() {
  const completion = await groq.chat.completions.create({
    messages: [
      {role: 'system', content: BASE_SYSTEM_PROMPT},
      {role: 'user', content: userPrompt}
    ],
    model: 'llama-3.1-8b-instant',
    response_format: { type: 'json_object' }
  });
  console.log(completion.choices[0]?.message?.content);
}

main().catch(console.error);
