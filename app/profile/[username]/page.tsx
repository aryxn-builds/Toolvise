import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Globe,
  Layers,
  Pencil,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  // Check if this is the current user's profile
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === profile.id;

  // Fetch public stacks
  const { data: stacks } = await supabase
    .from("stacks")
    .select("*")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Avatar initials fallback
  const initials = (profile.display_name || profile.username || "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-dvh bg-[#fff1d6] text-[#111827]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#FFD896] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#F97316] to-[#FB923C] shadow-lg shadow-amber-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Toolvise</span>
          </Link>
          <div className="ml-auto">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[#111827]/60 hover:text-[#111827] flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <section className="rounded-2xl border border-[#FFD896] bg-white p-8 mb-10">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || profile.username}
                className="h-20 w-20 rounded-full object-cover border-2 border-[#FFD896]"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#F97316] to-[#FB923C] flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">
                  {profile.display_name || profile.username}
                </h1>
                {profile.skill_level && (
                  <Badge className="border border-[#FFD896] bg-[#fff1d6] text-[#111827]/70 text-xs">
                    {profile.skill_level}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-[#111827]/50">@{profile.username}</p>

              {profile.bio && (
                <p className="text-sm text-[#111827]/70 leading-relaxed max-w-xl mt-2">
                  {profile.bio}
                </p>
              )}

              <div className="flex items-center gap-4 pt-2 flex-wrap">
                {profile.website && (
                  <a
                    href={
                      profile.website.startsWith("http")
                        ? profile.website
                        : `https://${profile.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-[#F97316] hover:text-[#EA6C0A] transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                <span className="flex items-center gap-1 text-xs text-[#111827]/40">
                  <Calendar className="h-3.5 w-3.5" />
                  Builder since {joinDate}
                </span>
                <span className="flex items-center gap-1 text-xs text-[#111827]/40">
                  <Layers className="h-3.5 w-3.5" />
                  {profile.stacks_count || 0} stacks
                </span>
              </div>
            </div>

            {/* Edit button */}
            {isOwnProfile && (
              <Link href="/settings">
                <Button
                  variant="outline"
                  className="border-[#FFD896] text-[#111827]/70 hover:bg-[#fff1d6] hover:text-[#111827] rounded-xl"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* Public Stacks */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Public Stacks</h2>
          {stacks && stacks.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stacks.map((stack: Record<string, unknown>) => (
                <Card
                  key={stack.id as string}
                  className="border-[#FFD896] bg-white hover:shadow-lg transition-all rounded-2xl"
                >
                  <CardContent className="p-5 space-y-3">
                    <p className="text-sm font-medium text-[#111827] line-clamp-2">
                      &quot;{stack.user_input as string}&quot;
                    </p>
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
                    <Link
                      href={`/result?slug=${stack.share_slug}`}
                      className="flex items-center gap-1 text-sm font-semibold text-[#F97316] hover:text-[#EA6C0A] transition-colors pt-1"
                    >
                      View Stack
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#FFD896] bg-white p-12 text-center">
              <Layers className="h-10 w-10 text-[#111827]/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#111827] mb-1">
                No public stacks yet
              </h3>
              <p className="text-sm text-[#111827]/50">
                {isOwnProfile
                  ? "Generate your first stack with the AI advisor!"
                  : "This builder hasn't shared any stacks yet."}
              </p>
              {isOwnProfile && (
                <Link href="/advisor">
                  <Button className="mt-6 bg-[#F97316] text-white hover:bg-[#EA6C0A] rounded-xl">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create a Stack
                  </Button>
                </Link>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
