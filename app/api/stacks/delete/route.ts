import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(req: NextRequest) {
  try {
    const { stackId } = await req.json();

    if (!stackId) {
      return NextResponse.json({ error: "stackId is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns the stack before deleting
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

    const { error: deleteError } = await supabase
      .from("stacks")
      .delete()
      .eq("id", stackId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("[delete-stack] Supabase error:", deleteError);
      return NextResponse.json({ error: "Failed to delete stack" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[delete-stack] Unhandled error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
