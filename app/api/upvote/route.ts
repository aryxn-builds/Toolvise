import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use the anon key but call an RPC function that has SECURITY DEFINER
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stackId } = body;

    if (!stackId) {
      return NextResponse.json({ error: "stackId is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Use RPC function to increment upvotes atomically
    const { data, error } = await supabase.rpc("increment_upvote", {
      stack_id: stackId,
    });

    if (error) {
      console.error("[upvote] RPC error:", error);
      return NextResponse.json({ error: "Failed to upvote" }, { status: 500 });
    }

    return NextResponse.json({ upvotes: data });
  } catch (err) {
    console.error("[upvote] Unhandled error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
