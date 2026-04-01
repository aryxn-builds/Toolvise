import { NextResponse } from "next/server"

export async function GET() {
  const key = process.env.GEMINI_API_KEY

  if (!key) {
    return NextResponse.json({ error: "No GEMINI_API_KEY found", keyExists: false })
  }

  const keyPrefix = key.substring(0, 8) + "..."

  // Step 1: List all available models for this API key
  let availableModels: string[] = []
  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
      { headers: { "Referer": "https://toolvise.vercel.app/" } }
    )
    const listData = await listRes.json() as { models?: Array<{ name: string; supportedGenerationMethods?: string[] }> }
    availableModels = (listData.models ?? [])
      .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
      .map(m => m.name)
  } catch (err) {
    return NextResponse.json({
      success: false,
      stage: "listModels",
      error: (err as Error).message,
      keyPrefix,
    })
  }

  if (availableModels.length === 0) {
    return NextResponse.json({
      success: false,
      message: "No generateContent-capable models found for this API key",
      keyPrefix,
    })
  }

  // Step 2: Try the first available model
  const modelFullName = availableModels[0]
  // SDK expects just the model name without "models/" prefix
  const modelId = modelFullName.replace(/^models\//, "")

  try {
    const genRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${modelFullName}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Referer": "https://toolvise.vercel.app/",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say hello in one word" }] }],
        }),
      }
    )
    const genData = await genRes.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      error?: { message: string }
    }

    if (genData.error) {
      return NextResponse.json({
        success: false,
        stage: "generateContent",
        triedModel: modelId,
        error: genData.error.message,
        availableModels,
        keyPrefix,
      })
    }

    const text = genData.candidates?.[0]?.content?.parts?.[0]?.text ?? "(empty)"
    return NextResponse.json({
      success: true,
      winnerModel: modelId,
      response: text,
      availableModels,
      keyPrefix,
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      stage: "generateContent",
      triedModel: modelId,
      error: (err as Error).message,
      availableModels,
      keyPrefix,
    })
  }
}
