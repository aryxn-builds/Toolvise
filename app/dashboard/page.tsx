import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Sparkles,
  Layers,
  Settings,
  User,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Fetch user's stacks
  const { data: stacks } = await supabase
    .from("stacks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const displayName =
    profile?.display_name || profile?.username || user.email?.split("@")[0];

  return (
    <div className="min-h-dvh bg-[#fff1d6] text-[#111827]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#FFD896] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#F97316] to-[#FB923C] shadow-lg shadow-amber-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Toolvise</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${profile?.username || ""}`}
              className="text-sm font-medium text-[#111827]/60 hover:text-[#111827] flex items-center gap-2 transition-colors"
            >
              <User className="h-4 w-4" /> Profile
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-[#111827]/60 hover:text-[#111827] flex items-center gap-2 transition-colors"
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Welcome */}
        <section className="mb-10">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {displayName} 👋
          </h1>
          <p className="text-[#111827]/50">
            Here&apos;s an overview of your generated stacks.
          </p>
        </section>

        {/* Quick actions */}
        <section className="flex flex-wrap gap-3 mb-10">
          <Link href="/advisor">
            <Button className="bg-[#F97316] text-white hover:bg-[#EA6C0A] rounded-xl shadow-lg shadow-amber-500/20">
              <Plus className="mr-2 h-4 w-4" />
              New Stack
            </Button>
          </Link>
          <Link href="/explore">
            <Button
              variant="outline"
              className="border-[#FFD896] text-[#111827]/70 hover:bg-white hover:text-[#111827] rounded-xl"
            >
              <Layers className="mr-2 h-4 w-4" />
              Explore Community
            </Button>
          </Link>
        </section>

        {/* Stacks grid */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Your Stacks</h2>
          {stacks && stacks.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stacks.map((stack: Record<string, unknown>) => (
                <Card
                  key={stack.id as string}
                  className="border-[#FFD896] bg-white hover:shadow-lg transition-all rounded-2xl group"
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[#111827] line-clamp-2 flex-1">
                        &quot;{stack.user_input as string}&quot;
                      </p>
                      <Badge className="border border-[#FFD896] bg-[#fff1d6] text-[#111827]/60 text-[10px] shrink-0">
                        {stack.skill_level as string}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {((stack.tools as { name: string }[]) || [])
                        .slice(0, 3)
                        .map(
                          (
                            t: { name: string },
                            idx: number
                          ) => (
                            <Badge
                              key={idx}
                              className="border border-[#FFD896] bg-[#fff1d6] text-[#111827]/70 text-xs"
                            >
                              {t.name}
                            </Badge>
                          )
                        )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#FFD896]/50">
                      <span className="text-xs text-[#111827]/40">
                        {new Date(
                          stack.created_at as string
                        ).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/result?slug=${stack.share_slug}`}
                        className="flex items-center gap-1 text-sm font-semibold text-[#F97316] hover:text-[#EA6C0A] transition-colors"
                      >
                        View
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#FFD896] bg-white p-12 text-center">
              <Layers className="h-10 w-10 text-[#111827]/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#111827] mb-1">
                No stacks yet
              </h3>
              <p className="text-sm text-[#111827]/50 mb-6">
                Generate your first AI-powered stack recommendation!
              </p>
              <Link href="/advisor">
                <Button className="bg-[#F97316] text-white hover:bg-[#EA6C0A] rounded-xl shadow-lg shadow-amber-500/20">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Find My Stack
                </Button>
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
