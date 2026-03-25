"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Bookmark,
  Share2,
  Sparkles,
  ArrowLeft,
  Clock,
  Lightbulb,
  Loader2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────
interface Tool {
  name: string
  category: string
  reason: string
  isFree: boolean
  learnUrl: string
  difficulty: string
}

interface StackResult {
  summary: string
  tools: Tool[]
  roadmap: string[]
  estimatedTime: string
  proTip: string
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

// ── Main Component ─────────────────────────────────────────────────────────
export default function ResultPage() {
  const [data, setData] = React.useState<StackResult | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("toolvise_result")
      if (raw) {
        setData(JSON.parse(raw))
      }
    } catch {
      console.error("[result] Failed to parse localStorage data")
    } finally {
      setLoading(false)
    }
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0a0a0a] text-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" />
      </div>
    )
  }

  // No data state
  if (!data) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#0a0a0a] text-white">
        <p className="text-white/60">No stack result found.</p>
        <Link
          href="/advisor"
          className="flex items-center gap-2 text-sm text-[#7c3aed] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Go to advisor
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh bg-[#0a0a0a] text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_15%_15%,rgba(124,58,237,0.18),transparent_55%),radial-gradient(900px_circle_at_85%_25%,rgba(37,99,235,0.14),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/advisor"
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Sparkles className="h-4 w-4 text-[#7c3aed]" />
              Your recommended stack
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-white/15 bg-transparent text-white/85 hover:bg-white/5 hover:text-white"
            >
              <Bookmark className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button
              variant="outline"
              className="border-white/15 bg-transparent text-white/85 hover:bg-white/5 hover:text-white"
              onClick={() => {
                const url = `${window.location.origin}/result?slug=${data.shareSlug || ""}`
                navigator.clipboard.writeText(url)
              }}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* ── Left column: Summary + Roadmap ── */}
          <div className="space-y-6">
            {/* Summary card */}
            <Card className="border-white/10 bg-[#111111]/80 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_70px_rgba(0,0,0,0.55)]">
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl tracking-tight">
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-white/75">
                <p className="leading-relaxed">{data.summary}</p>
                <Separator className="bg-white/10" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-white/60">
                      <Clock className="h-3.5 w-3.5" />
                      Time to MVP
                    </span>
                    <span className="font-medium text-white">
                      {data.estimatedTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Tools</span>
                    <span className="font-medium text-white">
                      {data.tools?.length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Roadmap card */}
            <Card className="border-white/10 bg-[#111111]/80 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_70px_rgba(0,0,0,0.55)]">
              <CardHeader>
                <CardTitle className="text-lg tracking-tight">
                  Build Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="relative ml-3 space-y-4 border-l border-white/10 pl-6">
                  {data.roadmap?.map((step, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0a0a0a] text-xs font-bold text-[#7c3aed]">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-white/75">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* Pro tip card */}
            {data.proTip && (
              <Card className="border-[#7c3aed]/20 bg-[#7c3aed]/5 text-white">
                <CardContent className="flex items-start gap-3 pt-5">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#7c3aed]" />
                  <div>
                    <p className="mb-1 text-sm font-semibold text-[#7c3aed]">
                      Pro Tip
                    </p>
                    <p className="text-sm leading-relaxed text-white/75">
                      {data.proTip}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Right column: Tools grid ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {data.tools?.map((t) => (
              <Card
                key={t.name}
                className="border-white/10 bg-[#111111]/80 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_70px_rgba(0,0,0,0.55)]"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <Badge
                      className={cn(
                        "text-[10px] font-semibold",
                        t.isFree
                          ? "border border-white/10 bg-black/35 text-white/80"
                          : "border border-[#7c3aed]/40 bg-[#7c3aed]/15 text-white"
                      )}
                    >
                      {t.isFree ? "Free" : "Paid"}
                    </Badge>
                  </div>
                  <Badge
                    className={cn(
                      "w-fit border text-[10px]",
                      CATEGORY_COLORS[t.category] ||
                        "border-white/10 bg-white/5 text-white/60"
                    )}
                  >
                    {t.category}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed text-white/70">
                    {t.reason}
                  </p>
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>Difficulty: {t.difficulty}</span>
                  </div>
                  <a
                    href={t.learnUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
                  >
                    Learn
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/advisor"
            className="flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Try another project
          </Link>
        </div>
      </div>
    </div>
  )
}
