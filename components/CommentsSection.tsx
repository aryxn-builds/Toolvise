"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Send, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
  profiles: CommentProfile | null;
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
  const supabase = createClient();

  const [comments, setComments] = React.useState<Comment[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [loadingComments, setLoadingComments] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<{
    id: string;
    email?: string;
  } | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const MAX_CHARS = 500;
  const remaining = MAX_CHARS - newComment.length;

  // Fetch current user + comments on mount
  React.useEffect(() => {
    async function init() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) setCurrentUser({ id: user.id, email: user.email ?? "" });
      } catch {
        // not logged in
      }

      try {
        const { data } = await supabase
          .from("comments")
          .select(
            `id, content, created_at, user_id,
             profiles ( username, display_name, avatar_url )`
          )
          .eq("stack_id", stackId)
          .order("created_at", { ascending: true });

        // Supabase returns profiles as array with joins — normalize
        const normalized: Comment[] = ((data as unknown[]) || []).map((row: unknown) => {
          const r = row as Record<string, unknown>;
          const profilesRaw = r.profiles;
          const profile: CommentProfile = Array.isArray(profilesRaw)
            ? (profilesRaw[0] as CommentProfile) ?? null
            : (profilesRaw as CommentProfile) ?? null;
          return { ...r, profiles: profile } as Comment;
        });
        setComments(normalized);
      } catch {
        // ignore fetch errors
      } finally {
        setLoadingComments(false);
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stackId]);

  async function postComment() {
    if (!newComment.trim() || !currentUser || posting) return;
    if (newComment.trim().length > MAX_CHARS) return;

    setPosting(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          stack_id: stackId,
          user_id: currentUser.id,
          content: newComment.trim(),
        })
        .select(
          `id, content, created_at, user_id,
           profiles ( username, display_name, avatar_url )`
        )
        .single();

      if (!error && data) {
          // Normalize profiles (Supabase returns array on joins)
          const raw = data as Record<string, unknown>;
          const profilesRaw = raw.profiles;
          const profile: CommentProfile = Array.isArray(profilesRaw)
            ? (profilesRaw[0] as CommentProfile) ?? null
            : (profilesRaw as CommentProfile) ?? null;
          const normalized: Comment = { ...raw, profiles: profile } as Comment;
          setComments((prev) => [...prev, normalized]);
          setNewComment("");
        }
    } catch {
      // silent fail — user can retry
    } finally {
      setPosting(false);
    }
  }

  async function deleteComment(commentId: string) {
    setDeletingId(commentId);
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", currentUser!.id);

      if (!error) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
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

  return (
    <section className="rounded-2xl border border-[#FFD896] bg-white p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-bold text-[#111827]">
          💬 Discussion
        </h3>
        <span className="text-sm text-[#111827]/40">
          ({comments.length})
        </span>
      </div>

      {/* Comments list */}
      {loadingComments ? (
        <div className="flex items-center gap-2 text-sm text-[#111827]/40 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-[#111827]/40 space-y-1">
          <p className="text-2xl">💬</p>
          <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-[#FFD896]/50">
          {comments.map((comment) => {
            const profile = comment.profiles;
            const isOwn = currentUser?.id === comment.user_id;

            return (
              <div key={comment.id} className="flex gap-3 py-4">
                {/* Avatar */}
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name ?? profile.username ?? ""}
                    className="h-9 w-9 rounded-full object-cover border border-[#FFD896] shrink-0"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#F97316] to-[#FB923C] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {getInitials(profile)}
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#111827]">
                      {profile?.display_name || profile?.username || "Anonymous"}
                    </span>
                    {profile?.username && (
                      <span className="text-xs text-[#111827]/40">
                        @{profile.username}
                      </span>
                    )}
                    <span className="text-xs text-[#6B7280]">
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-[#111827]/80 leading-relaxed break-words">
                    {comment.content}
                  </p>
                </div>

                {/* Delete button (own comments only) */}
                {isOwn && (
                  <button
                    onClick={() => deleteComment(comment.id)}
                    disabled={deletingId === comment.id}
                    className="shrink-0 p-1.5 rounded-lg text-[#111827]/30 hover:text-red-500 hover:bg-red-50 transition-colors"
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
        <div className="space-y-2 pt-2 border-t border-[#FFD896]/50">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            placeholder="Share your thoughts... (Ctrl+Enter to post)"
            rows={3}
            className="w-full resize-none rounded-xl border border-[#FFD896] bg-[#fff1d6]/30 px-4 py-3 text-sm text-[#111827] placeholder:text-[#111827]/30 outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all"
          />
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-xs",
                remaining < 50
                  ? remaining < 10
                    ? "text-red-500"
                    : "text-amber-500"
                  : "text-[#111827]/30"
              )}
            >
              {remaining} characters left
            </span>
            <button
              onClick={postComment}
              disabled={posting || !newComment.trim() || remaining < 0}
              className="flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-2 text-sm font-semibold text-white hover:bg-[#EA6C0A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <div className="pt-2 border-t border-[#FFD896]/50">
          <Link
            href={`/login?next=/result?slug=${shareSlug}`}
            className="inline-flex items-center gap-2 text-sm text-[#F97316] font-semibold hover:text-[#EA6C0A] transition-colors"
          >
            Sign in to join the discussion →
          </Link>
        </div>
      )}
    </section>
  );
}
