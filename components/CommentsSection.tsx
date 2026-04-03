"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Send, Trash2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CommentProfile {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile: CommentProfile | null; // fetched separately
}

interface CommentsSectionProps {
  stackId: string;
  shareSlug: string;
}

// ── Helper: time ago ──────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Helper: avatar initials ────────────────────────────────────────────────────
function getInitials(profile: CommentProfile | null): string {
  const name = profile?.display_name || profile?.username || "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function CommentsSection({ stackId, shareSlug }: CommentsSectionProps) {
  // Create client once via useMemo to avoid re-instantiation on re-renders
  const supabase = React.useMemo(() => createClient(), []);

  const [comments, setComments] = React.useState<Comment[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [postError, setPostError] = React.useState<string | null>(null);
  const [loadingComments, setLoadingComments] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<{
    id: string;
    email?: string;
  } | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const MAX_CHARS = 500;
  const remaining = MAX_CHARS - newComment.length;

  // ── Fetch profile for a user_id ───────────────────────────────────────────
  async function fetchProfile(userId: string): Promise<CommentProfile | null> {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      return data ?? null;
    } catch {
      return null;
    }
  }

  // ── Init: load user + comments ────────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;

    async function init() {
      // 1. Get current user session
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!cancelled && user) {
          setCurrentUser({ id: user.id, email: user.email ?? "" });
        }
      } catch {
        // not logged in — fine
      }

      // 2. Fetch comments (no join — fetch profiles separately per comment)
      try {
        const { data, error } = await supabase
          .from("comments")
          .select("id, content, created_at, user_id")
          .eq("stack_id", stackId)
          .order("created_at", { ascending: true });

        if (cancelled) return;

        if (error) {
          console.error("[CommentsSection] fetch error:", error);
          if (
            error.code === "42P01" ||
            error.message?.includes("relation") ||
            error.message?.includes("does not exist")
          ) {
            setFetchError(
              "Comments table is not set up yet. Please run comments-migration.sql in Supabase."
            );
          } else {
            setFetchError(`Failed to load comments: ${error.message}`);
          }
          setLoadingComments(false);
          return;
        }

        // Batch-fetch profiles for all unique user_ids
        const rows = (data as any[]) || [];
        const uniqueUserIds = [...new Set(rows.map((r: any) => r.user_id as string))];
        const profileMap: Record<string, CommentProfile | null> = {};

        await Promise.all(
          uniqueUserIds.map(async (uid) => {
            profileMap[uid] = await fetchProfile(uid);
          })
        );

        if (cancelled) return;

        const normalized: Comment[] = rows.map((row: any) => ({
          id: row.id,
          content: row.content,
          created_at: row.created_at,
          user_id: row.user_id,
          profile: profileMap[row.user_id] ?? null,
        }));

        setComments(normalized);
      } catch (err) {
        console.error("[CommentsSection] unexpected error:", err);
        if (!cancelled) setFetchError("Something went wrong loading comments.");
      } finally {
        if (!cancelled) setLoadingComments(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stackId]);

  // ── Post a comment ────────────────────────────────────────────────────────
  async function postComment() {
    const trimmed = newComment.trim();
    if (!trimmed || !currentUser || posting) return;
    if (trimmed.length > MAX_CHARS) return;

    setPosting(true);
    setPostError(null);

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          stack_id: stackId,
          user_id: currentUser.id,
          content: trimmed,
        })
        .select("id, content, created_at, user_id")
        .single();

      if (error) {
        console.error("[CommentsSection] post error:", error);
        if (error.code === "42501" || error.message?.includes("policy")) {
          setPostError("Permission denied. Please sign out and sign back in.");
        } else if (error.message?.includes("foreign key")) {
          setPostError("Your session may have expired. Please sign in again.");
        } else {
          setPostError(`Failed to post: ${error.message}`);
        }
        return;
      }

      if (data) {
        // Fetch profile for the current user to show in the new comment
        const profile = await fetchProfile(currentUser.id);
        const newEntry: Comment = {
          id: (data as any).id,
          content: (data as any).content,
          created_at: (data as any).created_at,
          user_id: (data as any).user_id,
          profile,
        };
        setComments((prev) => [...prev, newEntry]);
        setNewComment("");
      }
    } catch (err) {
      console.error("[CommentsSection] unexpected post error:", err);
      setPostError("Something went wrong. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  // ── Delete a comment ──────────────────────────────────────────────────────
  async function deleteComment(commentId: string) {
    if (!currentUser) return;
    setDeletingId(commentId);
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", currentUser.id);

      if (!error) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        console.error("[CommentsSection] delete error:", error);
      }
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      postComment();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="rounded-2xl border border-border bg-white p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-bold text-foreground">💬 Discussion</h3>
        <span className="text-sm text-foreground/40">({comments.length})</span>
      </div>

      {/* Comments list */}
      {loadingComments ? (
        <div className="flex items-center gap-2 text-sm text-foreground/40 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading comments...
        </div>
      ) : fetchError ? (
        <div className="flex items-center gap-2 text-sm text-red-500 py-3 bg-red-50 rounded-xl px-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{fetchError}</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-foreground/40 space-y-1">
          <p className="text-2xl">💬</p>
          <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-[#FFD896]/50">
          {comments.map((comment) => {
            const profile = comment.profile;
            const isOwn = currentUser?.id === comment.user_id;

            return (
              <div key={comment.id} className="flex gap-3 py-4">
                <Avatar className="h-9 w-9 border border-border shrink-0">
                  {profile?.avatar_url && (
                    <AvatarImage
                      src={profile.avatar_url}
                      alt={profile.display_name ?? profile.username ?? ""}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-400 text-white text-xs font-bold">
                    {getInitials(profile)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">
                      {profile?.display_name || profile?.username || "Anonymous"}
                    </span>
                    {profile?.username && (
                      <span className="text-xs text-foreground/40">
                        @{profile.username}
                      </span>
                    )}
                    <span className="text-xs text-amber-600/70">
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed break-words">
                    {comment.content}
                  </p>
                </div>

                {isOwn && (
                  <button
                    onClick={() => deleteComment(comment.id)}
                    disabled={deletingId === comment.id}
                    className="shrink-0 p-1.5 rounded-lg text-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete comment"
                  >
                    {deletingId === comment.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Comment input or login prompt */}
      {currentUser ? (
        <div className="space-y-2 pt-2 border-t border-border/50">
          {postError && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{postError}</span>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value.slice(0, MAX_CHARS));
              if (postError) setPostError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Share your thoughts... (Ctrl+Enter to post)"
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-background/30 px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-xs",
                remaining < 50
                  ? remaining < 10
                    ? "text-red-500"
                    : "text-amber-500"
                  : "text-foreground/30"
              )}
            >
              {remaining} characters left
            </span>
            <button
              onClick={postComment}
              disabled={posting || !newComment.trim() || remaining < 0}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {posting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post Comment
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-border/50">
          <Link
            href={`/login?next=/result?slug=${shareSlug}`}
            className="inline-flex items-center gap-2 text-sm text-amber-500 font-semibold hover:text-amber-600 transition-colors"
          >
            Sign in to join the discussion →
          </Link>
        </div>
      )}
    </section>
  );
}
