"use client"

import * as React from "react"
import { CommentsSection } from "@/components/CommentsSection"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowUpRight,
  Bookmark,
  Share2,
  Sparkles,
  Lightbulb,
  Loader2,
  RefreshCcw,
  Library,
  Copy,
  Bot,
  Zap,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Monitor,
  Server,
  Database
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/Navbar"

function formatEstimatedTime(time: unknown): string {
  if (!time) return "TBD"
  
  if (typeof time === 'string') {
    if (time.trim().startsWith('{')) {
      try {
        const obj = JSON.parse(time)
        const values = Object.values(obj) as string[]
        if (values.length === 1) return values[0]
        return values[0] + ' – ' + values[values.length - 1]
      } catch {
        // Not valid JSON, truncate
      }
    }
    if (time.length > 30) {
      return time.split(',')[0].trim()
    }
    return time
  }
  
  if (typeof time === 'object') {
    const obj = time as Record<string, string>
    const values = Object.values(obj)
    if (values.length === 0) return "TBD"
    if (values.length === 1) return String(values[0])
    return String(values[0]) + ' – ' + String(values[values.length - 1])
  }
  
  return String(time)
}

// ── Types ──────────────────────────────────────────────────────────────────
interface Tool {
  name: string
  category: string
  reason: string
  isFree: boolean
  learnUrl: string
  difficulty: string
  alternatives?: string[]
  warnings?: string
  bestFor?: string
}

interface Comparison {
  category: string
  recommended: string
  alternatives: string[]
  pros: string[]
  cons: string[]
  whenToUse: string
}

interface VibeAITool {
  name: string
  purpose: string
  tip: string
}

interface VibeCodingData {
  aiTools: VibeAITool[]
  workflow: string[]
  starterPrompt: string
}

interface ScoreCard {
  speedToShip: number
  costEfficiency: number
  scalability: number
  beginnerFriendly: number
  flexibility: number
  overallScore: number
  verdict: string
}

interface StackResult {
  id?: string
  summary: string
  tools: Tool[]
  roadmap: string[]
  estimatedTime: string
  proTip: string
  vibeCoding?: VibeCodingData | null
  scoreCard?: ScoreCard | null
  architecture?: string
  comparisonEngine?: Comparison[] | null
  shareSlug?: string
  stackUserId?: string | null
  formInput?: {
    description: string
    skillLevel: string
    budget: string
    goal: string
  }
}

// ── Category colors ────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Frontend: "border-[#2EA043]/30/40 bg-[#0D1117]/15 text-[#2EA043]",
  Backend: "border-green-500/40 bg-[#1ABC9C]/100/15 text-green-400",
  Database: "border-[#2EA043]/35 bg-[#0D1117]/15 text-[#8B949E]",
  AI: "border-[#2EA043]/35 bg-[#0D1117]/15 text-[#8B949E]",
  Design: "border-pink-500/40 bg-[#388BFD]/100/15 text-pink-400",
  DevOps: "border-cyan-500/40 bg-cyan-500/15 text-cyan-400",
}

// ── Score Card Component ───────────────────────────────────────────────────
function ScoreCardSection({ scoreCard }: { scoreCard: ScoreCard }) {
  const [animated, setAnimated] = React.useState(false)
  const [scoreCopied, setScoreCopied] = React.useState(false)
  const cardRef = React.useRef<HTMLDivElement>(null)

  // Recalculate overall score from individual scores as safety net
  const individualSum = (
    (scoreCard.speedToShip || 0) +
    (scoreCard.costEfficiency || 0) +
    (scoreCard.scalability || 0) +
    (scoreCard.beginnerFriendly || 0) +
    (scoreCard.flexibility || 0)
  )
  const calculatedScore = Math.round((individualSum / 5) * 10)

  // Use calculated score if AI returned wrong value (e.g. raw sum instead of average)
  // Use calculated score if overallScore is missing, not a number, or out of 0-100 range
  const displayScore = (
    typeof scoreCard.overallScore === "number" &&
    scoreCard.overallScore >= 0 &&
    scoreCard.overallScore <= 100
  )
    ? scoreCard.overallScore
    : calculatedScore;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimated(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setAnimated(true), 200)
        }
      },
      { threshold: 0.3 }
    )
    
    if (cardRef.current) {
      observer.observe(cardRef.current)
    }
    
    return () => observer.disconnect()
  }, [])

  const scoreColor = displayScore >= 90
    ? "text-green-500"
    : displayScore >= 70
      ? "text-[#2EA043]"
      : displayScore >= 50
        ? "text-yellow-500"
        : "text-red-500"

  const scoreGlow = displayScore >= 90
    ? "shadow-[0_0_40px_rgba(74,222,128,0.2)]"
    : displayScore >= 70
      ? "shadow-[0_0_40px_rgba(0,212,255,0.2)]"
      : displayScore >= 50
        ? "shadow-[0_0_40px_rgba(250,204,21,0.2)]"
        : "shadow-[0_0_40px_rgba(239,68,68,0.2)]"

  const bars = [
    { label: "Speed to Ship", value: scoreCard.speedToShip, delay: 0 },
    { label: "Cost Efficiency", value: scoreCard.costEfficiency, delay: 100 },
    { label: "Scalability", value: scoreCard.scalability, delay: 200 },
    { label: "Beginner Friendly", value: scoreCard.beginnerFriendly, delay: 300 },
    { label: "Flexibility", value: scoreCard.flexibility, delay: 400 },
  ]

  const handleShareScore = () => {
    const text = 
      `My Toolvise Stack Score: ` +
      `${displayScore}/100 🏆\n` +
      `Speed: ${scoreCard.speedToShip}/10` +
      ` | Cost: ${scoreCard.costEfficiency}/10` +
      ` | Scale: ${scoreCard.scalability}/10` +
      ` | Beginner: ${scoreCard.beginnerFriendly}/10` +
      ` | Flex: ${scoreCard.flexibility}/10\n` +
      `toolvise.vercel.app`
    navigator.clipboard.writeText(text)
    setScoreCopied(true)
    setTimeout(() => setScoreCopied(false), 2000)
  }

  return (
    <div ref={cardRef} className="mb-10 animate-in fade-in slide-in-from-bottom-6 duration-300 fill-mode-both" style={{ animationDelay: "50ms" }}>
      <Card className={cn("overflow-hidden card-3d", scoreGlow)}>
        <div className="h-1 w-full bg-gradient-to-r from-[#2EA043] via-[#1ABC9C] to-[#1ABC9C]" />
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold tracking-tight text-[#E6EDF3] flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#2EA043]" />
            Your Stack Score 🏆
          </CardTitle>
          {scoreCard.verdict && (
            <p className="text-sm text-[#E6EDF3]/50 italic mt-1">{scoreCard.verdict}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-[1fr_auto]">
            {/* Score bars */}
            <div className="space-y-4">
              {bars.map((bar) => (
                <div key={bar.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#E6EDF3]/70 font-medium">{bar.label}</span>
                    <span className="text-[#E6EDF3]/90 font-bold tabular-nums">{bar.value}/10</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#0D1117] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2EA043] to-[#1ABC9C] transition-all duration-500 ease-out"
                      style={{
                        width: animated ? `${bar.value * 10}%` : "0%",
                        transitionDelay: `${bar.delay}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Overall score circle */}
            <div className="flex flex-col items-center justify-center px-6">
              <div className={cn("text-6xl font-black tabular-nums", scoreColor)}>
                {displayScore}
              </div>
              <div className="text-xs font-bold text-[#E6EDF3]/40 uppercase tracking-widest mt-1">/ 100</div>
              <button
                onClick={handleShareScore}
                className={cn(
                  "mt-4 flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
                  scoreCopied
                    ? "bg-[#1ABC9C]/100/20 text-green-400 border border-green-500/30"
                    : "bg-[#0D1117] text-[#E6EDF3]/50 border border-[rgba(240,246,252,0.10)] hover:bg-[#0D1117] hover:text-[#E6EDF3]"
                )}
              >
                <Share2 className="h-3.5 w-3.5" />
                {scoreCopied ? "Copied! ✅" : "Share Score"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Comparison Engine Component ──────────────────────────────────────────
function ComparisonEngineSection({ comparisons }: { comparisons: Comparison[] }) {
  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-300" style={{ animationDelay: "100ms" }}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2EA043] border border-[#2EA043]/30">
          <RefreshCcw className="h-5 w-5 text-[#2EA043]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#E6EDF3] flex items-center gap-2">
            🚀 Tool Comparison Engine
          </h2>
          <p className="text-sm text-[#2EA043]/70">Detailed breakdown of why we chose these specific tools for your project</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {comparisons.map((comp, idx) => (
          <Card key={idx} className="card-3d overflow-hidden group">
            <CardHeader className="bg-gradient-to-br from-[#2EA043]/50 to-white border-b border-[rgba(240,246,252,0.10)]/30 pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#2EA043] font-bold shadow-sm">
                  {comp.category}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[#E6EDF3] bg-[#0D1117]/5 px-2 py-0.5 rounded-lg border border-[#2EA043]/10">{comp.recommended}</span>
                <span className="text-[#2EA043]/70 font-normal text-sm italic">vs</span>
                <span className="text-[#2EA043]/70 font-normal text-sm">{comp.alternatives.join(" / ")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-[#1ABC9C] uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Pros
                  </p>
                  <ul className="space-y-1">
                    {comp.pros.map((p, i) => (
                      <li key={i} className="text-xs text-[#E6EDF3]/70 flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">•</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Cons
                  </p>
                  <ul className="space-y-1">
                    {comp.cons.map((c, i) => (
                      <li key={i} className="text-xs text-[#E6EDF3]/70 flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-[rgba(240,246,252,0.10)]/30">
                <p className="text-xs font-bold text-[#E6EDF3] mb-1 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3 text-[#2EA043]" />
                  When to use what?
                </p>
                <p className="text-xs text-[#E6EDF3]/60 leading-relaxed italic">
                  {comp.whenToUse}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

// ── Budget Section Component ───────────────────────────────────────────────
function BudgetSection({ tools }: { tools: Tool[] }) {
  const freeTools = tools.filter(t => t.isFree)
  const paidTools = tools.filter(t => !t.isFree)
  const allFree = paidTools.length === 0

  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-300" style={{ animationDelay: "100ms" }}>
      <h2 className="text-xl font-bold text-[#E6EDF3] flex items-center gap-2">
        💰 Approx. Budget
      </h2>

      <Card className="card-3d bg-[#0D1117]">
        <CardContent className="p-6 space-y-5">
          
          <div className={cn(
            "rounded-xl p-4 flex items-center gap-4",
            allFree ? "bg-[#1ABC9C]/10 border border-[#00D4FF]/30" : "bg-[#0D1117] border border-[rgba(240,246,252,0.10)]"
          )}>
            <div className="text-4xl">{allFree ? "🎉" : "💳"}</div>
            <div>
              <p className="font-bold text-lg text-[#E6EDF3]">
                {allFree ? "100% Free Stack!" : "Mostly Free Stack"}
              </p>
              <p className="text-sm text-[#2EA043]/70">
                {allFree 
                  ? "All recommended tools have free tiers. Perfect for students and indie builders!" 
                  : `${freeTools.length} free tools + ${paidTools.length} paid tools in your stack`}
              </p>
            </div>
          </div>

          {freeTools.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold text-[#1ABC9C] text-sm flex items-center gap-2">
                ✅ Free Tools ({freeTools.length})
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {freeTools.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-[#1ABC9C]/10 border border-[#00D4FF]/20 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-[#1ABC9C] shrink-0" />
                    <span className="text-sm font-medium text-[#1ABC9C]">{t.name}</span>
                    <span className="text-xs text-[#1ABC9C] ml-auto">$0/mo</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {paidTools.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold text-[#2EA043] text-sm flex items-center gap-2">
                💳 Paid Tools ({paidTools.length})
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {paidTools.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-[#0D1117] border border-[#2EA043]/30 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-[#2EA043] shrink-0" />
                    <span className="text-sm font-medium text-[#2EA043]">{t.name}</span>
                    <span className="text-xs text-[#2EA043] ml-auto">Paid</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl bg-[#2EA043]/10 border border-[#2EA043]/20 p-4">
            <p className="text-sm font-semibold text-[#2EA043] mb-1">
              💡 Budget Tip for Beginners
            </p>
            <p className="text-sm text-[#2EA043] leading-relaxed">
              {allFree 
                ? "Start with the free tiers — they're more than enough to build and launch your MVP. Upgrade only when you have real users."
                : "Most paid tools have free tiers or trials. Start free, validate your idea, then pay only when you need to scale."}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[#0D1117] border border-[rgba(240,246,252,0.10)] px-5 py-4">
            <span className="font-semibold text-[#E6EDF3]">Estimated Monthly Cost</span>
            <span className="text-2xl font-black text-[#2EA043]">
              {allFree ? "$0 / month" : paidTools.length === 1 ? "~$10-30 / month" : "~$30-100 / month"}
            </span>
          </div>

        </CardContent>
      </Card>
    </section>
  )
}

// ── Result Content Core Component ──────────────────────────────────────────
function ResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = searchParams.get("slug")
  
  const [data, setData] = React.useState<StackResult | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [copied, setCopied] = React.useState(false)
  const [promptCopied, setPromptCopied] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [learningMode, setLearningMode] = React.useState(false)
  
  const [criticData, setCriticData] = React.useState<any>(null)
  const [criticLoading, setCriticLoading] = React.useState(false)

  const handleCriticMode = async () => {
    if (criticData || criticLoading || !data) return;
    setCriticLoading(true);
    try {
      const res = await fetch("/api/critic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: data.summary,
          tools: data.tools,
          userInput: data.formInput?.description,
        })
      });
      if (res.ok) {
        const d = await res.json();
        setCriticData(d);
      }
    } catch(e) {
      console.error("Critic mode failed", e);
    } finally {
      setCriticLoading(false);
    }
  }

  React.useEffect(() => {
    async function loadData() {
      // 1. Try URL Param (Supabase DB Fetch)
      if (slug) {
        try {
          const supabase = createClient()
          const { data: dbData, error } = await supabase
            .from("stacks")
            .select("*")
            .eq("share_slug", slug)
            .single()

          if (dbData && !error) {
            setData({
              id: dbData.id,
              summary: dbData.summary,
              tools: dbData.tools,
              roadmap: dbData.roadmap,
              estimatedTime: formatEstimatedTime(dbData.estimated_time || dbData.estimatedTime),
              proTip: dbData.pro_tip,
              vibeCoding: dbData.vibe_coding || null,
              scoreCard: dbData.score_card ?? dbData.scoreCard ?? null,
              comparisonEngine: dbData.comparison_engine || null,
              shareSlug: dbData.share_slug,
              stackUserId: dbData.user_id,
              formInput: {
                description: dbData.user_input,
                skillLevel: dbData.skill_level,
                budget: dbData.budget,
                goal: dbData.goal,
              },
            })
            
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              // Already owns this stack
              if (dbData.user_id === user.id) {
                setSaved(true)
              } else if (dbData.id) {
                // Check if bookmarked
                const { data: bm } = await supabase
                  .from('bookmarks')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('stack_id', dbData.id)
                  .maybeSingle()
                if (bm) setSaved(true)
              }
            }
            
            // Clear localStorage since we have
            // fresh data from DB
            localStorage.removeItem("toolvise_result")
            
            setTimeout(() => setLoading(false), 800)
            return
          }
        } catch (e) {
          console.error("[result] Failed to fetch shared stack from Supabase", e)
        }
      }

      // 2. Fallback to LocalStorage
      try {
        const raw = localStorage.getItem(
          "toolvise_result"
        )
        if (raw) {
          const parsed = JSON.parse(raw)
          
          // Validate minimum required fields
          if (!parsed.summary && 
              !parsed.tools?.length) {
            // Stale or corrupt data
            localStorage.removeItem(
              "toolvise_result"
            )
            setData(null)
            setLoading(false)
            return
          }
          
          // Normalize all possible key names
          setData({
            id: parsed.id,
            summary: parsed.summary || 
              parsed.Summary || "",
            tools: parsed.tools || 
              parsed.Tools || [],
            roadmap: parsed.roadmap || 
              parsed.Roadmap || [],
            estimatedTime: formatEstimatedTime(
              parsed.estimatedTime || 
              parsed.estimated_time || 
              ""
            ),
            proTip: parsed.proTip || 
              parsed.pro_tip || "",
            vibeCoding: parsed.vibeCoding || 
              parsed.vibe_coding || null,
            scoreCard: parsed.scoreCard || 
              parsed.score_card || null,
            architecture: parsed.architecture || 
              null,
            shareSlug: parsed.shareSlug || 
              parsed.share_slug || "",
            stackUserId: parsed.stackUserId || 
              parsed.user_id || null,
            formInput: parsed.formInput || {
              description: parsed.user_input || "",
              skillLevel: parsed.skill_level || "",
              budget: parsed.budget || "",
              goal: parsed.goal || "",
            }
          })
        } else {
          // No data at all
          setData(null)
        }
      } catch {
        console.error(
          "[result] Failed to parse localStorage"
        )
        localStorage.removeItem("toolvise_result")
        setData(null)
      } finally {
        setTimeout(() => setLoading(false), 800)
      }
    }

    loadData()
  }, [slug])

  const handleShare = () => {
    if (!data?.shareSlug) return
    const url = `${window.location.origin}/result?slug=${data.shareSlug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  const handleSaveStack = async () => {
    if (saved || saving || !data?.shareSlug) return
    setSaving(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push(`/login?next=/result?slug=${data.shareSlug}`)
        return
      }

      // Fetch the latest stack ownership state
      const { data: stack } = await supabase
        .from('stacks')
        .select('id, user_id')
        .eq('share_slug', data.shareSlug)
        .single()

      if (!stack?.user_id || stack.user_id === user.id) {
        // Unclaimed or own stack → claim it
        const { error } = await supabase
          .from('stacks')
          .update({ user_id: user.id })
          .eq('share_slug', data.shareSlug)
        if (!error) setSaved(true)
        else console.error('Claim error:', error)
      } else {
        // Someone else's stack → bookmark it
        const { error } = await supabase
          .from('bookmarks')
          .upsert({ user_id: user.id, stack_id: stack.id })
        if (!error) setSaved(true)
        else console.error('Bookmark error:', error)
      }
    } finally {
      setSaving(false)
    }
  }


  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#2EA043]" />
        <p className="animate-pulse text-sm text-[#E6EDF3]/50 tracking-widest uppercase font-medium">Loading Stack</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-[80vh] 
        flex-col items-center justify-center 
        gap-6 px-4 text-center">
        <div className="text-5xl">🤔</div>
        <div>
          <h2 className="text-2xl font-bold 
            text-[#E6EDF3] mb-2">
            No stack result found
          </h2>
          <p className="text-[#2EA043]/70 
            max-w-md">
            This could happen if the result 
            expired or the link is invalid.
            Generate a new stack to get 
            your recommendations.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/advisor">
            <Button className="btn-primary rounded-xl px-6">
              Generate New Stack →
            </Button>
          </Link>
          <Link href="/explore">
            <Button className="btn-ghost rounded-xl px-6">
              Browse Stacks
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="relative mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 overflow-hidden">
      {/* 1. HEADER */}
      <header className="animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2EA043]/25 bg-[#0D1117]/10 px-3 py-1 text-sm font-medium text-[#8B949E]">
              <Sparkles className="h-4 w-4" />
              AI Generated
            </div>
            <h1 className="bg-gradient-to-br from-[#2EA043] to-[#1ABC9C] bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
              Your Perfect Stack
            </h1>
            {data.formInput?.description && (
              <p className="text-lg text-[#E6EDF3]/60 leading-relaxed border-l-2 border-[rgba(240,246,252,0.10)] pl-4">
                &quot;{data.formInput.description}&quot;
              </p>
            )}
          </div>
          
          <div className="flex shrink-0 items-center justify-end">
            <Button
              onClick={handleShare}
              className="rounded-full bg-[#0D1117] border border-[rgba(240,246,252,0.10)] h-12 px-6 py-6 text-[#E6EDF3] hover:bg-[#0D1117] hover:border-[rgba(240,246,252,0.10)] transition-all shadow-lg text-sm font-semibold"
            >
              <Share2 className="mr-2 h-4 w-4 text-[#2EA043]" />
              {copied ? "Copied!" : "Share Stack"}
            </Button>
          </div>
        </div>
      </header>

      {/* 2. SCORE CARD */}
      {data.scoreCard && <ScoreCardSection scoreCard={data.scoreCard} />}

      {/* 3. OVERVIEW */}
      <Card className="card-3d overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300 fill-mode-both" style={{ animationDelay: "75ms" }}>
        <div className="h-1 w-full bg-gradient-to-r from-[#2EA043] to-[#1ABC9C]" />
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-xl font-bold text-[#E6EDF3] flex items-center gap-2">
              📋 Overview
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Estimated Time Badge */}
              <Badge className="bg-[#0D1117]/10 border-[#2EA043]/25 text-[#2EA043] px-3 py-1">
                ⏱ {formatEstimatedTime(data.estimatedTime)}
              </Badge>
              {/* Skill level badge */}
              {data.formInput?.skillLevel && (
                <Badge className="bg-[#2EA043]/10 border-[#2EA043]/30 text-[#2EA043] px-3 py-1 capitalize">
                  👤 {data.formInput.skillLevel}
                </Badge>
              )}
              {/* Goal badge */}
              {data.formInput?.goal && (
                <Badge className="bg-[#1ABC9C]/10 border-[#00D4FF]/30 text-[#1ABC9C] px-3 py-1 capitalize">
                  🎯 {data.formInput.goal.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Main summary */}
          <p className="text-base leading-relaxed text-[#E6EDF3]/80 lg:text-lg">
            {data.summary}
          </p>

          {/* What this stack means for beginners */}
          <div className="rounded-xl bg-[#2EA043]/10 border border-[#2EA043]/20 p-4">
            <p className="text-sm font-semibold text-[#2EA043] mb-1">
              💡 What does this mean?
            </p>
            <p className="text-sm text-[#2EA043] leading-relaxed">
              This is a curated set of tools that work well together for your project. Each tool has a specific role — like a team where everyone has a job.
            </p>
          </div>

          {/* Architecture if deep dive */}
          {data.architecture && (
            <div className="rounded-xl border border-[rgba(240,246,252,0.10)] bg-[#0D1117] p-4">
              <h4 className="font-semibold text-[#E6EDF3] mb-2 text-sm flex items-center gap-2">
                🏗️ Architecture Overview
              </h4>
              <p className="text-sm leading-relaxed text-[#E6EDF3]/70">
                {data.architecture}
              </p>
            </div>
          )}

          {/* Pro Tip */}
          {data.proTip && (
            <div className="rounded-xl border border-[rgba(240,246,252,0.10)] bg-[#0D1117] p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-[#2EA043] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#2EA043] mb-1 text-sm">
                    Pro Tip
                  </p>
                  <p className="text-sm leading-relaxed text-[#2EA043]/80">
                    {data.proTip}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. RECOMMENDED TOOLS */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-300" style={{ animationDelay: "75ms" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#E6EDF3] flex items-center gap-2">
            🛠️ Recommended Tools
            <span className="text-sm font-normal text-[#2EA043]/70">
              ({data.tools?.length || 0} tools)
            </span>
          </h2>
          {/* Controls & Legend */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLearningMode(!learningMode)}
              className={cn(
                "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border",
                learningMode 
                  ? "bg-purple-100 text-purple-700 border-purple-300" 
                  : "bg-[#0D1117] text-[#2EA043]/70 border-[rgba(240,246,252,0.10)]"
              )}
            >
              <Lightbulb className={cn("h-3.5 w-3.5", learningMode && "text-purple-600")} />
              Learning Mode: {learningMode ? "ON" : "OFF"}
            </button>
            <div className="flex items-center gap-3 text-xs text-[#2EA043]/70">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#1ABC9C]" />
                Free
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                Paid
              </span>
            </div>
          </div>
        </div>

        {/* Beginner explanation */}
        <p className="text-sm text-[#2EA043]/70 bg-[#0D1117] border border-[rgba(240,246,252,0.10)] rounded-xl px-4 py-3">
          💬 These are the tools we recommend for your project. Each has a role — hover or read below to understand what each one does and why.
        </p>

        {/* Tools grouping */}
        <div className="space-y-8">
          {Object.entries(
            (data.tools || []).reduce((acc: Record<string, Tool[]>, tool) => {
              if (tool && tool.category) {
                if (!acc[tool.category]) acc[tool.category] = []
                acc[tool.category].push(tool)
              }
              return acc
            }, {})
          ).map(([category, catTools]) => {
            const categoryObj = CATEGORY_COLORS[category] || "border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#2EA043]/70"
            // extract the text-color from category object
            const textColorMatch = categoryObj.match(/text-([a-z]+-\d+)/)
            const catTextColor = textColorMatch ? textColorMatch[0] : "text-[#E6EDF3]"
            
            return (
              <div key={category} className="space-y-3">
                <h3 className={cn("text-lg font-bold border-b border-[rgba(240,246,252,0.10)]/50 pb-2", catTextColor)}>
                  {category}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {catTools.map((tool, index) => (
                    <Card key={index} className="relative border-[rgba(240,246,252,0.10)] bg-[#0D1117] hover:shadow-md hover:border-[#2EA043]/35 transition-all duration-200 flex flex-col pt-3">
                      <div className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-[#E6EDF3] text-xs font-bold shadow-md ring-2 ring-white z-10">
                        {index + 1}
                      </div>
                      <CardContent className="p-5 flex flex-col flex-1 gap-3">
                        
                        {/* Tool header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-[#E6EDF3] text-base flex items-center gap-2">
                              {String(tool.name || '')}
                              {tool.difficulty === 'Industry Standard' && (
                                <span title="Industry Standard" className="text-xs">⭐</span>
                              )}
                              {['next.js', 'react', 'tailwind css', 'supabase', 'vercel', 'prisma', 'stripe', 'clerk']
                                .includes(String(tool.name).toLowerCase()) && (
                                <span title="Trending Tool" className="inline-flex items-center rounded bg-red-900/30 px-1.5 py-0.5 text-[10px] font-bold text-red-300 select-none">
                                  Trending 🔥
                                </span>
                              )}
                            </h3>
                            <Badge className={cn(
                              "text-[10px] uppercase font-bold mt-1 whitespace-nowrap",
                              CATEGORY_COLORS[tool.category] || "border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3]/60"
                            )}>
                              {tool.category}
                            </Badge>
                          </div>
                          <Badge className={cn(
                            "shrink-0 text-xs font-semibold px-2 py-0.5",
                            tool.isFree ? "bg-[#1ABC9C]/10 text-[#1ABC9C] border-[#00D4FF]/30" : "bg-yellow-900/20 text-yellow-400 border-yellow-500/30"
                          )}>
                            {tool.isFree ? "✅ Free" : "💳 Paid"}
                          </Badge>
                        </div>

                        {/* What it does */}
                        <div className="bg-[#0D1117]/60 rounded-lg p-3">
                          <p className="text-xs font-semibold text-[#2EA043] mb-1">
                            🔧 What it does
                          </p>
                          <p className="text-sm text-[#E6EDF3]/70 leading-relaxed line-clamp-3">
                            {String(tool.reason || '')}
                          </p>
                        </div>

                        {/* Learning Mode Extender */}
                        {learningMode && (
                          <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-3 mt-1 animate-in fade-in slide-in-from-top-2">
                            <p className="text-xs font-semibold text-purple-600 mb-1 flex items-center gap-1">
                              <Lightbulb className="h-3 w-3" />
                              Why this choice?
                            </p>
                            <p className="text-xs text-purple-900/70 leading-relaxed">
                              This tool strongly fits your prompt constraints, keeping {tool.isFree ? "costs down" : "features high"} while offering {tool.difficulty.toLowerCase()} level accessibility.
                            </p>
                          </div>
                        )}

                        {/* Difficulty */}
                        <div className="flex items-center gap-2 text-xs text-[#2EA043]/70">
                          <span>Difficulty:</span>
                          <span className={cn(
                            "font-semibold",
                            tool.difficulty === 'Beginner' ? "text-green-500" : tool.difficulty === 'Intermediate' ? "text-yellow-500" : "text-red-500"
                          )}>
                            {tool.difficulty === 'Beginner' && "🟢 "}
                            {tool.difficulty === 'Intermediate' && "🟡 "}
                            {tool.difficulty === 'Advanced' && "🔴 "}
                            {tool.difficulty}
                          </span>
                        </div>

                        {/* Deep dive extras */}
                        {tool.bestFor && learningMode && (
                          <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                            ✨ Best for: {tool.bestFor}
                          </p>
                        )}
                        {tool.warnings && (
                          <p className="text-xs text-[#2EA043] bg-[#0D1117] rounded-lg px-3 py-2">
                            ⚠️ {tool.warnings}
                          </p>
                        )}
                        {tool.alternatives && tool.alternatives.length > 0 && learningMode && (
                          <p className="text-xs text-[#2EA043]/70">
                            Alternatives: {tool.alternatives.join(", ")}
                          </p>
                        )}

                        {/* Learn button */}
                        <a href={tool.learnUrl || "#"} target="_blank" rel="noreferrer" className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-[#0D1117] text-[#E6EDF3] px-4 py-2.5 text-sm font-semibold hover:bg-[#2EA043] transition-colors">
                          {tool.isFree ? "Learn Free 📚" : "Learn More 📚"}
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4.1 TOOL COMPARISON ENGINE */}
      {data.comparisonEngine && data.comparisonEngine.length > 0 && (
        <ComparisonEngineSection comparisons={data.comparisonEngine} />
      )}

      {/* 4.5 ARCHITECTURE DIAGRAM */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-300" style={{ animationDelay: "75ms" }}>
        <h2 className="text-xl font-bold text-[#E6EDF3] flex items-center gap-2">
          🏗️ Architecture Diagram
        </h2>
        <div className="bg-[#0D1117] p-6 rounded-xl border border-[rgba(240,246,252,0.10)] shadow-sm overflow-x-auto">
          <div className="min-w-[600px] flex items-center justify-between gap-4 py-8 px-12">
            
            {/* Frontend / Client */}
            <div className="flex flex-col items-center gap-3 w-40">
              <div className="w-20 h-20 rounded-2xl bg-[#2EA043]/10 flex items-center justify-center border-2 border-[#2EA043]/30 shadow-sm relative group">
                <Monitor className="text-blue-500 h-10 w-10 transition-transform group-hover:scale-110" />
                <div className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 border border-[#2EA043]/30">
                  <span className="text-[10px] select-none">UI</span>
                </div>
              </div>
              <div className="text-center">
                <span className="font-bold text-sm text-[#E6EDF3] block">Frontend</span>
                <span className="text-xs text-[#2EA043]/70 line-clamp-1">
                  {data.tools?.find(t => t.category === "Frontend")?.name || "Client UI"}
                </span>
              </div>
            </div>
            
            {/* Arrow */}
            <div className="flex-1 flex flex-col items-center justify-center relative -mt-6">
              <span className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">REST / GraphQL</span>
              <div className="w-full h-0.5 bg-gray-200 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-[rgba(240,246,252,0.15)] rotate-45"></div>
              </div>
            </div>

            {/* Backend / API */}
            <div className="flex flex-col items-center gap-3 w-40">
              <div className="w-20 h-20 rounded-2xl bg-[#0D1117] flex items-center justify-center border-2 border-[#2EA043]/30 shadow-sm relative group">
                <Server className="text-[#2EA043] h-10 w-10 transition-transform group-hover:scale-110" />
                <div className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#2EA043] border border-[#2EA043]/30">
                  <span className="text-[10px] select-none">API</span>
                </div>
              </div>
              <div className="text-center">
                <span className="font-bold text-sm text-[#E6EDF3] block">Backend</span>
                <span className="text-xs text-[#2EA043]/70 line-clamp-1">
                  {data.tools?.find(t => t.category === "Backend")?.name || "Server Edge"}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-1 flex flex-col items-center justify-center relative -mt-6">
              <span className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Queries</span>
              <div className="w-full h-0.5 bg-gray-200 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-[rgba(240,246,252,0.15)] rotate-45"></div>
              </div>
            </div>

            {/* Database */}
            <div className="flex flex-col items-center gap-3 w-40">
              <div className="w-20 h-20 rounded-2xl bg-[#1ABC9C]/10 flex items-center justify-center border-2 border-[#00D4FF]/30 shadow-sm relative group">
                <Database className="text-green-500 h-10 w-10 transition-transform group-hover:scale-110" />
                <div className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 border border-[#00D4FF]/30">
                  <span className="text-[10px] select-none">DB</span>
                </div>
              </div>
              <div className="text-center">
                <span className="font-bold text-sm text-[#E6EDF3] block">Database</span>
                <span className="text-xs text-[#2EA043]/70 line-clamp-1">
                  {data.tools?.find(t => t.category === "Database")?.name || "Data Store"}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. EXECUTION ROADMAP */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-300" style={{ animationDelay: "100ms" }}>
        <h2 className="text-xl font-bold text-[#E6EDF3] flex items-center gap-2">
          🗺️ Execution Roadmap
        </h2>
        
        <p className="text-sm text-[#2EA043]/70 bg-[#0D1117] border border-[rgba(240,246,252,0.10)] rounded-xl px-4 py-3">
          📌 Follow these steps in order to build your project. Each step builds on the previous one.
        </p>

        <div className="relative pl-6 sm:pl-8 border-l-2 border-[rgba(240,246,252,0.10)]/60 space-y-8 mt-6">
          {data.roadmap?.map((step, idx) => {
            let stepText: string
            if (typeof step === 'string') {
              stepText = step
            } else if (typeof step === 'object' && step !== null) {
              const s = step as Record<string, unknown>
              stepText = s.name ? String(s.name) : JSON.stringify(step)
            } else {
              stepText = String(step ?? '')
            }
            return (
              <div key={idx} className="relative group">
                <div className="absolute -left-[35px] sm:-left-[43px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-[#2EA043]/30 bg-[#0D1117] text-[#E6EDF3] text-sm font-bold shadow-md transition-transform group-hover:scale-110">
                  {idx + 1}
                </div>
                <div className="bg-[#0D1117] p-5 rounded-xl border border-[rgba(240,246,252,0.10)] hover:border-[#2EA043]/35 transition-colors shadow-sm ml-2">
                  <h4 className="font-bold text-[#E6EDF3] mb-1">Phase {idx + 1}</h4>
                  <p className="text-sm text-[#E6EDF3]/80 leading-relaxed">
                    {stepText}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 6. APPROX. BUDGET */}
      {data.tools && data.tools.length > 0 && (
        <BudgetSection tools={data.tools} />
      )}

      {/* 6.5 TOOL COMPARISON ENGINE */}
      {data.comparisonEngine && data.comparisonEngine.length > 0 && (
        <ComparisonEngineSection comparisons={data.comparisonEngine} />
      )}

      {/* 7. VIBE CODING */}
      {data.vibeCoding ? (
        data.vibeCoding.aiTools && data.vibeCoding.aiTools.length > 0 ? (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-300 fill-mode-both" style={{ animationDelay: "150ms" }}>
            <div className="rounded-xl bg-[#0D1117]/5 border border-[#2EA043]/15 p-4 mb-6">
              <p className="text-sm text-[#2EA043] font-semibold mb-1">
                🤖 What is Vibe Coding?
              </p>
              <p className="text-sm text-[#E6EDF3]/70 leading-relaxed">
                Vibe coding means using AI tools like Cursor, v0.dev, and Antigravity to build your project faster — instead of writing every line of code yourself. Think of it as having an AI co-pilot.
              </p>
            </div>

            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0D1117]/20">
                <Bot className="h-5 w-5 text-[#2EA043]" />
              </div>
              <h2 className="text-2xl font-bold text-[#E6EDF3]">🤖 Your Vibe Coding Workflow</h2>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
              {/* AI Tools Cards */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#E6EDF3]/90 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#2EA043]" />
                  AI Coding Tools
                </h3>
                <div className="space-y-3">
                  {data.vibeCoding.aiTools.map((tool, idx) => (
                    <Card
                      key={idx}
                      className="border-[#2EA043]/15 bg-[#0D1117]/5 backdrop-blur-md overflow-hidden"
                    >
                      <CardContent className="p-5 space-y-2">
                        <h4 className="text-base font-bold text-[#E6EDF3]">{tool.name}</h4>
                        <p className="text-sm text-[#E6EDF3]/70 leading-relaxed">{tool.purpose}</p>
                        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-[#2EA043]/10">
                          <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-[#8B949E] shrink-0" />
                          <p className="text-xs text-[#8B949E]">{tool.tip}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Vibe Workflow Steps */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#E6EDF3]/90">Workflow</h3>
                <div className="relative border-l-2 border-[rgba(240,246,252,0.10)] ml-3 pl-8 py-2 space-y-8">
                  {data.vibeCoding.workflow?.map((step, idx) => {
                    let stepText: string
                    if (typeof step === 'string') {
                      stepText = step
                    } else if (typeof step === 'object' && step !== null) {
                      const s = step as Record<string, unknown>
                      if (s.name) {
                        stepText = String(s.name)
                        if (Array.isArray(s.substeps) && s.substeps.length > 0) {
                          stepText += ': ' + (s.substeps as string[]).join(', ')
                        }
                      } else {
                        stepText = JSON.stringify(step)
                      }
                    } else {
                      stepText = String(step ?? '')
                    }
                    return (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-[49px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-sm font-bold text-[#2EA043] z-10 transition-transform group-hover:scale-110">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-[#E6EDF3]/80 leading-relaxed pt-1">{stepText}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Starter Prompt */}
            {data.vibeCoding.starterPrompt && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-[#E6EDF3]/90 mb-3">Starter Prompt</h3>
                <div className="relative group">
                  <pre className="overflow-x-auto rounded-xl border border-[rgba(240,246,252,0.10)] bg-[#2EA043] p-4 text-sm text-[#E6EDF3] leading-relaxed whitespace-pre-wrap font-mono">
                    {data.vibeCoding.starterPrompt}
                  </pre>
                  <button
                    onClick={() => handleCopyPrompt(data.vibeCoding!.starterPrompt)}
                    className={cn(
                      "absolute right-3 top-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                      promptCopied
                        ? "bg-green-100 text-[#1ABC9C] border border-green-300"
                        : "bg-[#0D1117] text-[#E6EDF3] hover:bg-[#2EA043]"
                    )}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {promptCopied ? "Copied! ✅" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : (
          /* Vibe Coding fallback when data exists but aiTools is empty */
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-300 fill-mode-both" style={{ animationDelay: "150ms" }}>
            <Card className="border-[#2EA043]/15 bg-[#0D1117]/5 backdrop-blur-md">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertTriangle className="h-10 w-10 text-[#8B949E] mb-4" />
                <h3 className="text-lg font-semibold text-[#E6EDF3] mb-2">Vibe coding workflow generation failed.</h3>
                <p className="text-sm text-[#E6EDF3]/50 mb-6">Try again with the same settings.</p>
                <Button
                  onClick={() => router.push("/advisor")}
                  className="rounded-xl bg-[#0D1117] text-[#E6EDF3] hover:bg-[#2EA043] px-6 font-semibold"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      ) : null}

      {/* 7.5 AI CRITIC */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-300" style={{ animationDelay: "150ms" }}>
        <div className="flex items-center justify-between border border-[rgba(240,246,252,0.10)] bg-[#0D1117] rounded-xl p-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#E6EDF3] flex items-center gap-2">
              🧐 Ask the AI Critic
            </h2>
            <p className="text-sm text-[#2EA043]/70">
              Get a harsh, realistic review of this tech stack. Find out its bottlenecks, tradeoffs, and missing pieces before you start building.
            </p>
          </div>
          <Button
            onClick={handleCriticMode}
            disabled={criticLoading || !!criticData}
            className="shrink-0 rounded-xl bg-purple-600 text-[#E6EDF3] hover:bg-purple-700 h-10 px-6 font-semibold"
          >
            {criticLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Roasting Stack...</>
            ) : criticData ? (
              "Criticized"
            ) : (
              "Critique Stack"
            )}
          </Button>
        </div>

        {criticData && (
          <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-6 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                 🧑‍⚖️
              </div>
              <div className="space-y-5 flex-1">
                <div>
                  <h3 className="font-bold text-purple-900 mb-1">The Verdict</h3>
                  <p className="text-sm text-purple-800 leading-relaxed">{criticData.verdict}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-[#0D1117] rounded-lg p-4 border border-purple-100">
                    <h4 className="text-xs font-bold text-red-400 uppercase mb-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Missing Pieces</h4>
                    <p className="text-sm text-[#E6EDF3]/80">{criticData.missingPiece}</p>
                  </div>
                  <div className="bg-[#0D1117] rounded-lg p-4 border border-purple-100">
                    <h4 className="text-xs font-bold text-[#2EA043] uppercase mb-2 flex items-center gap-1"><Zap className="h-3 w-3" /> Scaling Bottlenecks</h4>
                    <p className="text-sm text-[#E6EDF3]/80">{criticData.scalingBottleneck}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-purple-900 mb-2">Key Tradeoffs</h4>
                  <div className="space-y-2">
                    {criticData.tradeoffs?.map((t: any, i: number) => (
                      <div key={i} className="flex gap-2 items-start text-sm bg-[#0D1117] rounded-lg p-3 border border-purple-100">
                        <span className="shrink-0 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">{t.aspect}</span>
                        <span className="text-[#E6EDF3]/80">{t.comment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 8. ACTION BUTTONS */}
      <section className="border-t border-[rgba(240,246,252,0.10)] pt-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: "200ms" }}>
        
        <p className="text-center text-sm text-[#2EA043]/70 mb-6">
          Happy with your stack? Save it to your dashboard or share it with your team.
        </p>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
          <Button
            onClick={handleSaveStack}
            disabled={saving || saved}
            className={cn(
               "h-12 px-8 rounded-xl font-semibold w-full sm:w-auto text-base shadow-[0_0_20px_rgba(0,212,255,0.3)]",
               saved
                 ? "bg-[#1ABC9C]/100 hover:bg-[#1ABC9C]/100 text-[#E6EDF3] cursor-default shadow-none"
                 : "bg-[#0D1117] text-[#E6EDF3] hover:bg-[#2EA043]"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Saved to Dashboard ✅
              </>
            ) : (
              <>
                <Bookmark className="mr-2 h-5 w-5" />
                Save My Stack
              </>
            )}
          </Button>

          {saved && (
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto h-12 px-8 rounded-xl border-[rgba(240,246,252,0.10)] text-[#E6EDF3] hover:bg-[#0D1117] font-semibold text-base"
              >
                View in Dashboard →
              </Button>
            </Link>
          )}
          
          <Button
            onClick={handleShare}
            variant="outline"
            className="h-12 px-8 rounded-xl border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3] hover:bg-[#0D1117] font-semibold w-full sm:w-auto text-base"
          >
            <Share2 className="mr-2 h-5 w-5" />
            {copied ? "Copied Link!" : "Share Stack"}
          </Button>
          
          <Button
            onClick={() => router.push('/advisor')}
            variant="ghost"
            className="h-12 px-8 rounded-xl text-[#E6EDF3]/70 hover:text-[#E6EDF3] hover:bg-[#0D1117] font-semibold w-full sm:w-auto text-base"
          >
            <RefreshCcw className="mr-2 h-5 w-5" />
            Try Again
          </Button>
          
          <Button
            onClick={() => router.push('/explore')}
            variant="ghost"
            className="h-12 px-8 rounded-xl text-[#E6EDF3]/70 hover:text-[#E6EDF3] hover:bg-[#0D1117] font-semibold w-full sm:w-auto text-base"
          >
            <Library className="mr-2 h-5 w-5" />
            View All Stacks
          </Button>

          {data.shareSlug && (
            <Button
              onClick={() => router.push(`/compare?a=${data.shareSlug}`)}
              variant="outline"
              className="h-12 px-8 rounded-xl border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3] hover:bg-[#0D1117] font-semibold w-full sm:w-auto text-base"
            >
              ⚡ Compare with another stack →
            </Button>
          )}
        </div>
      </section>

      {/* 9. COMMENTS */}
      {data.shareSlug && (
        <CommentsSection
          stackId={data.id ?? ""}
          shareSlug={data.shareSlug}
        />
      )}
    </main>
  )
}

// ── Main Page Wrap ─────────────────────────────────────────────────────────
export default function ResultPage() {
  return (
    <div className="relative min-h-dvh bg-[#0D1117] text-[#E6EDF3] selection:bg-[#161B22]/2 overflow-hidden">
      <Navbar />
      {/* Background ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(232,162,78,0.12)_0%,transparent_70%)]" />
      
      <React.Suspense fallback={
        <div className="flex min-h-[100dvh] flex-col items-center justify-center space-y-4 relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-[#2EA043]" />
          <p className="animate-pulse text-sm text-[#E6EDF3]/50 tracking-widest uppercase font-medium">Resolving Stack</p>
        </div>
      }>
        <ResultContent />
      </React.Suspense>
    </div>
  )
}
