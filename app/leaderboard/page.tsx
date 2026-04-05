"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Flame,
  Layers,
  Trophy,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Builder {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  stacks_count: number;
  followers_count: number;
}

interface ScoreCard {
  overallScore?: number;
}

interface StackProfile {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface TopStack {
  id: string;
  user_input: string;
  upvotes: number;
  share_slug: string;
  score_card: ScoreCard | null;
  build_style: string | null;
  created_at: string;
  profiles: StackProfile | null;
}

type Tab = "builders" | "stacks";
type TimeFilter = "all" | "month" | "week";

// ── Rank badge ────────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-white text-base shadow-sm">
        🥇
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-white text-base shadow-sm">
        🥈
      </span>
    );
  if (rank === 3)
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4F8EF7] text-white text-base shadow-sm">
        🥉
      </span>
    );
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A0A0A] border border-white/10 text-[#F8F8F8]/60 text-xs font-bold">
      {rank}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function UserAvatar({
  url,
  name,
}: {
  url: string | null;
  name: string | null;
}) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className="h-10 w-10 border border-white/10">
      {url && <AvatarImage src={url} alt={name ?? ""} className="object-cover" />}
      <AvatarFallback className="bg-gradient-to-br from-[#4F8EF7] to-[#00D4FF] text-white text-sm font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function LeaderboardSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className="h-16 rounded-xl bg-[#0A0A0A] border border-white/10"
        />
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const supabase = createClient();

  const [tab, setTab] = React.useState<Tab>("builders");
  const [timeFilter, setTimeFilter] = React.useState<TimeFilter>("all");
  const [builders, setBuilders] = React.useState<Builder[]>([]);
  const [stacks, setStacks] = React.useState<TopStack[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      // Top builders
      const { data: buildersData } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url, stacks_count, followers_count"
        )
        .order("stacks_count", { ascending: false })
        .limit(50);

      setBuilders((buildersData as Builder[]) || []);

      // Top stacks — apply time filter
      let query = supabase
        .from("stacks")
        .select(
          `id, user_input, upvotes, share_slug, score_card, build_style, created_at,
           profiles ( username, display_name, avatar_url )`
        )
        .eq("is_public", true)
        .order("upvotes", { ascending: false })
        .limit(20);

      if (timeFilter === "week") {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", weekAgo);
      } else if (timeFilter === "month") {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", monthAgo);
      }

      const { data: stacksData } = await query;
      // Normalize profiles (Supabase returns array for joins)
      const normalizedStacks: TopStack[] = ((stacksData as unknown[]) || []).map((row: unknown) => {
        const r = row as Record<string, unknown>;
        const profilesRaw = r.profiles;
        const profile: StackProfile | null = Array.isArray(profilesRaw)
          ? (profilesRaw[0] as StackProfile) ?? null
          : (profilesRaw as StackProfile) ?? null;
        return { ...r, profiles: profile } as TopStack;
      });
      setStacks(normalizedStacks);
    } catch {
      // silent — show empty states
    } finally {
      setLoading(false);
    }
  }

  const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
    { key: "all", label: "All Time" },
    { key: "month", label: "This Month" },
    { key: "week", label: "This Week" },
  ];

  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-[#F8F8F8]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Page title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h1 className="text-2xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-sm text-[#F8F8F8]/50">
            Top builders and most-upvoted stacks on Toolvise.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-[#0A0A0A] border border-white/10 p-1 w-fit">
          {(
            [
              { key: "builders", label: "🏆 Top Builders", icon: Users },
              { key: "stacks", label: "🔥 Top Stacks", icon: Flame },
            ] as { key: Tab; label: string; icon: React.ElementType }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                tab === key
                  ? "bg-[#0A0A0A] text-white shadow-sm"
                  : "text-[#F8F8F8]/60 hover:text-[#F8F8F8] hover:bg-[#0A0A0A]"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Time filter (only for Stacks tab) */}
        {tab === "stacks" && (
          <div className="flex gap-2">
            {TIME_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeFilter(key)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  timeFilter === key
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-[#0A0A0A] border-white/10 text-[#F8F8F8]/60 hover:border-neutral-900/30"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LeaderboardSkeleton />
        ) : tab === "builders" ? (
          /* ── Top Builders ──────────────────────────── */
          <div className="space-y-2">
            {builders.length === 0 ? (
              <div className="text-center py-16 text-[#F8F8F8]/40">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No builders yet. Be the first!</p>
              </div>
            ) : (
              builders.map((builder, idx) => (
                <Card
                  key={builder.id}
                  className={cn(
                    "border-white/10 bg-[#0A0A0A] hover:shadow-md transition-all",
                    idx < 3 && "border-white/10 ring-1 ring-[#4F8EF7]/30/60"
                  )}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <RankBadge rank={idx + 1} />

                    <UserAvatar
                      url={builder.avatar_url}
                      name={builder.display_name || builder.username}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#F8F8F8] truncate">
                        {builder.display_name || builder.username || "Anonymous"}
                      </p>
                      {builder.username && (
                        <p className="text-xs text-[#F8F8F8]/40 truncate">
                          @{builder.username}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-center hidden sm:block">
                        <p className="text-sm font-bold text-[#F8F8F8]">
                          {builder.stacks_count ?? 0}
                        </p>
                        <p className="text-xs text-[#F8F8F8]/40">Stacks</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-sm font-bold text-[#F8F8F8]">
                          {builder.followers_count ?? 0}
                        </p>
                        <p className="text-xs text-[#F8F8F8]/40">Followers</p>
                      </div>

                      {builder.username && (
                        <Link
                          href={`/profile/${builder.username}`}
                          className="flex items-center gap-1 text-xs font-semibold text-[#4F8EF7] hover:text-[#4F8EF7] transition-colors whitespace-nowrap"
                        >
                          View Profile
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* ── Top Stacks ────────────────────────────── */
          <div className="space-y-2">
            {stacks.length === 0 ? (
              <div className="text-center py-16 text-[#F8F8F8]/40">
                <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No stacks found for this time period.</p>
              </div>
            ) : (
              stacks.map((stack, idx) => {
                const profile = stack.profiles;
                const score = stack.score_card?.overallScore;

                return (
                  <Card
                    key={stack.id}
                    className={cn(
                      "border-white/10 bg-[#0A0A0A] hover:shadow-md transition-all",
                      idx < 3 && "ring-1 ring-[#4F8EF7]/30/60"
                    )}
                  >
                    <CardContent className="p-4 flex items-start gap-4">
                      <RankBadge rank={idx + 1} />

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-sm font-semibold text-[#F8F8F8] line-clamp-2">
                          &quot;{stack.user_input}&quot;
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Builder info */}
                          {profile && (
                            <div className="flex items-center gap-1.5">
                              <UserAvatar
                                url={profile.avatar_url}
                                name={profile.display_name || profile.username}
                              />
                              <span className="text-xs text-[#F8F8F8]/50">
                                {profile.display_name || profile.username || "Anonymous"}
                              </span>
                            </div>
                          )}
                          {stack.build_style && (
                            <Badge className="text-[10px] border-white/10 bg-[#0A0A0A] text-[#F8F8F8]/60">
                              {stack.build_style}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {/* Upvotes */}
                        <div className="text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <Flame className="h-3.5 w-3.5 text-[#4F8EF7]" />
                            <span className="text-sm font-bold text-[#F8F8F8]">
                              {stack.upvotes ?? 0}
                            </span>
                          </div>
                          <p className="text-xs text-[#F8F8F8]/40">upvotes</p>
                        </div>

                        {/* Score intentionally hidden from public leaderboard */}

                        <Link
                          href={`/result?slug=${stack.share_slug}`}
                          className="flex items-center gap-1 text-xs font-semibold text-[#4F8EF7] hover:text-[#4F8EF7] transition-colors whitespace-nowrap"
                        >
                          View Stack
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
