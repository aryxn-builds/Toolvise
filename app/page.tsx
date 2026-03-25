import Link from "next/link";
import { ArrowRight, Compass, Layers3, Sparkles } from "lucide-react";

import { StackCard } from "@/components/StackCard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/70 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#2563eb] shadow-[0_10px_30px_rgba(124,58,237,0.25)]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-wide text-white">
            Toolvise
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
          <Link className="transition-colors hover:text-white" href="/">
            Home
          </Link>
          <Link className="transition-colors hover:text-white" href="/explore">
            Explore
          </Link>
          <Link className="transition-colors hover:text-white" href="/about">
            About
          </Link>
        </nav>

        <Link
          href="/advisor"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-10 border-white/15 bg-transparent text-white/85 transition-all hover:-translate-y-0.5 hover:bg-white/5 hover:text-white active:translate-y-0"
          )}
        >
          Try Free
        </Link>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <div className="bg-[#0a0a0a] text-white">
      <Nav />

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_15%_15%,rgba(124,58,237,0.22),transparent_55%),radial-gradient(900px_circle_at_85%_20%,rgba(37,99,235,0.18),transparent_55%)]" />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="max-w-2xl space-y-6">
              <Badge className="w-fit border border-white/10 bg-white/5 text-white/80">
                AI-Powered Stack Advisor
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Stop Guessing. Start Building.
              </h1>
              <p className="text-base leading-relaxed text-white/65 sm:text-lg">
                Tell us what you&apos;re building — Toolvise finds the perfect
                tools, stack, and learning path for you. Free.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/advisor"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-11 bg-[#7c3aed] px-5 text-white shadow-[0_12px_40px_rgba(124,58,237,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#6d28d9] active:translate-y-0"
                  )}
                >
                  Find My Stack <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </div>

              <p className="text-xs leading-relaxed text-white/55 sm:text-sm">
                No signup needed • 100% Free • Powered by Gemini AI
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:mt-16">
              <Card className="border-white/10 bg-[#111111]/80 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_70px_rgba(0,0,0,0.55)]">
                <CardHeader className="space-y-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/35">
                    <Layers3 className="h-5 w-5 text-[#7c3aed]" />
                  </div>
                  <CardTitle className="text-base">Clarity, instantly</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-white/65">
                  A clean, opinionated stack with reasoning and trade-offs — not
                  a list of links.
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-[#111111]/80 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_70px_rgba(0,0,0,0.55)]">
                <CardHeader className="space-y-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/35">
                    <Compass className="h-5 w-5 text-[#2563eb]" />
                  </div>
                  <CardTitle className="text-base">A path to ship</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-white/65">
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
              <p className="text-sm text-white/55">3 steps to a confident stack</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Describe Your Project",
                text: "Tell us what you’re building in plain English",
                icon: <Sparkles className="h-5 w-5 text-[#7c3aed]" />,
              },
              {
                n: "02",
                title: "AI Analyzes & Recommends",
                text: "Gemini AI finds your perfect stack",
                icon: <Layers3 className="h-5 w-5 text-[#2563eb]" />,
              },
              {
                n: "03",
                title: "Build With Confidence",
                text: "Get tools, resources and roadmap instantly",
                icon: <ArrowRight className="h-5 w-5 text-white" />,
              },
            ].map((s) => (
              <Card
                key={s.n}
                className="border-white/10 bg-[#111111]/80 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_70px_rgba(0,0,0,0.55)]"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/35">
                      {s.icon}
                    </div>
                    <span className="text-xs font-medium tracking-wider text-white/45">
                      {s.n}
                    </span>
                  </div>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-white/65">{s.text}</CardContent>
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
                "border-white/15 bg-transparent text-white/85 transition-all hover:-translate-y-0.5 hover:bg-white/5 hover:text-white active:translate-y-0"
              )}
            >
              View All Stacks <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <StackCard title="AI Flashcards Generator" />
            <StackCard title="Startup CRM MVP" />
            <StackCard title="Design Portfolio + Blog" />
          </div>
          <Separator className="mt-14 bg-white/10" />
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-10 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Toolvise © 2025 • Built for builders</p>
          <div className="flex items-center gap-4">
            <Link className="transition-colors hover:text-white" href="/">
              Home
            </Link>
            <Link className="transition-colors hover:text-white" href="/explore">
              Explore
            </Link>
            <Link className="transition-colors hover:text-white" href="/about">
              About
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
