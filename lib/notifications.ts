import { createClient } from "@/lib/supabase/client";

export type NotificationType = "follow" | "upvote" | "comment" | "announcement";

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType;
  stack_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Insert a notification for a target user.
 * Silently fails — never throws.
 */
export async function createNotification({
  userId,
  actorId,
  type,
  stackId,
  message,
}: {
  userId: string;
  actorId?: string;
  type: NotificationType;
  stackId?: string;
  message: string;
}): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from("notifications").insert({
      user_id: userId,
      actor_id: actorId ?? null,
      type,
      stack_id: stackId ?? null,
      message,
    });
  } catch {
    // Silently ignore — notifications are non-critical
  }
}

/**
 * Returns the count of unread notifications for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const supabase = createClient();
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Fetches all notifications for a user, newest first.
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data as Notification[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Marks all notifications as read for a user.
 */
export async function markAllRead(userId: string): Promise<void> {
  try {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
  } catch {
    // Silently ignore
  }
}

/**
 * Marks a single notification as read.
 */
export async function markOneRead(notificationId: string): Promise<void> {
  try {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
  } catch {
    // Silently ignore
  }
}

/**
 * Returns a human-readable time-ago string.
 */
export function timeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
