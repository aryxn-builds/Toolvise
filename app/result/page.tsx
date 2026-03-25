import { ArrowUpRight, Bookmark, Share2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tools = [
  {
    name: "Next.js 14",
    why: "App Router, great DX, and fast iteration for MVPs.",
    tier: "Free",
    href: "https://nextjs.org",
  },
  {
    name: "Supabase",
    why: "Postgres + Auth + Storage with minimal setup.",
    tier: "Free",
    href: "https://supabase.com",
  },
  {
    name: "shadcn/ui",
    why: "Premium UI primitives with full control.",
    tier: "Free",
    href: "https://ui.shadcn.com",
  },
  {
    name: "Gemini",
    why: "Strong reasoning for stack recommendations and prompts.",
    tier: "Paid",
    href: "https://ai.google.dev",
  },
];

export default function ResultPage() {
  return (
    <div className="relative min-h-dvh bg-[#0a0a0a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_15%_15%,rgba(124,58,237,0.18),transparent_55%),radial-gradient(900px_circle_at_85%_25%,rgba(37,99,235,0.14),transparent_55%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Sparkles className="h-4 w-4 text-[#7c3aed]" />
            Your recommended stack
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
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/10 bg-[#111111]/80 text-white">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl tracking-tight">
                Summary
              </CardTitle>
              <p className="text-sm text-white/60">
                Opinionated, minimal, modern SaaS stack optimized for speed and
                maintainability.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-white/75">
              <p>
                Build with Next.js for the product surface, Supabase for auth +
                data, shadcn/ui for premium UI, and Gemini for recommendation
                generation.
              </p>
              <Separator className="bg-white/10" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Time to MVP</span>
                  <span className="font-medium text-white">1–3 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Complexity</span>
                  <span className="font-medium text-white">Low</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Scaling path</span>
                  <span className="font-medium text-white">Clear</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {tools.map((t) => (
              <Card
                key={t.name}
                className="border-white/10 bg-[#111111]/80 text-white"
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <Badge
                      className={
                        t.tier === "Free"
                          ? "border border-white/10 bg-black/35 text-white/80"
                          : "border border-[#7c3aed]/40 bg-[#7c3aed]/15 text-white"
                      }
                    >
                      {t.tier}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-white/70">{t.why}</p>
                  <a
                    href={t.href}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                    )}
                  >
                    Learn
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
