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
  profile: CommentProfile | null;
}

interface CommentsSectionProps {
  stackId: string;   // may be "" if not yet resolved
  shareSlug: string; // always set — used to resolve stackId if needed
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function getInitials(profile: CommentProfile | null): string {
  const name = profile?.display_name || profile?.username || "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function CommentsSection({ stackId, shareSlug }: CommentsSectionProps) {
  const supabase = React.useMemo(() => createClient(), []);

  const [comments, setComments] = React.useState<Comment[]>([]);
  const [resolvedStackId, setResolvedStackId] = React.useState<string>(stackId);
  const [newComment, setNewComment] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [postError, setPostError] = React.useState<string | null>(null);
  const [loadingComments, setLoadingComments] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<{ id: string; email?: string } | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const MAX_CHARS = 500;
  const remaining = MAX_CHARS - newComment.length;

  // ── Profile fetch helper ───────────────────────────────────────────────────
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

  // ── Main init effect ───────────────────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;

    async function init() {
      // Step 1: Get current user
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!cancelled && user) {
          setCurrentUser({ id: user.id, email: user.email ?? "" });
        }
      } catch {
        // not logged in — fine
      }

      // Step 2: Resolve stackId from shareSlug if not provided
      let sid = stackId;
      if (!sid && shareSlug) {
        try {
          const { data: row } = await supabase
            .from("stacks")
            .select("id")
            .eq("share_slug", shareSlug)
            .maybeSingle();
          if (row?.id) {
            sid = row.id;
            if (!cancelled) setResolvedStackId(sid);
          }
        } catch {
          /* ignore */
        }
      }

      if (!sid) {
        if (!cancelled) setLoadingComments(false);
        return;
      }

      // Step 3: Fetch comments
      try {
        const { data, error } = await supabase
          .from("comments")
          .select("id, content, created_at, user_id")
          .eq("stack_id", sid)
          .order("created_at", { ascending: true });

        if (cancelled) return;

        if (error) {
          console.error("[CommentsSection] fetch error:", error);
          if (
            error.code === "42P01" ||
            (error.message && (error.message.includes("relation") || error.message.includes("does not exist")))
          ) {
            setFetchError("Comments are not set up yet. Please run comments-migration.sql in Supabase.");
          } else {
            setFetchError(`Could not load comments: ${error.message}`);
          }
          setLoadingComments(false);
          return;
        }

        const rows = (data as any[]) || [];

        // Step 4: Batch-fetch profiles
        const uniqueIds = Array.from(new Set(rows.map((r: any) => r.user_id as string)));
        const profileMap: Record<string, CommentProfile | null> = {};
        await Promise.all(uniqueIds.map(async (uid) => {
          profileMap[uid] = await fetchProfile(uid);
        }));

        if (cancelled) return;

        setComments(rows.map((row: any) => ({
          id: row.id,
          content: row.content,
          created_at: row.created_at,
          user_id: row.user_id,
          profile: profileMap[row.user_id] ?? null,
        })));
      } catch (err) {
        console.error("[CommentsSection] unexpected error:", err);
        if (!cancelled) setFetchError("Something went wrong loading comments.");
      } finally {
        if (!cancelled) setLoadingComments(false);
      }
    }

    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stackId, shareSlug]);

  // ── Post comment ───────────────────────────────────────────────────────────
  async function postComment() {
    const trimmed = newComment.trim();
    const sid = resolvedStackId || stackId;
    if (!trimmed || !currentUser || posting || !sid) return;
    if (trimmed.length > MAX_CHARS) return;

    setPosting(true);
    setPostError(null);

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({ stack_id: sid, user_id: currentUser.id, content: trimmed })
        .select("id, content, created_at, user_id")
        .single();

      if (error) {
        console.error("[CommentsSection] post error:", error);
        if (error.code === "42501" || (error.message && error.message.includes("policy"))) {
          setPostError("Permission denied. Please sign out and sign back in.");
        } else if (error.message && error.message.includes("foreign key")) {
          setPostError("Session error. Please sign in again.");
        } else if (error.code === "42P01") {
          setPostError("Comments table not set up. Run comments-migration.sql in Supabase.");
        } else {
          setPostError(`Failed to post: ${error.message}`);
        }
        return;
      }

      if (data) {
        const profile = await fetchProfile(currentUser.id);
        setComments((prev) => [...prev, {
          id: (data as any).id,
          content: (data as any).content,
          created_at: (data as any).created_at,
          user_id: (data as any).user_id,
          profile,
        }]);
        setNewComment("");

        // Fire comment notification (non-blocking)
        (async () => {
          try {
            const { data: stackData } = await supabase
              .from("stacks")
              .select("user_id, title")
              .eq("id", sid)
              .maybeSingle();

            if (stackData?.user_id && stackData.user_id !== currentUser.id) {
              const { createNotification } = await import("@/lib/notifications");
              await createNotification({
                userId: stackData.user_id,
                actorId: currentUser.id,
                type: "comment",
                stackId: sid,
                message: `${profile?.display_name || profile?.username || "Someone"} commented on your stack "${stackData.title || "Untitled"}".`,
              });
            }
          } catch {
            /* silently ignore */
          }
        })();
      }
    } catch (err) {
      console.error("[CommentsSection] unexpected post error:", err);
      setPostError("Something went wrong. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  // ── Delete comment ─────────────────────────────────────────────────────────
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
      }
    } catch { /* silent */ } finally {
      setDeletingId(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postComment();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="card-3d p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-bold text-[#E6EDF3]">💬 Discussion</h3>
        <span className="text-sm text-[#E6EDF3]/40">({comments.length})</span>
      </div>

      {/* Comments list */}
      {loadingComments ? (
        <div className="flex items-center gap-2 text-sm text-[#E6EDF3]/40 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading comments...
        </div>
      ) : fetchError ? (
        <div className="flex items-center gap-2 text-sm text-red-400 py-3 bg-red-900/20 border border-red-500/30 rounded-xl px-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{fetchError}</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-[#E6EDF3]/40 space-y-1">
          <p className="text-2xl">💬</p>
          <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-[rgba(240,246,252,0.08)]">
          {comments.map((comment) => {
            const profile = comment.profile;
            const isOwn = currentUser?.id === comment.user_id;
            return (
              <div key={comment.id} className="flex gap-3 py-4">
                <Avatar className="h-9 w-9 border border-[rgba(240,246,252,0.10)] shrink-0">
                  {profile?.avatar_url && (
                    <AvatarImage
                      src={profile.avatar_url}
                      alt={profile.display_name ?? profile.username ?? ""}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-gradient-primary text-[#E6EDF3] text-xs font-bold">
                    {getInitials(profile)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#E6EDF3]">
                      {profile?.display_name || profile?.username || "Anonymous"}
                    </span>
                    {profile?.username && (
                      <span className="text-xs text-[#E6EDF3]/40">@{profile.username}</span>
                    )}
                    <span className="text-xs text-[#2EA043]/70">{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-[#E6EDF3]/80 leading-relaxed break-words">
                    {comment.content}
                  </p>
                </div>

                {isOwn && (
                  <button
                    onClick={() => deleteComment(comment.id)}
                    disabled={deletingId === comment.id}
                    className="shrink-0 p-1.5 rounded-lg text-[#E6EDF3]/30 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                    title="Delete comment"
                  >
                    {deletingId === comment.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Input or login prompt */}
      {currentUser ? (
        <div className="space-y-2 pt-2 border-t border-[rgba(240,246,252,0.10)]/50">
          {postError && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{postError}</span>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => { setNewComment(e.target.value.slice(0, MAX_CHARS)); if (postError) setPostError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Share your thoughts... (Ctrl+Enter to post)"
            rows={3}
            className="w-full resize-none card-3d/30 px-4 py-3 text-sm text-[#E6EDF3] placeholder:text-[#E6EDF3]/30 outline-none focus:border-[#2EA043] focus:ring-2 focus:ring-[#4F8EF7]/30/20 transition-all"
          />
          <div className="flex items-center justify-between">
            <span className={cn("text-xs",
              remaining < 50 ? remaining < 10 ? "text-red-500" : "text-[#2EA043]" : "text-[#E6EDF3]/30"
            )}>
              {remaining} characters left
            </span>
            <button
              onClick={postComment}
              disabled={posting || !newComment.trim() || remaining < 0}
              className="flex items-center gap-2 rounded-xl bg-[#0D1117] px-5 py-2 text-sm font-semibold text-[#E6EDF3] hover:bg-[#2EA043] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Post Comment
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-[rgba(240,246,252,0.10)]/50">
          <Link
            href={`/login?next=/result?slug=${shareSlug}`}
            className="inline-flex items-center gap-2 text-sm text-[#2EA043] font-semibold hover:text-[#2EA043] transition-colors"
          >
            Sign in to join the discussion →
          </Link>
        </div>
      )}
    </section>
  );
}
