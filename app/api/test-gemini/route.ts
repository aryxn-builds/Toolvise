import { NextResponse } from "next/server"

export async function GET() {
  const key = process.env.GEMINI_API_KEY
  if (!key) return NextResponse.json({ error: "No key found" })
    
  try {
    // Probe models list via REST so we see what's actually there
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
    const data = await res.json()
    return NextResponse.json({ 
      success: true,
      keyPrefix: key.substring(0, 8) + "...",
      models: data
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message })
  }
}
