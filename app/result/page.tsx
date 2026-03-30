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
              estimatedTime: dbData.estimated_time,
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
            estimatedTime: parsed.estimatedTime || 
              parsed.estimated_time || "",
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
    <main className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* 1. HEADER */}
      <header className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
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

      {/* SCORE CARD */}
      {data.scoreCard && <ScoreCardSection scoreCard={data.scoreCard} />}

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: "150ms" }}>
        
        {/* Left Column: Summary & Roadmap */}
        <div className="space-y-8">
          
          {/* 2. SUMMARY CARD */}
          <Card className="overflow-hidden border-[#FFD896] bg-[#fff1d6]/80 backdrop-blur-md shadow-2xl">
            <div className="h-1 w-full bg-gradient-to-r from-[#F97316] to-[#FB923C]" />
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold tracking-tight text-[#111827] flex items-center justify-between">
                Overview
                <Badge variant="outline" className="border-[#F97316]/40 bg-[#F97316]/10 text-[#FB923C] px-3 py-1 text-xs">
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  {data.estimatedTime}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-base leading-relaxed text-[#111827]/80">
                {data.summary}
              </p>

              {/* Architecture (deep dive only) */}
              {data.architecture && (
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <h4 className="font-semibold text-cyan-400 mb-2 text-sm">🏗️ Architecture</h4>
                  <p className="text-sm leading-relaxed text-cyan-400/80">
                    {data.architecture}
                  </p>
                </div>
              )}
              
              {data.proTip && (
                <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-500/10 blur-xl" />
                  <div className="relative flex items-start gap-4">
                    <div className="mt-1 rounded-full bg-amber-500/20 p-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-500 mb-1">Pro Tip</h4>
                      <p className="text-sm leading-relaxed text-amber-500/80">
                        {data.proTip}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. ROADMAP SECTION */}
          <Card className="border-[#FFD896] bg-white backdrop-blur-md pb-4">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[#111827]">Execution Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-[#FFD896] ml-3 pl-8 py-2 space-y-8">
                {(data.roadmap || []).map((step, idx) => {
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
                      <div className="absolute -left-[49px] top-0 flex h-8 w-8 items-center justify-center rounded-full border border-[#FFD896] bg-[#F97316] text-sm font-bold text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-transform group-hover:scale-110 z-10">
                        {idx + 1}
                      </div>
                      <p className="text-base text-[#111827]/80 leading-relaxed pt-1">
                        {stepText}
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: 3. TOOLS GRID */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-[#111827] mb-4 px-1 flex items-center gap-2">
            Recommended Tools
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-[#111827]/60">
              {data.tools?.length || 0}
            </span>
          </h3>
          
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {(data.tools || []).map((tool, index) => {
              if (!tool || typeof tool !== 'object') return null;
              return (
              <Card
                key={tool.name || index}
                className="group relative overflow-hidden border-[#FFD896] bg-white backdrop-blur-xl transition-all hover:border-[#FFD896] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col h-full animate-in fade-in zoom-in-95 duration-700 fill-mode-both"
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold text-[#111827] tracking-tight">{String(tool.name || 'Unknown')}</h4>
                      <Badge
                        className={cn(
                          "text-[10px] uppercase font-bold tracking-wider rounded-md",
                          CATEGORY_COLORS[tool.category] || "border-[#FFD896] bg-white text-[#111827]/60"
                        )}
                      >
                        {tool.category}
                      </Badge>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] font-bold border-0 bg-opacity-20 px-2.5 py-0.5",
                          tool.isFree 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-yellow-500/20 text-yellow-500"
                        )}
                      >
                        {tool.isFree ? "Free" : "Paid"}
                      </Badge>
                      <span className="text-[10px] font-medium text-[#111827]/40 uppercase tracking-widest">
                        {tool.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-[#111827]/60 leading-relaxed mb-4 flex-1">
                    {tool.reason}
                  </p>

                  {/* Deep dive extras */}
                  {tool.bestFor && (
                    <p className="text-xs text-emerald-400/80 mb-2">✨ Best for: {tool.bestFor}</p>
                  )}
                  {tool.warnings && (
                    <p className="text-xs text-amber-400/80 mb-2">⚠️ {tool.warnings}</p>
                  )}
                  {tool.alternatives && tool.alternatives.length > 0 && (
                    <p className="text-xs text-[#111827]/40 mb-4">Alternatives: {tool.alternatives.join(", ")}</p>
                  )}
                  
                  <a
                    href={tool.learnUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white border border-[#FFD896] px-4 py-2.5 text-sm font-semibold text-[#111827]/90 transition-all mt-auto group-hover:bg-[#F97316] group-hover:border-[#F97316] group-hover:text-white group-hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                  >
                    {tool.isFree ? "Learn Free" : "Learn"}
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            )})}
          </div>
        </div>
      </div>

      {/* 5. VIBE CODING SECTION */}
      {data.vibeCoding ? (
        data.vibeCoding.aiTools && data.vibeCoding.aiTools.length > 0 ? (
          <div className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: "400ms" }}>
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
          </div>
        ) : (
          /* Vibe Coding fallback when data exists but aiTools is empty */
          <div className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: "400ms" }}>
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

      {/* 6. ACTION BUTTONS */}
      <div className="mt-20 border-t border-[#FFD896] pt-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: "500ms" }}>
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
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
      </div>
    </main>
  )
}

// ── Main Page Wrap ─────────────────────────────────────────────────────────
export default function ResultPage() {
  return (
    <div className="relative min-h-dvh bg-white text-foreground selection:bg-[#F97316]/30 overflow-hidden">
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
