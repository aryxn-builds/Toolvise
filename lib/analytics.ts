import { createClient } from "@/lib/supabase/client";

/**
 * Records a stack view and increments the views_count column.
 * Silently fails — non-critical.
 */
export async function trackStackView(
  stackId: string,
  viewerId?: string | null
): Promise<void> {
  try {
    const supabase = createClient();

    // Insert the view record
    await supabase.from("stack_views").insert({
      stack_id: stackId,
      viewer_id: viewerId ?? null,
    });

    // Increment the denormalized counter on the stacks table
    // Use raw SQL via rpc if available, otherwise do a read-modify-write
    const { data: stackData } = await supabase
      .from("stacks")
      .select("views_count")
      .eq("id", stackId)
      .maybeSingle();

    if (stackData) {
      await supabase
        .from("stacks")
        .update({ views_count: (stackData.views_count ?? 0) + 1 })
        .eq("id", stackId);
    }
  } catch {
    // Silently ignore — view tracking is non-critical
  }
}

/**
 * Gets the total view count for a stack from the denormalized column.
 */
export async function getViewCount(stackId: string): Promise<number> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("stacks")
      .select("views_count")
      .eq("id", stackId)
      .maybeSingle();
    return data?.views_count ?? 0;
  } catch {
    return 0;
  }
}
