import Link from "next/link";
import { ArrowRight, Compass, LayoutGrid, Sparkles, Wand2 } from "lucide-react";

import { StackCard } from "@/components/StackCard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
          <span className="text-sm font-semibold tracking-wide text-white">
            Toolvise
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
          <Link className="hover:text-white" href="/advisor">
            Advisor
          </Link>
          <Link className="hover:text-white" href="/explore">
            Explore
          </Link>
          <Link className="hover:text-white" href="/result">
            Result
          </Link>
        </nav>

        <Link
          href="/advisor"
          className={cn(
            buttonVariants(),
            "h-10 bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
          )}
        >
          Try Free
          <ArrowRight className="ml-2 h-4 w-4" />
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
              <Badge className="border border-white/10 bg-white/5 text-white/80">
                Premium stack recommendations
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Your AI-powered tool and stack advisor for building faster.
              </h1>
              <p className="text-base leading-relaxed text-white/65 sm:text-lg">
                Describe your project. Toolvise suggests a modern, minimal stack
                with clear reasoning, trade-offs, and a path to ship.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/advisor"
                  className={cn(
                    buttonVariants(),
                    "h-11 bg-[#7c3aed] text-white shadow-[0_12px_40px_rgba(124,58,237,0.25)] hover:bg-[#6d28d9]"
                  )}
                >
                  Get my stack
                  <Wand2 className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/explore"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-11 border-white/15 bg-transparent text-white/85 hover:bg-white/5 hover:text-white"
                  )}
                >
                  Explore stacks
                  <Compass className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:mt-16">
              <Card className="border-white/10 bg-[#111111]/80 text-white">
                <CardHeader>
                  <CardTitle className="text-base">Instant clarity</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-white/65">
                  Skip the rabbit hole. Get an opinionated stack with the “why”
                  behind every tool.
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-[#111111]/80 text-white">
                <CardHeader>
                  <CardTitle className="text-base">Built to ship</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-white/65">
                  Minimal choices, premium defaults, and a clear path from MVP to
                  scale.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight">How it works</h2>
            <div className="hidden text-sm text-white/55 sm:block">
              3 steps to a confident stack
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: <LayoutGrid className="h-5 w-5 text-[#7c3aed]" />,
                title: "Describe",
                text: "Tell us what you’re building and your constraints.",
              },
              {
                icon: <Sparkles className="h-5 w-5 text-[#2563eb]" />,
                title: "Recommend",
                text: "Toolvise proposes a clean, modern stack with rationale.",
              },
              {
                icon: <ArrowRight className="h-5 w-5 text-white" />,
                title: "Ship",
                text: "Use the blueprint to start building immediately.",
              },
            ].map((s) => (
              <Card
                key={s.title}
                className="border-white/10 bg-[#111111]/80 text-white"
              >
                <CardHeader className="space-y-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/35">
                    {s.icon}
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
              Explore preview
            </h2>
            <Link
              href="/explore"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-white/15 bg-transparent text-white/85 hover:bg-white/5 hover:text-white"
              )}
            >
              Open explore
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
          <p>© {new Date().getFullYear()} Toolvise</p>
          <div className="flex items-center gap-4">
            <Link className="hover:text-white" href="/advisor">
              Try
            </Link>
            <Link className="hover:text-white" href="/explore">
              Explore
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
