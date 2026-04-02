"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  GitCompare,
  Loader2,
  Share2,
  Trophy,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";

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
      <div className="flex-1 h-2 rounded-full bg-amber-200/40 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            isWinner ? "bg-amber-500" : "bg-neutral-900/20"
          )}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <span
        className={cn(
          "text-sm font-bold w-8 text-right",
          isWinner ? "text-amber-500" : "text-foreground/50"
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
        <div key={n} className="h-14 bg-white rounded-xl border border-border" />
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

  function handleSwap() {
    setSlugA(slugB);
    setSlugB(slugA);
    if (stackA && stackB) {
      setStackA(stackB);
      setStackB(stackA);
      router.replace(`/compare?a=${stackB.shareSlug}&b=${stackA.shareSlug}`, {
        scroll: false,
      });
      setVerdictData(null);
    }
  }

  // Categories for breakdown
  const CATEGORY_ORDER = ["Frontend", "Backend", "Database", "AI", "DevOps", "Design", "Other"];
  
  function getGroupedTools(tools: Tool[]) {
    const grouped = tools.reduce((acc: Record<string, Tool[]>, t) => {
      const c = t.category || "Other";
      if (!acc[c]) acc[c] = [];
      acc[c].push(t);
      return acc;
    }, {});
    
    return CATEGORY_ORDER.filter(c => grouped[c]).map(c => ({
      category: c,
      tools: grouped[c]
    }));
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Page title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-bold">Stack Comparison</h1>
          </div>
          <p className="text-sm text-foreground/50">
            Compare two Toolvise stacks side by side to see which one fits your needs better.
          </p>
        </div>

        {/* ── SECTION 1: Input ─────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-white p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Select Stacks to Compare</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-6 relative">
            <div className="space-y-2 flex-1">
              <label className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <Badge className="h-2 w-2 rounded-full bg-amber-500 p-0" /> Stack A
              </label>
              <div className="relative group">
                <input
                  id="slug-a"
                  value={slugA}
                  onChange={(e) => setSlugA(e.target.value)}
                  placeholder="Paste URL or select from below"
                  className="w-full rounded-xl border border-border bg-background/20 px-4 py-3.5 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-mono"
                />
                {slugA && (
                  <button 
                    onClick={() => setSlugA("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-amber-300/60"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-center pt-6">
              <button 
                onClick={handleSwap}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-border hover:border-amber-500 hover:scale-110 active:scale-95 text-amber-500 transition-all shadow-md z-10 group"
                title="Swap stacks"
              >
                <GitCompare className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
            
            <div className="space-y-2 flex-1">
              <label className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Badge className="h-2 w-2 rounded-full bg-blue-600 p-0" /> Stack B
              </label>
              <div className="relative group">
                <input
                  id="slug-b"
                  value={slugB}
                  onChange={(e) => setSlugB(e.target.value)}
                  placeholder="Paste URL or select from below"
                  className="w-full rounded-xl border border-border bg-background/20 px-4 py-3.5 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-mono"
                />
                {slugB && (
                  <button 
                    onClick={() => setSlugB("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-amber-300/60"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
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
            className="bg-amber-500 text-white hover:bg-amber-400 rounded-xl px-6 h-11 font-semibold shadow-sm"
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
            <div className="space-y-3 pt-4 border-t border-border/50">
              <p className="text-xs font-bold text-foreground/30 uppercase tracking-widest">Your Recent Generations</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {recentSlugs.map((r) => (
                  <button
                    key={r.slug}
                    onClick={() => {
                      if (!slugA) setSlugA(r.slug);
                      else if (!slugB && r.slug !== slugA) setSlugB(r.slug);
                    }}
                    className="group text-left text-xs p-3 rounded-xl border border-border bg-background/20 text-foreground hover:border-amber-500 hover:bg-white transition-all flex items-center justify-between"
                  >
                    <span className="truncate pr-2 font-medium">{r.label || r.slug}</span>
                    <Badge className="bg-amber-200/40 text-foreground/40 p-0 px-1.5 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors">Select</Badge>
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
                  className="rounded-2xl border border-border bg-white p-5 space-y-2"
                >
                  <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-500 text-xs font-bold">
                    Stack {i === 0 ? "A" : "B"}
                  </Badge>
                  <p className="text-sm font-semibold text-foreground line-clamp-2">
                    &quot;{stack.userInput}&quot;
                  </p>
                  <Link
                    href={`/result?slug=${stack.shareSlug}`}
                    className="flex items-center gap-1 text-xs text-amber-500 hover:underline"
                  >
                    View full stack <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>

            {/* Score Card Comparison */}
            {(stackA.scoreCard || stackB.scoreCard) && (
              <Card className="border-border bg-white overflow-hidden shadow-sm">
                <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-400" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      Performance Metrics
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-500 border-amber-500/20 bg-amber-500/5">
                      {verdictData?.winner === 'Tie' ? 'Tie Matchup' : 'Side-by-Side'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  {scoreRows.map(({ label, keyA }) => {
                    const vA = Number(stackA.scoreCard?.[keyA] ?? 0);
                    const vB = Number(stackB.scoreCard?.[keyA] ?? 0);
                    const aWins = vA > vB;
                    const bWins = vB > vA;
                    const isTie = vA === vB;
                    
                    return (
                      <div key={label} className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <p className="text-xs font-bold text-foreground uppercase tracking-wider">{label}</p>
                          {isTie ? (
                            <span className="text-[10px] font-bold text-foreground/30">TIE</span>
                          ) : (
                            <span className={cn(
                              "text-[10px] font-bold uppercase",
                              aWins ? "text-amber-500" : "text-blue-600"
                            )}>
                              {aWins ? "Stack A favored" : "Stack B favored"}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className={cn(
                            "rounded-xl px-4 py-3 transition-all",
                            aWins ? "bg-amber-500/5 border-2 border-amber-500/20" : "bg-gray-50/50 border border-transparent"
                          )}>
                            <ScoreBar value={vA} isWinner={aWins} />
                          </div>
                          <div className={cn(
                            "rounded-xl px-4 py-3 transition-all",
                            bWins ? "bg-blue-50 border-2 border-blue-200" : "bg-gray-50/50 border border-transparent"
                          )}>
                            <ScoreBar value={vB} isWinner={bWins} />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Overall Summary Row */}
                  <div className="pt-6 border-t border-border/50 grid grid-cols-2 gap-6">
                    {[stackA, stackB].map((stack, i) => {
                      const isWinner = verdictData?.winner === (i === 0 ? "A" : "B");
                      return (
                        <div key={i} className={cn(
                          "relative text-center rounded-2xl p-6 transition-all duration-500",
                          i === 0 
                            ? (isWinner ? "bg-amber-100 border-2 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.15)] ring-1 ring-orange-400/50" : "bg-background border-2 border-border") 
                            : (isWinner ? "bg-blue-50 border-2 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-400/50" : "bg-blue-50/50 border-2 border-blue-100")
                        )}>
                          {isWinner && (
                            <div className={cn(
                              "absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm",
                              i === 0 ? "bg-amber-1000 border-orange-400 text-white" : "bg-blue-600 border-blue-400 text-white"
                            )}>
                              Overall Winner
                            </div>
                          )}
                          {!isWinner && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white border border-inherit text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                              Final Weight
                            </div>
                          )}
                          <p className={cn(
                            "text-4xl font-black mb-1",
                            isWinner ? (i === 0 ? "text-amber-600" : "text-blue-700") : "text-foreground"
                          )}>
                            {stack.scoreCard?.overallScore ?? "—"}
                            <span className="text-lg font-normal opacity-30">/10</span>
                          </p>
                          <p className={cn(
                            "text-xs font-bold uppercase tracking-wider",
                            i === 0 ? "text-amber-500" : "text-blue-600"
                          )}>
                            Stack {i === 0 ? "A" : "B"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tools Comparison */}
            <Card className="border-border bg-white shadow-sm overflow-hidden">
              <CardHeader className="bg-background/20 border-b border-border/30">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Architecture Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {(() => {
                  const toolNamesA = new Set(stackA.tools.map((t) => t.name.toLowerCase()));
                  const toolNamesB = new Set(stackB.tools.map((t) => t.name.toLowerCase()));
                  
                  return (
                    <div className="grid grid-cols-2 gap-8 relative">
                      {/* Divider line */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-amber-200/50 hidden sm:block" />
                      
                      {[
                        { stack: stackA, otherSet: toolNamesB, label: "A", color: "text-amber-500" },
                        { stack: stackB, otherSet: toolNamesA, label: "B", color: "text-blue-600" },
                      ].map(({ stack, otherSet, label, color }) => (
                        <div key={label} className="space-y-4">
                          <p className={cn("text-sm font-black uppercase tracking-widest", color)}>Stack {label}</p>
                          <div className="space-y-4">
                            {getGroupedTools(stack.tools).map((group) => (
                              <div key={group.category} className="space-y-1.5">
                                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter">{group.category}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {group.tools.map((tool) => {
                                    const inCommon = otherSet.has(tool.name.toLowerCase());
                                    return (
                                      <Badge
                                        key={tool.name}
                                        variant="outline"
                                        className={cn(
                                          "px-2 py-1 text-xs font-medium transition-all",
                                          inCommon
                                            ? "bg-green-50 border-green-200 text-green-700 font-bold"
                                            : "border-border bg-white text-foreground/70"
                                        )}
                                      >
                                        {inCommon && <Check className="mr-1 h-3 w-3 stroke-[3]" />}
                                        {tool.name}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div className="mt-8 flex items-center justify-center">
                  <div className="bg-green-50 border border-green-100 rounded-full px-4 py-1.5 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
                      Shared tools are highlighted in bold green
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estimated Time + Build Style */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[stackA, stackB].map((stack, i) => (
                <Card key={i} className="border-border bg-white">
                  <CardContent className="p-5 space-y-3">
                    <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-500 text-xs">
                      Stack {i === 0 ? "A" : "B"}
                    </Badge>
                    <div>
                      <p className="text-xs text-foreground/50 mb-0.5">⏱ Estimated Time</p>
                      <p className="text-sm font-semibold">{stack.estimatedTime || "—"}</p>
                    </div>
                    {stack.buildStyle && (
                      <div>
                        <p className="text-xs text-foreground/50 mb-0.5">🏗 Build Style</p>
                        <p className="text-sm font-semibold">{stack.buildStyle}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI Verdict */}
            <Card className="border-border bg-white overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-400" />
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
                    className="bg-amber-500 text-white hover:bg-amber-400 rounded-xl font-semibold"
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
                      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        <span className="font-bold text-amber-500">
                          {verdictData.winner === "Tie"
                            ? "It's a Tie!"
                            : `Stack ${verdictData.winner} Wins`}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-foreground/80 leading-relaxed">{verdictData.verdict}</p>

                    <ul className="space-y-2">
                      {verdictData.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                          <span className="mt-0.5 h-4 w-4 rounded-full bg-amber-500/20 text-amber-500 text-xs flex items-center justify-center shrink-0 font-bold">
                            {i + 1}
                          </span>
                          {r}
                        </li>
                      ))}
                    </ul>

                    {(verdictData.bestForA || verdictData.bestForB) && (
                      <div className="grid sm:grid-cols-2 gap-3 pt-2">
                        {verdictData.bestForA && (
                          <div className="rounded-xl bg-background border border-border p-3">
                            <p className="text-xs font-bold text-foreground/50 mb-1">Best for Stack A:</p>
                            <p className="text-xs text-foreground/70">{verdictData.bestForA}</p>
                          </div>
                        )}
                        {verdictData.bestForB && (
                          <div className="rounded-xl bg-background border border-border p-3">
                            <p className="text-xs font-bold text-foreground/50 mb-1">Best for Stack B:</p>
                            <p className="text-xs text-foreground/70">{verdictData.bestForB}</p>
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
                className="border-border bg-white text-foreground hover:bg-background rounded-xl font-semibold w-full sm:w-auto"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4 text-amber-500" />
                    Share this Comparison
                  </>
                )}
              </Button>
              <Link href="/explore" className="text-sm text-foreground/50 hover:text-amber-300 transition-colors">
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
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      }
    >
      <CompareContent />
    </React.Suspense>
  );
}
