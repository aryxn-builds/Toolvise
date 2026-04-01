import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function GET() {
  const key = process.env.GEMINI_API_KEY
  
  if (!key) return NextResponse.json({ error: "No key found" })

  try {
    const genAI = new GoogleGenerativeAI(key)
    // List models to see what's actually available
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
    const data = await response.json()
    
    return NextResponse.json({ 
      success: true,
      keyPrefix: key.substring(0, 8) + "...",
      models: data.models?.map((m: any) => ({
        name: m.name,
        methods: m.supportedGenerationMethods,
        displayName: m.displayName
      })) || []
    })
  } catch (err: unknown) {
    return NextResponse.json({ 
      success: false,
      error: (err as Error).message
    })
  }
}
