import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function GET() {
  const key = process.env.GEMINI_API_KEY
  
  if (!key) return NextResponse.json({ error: "No key found" })

  try {
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    const result = await model.generateContent("Say 'System Online' in one word")
    
    return NextResponse.json({ 
      success: true,
      model: "gemini-2.5-flash",
      response: result.response.text(),
      keyPrefix: key.substring(0, 8) + "..."
    })
  } catch (err: unknown) {
    // If it fails, list models too for debugging
    const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
    const modelsData = await modelsRes.json()
    
    return NextResponse.json({ 
      success: false,
      error: (err as Error).message,
      models: modelsData.models?.map((m: { name: string }) => m.name) || [],
      keyPrefix: key.substring(0, 8) + "..."
    })
  }
}
