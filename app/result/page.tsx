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
  Zap
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@/lib/supabase-client"

// ── Types ──────────────────────────────────────────────────────────────────
interface Tool {
  name: string
  category: string
  reason: string
  isFree: boolean
  learnUrl: string
  difficulty: string
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

interface StackResult {
  summary: string
  tools: Tool[]
  roadmap: string[]
  estimatedTime: string
  proTip: string
  vibeCoding?: VibeCodingData | null
  shareSlug?: string
  formInput?: {
    description: string
    skillLevel: string
    budget: string
    goal: string
  }
}

// ── Category colors ────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Frontend: "border-blue-500/40 bg-blue-500/15 text-blue-400",
  Backend: "border-green-500/40 bg-green-500/15 text-green-400",
  Database: "border-amber-500/40 bg-amber-500/15 text-amber-400",
  AI: "border-purple-500/40 bg-purple-500/15 text-purple-400",
  Design: "border-pink-500/40 bg-pink-500/15 text-pink-400",
  DevOps: "border-cyan-500/40 bg-cyan-500/15 text-cyan-400",
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

  React.useEffect(() => {
    async function loadData() {
      // 1. Try URL Param (Supabase DB Fetch)
      if (slug) {
        try {
          const supabase = createBrowserClient()
          const { data: dbData, error } = await supabase
            .from("stacks")
            .select("*")
            .eq("share_slug", slug)
            .single()

          if (dbData && !error) {
            setData({
              summary: dbData.summary,
              tools: dbData.tools,
              roadmap: dbData.roadmap,
              estimatedTime: dbData.estimated_time,
              proTip: dbData.pro_tip,
              vibeCoding: dbData.vibe_coding || null,
              shareSlug: dbData.share_slug,
              formInput: {
                description: dbData.user_input,
                skillLevel: dbData.skill_level,
                budget: dbData.budget,
                goal: dbData.goal,
              },
            })
            setTimeout(() => setLoading(false), 800)
            return
          }
        } catch (e) {
          console.error("[result] Failed to fetch shared stack from Supabase", e)
        }
      }

      // 2. Fallback to LocalStorage
      try {
        const raw = localStorage.getItem("toolvise_result")
        if (raw) {
          setData(JSON.parse(raw))
        }
      } catch {
        console.error("[result] Failed to parse localStorage data")
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

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        <p className="animate-pulse text-sm text-white/50 tracking-widest uppercase font-medium">Loading Stack</p>
      </div>
    )
  }

  // No data state
  if (!data) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <p className="text-white/60">No stack result found.</p>
        <Link
          href="/advisor"
          className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm text-[#7c3aed] transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Go to advisor
        </Link>
      </div>
    )
  }

  return (
    <main className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* 1. HEADER */}
      <header className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-3 py-1 text-sm font-medium text-[#c4b5fd]">
              <Sparkles className="h-4 w-4" />
              AI Generated
            </div>
            <h1 className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
              Your Perfect Stack
            </h1>
            {data.formInput?.description && (
              <p className="text-lg text-white/60 leading-relaxed border-l-2 border-white/20 pl-4">
                &quot;{data.formInput.description}&quot;
              </p>
            )}
          </div>
          
          <div className="flex shrink-0 items-center justify-end">
            <Button
              onClick={handleShare}
              className="rounded-full bg-white/5 border border-white/10 h-12 px-6 py-6 text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-lg text-sm font-semibold"
            >
              <Share2 className="mr-2 h-4 w-4 text-[#7c3aed]" />
              {copied ? "Copied!" : "Share Stack"}
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: "150ms" }}>
        
        {/* Left Column: Summary & Roadmap */}
        <div className="space-y-8">
          
          {/* 2. SUMMARY CARD */}
          <Card className="overflow-hidden border-white/10 bg-[#111111]/80 backdrop-blur-md shadow-2xl">
            <div className="h-1 w-full bg-gradient-to-r from-[#7c3aed] to-[#2563eb]" />
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold tracking-tight text-white flex items-center justify-between">
                Overview
                <Badge variant="outline" className="border-[#7c3aed]/40 bg-[#7c3aed]/10 text-[#c4b5fd] px-3 py-1 text-xs">
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  {data.estimatedTime}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-base leading-relaxed text-white/80">
                {data.summary}
              </p>
              
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
          <Card className="border-white/10 bg-[#111111]/50 backdrop-blur-md pb-4">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Execution Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-white/10 ml-3 pl-8 py-2 space-y-10">
                {data.roadmap?.map((step, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[49px] top-0 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#7c3aed] text-sm font-bold text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-transform group-hover:scale-110">
                      {idx + 1}
                    </div>
                    <p className="text-base text-white/80 leading-relaxed pt-1">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: 3. TOOLS GRID */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white mb-4 px-1 flex items-center gap-2">
            Recommended Tools
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs text-white/60">
              {data.tools?.length || 0}
            </span>
          </h3>
          
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {data.tools?.map((tool, index) => (
              <Card
                key={tool.name}
                className="group relative overflow-hidden border-white/10 bg-[#111111]/80 backdrop-blur-xl transition-all hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col h-full animate-in fade-in zoom-in-95 duration-700 fill-mode-both"
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold text-white tracking-tight">{tool.name}</h4>
                      <Badge
                        className={cn(
                          "text-[10px] uppercase font-bold tracking-wider rounded-md",
                          CATEGORY_COLORS[tool.category] || "border-white/10 bg-white/5 text-white/60"
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
                      <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
                        {tool.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-white/60 leading-relaxed mb-6 flex-1">
                    {tool.reason}
                  </p>
                  
                  <a
                    href={tool.learnUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/90 transition-all hover:bg-white/10 hover:text-white mt-auto group-hover:bg-[#7c3aed] group-hover:border-[#7c3aed] group-hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                  >
                    {tool.isFree ? "Learn Free" : "Learn"}
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 5. VIBE CODING SECTION */}
      {data.vibeCoding && (
        <div className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: "400ms" }}>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7c3aed]/20">
              <Bot className="h-5 w-5 text-[#7c3aed]" />
            </div>
            <h2 className="text-2xl font-bold text-white">🤖 Your Vibe Coding Workflow</h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            {/* AI Tools Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#7c3aed]" />
                AI Coding Tools
              </h3>
              <div className="space-y-3">
                {data.vibeCoding.aiTools?.map((tool, idx) => (
                  <Card
                    key={idx}
                    className="border-[#7c3aed]/20 bg-[#7c3aed]/5 backdrop-blur-md overflow-hidden"
                  >
                    <CardContent className="p-5 space-y-2">
                      <h4 className="text-base font-bold text-white">{tool.name}</h4>
                      <p className="text-sm text-white/70 leading-relaxed">{tool.purpose}</p>
                      <div className="flex items-start gap-2 mt-2 pt-2 border-t border-[#7c3aed]/10">
                        <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-[#c4b5fd] shrink-0" />
                        <p className="text-xs text-[#c4b5fd]">{tool.tip}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Vibe Workflow Steps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white/90">Workflow</h3>
              <div className="relative border-l-2 border-[#7c3aed]/30 ml-3 pl-8 py-2 space-y-8">
                {data.vibeCoding.workflow?.map((step, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[49px] top-0 flex h-8 w-8 items-center justify-center rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/20 text-sm font-bold text-[#c4b5fd] shadow-[0_0_10px_rgba(124,58,237,0.3)] transition-transform group-hover:scale-110">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Starter Prompt */}
          {data.vibeCoding.starterPrompt && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white/90 mb-3">Starter Prompt</h3>
              <div className="relative group">
                <pre className="overflow-x-auto rounded-xl border border-[#7c3aed]/20 bg-[#0d0d0d] p-5 text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-mono">
                  {data.vibeCoding.starterPrompt}
                </pre>
                <button
                  onClick={() => handleCopyPrompt(data.vibeCoding!.starterPrompt)}
                  className={cn(
                    "absolute right-3 top-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    promptCopied
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {promptCopied ? "Copied! ✅" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. ACTION BUTTONS */}
      <div className="mt-20 border-t border-white/10 pt-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: "500ms" }}>
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
          <Button
            onClick={() => {
              console.log("Saving functionality... UUID:", data.shareSlug)
            }}
            className="h-12 px-8 rounded-xl bg-[#7c3aed] text-white hover:bg-[#6d28d9] shadow-[0_0_20px_rgba(124,58,237,0.3)] font-semibold w-full sm:w-auto text-base"
          >
            <Bookmark className="mr-2 h-5 w-5" />
            Save My Stack
          </Button>
          
          <Button
            onClick={handleShare}
            variant="outline"
            className="h-12 px-8 rounded-xl border-white/20 bg-[#111] text-white hover:bg-white/10 font-semibold w-full sm:w-auto text-base"
          >
            <Share2 className="mr-2 h-5 w-5" />
            {copied ? "Copied Link!" : "Share Stack"}
          </Button>
          
          <Button
            onClick={() => router.push('/advisor')}
            variant="ghost"
            className="h-12 px-8 rounded-xl text-white/70 hover:text-white hover:bg-white/5 font-semibold w-full sm:w-auto text-base"
          >
            <RefreshCcw className="mr-2 h-5 w-5" />
            Try Again
          </Button>
          
          <Button
            onClick={() => router.push('/explore')}
            variant="ghost"
            className="h-12 px-8 rounded-xl text-white/70 hover:text-white hover:bg-white/5 font-semibold w-full sm:w-auto text-base"
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
    <div className="relative min-h-dvh bg-[#0a0a0a] text-foreground selection:bg-[#7c3aed]/30 overflow-hidden">
      {/* Background ambient glow isolated to prevent visual popping on suspense boundary */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1200px_circle_at_50%_-20%,rgba(124,58,237,0.15),transparent_60%)]" />
      
      <React.Suspense fallback={
        <div className="flex min-h-[100dvh] flex-col items-center justify-center space-y-4 relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
          <p className="animate-pulse text-sm text-white/50 tracking-widest uppercase font-medium">Resolving Stack</p>
        </div>
      }>
        <ResultContent />
      </React.Suspense>
    </div>
  )
}
