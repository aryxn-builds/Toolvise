"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Compass, Layers3, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button-variants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/Navbar"

// ── Hardcoded fallback cards ───────────────────────────────────────────────
const FALLBACK_CARDS = [
  {
    title: "E-Learning Chemistry Platform",
    tools: ["Next.js", "Supabase", "Gemini"],
    goal: "Build MVP Fast",
    slug: null,
  },
  {
    title: "AI Resume Reviewer",
    tools: ["React", "Node.js", "OpenAI"],
    goal: "Startup Product",
    slug: null,
  },
  {
    title: "Freelance CRM Dashboard",
    tools: ["Next.js", "Tailwind", "Supabase"],
    goal: "Freelance Project",
    slug: null,
  },
]

interface CommunityStack {
  title: string
  tools: string[]
  goal: string
  slug: string | null
}


function CommunityCards() {
  const [cards, setCards] = React.useState<CommunityStack[]>([])
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    async function fetchRecentStacks() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("stacks")
          .select("user_input, tools, goal, share_slug")
          .order("created_at", { ascending: false })
          .limit(3)

  interface Stack {
    id: string
    user_input: string
    tools: { name: string }[]
    goal: string
    share_slug: string
    created_at: string
  }

        if (data && !error && data.length > 0) {
          setCards(
            data.map((raw: unknown) => {
              const d = raw as Stack;
              return {
                title: d.user_input,
                tools: (d.tools || []).slice(0, 3).map((t: { name: string } | string) => typeof t === "string" ? t : t.name),
                goal: d.goal || "",
                slug: d.share_slug || null,
              }
            })
          )
        } else {
          setCards(FALLBACK_CARDS)
        }
      } catch {
        setCards(FALLBACK_CARDS)
      } finally {
        setLoaded(true)
      }
    }

    fetchRecentStacks()
  }, [])

  if (!loaded) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(n => (
          <Card key={n} className="h-48 bg-white border-[#FFD896] animate-pulse rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className="group border-[#FFD896] bg-white text-[#111827] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_70px_rgba(0,0,0,0.55)] hover:border-[#FFD896] transition-all"
        >
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-base font-semibold tracking-tight line-clamp-2">
                {card.title}
              </CardTitle>
              <Badge
                variant="secondary"
                className="border border-[#FFD896] bg-white text-[#111827]/80 shrink-0"
              >
                <Sparkles className="mr-1 h-3.5 w-3.5 text-[#F97316]" />
                AI Stack
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {card.tools.map((t) => (
                <Badge
                  key={t}
                  className="border border-[#FFD896] bg-[#fff1d6] text-[#111827]/80 hover:bg-black/45"
                >
                  {t}
                </Badge>
              ))}
            </div>

            {card.goal && (
              <Badge variant="outline" className="border-[#F97316]/30 bg-[#F97316]/10 text-[#c4b5fd] text-[10px] uppercase tracking-wider font-bold">
                {card.goal}
              </Badge>
            )}

            <div className="flex items-center justify-end">
              {card.slug ? (
                <Link
                  href={`/result?slug=${card.slug}`}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#F97316] hover:text-[#9353d3] transition-colors"
                >
                  View Stack
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/advisor"
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#F97316] hover:text-[#9353d3] transition-colors"
                >
                  Build Yours
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <div className="bg-white text-[#111827]">
      <Navbar />

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_15%_15%,rgba(249,115,22,0.15),transparent_55%),radial-gradient(900px_circle_at_85%_20%,rgba(251,146,60,0.12),transparent_55%)]" />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="max-w-2xl space-y-6">
              <Badge className="w-fit border border-[#FFD896] bg-white text-[#111827]/80">
                AI-Powered Stack Advisor
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Stop Guessing. Start Building.
              </h1>
              <p className="text-base leading-relaxed text-[#111827]/65 sm:text-lg">
                Tell us what you&apos;re building — Toolvise finds the perfect
                tools, stack, and learning path for you. Free.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/advisor"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-11 bg-[#F97316] px-5 text-[#111827] shadow-[0_12px_40px_rgba(249,115,22,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#EA6C0A] active:translate-y-0"
                  )}
                >
                  Find My Stack <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </div>

              <p className="text-xs leading-relaxed text-[#111827]/55 sm:text-sm">
                No signup needed • 100% Free • Powered by Gemini AI
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:mt-16">
              <Card className="border-[#FFD896] bg-white text-[#111827] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_70px_rgba(0,0,0,0.55)]">
                <CardHeader className="space-y-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#FFD896] bg-[#fff1d6]">
                    <Layers3 className="h-5 w-5 text-[#F97316]" />
                  </div>
                  <CardTitle className="text-base">Clarity, instantly</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-[#111827]/65">
                  A clean, opinionated stack with reasoning and trade-offs — not
                  a list of links.
                </CardContent>
              </Card>
              <Card className="border-[#FFD896] bg-white text-[#111827] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_70px_rgba(0,0,0,0.55)]">
                <CardHeader className="space-y-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#FFD896] bg-[#fff1d6]">
                    <Compass className="h-5 w-5 text-[#FB923C]" />
                  </div>
                  <CardTitle className="text-base">A path to ship</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-[#111827]/65">
                  Tools plus a learning roadmap so you can build with confidence
                  from day one.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">How it works</h2>
              <p className="text-sm text-[#111827]/55">3 steps to a confident stack</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Describe Your Project",
                text: "Tell us what you're building in plain English",
                icon: <Sparkles className="h-5 w-5 text-[#F97316]" />,
              },
              {
                n: "02",
                title: "AI Analyzes & Recommends",
                text: "Gemini AI finds your perfect stack",
                icon: <Layers3 className="h-5 w-5 text-[#FB923C]" />,
              },
              {
                n: "03",
                title: "Build With Confidence",
                text: "Get tools, resources and roadmap instantly",
                icon: <ArrowRight className="h-5 w-5 text-[#111827]" />,
              },
            ].map((s) => (
              <Card
                key={s.n}
                className="border-[#FFD896] bg-white text-[#111827] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_70px_rgba(0,0,0,0.55)]"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#FFD896] bg-[#fff1d6]">
                      {s.icon}
                    </div>
                    <span className="text-xs font-medium tracking-wider text-[#111827]/45">
                      {s.n}
                    </span>
                  </div>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-[#111827]/65">{s.text}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight">
              See What Others Are Building
            </h2>
            <Link
              href="/explore"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-[#FFD896] bg-transparent text-[#111827]/85 transition-all hover:-translate-y-0.5 hover:bg-white hover:text-[#111827] active:translate-y-0"
              )}
            >
              View All Stacks <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
          <CommunityCards />
          <Separator className="mt-14 bg-white" />
        </section>
      </main>

      <footer className="border-t border-[#FFD896] bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-10 text-sm text-[#111827]/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Toolvise © 2025 • Built for builders</p>
          <div className="flex items-center gap-4">
            <Link className="transition-colors hover:text-[#111827]" href="/">
              Home
            </Link>
            <Link className="transition-colors hover:text-[#111827]" href="/explore">
              Explore
            </Link>
            <Link className="transition-colors hover:text-[#111827]" href="/about">
              About
            </Link>
            <Link className="transition-colors hover:text-[#111827] flex items-center gap-1" href="/report">
              Report a Bug 🐛
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
