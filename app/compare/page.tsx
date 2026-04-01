"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  GitCompare,
  Loader2,
  Share2,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────
interface ScoreCard {
  speedToShip: number;
  costEfficiency: number;
  scalability: number;
  beginnerFriendly: number;
  flexibility: number;
  overallScore: number;
  verdict?: string;
}

interface Tool {
  name: string;
  category?: string;
}

interface Stack {
  id: string;
  userInput: string;
  tools: Tool[];
  scoreCard: ScoreCard | null;
  estimatedTime: string;
  buildStyle?: string;
  shareSlug: string;
  summary?: string;
}

interface VerdictData {
  winner: "A" | "B" | "Tie";
  verdict: string;
  reasons: string[];
  bestForA: string;
  bestForB: string;
}

// ── Score bar component ───────────────────────────────────────────────────────
function ScoreBar({
  value,
  isWinner,
}: {
  value: number;
  isWinner: boolean;
}) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 rounded-full bg-[#FFD896]/40 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            isWinner ? "bg-[#F97316]" : "bg-[#111827]/20"
          )}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <span
        className={cn(
          "text-sm font-bold w-8 text-right",
          isWinner ? "text-[#F97316]" : "text-[#111827]/50"
        )}
      >
        {value}/10
      </span>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function CompareSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className="h-14 bg-white rounded-xl border border-[#FFD896]" />
      ))}
    </div>
  );
}

// ── Main compare content ──────────────────────────────────────────────────────
function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [slugA, setSlugA] = React.useState(searchParams.get("a") ?? "");
  const [slugB, setSlugB] = React.useState(searchParams.get("b") ?? "");
  const [stackA, setStackA] = React.useState<Stack | null>(null);
  const [stackB, setStackB] = React.useState<Stack | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [verdictData, setVerdictData] = React.useState<VerdictData | null>(null);
  const [verdictLoading, setVerdictLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [recentSlugs, setRecentSlugs] = React.useState<
    { slug: string; label: string }[]
  >([]);

  // Load recent stacks from localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("toolvise_recent_stacks");
      if (raw) {
        const parsed = JSON.parse(raw) as {
          slug: string;
          label: string;
        }[];
        setRecentSlugs(parsed.slice(0, 5));
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-load from URL params on mount
  React.useEffect(() => {
    const a = searchParams.get("a");
    const b = searchParams.get("b");
    if (a && b) {
      handleCompare(a, b);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchStack(slug: string): Promise<Stack | null> {
    const cleanSlug = slug.trim().replace(/^.*\/result\?slug=/, "");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("stacks")
      .select("id, user_input, tools, score_card, estimated_time, build_style, share_slug, summary")
      .eq("share_slug", cleanSlug)
      .single();

    if (error || !data) return null;

    return {
      id: data.id as string,
      userInput: (data.user_input as string) ?? "",
      tools: ((data.tools as Tool[]) || []),
      scoreCard: (data.score_card as ScoreCard | null) ?? null,
      estimatedTime: (data.estimated_time as string) ?? "",
      buildStyle: (data.build_style as string) ?? "",
      shareSlug: (data.share_slug as string) ?? cleanSlug,
      summary: (data.summary as string) ?? "",
    };
  }

  async function handleCompare(overrideA?: string, overrideB?: string) {
    const a = (overrideA ?? slugA).trim();
    const b = (overrideB ?? slugB).trim();

    if (!a || !b) {
      setErrorMsg("Please enter both stack slugs.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setStackA(null);
    setStackB(null);
    setVerdictData(null);

    try {
      const [sa, sb] = await Promise.all([fetchStack(a), fetchStack(b)]);

      if (!sa) { setErrorMsg(`Stack "${a}" not found.`); return; }
      if (!sb) { setErrorMsg(`Stack "${b}" not found.`); return; }

      setStackA(sa);
      setStackB(sb);

      // Update URL for shareability
      router.replace(`/compare?a=${sa.shareSlug}&b=${sb.shareSlug}`, {
        scroll: false,
      });
    } catch {
      setErrorMsg("Failed to load stacks. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGetVerdict() {
    if (!stackA || !stackB) return;
    setVerdictLoading(true);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stackA, stackB }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVerdictData(data as VerdictData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI verdict failed.";
      setErrorMsg(msg);
    } finally {
      setVerdictLoading(false);
    }
  }

  function handleShare() {
    if (!stackA || !stackB) return;
    const url = `${window.location.origin}/compare?a=${stackA.shareSlug}&b=${stackB.shareSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const scoreRows = [
    { label: "⚡ Speed to Ship", keyA: "speedToShip" as keyof ScoreCard, keyB: "speedToShip" as keyof ScoreCard },
    { label: "💰 Cost Efficiency", keyA: "costEfficiency" as keyof ScoreCard, keyB: "costEfficiency" as keyof ScoreCard },
    { label: "📈 Scalability", keyA: "scalability" as keyof ScoreCard, keyB: "scalability" as keyof ScoreCard },
    { label: "🎓 Beginner Friendly", keyA: "beginnerFriendly" as keyof ScoreCard, keyB: "beginnerFriendly" as keyof ScoreCard },
    { label: "🔧 Flexibility", keyA: "flexibility" as keyof ScoreCard, keyB: "flexibility" as keyof ScoreCard },
  ];

  return (
    <div className="min-h-dvh bg-[#fff1d6] text-[#111827]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#FFD896] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#F97316] to-[#FB923C] shadow-lg shadow-amber-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-wide text-[#111827]">Toolvise</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-[#111827]/60">
            <Link href="/explore" className="hover:text-[#111827] transition-colors">Explore</Link>
            <Link href="/leaderboard" className="hover:text-[#111827] transition-colors">Leaderboard</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Page title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-[#F97316]" />
            <h1 className="text-2xl font-bold">Stack Comparison</h1>
          </div>
          <p className="text-sm text-[#111827]/50">
            Compare two Toolvise stacks side by side and get an AI verdict.
          </p>
        </div>

        {/* ── SECTION 1: Input ─────────────────────────────────────────── */}
        <section className="rounded-2xl border border-[#FFD896] bg-white p-6 space-y-4">
          <h2 className="font-semibold text-[#111827]">Enter Stack Slugs</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#111827]/60">Stack A</label>
              <input
                id="slug-a"
                value={slugA}
                onChange={(e) => setSlugA(e.target.value)}
                placeholder="e.g. brave-lion-42"
                className="w-full rounded-xl border border-[#FFD896] bg-[#fff1d6]/40 px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#111827]/60">Stack B</label>
              <input
                id="slug-b"
                value={slugB}
                onChange={(e) => setSlugB(e.target.value)}
                placeholder="e.g. swift-fox-77"
                className="w-full rounded-xl border border-[#FFD896] bg-[#fff1d6]/40 px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
              ⚠️ {errorMsg}
            </p>
          )}

          <Button
            onClick={() => handleCompare()}
            disabled={loading}
            className="bg-[#F97316] text-white hover:bg-[#EA6C0A] rounded-xl px-6 h-11 font-semibold shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Compare Stacks
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {/* Recent stacks quick-picks */}
          {recentSlugs.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#FFD896]/50">
              <p className="text-xs font-medium text-[#111827]/40">Recent stacks:</p>
              <div className="flex flex-wrap gap-2">
                {recentSlugs.map((r) => (
                  <button
                    key={r.slug}
                    onClick={() => setSlugA(r.slug)}
                    className="text-xs px-3 py-1 rounded-full border border-[#FFD896] bg-[#fff1d6] text-[#111827]/70 hover:border-[#F97316]/50 hover:text-[#F97316] transition-colors"
                  >
                    {r.label || r.slug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── SECTION 2: Side-by-side ──────────────────────────────────── */}
        {loading && <CompareSkeleton />}

        {stackA && stackB && !loading && (
          <div className="space-y-6">
            {/* Stack headers */}
            <div className="grid grid-cols-2 gap-4">
              {[stackA, stackB].map((stack, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#FFD896] bg-white p-5 space-y-2"
                >
                  <Badge className="bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316] text-xs font-bold">
                    Stack {i === 0 ? "A" : "B"}
                  </Badge>
                  <p className="text-sm font-semibold text-[#111827] line-clamp-2">
                    &quot;{stack.userInput}&quot;
                  </p>
                  <Link
                    href={`/result?slug=${stack.shareSlug}`}
                    className="flex items-center gap-1 text-xs text-[#F97316] hover:underline"
                  >
                    View full stack <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>

            {/* Score Card Comparison */}
            {(stackA.scoreCard || stackB.scoreCard) && (
              <Card className="border-[#FFD896] bg-white overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-[#F97316] to-[#FB923C]" />
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    📊 Score Card Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scoreRows.map(({ label, keyA }) => {
                    const vA = Number(stackA.scoreCard?.[keyA] ?? 0);
                    const vB = Number(stackB.scoreCard?.[keyA] ?? 0);
                    const aWins = vA > vB;
                    const bWins = vB > vA;
                    return (
                      <div key={label} className="space-y-1">
                        <p className="text-xs font-semibold text-[#111827]/60">{label}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className={cn("rounded-lg px-3 py-2", aWins && "bg-[#F97316]/5 border border-[#F97316]/20")}>
                            <ScoreBar value={vA} isWinner={aWins} />
                          </div>
                          <div className={cn("rounded-lg px-3 py-2", bWins && "bg-[#F97316]/5 border border-[#F97316]/20")}>
                            <ScoreBar value={vB} isWinner={bWins} />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Overall */}
                  <div className="pt-2 border-t border-[#FFD896]/50 grid grid-cols-2 gap-4">
                    {[stackA, stackB].map((stack, i) => (
                      <div key={i} className="text-center rounded-xl bg-[#fff1d6] border border-[#FFD896] py-3">
                        <p className="text-xs text-[#111827]/50 mb-1">Overall Score</p>
                        <p className="text-2xl font-bold text-[#F97316]">
                          {stack.scoreCard?.overallScore ?? "—"}
                          <span className="text-sm text-[#111827]/40 font-normal">/10</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tools Comparison */}
            <Card className="border-[#FFD896] bg-white">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  🛠️ Tools Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const toolNamesA = new Set(stackA.tools.map((t) => t.name.toLowerCase()));
                  const toolNamesB = new Set(stackB.tools.map((t) => t.name.toLowerCase()));
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { stack: stackA, otherSet: toolNamesB, label: "A" },
                        { stack: stackB, otherSet: toolNamesA, label: "B" },
                      ].map(({ stack, otherSet, label }) => (
                        <div key={label} className="space-y-2">
                          <p className="text-xs font-semibold text-[#111827]/50">Stack {label}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {stack.tools.map((tool) => {
                              const inCommon = otherSet.has(tool.name.toLowerCase());
                              return (
                                <Badge
                                  key={tool.name}
                                  className={cn(
                                    "text-xs",
                                    inCommon
                                      ? "bg-green-50 border-green-200 text-green-700"
                                      : "border-[#FFD896] bg-[#fff1d6] text-[#111827]/70"
                                  )}
                                >
                                  {inCommon && <Check className="mr-1 h-3 w-3" />}
                                  {tool.name}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <p className="text-xs text-green-600 mt-3 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Green = shared tools between both stacks
                </p>
              </CardContent>
            </Card>

            {/* Estimated Time + Build Style */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[stackA, stackB].map((stack, i) => (
                <Card key={i} className="border-[#FFD896] bg-white">
                  <CardContent className="p-5 space-y-3">
                    <Badge className="bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316] text-xs">
                      Stack {i === 0 ? "A" : "B"}
                    </Badge>
                    <div>
                      <p className="text-xs text-[#111827]/50 mb-0.5">⏱ Estimated Time</p>
                      <p className="text-sm font-semibold">{stack.estimatedTime || "—"}</p>
                    </div>
                    {stack.buildStyle && (
                      <div>
                        <p className="text-xs text-[#111827]/50 mb-0.5">🏗 Build Style</p>
                        <p className="text-sm font-semibold">{stack.buildStyle}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI Verdict */}
            <Card className="border-[#FFD896] bg-white overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#F97316] to-amber-400" />
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  🤖 AI Verdict
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!verdictData ? (
                  <Button
                    onClick={handleGetVerdict}
                    disabled={verdictLoading}
                    className="bg-[#F97316] text-white hover:bg-[#EA6C0A] rounded-xl font-semibold"
                  >
                    {verdictLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Getting verdict...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Get AI Verdict →
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {/* Winner badge */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/30 rounded-xl px-4 py-2">
                        <Trophy className="h-5 w-5 text-[#F97316]" />
                        <span className="font-bold text-[#F97316]">
                          {verdictData.winner === "Tie"
                            ? "It's a Tie!"
                            : `Stack ${verdictData.winner} Wins`}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-[#111827]/80 leading-relaxed">{verdictData.verdict}</p>

                    <ul className="space-y-2">
                      {verdictData.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#111827]/70">
                          <span className="mt-0.5 h-4 w-4 rounded-full bg-[#F97316]/20 text-[#F97316] text-xs flex items-center justify-center shrink-0 font-bold">
                            {i + 1}
                          </span>
                          {r}
                        </li>
                      ))}
                    </ul>

                    {(verdictData.bestForA || verdictData.bestForB) && (
                      <div className="grid sm:grid-cols-2 gap-3 pt-2">
                        {verdictData.bestForA && (
                          <div className="rounded-xl bg-[#fff1d6] border border-[#FFD896] p-3">
                            <p className="text-xs font-bold text-[#111827]/50 mb-1">Best for Stack A:</p>
                            <p className="text-xs text-[#111827]/70">{verdictData.bestForA}</p>
                          </div>
                        )}
                        {verdictData.bestForB && (
                          <div className="rounded-xl bg-[#fff1d6] border border-[#FFD896] p-3">
                            <p className="text-xs font-bold text-[#111827]/50 mb-1">Best for Stack B:</p>
                            <p className="text-xs text-[#111827]/70">{verdictData.bestForB}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Share comparison */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                onClick={handleShare}
                variant="outline"
                className="border-[#FFD896] bg-white text-[#111827] hover:bg-[#fff1d6] rounded-xl font-semibold w-full sm:w-auto"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4 text-[#F97316]" />
                    Share this Comparison
                  </>
                )}
              </Button>
              <Link href="/explore" className="text-sm text-[#111827]/50 hover:text-[#111827] transition-colors">
                Browse more stacks →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Page export (wrapped in Suspense for useSearchParams) ─────────────────────
export default function ComparePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#fff1d6]">
          <Loader2 className="h-8 w-8 animate-spin text-[#F97316]" />
        </div>
      }
    >
      <CompareContent />
    </React.Suspense>
  );
}
