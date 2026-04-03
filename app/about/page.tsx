import Link from "next/link"
import { Target, Bot, Globe, Zap, Code2, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

import { buttonVariants } from "@/components/ui/button-variants"
import { Navbar } from "@/components/Navbar"

export const revalidate = 60 // Update stats every minute

export default async function AboutPage() {
  const supabase = await createClient()

  const { count } = await supabase
    .from("stacks")
    .select("*", { count: "exact", head: true })

  const statsCount = count || 0

  return (
    <div className="min-h-dvh bg-white bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(232,162,78,0.12)_0%,transparent_70%)] font-sans text-foreground/90 selection:bg-amber-500/30">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pt-24 pb-24 sm:px-6 lg:px-8">
        
        {/* 1. HERO SECTION */}
        <section className="mb-24 text-center mt-12 animate-in slide-in-from-bottom-6 fade-in duration-300">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300 sm:text-6xl mb-6">
            About Toolvise
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-foreground/60 leading-relaxed">
            Built for builders who are tired of guessing their tech stack.
          </p>
        </section>

        <div className="grid gap-20 md:gap-32">
          
          {/* 2. WHAT IS TOOLVISE */}
          <section className="animate-in slide-in-from-bottom-6 fade-in duration-300 delay-75 fill-mode-both">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <Code2 className="h-6 w-6 text-amber-400" /> What is Toolvise?
              </h2>
              <p className="text-lg text-foreground/70 leading-relaxed">
                Toolvise is a free AI-powered stack advisor that helps developers, students, and startups find the perfect tools for their projects. Just describe what you&apos;re building — we handle the rest.
              </p>
            </div>
          </section>

          {/* 3. WHY WE BUILT THIS */}
          <section className="animate-in slide-in-from-bottom-6 fade-in duration-300 delay-100 fill-mode-both">
            <div className="max-w-3xl ml-auto text-left md:text-right">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3 justify-start md:justify-end">
                <Users className="h-6 w-6 text-amber-400" /> Why we built this
              </h2>
              <p className="text-lg text-foreground/70 leading-relaxed">
                As developers ourselves, we spent hours researching which tools to use for every new project. Stack Overflow threads, Reddit posts, YouTube videos — just to decide on a tech stack. Toolvise fixes that. One prompt. Perfect stack. Instantly.
              </p>
            </div>
          </section>

          {/* 4. FEATURES SECTION */}
          <section className="animate-in slide-in-from-bottom-6 fade-in duration-300 delay-75 fill-mode-both">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">What Toolvise does</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              
              <div className="rounded-2xl border border-border bg-white p-8 backdrop-blur-sm transition-colors hover:bg-white">
                <Target className="h-8 w-8 text-orange-400 mb-5" />
                <h3 className="text-xl font-semibold text-foreground mb-3">🎯 Personalized Recommendations</h3>
                <p className="text-foreground/60">Based on your skill level, budget and goal</p>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 backdrop-blur-sm shadow-[0_0_30px_-10px_rgba(168,85,247,0.15)] transition-colors hover:bg-amber-500/10">
                <Bot className="h-8 w-8 text-amber-400 mb-5" />
                <h3 className="text-xl font-semibold text-foreground mb-3">🤖 Vibe Coding Workflow</h3>
                <p className="text-foreground/60">AI tools and prompts to build faster</p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-8 backdrop-blur-sm transition-colors hover:bg-white">
                <Globe className="h-8 w-8 text-emerald-400 mb-5" />
                <h3 className="text-xl font-semibold text-foreground mb-3">🌍 Community Stacks</h3>
                <p className="text-foreground/60">See what others are building worldwide</p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-8 backdrop-blur-sm transition-colors hover:bg-white">
                <Zap className="h-8 w-8 text-amber-400 mb-5" />
                <h3 className="text-xl font-semibold text-foreground mb-3">⚡ Instant & Free</h3>
                <p className="text-foreground/60">No signup needed. Results in seconds.</p>
              </div>

            </div>
          </section>

          {/* 5. BUILT BY SECTION & CTA */}
          <section className="rounded-3xl border border-border bg-gradient-to-b from-white/5 to-transparent p-10 text-center sm:p-16 animate-in slide-in-from-bottom-6 fade-in duration-300 delay-200 fill-mode-both">
            <h2 className="text-3xl font-bold text-foreground mb-6">Built by a student, for builders</h2>
            <p className="mx-auto max-w-2xl text-lg text-foreground/60 leading-relaxed mb-10">
              Toolvise was built solo by a student developer who was tired of the same problem. No big team. No VC funding. Just code, caffeine, and a vision to help builders move faster.
            </p>
            <Link href="/advisor" className={buttonVariants({ className: "h-14 rounded-full bg-white px-10 text-lg font-semibold text-black transition-all hover:scale-105 hover:bg-white/90 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]" })}>
              Try Toolvise Free →
            </Link>
          </section>

          {/* 6. STATS SECTION */}
          <section className="grid gap-6 sm:grid-cols-3 text-center border-t border-border pt-16 mt-8 animate-in slide-in-from-bottom-6 fade-in duration-300 delay-100 fill-mode-both">
            <div>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-indigo-400 mb-2">
                {statsCount}
              </div>
              <div className="text-sm font-medium text-foreground/50 uppercase tracking-wider">Stacks Generated</div>
            </div>
            <div>
              <div className="text-4xl font-black text-foreground mb-2">100%</div>
              <div className="text-sm font-medium text-foreground/50 uppercase tracking-wider">Free forever</div>
            </div>
            <div>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 mb-2">AI</div>
              <div className="text-sm font-medium text-foreground/50 uppercase tracking-wider">Powered by Gemini</div>
            </div>
          </section>

        </div>
      </main>
      
      <footer className="bg-neutral-700 border-t-0 mt-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-10 text-sm text-neutral-300 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Toolvise © 2025 • Built for builders</p>
          <div className="flex items-center gap-4">
            <Link className="transition-colors hover:text-amber-300" href="/">
              Home
            </Link>
            <Link className="transition-colors hover:text-amber-300" href="/explore">
              Explore
            </Link>
            <Link className="transition-colors hover:text-amber-300" href="/about">
              About
            </Link>
            <Link className="transition-colors hover:text-amber-300 flex items-center gap-1" href="/report">
              Report a Bug 🐛
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
