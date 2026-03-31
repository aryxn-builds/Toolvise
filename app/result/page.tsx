"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowUpRight,
  Bookmark,
  Share2,
  Sparkles,
  ArrowLeft,
  Clock,
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
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

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
  Frontend: "border-orange-500/40 bg-orange-500/15 text-orange-400",
  Backend: "border-green-500/40 bg-green-500/15 text-green-400",
  Database: "border-amber-500/40 bg-amber-500/15 text-amber-400",
  AI: "border-amber-500/40 bg-amber-500/15 text-amber-400",
  Design: "border-pink-500/40 bg-pink-500/15 text-pink-400",
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
  const displayScore = (
    scoreCard.overallScore > 100 || 
    scoreCard.overallScore < 10 ||
    scoreCard.overallScore === individualSum
  )
    ? calculatedScore
    : scoreCard.overallScore

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
      ? "text-[#F97316]"
      : displayScore >= 50
        ? "text-yellow-500"
        : "text-red-500"

  const scoreGlow = displayScore >= 90
    ? "shadow-[0_0_40px_rgba(74,222,128,0.2)]"
    : displayScore >= 70
      ? "shadow-[0_0_40px_rgba(249,115,22,0.2)]"
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
    <div ref={cardRef} className="mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both" style={{ animationDelay: "100ms" }}>
      <Card className={cn("overflow-hidden border-[#F97316]/30 bg-[#fff1d6]/80 backdrop-blur-md", scoreGlow)}>
        <div className="h-1 w-full bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#F97316]" />
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold tracking-tight text-[#111827] flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#F97316]" />
            Your Stack Score 🏆
          </CardTitle>
          {scoreCard.verdict && (
            <p className="text-sm text-[#111827]/50 italic mt-1">{scoreCard.verdict}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-[1fr_auto]">
            {/* Score bars */}
            <div className="space-y-4">
              {bars.map((bar) => (
                <div key={bar.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#111827]/70 font-medium">{bar.label}</span>
                    <span className="text-[#111827]/90 font-bold tabular-nums">{bar.value}/10</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-white overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#F97316] to-[#FB923C] transition-all duration-1000 ease-out"
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
              <div className="text-xs font-bold text-[#111827]/40 uppercase tracking-widest mt-1">/ 100</div>
              <button
                onClick={handleShareScore}
                className={cn(
                  "mt-4 flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
                  scoreCopied
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white text-[#111827]/50 border border-[#FFD896] hover:bg-white hover:text-[#111827]"
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

// ── Budget Section Component ───────────────────────────────────────────────
function BudgetSection({ tools, userBudget }: { tools: Tool[], userBudget: string }) {
  const freeTools = tools.filter(t => t.isFree)
  const paidTools = tools.filter(t => !t.isFree)
  const allFree = paidTools.length === 0

  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ animationDelay: "300ms" }}>
      <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2">
        💰 Approx. Budget
      </h2>

      <Card className="border-[#FFD896] bg-white">
        <CardContent className="p-6 space-y-5">
          
          <div className={cn(
            "rounded-xl p-4 flex items-center gap-4",
            allFree ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
          )}>
            <div className="text-4xl">{allFree ? "🎉" : "💳"}</div>
            <div>
              <p className="font-bold text-lg text-[#111827]">
                {allFree ? "100% Free Stack!" : "Mostly Free Stack"}
              </p>
              <p className="text-sm text-[#6B7280]">
                {allFree 
                  ? "All recommended tools have free tiers. Perfect for students and indie builders!" 
                  : `${freeTools.length} free tools + ${paidTools.length} paid tools in your stack`}
              </p>
            </div>
          </div>

          {freeTools.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold text-green-700 text-sm flex items-center gap-2">
                ✅ Free Tools ({freeTools.length})
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {freeTools.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
                    <span className="text-sm font-medium text-green-800">{t.name}</span>
                    <span className="text-xs text-green-600 ml-auto">$0/mo</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {paidTools.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold text-amber-700 text-sm flex items-center gap-2">
                💳 Paid Tools ({paidTools.length})
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {paidTools.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-sm font-medium text-amber-800">{t.name}</span>
                    <span className="text-xs text-amber-600 ml-auto">Paid</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
            <p className="text-sm font-semibold text-blue-700 mb-1">
              💡 Budget Tip for Beginners
            </p>
            <p className="text-sm text-blue-600 leading-relaxed">
              {allFree 
                ? "Start with the free tiers — they're more than enough to build and launch your MVP. Upgrade only when you have real users."
                : "Most paid tools have free tiers or trials. Start free, validate your idea, then pay only when you need to scale."}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[#fff1d6] border border-[#FFD896] px-5 py-4">
            <span className="font-semibold text-[#111827]">Estimated Monthly Cost</span>
            <span className="text-2xl font-black text-[#F97316]">
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
        <Loader2 className="h-8 w-8 animate-spin text-[#F97316]" />
        <p className="animate-pulse text-sm text-[#111827]/50 tracking-widest uppercase font-medium">Loading Stack</p>
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
            text-[#111827] mb-2">
            No stack result found
          </h2>
          <p className="text-[#6B7280] 
            max-w-md">
            This could happen if the result 
            expired or the link is invalid.
            Generate a new stack to get 
            your recommendations.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/advisor">
            <Button className="bg-[#F97316] 
              text-white hover:bg-[#EA6C0A] 
              rounded-xl px-6">
              Generate New Stack →
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="outline"
              className="border-[#FFD896] 
              rounded-xl px-6">
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
      <header className="animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F97316]/30 bg-[#F97316]/10 px-3 py-1 text-sm font-medium text-[#FB923C]">
              <Sparkles className="h-4 w-4" />
              AI Generated
            </div>
            <h1 className="bg-gradient-to-br from-amber-400 to-orange-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
              Your Perfect Stack
            </h1>
            {data.formInput?.description && (
              <p className="text-lg text-[#111827]/60 leading-relaxed border-l-2 border-[#FFD896] pl-4">
                &quot;{data.formInput.description}&quot;
              </p>
            )}
          </div>
          
          <div className="flex shrink-0 items-center justify-end">
            <Button
              onClick={handleShare}
              className="rounded-full bg-white border border-[#FFD896] h-12 px-6 py-6 text-[#111827] hover:bg-white hover:border-[#FFD896] transition-all shadow-lg text-sm font-semibold"
            >
              <Share2 className="mr-2 h-4 w-4 text-[#F97316]" />
              {copied ? "Copied!" : "Share Stack"}
            </Button>
          </div>
        </div>
      </header>

      {/* 2. SCORE CARD */}
      {data.scoreCard && <ScoreCardSection scoreCard={data.scoreCard} />}

      {/* 3. OVERVIEW */}
      <Card className="border-[#FFD896] bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: "150ms" }}>
        <div className="h-1 w-full bg-gradient-to-r from-[#F97316] to-[#FB923C]" />
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-xl font-bold text-[#111827] flex items-center gap-2">
              📋 Overview
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Estimated Time Badge */}
              <Badge className="bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316] px-3 py-1">
                ⏱ {formatEstimatedTime(data.estimatedTime)}
              </Badge>
              {/* Skill level badge */}
              {data.formInput?.skillLevel && (
                <Badge className="bg-blue-50 border-blue-200 text-blue-600 px-3 py-1 capitalize">
                  👤 {data.formInput.skillLevel}
                </Badge>
              )}
              {/* Goal badge */}
              {data.formInput?.goal && (
                <Badge className="bg-green-50 border-green-200 text-green-600 px-3 py-1 capitalize">
                  🎯 {data.formInput.goal.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Main summary */}
          <p className="text-base leading-relaxed text-[#111827]/80 lg:text-lg">
            {data.summary}
          </p>

          {/* What this stack means for beginners */}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
            <p className="text-sm font-semibold text-blue-700 mb-1">
              💡 What does this mean?
            </p>
            <p className="text-sm text-blue-600 leading-relaxed">
              This is a curated set of tools that work well together for your project. Each tool has a specific role — like a team where everyone has a job.
            </p>
          </div>

          {/* Architecture if deep dive */}
          {data.architecture && (
            <div className="rounded-xl border border-[#FFD896] bg-[#fff1d6] p-4">
              <h4 className="font-semibold text-[#111827] mb-2 text-sm flex items-center gap-2">
                🏗️ Architecture Overview
              </h4>
              <p className="text-sm leading-relaxed text-[#111827]/70">
                {data.architecture}
              </p>
            </div>
          )}

          {/* Pro Tip */}
          {data.proTip && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-700 mb-1 text-sm">
                    Pro Tip
                  </p>
                  <p className="text-sm leading-relaxed text-amber-700/80">
                    {data.proTip}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. RECOMMENDED TOOLS */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            🛠️ Recommended Tools
            <span className="text-sm font-normal text-[#6B7280]">
              ({data.tools?.length || 0} tools)
            </span>
          </h2>
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Free
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              Paid
            </span>
          </div>
        </div>

        {/* Beginner explanation */}
        <p className="text-sm text-[#6B7280] bg-white border border-[#FFD896] rounded-xl px-4 py-3">
          💬 These are the tools we recommend for your project. Each has a role — hover or read below to understand what each one does and why.
        </p>

        {/* Tools grid - 2 cols on tablet, 3 on desktop */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.tools?.map((tool, index) => {
            if (!tool || typeof tool !== 'object') return null
            return (
              <Card key={index} className="border-[#FFD896] bg-white hover:shadow-md hover:border-[#F97316]/40 transition-all duration-200 flex flex-col">
                <CardContent className="p-5 flex flex-col flex-1 gap-3">
                  
                  {/* Tool header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-[#111827] text-base">
                        {String(tool.name || '')}
                      </h3>
                      <Badge className={cn(
                        "text-[10px] uppercase font-bold mt-1 whitespace-nowrap",
                        CATEGORY_COLORS[tool.category] || "border-[#FFD896] bg-[#fff1d6] text-[#111827]/60"
                      )}>
                        {tool.category}
                      </Badge>
                    </div>
                    <Badge className={cn(
                      "shrink-0 text-xs font-semibold px-2 py-0.5",
                      tool.isFree ? "bg-green-50 text-green-600 border-green-200" : "bg-yellow-50 text-yellow-600 border-yellow-200"
                    )}>
                      {tool.isFree ? "✅ Free" : "💳 Paid"}
                    </Badge>
                  </div>

                  {/* What it does */}
                  <div className="bg-[#fff1d6]/60 rounded-lg p-3">
                    <p className="text-xs font-semibold text-[#F97316] mb-1">
                      🔧 What it does
                    </p>
                    <p className="text-sm text-[#111827]/70 leading-relaxed line-clamp-3">
                      {String(tool.reason || '')}
                    </p>
                  </div>

                  {/* Difficulty */}
                  <div className="flex items-center gap-2 text-xs text-[#6B7280]">
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
                  {tool.bestFor && (
                    <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                      ✨ Best for: {tool.bestFor}
                    </p>
                  )}
                  {tool.warnings && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                      ⚠️ {tool.warnings}
                    </p>
                  )}
                  {tool.alternatives && tool.alternatives.length > 0 && (
                    <p className="text-xs text-[#6B7280]">
                      Alternatives: {tool.alternatives.join(", ")}
                    </p>
                  )}

                  {/* Learn button */}
                  <a href={tool.learnUrl} target="_blank" rel="noreferrer" className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-[#F97316] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#EA6C0A] transition-colors">
                    {tool.isFree ? "Learn Free 📚" : "Learn More 📚"}
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* 5. EXECUTION ROADMAP */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ animationDelay: "250ms" }}>
        <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2">
          🗺️ Execution Roadmap
        </h2>
        
        <p className="text-sm text-[#6B7280] bg-white border border-[#FFD896] rounded-xl px-4 py-3">
          📌 Follow these steps in order to build your project. Each step builds on the previous one.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              <div key={idx} className="flex items-start gap-3 p-4 rounded-xl border border-[#FFD896] bg-white hover:border-[#F97316]/40 hover:bg-[#fff1d6]/50 transition-all">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-white text-sm font-bold">
                  {idx + 1}
                </div>
                <p className="text-sm text-[#111827]/80 leading-relaxed pt-1">
                  {stepText}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 6. APPROX. BUDGET */}
      {data.tools && data.tools.length > 0 && (
        <BudgetSection tools={data.tools} userBudget={data.formInput?.budget || 'free'} />
      )}

      {/* 7. VIBE CODING */}
      {data.vibeCoding ? (
        data.vibeCoding.aiTools && data.vibeCoding.aiTools.length > 0 ? (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: "400ms" }}>
            <div className="rounded-xl bg-[#F97316]/5 border border-[#F97316]/20 p-4 mb-6">
              <p className="text-sm text-[#F97316] font-semibold mb-1">
                🤖 What is Vibe Coding?
              </p>
              <p className="text-sm text-[#111827]/70 leading-relaxed">
                Vibe coding means using AI tools like Cursor, v0.dev, and Antigravity to build your project faster — instead of writing every line of code yourself. Think of it as having an AI co-pilot.
              </p>
            </div>

            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F97316]/20">
                <Bot className="h-5 w-5 text-[#F97316]" />
              </div>
              <h2 className="text-2xl font-bold text-[#111827]">🤖 Your Vibe Coding Workflow</h2>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
              {/* AI Tools Cards */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#111827]/90 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#F97316]" />
                  AI Coding Tools
                </h3>
                <div className="space-y-3">
                  {data.vibeCoding.aiTools.map((tool, idx) => (
                    <Card
                      key={idx}
                      className="border-[#F97316]/20 bg-[#F97316]/5 backdrop-blur-md overflow-hidden"
                    >
                      <CardContent className="p-5 space-y-2">
                        <h4 className="text-base font-bold text-[#111827]">{tool.name}</h4>
                        <p className="text-sm text-[#111827]/70 leading-relaxed">{tool.purpose}</p>
                        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-[#F97316]/10">
                          <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-[#FB923C] shrink-0" />
                          <p className="text-xs text-[#FB923C]">{tool.tip}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Vibe Workflow Steps */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#111827]/90">Workflow</h3>
                <div className="relative border-l-2 border-[#FFD896] ml-3 pl-8 py-2 space-y-8">
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
                        <div className="absolute -left-[49px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFD896] bg-[#FFF1D6] text-sm font-bold text-[#F97316] z-10 transition-transform group-hover:scale-110">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-[#111827]/80 leading-relaxed pt-1">{stepText}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Starter Prompt */}
            {data.vibeCoding.starterPrompt && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-[#111827]/90 mb-3">Starter Prompt</h3>
                <div className="relative group">
                  <pre className="overflow-x-auto rounded-xl border border-[#FFD896] bg-[#FFE8B6] p-4 text-sm text-[#111827] leading-relaxed whitespace-pre-wrap font-mono">
                    {data.vibeCoding.starterPrompt}
                  </pre>
                  <button
                    onClick={() => handleCopyPrompt(data.vibeCoding!.starterPrompt)}
                    className={cn(
                      "absolute right-3 top-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                      promptCopied
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-[#F97316] text-white hover:bg-[#EA6C0A]"
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
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: "400ms" }}>
            <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-md">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertTriangle className="h-10 w-10 text-amber-400 mb-4" />
                <h3 className="text-lg font-semibold text-[#111827] mb-2">Vibe coding workflow generation failed.</h3>
                <p className="text-sm text-[#111827]/50 mb-6">Try again with the same settings.</p>
                <Button
                  onClick={() => router.push("/advisor")}
                  className="rounded-xl bg-[#F97316] text-[#111827] hover:bg-[#EA6C0A] px-6 font-semibold"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      ) : null}

      {/* 8. ACTION BUTTONS */}
      <section className="border-t border-[#FFD896] pt-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: "500ms" }}>
        
        <p className="text-center text-sm text-[#6B7280] mb-6">
          Happy with your stack? Save it to your dashboard or share it with your team.
        </p>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
          <Button
            onClick={handleSaveStack}
            disabled={saving || saved}
            className={cn(
               "h-12 px-8 rounded-xl font-semibold w-full sm:w-auto text-base shadow-[0_0_20px_rgba(249,115,22,0.3)]",
               saved
                 ? "bg-green-500 hover:bg-green-500 text-white cursor-default shadow-none"
                 : "bg-[#F97316] text-[#111827] hover:bg-[#EA6C0A]"
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
                className="w-full sm:w-auto h-12 px-8 rounded-xl border-[#FFD896] text-[#111827] hover:bg-[#fff1d6] font-semibold text-base"
              >
                View in Dashboard →
              </Button>
            </Link>
          )}
          
          <Button
            onClick={handleShare}
            variant="outline"
            className="h-12 px-8 rounded-xl border-[#FFD896] bg-white text-[#111827] hover:bg-white font-semibold w-full sm:w-auto text-base"
          >
            <Share2 className="mr-2 h-5 w-5" />
            {copied ? "Copied Link!" : "Share Stack"}
          </Button>
          
          <Button
            onClick={() => router.push('/advisor')}
            variant="ghost"
            className="h-12 px-8 rounded-xl text-[#111827]/70 hover:text-[#111827] hover:bg-white font-semibold w-full sm:w-auto text-base"
          >
            <RefreshCcw className="mr-2 h-5 w-5" />
            Try Again
          </Button>
          
          <Button
            onClick={() => router.push('/explore')}
            variant="ghost"
            className="h-12 px-8 rounded-xl text-[#111827]/70 hover:text-[#111827] hover:bg-white font-semibold w-full sm:w-auto text-base"
          >
            <Library className="mr-2 h-5 w-5" />
            View All Stacks
          </Button>
        </div>
      </section>
    </main>
  )
}

// ── Main Page Wrap ─────────────────────────────────────────────────────────
export default function ResultPage() {
  return (
    <div className="relative min-h-dvh bg-[#fff1d6] text-[#111827] selection:bg-[#F97316]/30 overflow-hidden">
      {/* Background ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(900px_circle_at_15%_15%,rgba(249,115,22,0.15),transparent_55%),radial-gradient(900px_circle_at_85%_20%,rgba(251,146,60,0.12),transparent_55%)]" />
      
      <React.Suspense fallback={
        <div className="flex min-h-[100dvh] flex-col items-center justify-center space-y-4 relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-[#F97316]" />
          <p className="animate-pulse text-sm text-[#111827]/50 tracking-widest uppercase font-medium">Resolving Stack</p>
        </div>
      }>
        <ResultContent />
      </React.Suspense>
    </div>
  )
}
