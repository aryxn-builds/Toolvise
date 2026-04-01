import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const MODELS_TO_TRY = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-pro",
]

const CUSTOM_HEADERS = { "Referer": "https://toolvise.vercel.app/" }

export async function GET() {
  const key = process.env.GEMINI_API_KEY

  if (!key) {
    return NextResponse.json({ error: "No GEMINI_API_KEY found", keyExists: false })
  }

  const results: Record<string, unknown> = {}

  for (const modelName of MODELS_TO_TRY) {
    try {
      const genAI = new GoogleGenerativeAI(key)
      const model = genAI.getGenerativeModel(
        { model: modelName },
        { customHeaders: CUSTOM_HEADERS, apiVersion: "v1" }
      )
      const result = await model.generateContent("Say hello in one word")
      results[modelName] = { success: true, response: result.response.text() }
      // First success — return immediately with winner
      return NextResponse.json({
        winner: modelName,
        success: true,
        response: result.response.text(),
        keyPrefix: key.substring(0, 8) + "...",
      })
    } catch (err: unknown) {
      results[modelName] = { success: false, error: (err as Error).message }
    }
  }

  return NextResponse.json({
    success: false,
    message: "All models failed",
    results,
    keyPrefix: key.substring(0, 8) + "...",
  })
}
