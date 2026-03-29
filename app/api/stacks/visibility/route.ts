import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  try {
    const { stackId, isPublic } = await req.json();

    if (!stackId || typeof isPublic !== "boolean") {
      return NextResponse.json(
        { error: "stackId and isPublic (boolean) are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: stack, error: fetchError } = await supabase
      .from("stacks")
      .select("id, user_id")
      .eq("id", stackId)
      .maybeSingle();

    if (fetchError || !stack) {
      return NextResponse.json({ error: "Stack not found" }, { status: 404 });
    }

    if (stack.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from("stacks")
      .update({ is_public: isPublic })
      .eq("id", stackId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[visibility] Supabase error:", updateError);
      return NextResponse.json({ error: "Failed to update visibility" }, { status: 500 });
    }

    return NextResponse.json({ success: true, isPublic });
  } catch (err) {
    console.error("[visibility] Unhandled error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
