import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function GET() {
  const key = process.env.GEMINI_API_KEY
  
  if (!key) return NextResponse.json({ error: "No key found" })

  try {
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent("Say hello in one word")
    
    return NextResponse.json({ 
      success: true,
      model: "gemini-2.0-flash",
      response: result.response.text(),
      keyPrefix: key.substring(0, 8) + "..."
    })
  } catch (err: unknown) {
    return NextResponse.json({ 
      success: false,
      error: (err as Error).message,
      keyPrefix: key.substring(0, 8) + "..."
    })
  }
}
