import Link from "next/link"
import { Sparkles, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { PeopleClient } from "@/components/PeopleClient"

export const metadata = {
  title: "Discover People · Toolvise",
  description: "Find developers, students, companies, and startups building on Toolvise.",
}

type ProfileSummary = {
  id: string
  username: string
  display_name: string | null
  headline: string | null
  avatar_url: string | null
  skill_level: string | null
  account_type: string | null
  stacks_count: number | null
  followers_count: number | null
  following_count: number | null
}

export default async function PeoplePage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id ?? null

  // Fetch top profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, headline, avatar_url, skill_level, account_type, stacks_count, followers_count, following_count")
    .order("followers_count", { ascending: false })
    .limit(40)

  // Fetch who the current user follows (to pre-populate follow buttons)
  let followingIds: string[] = []
  if (currentUserId) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId)
    followingIds = (follows || []).map((f: { following_id: string }) => f.following_id)
  }

  return (
    <div className="min-h-dvh bg-[#0D1117] text-[#E6EDF3]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[rgba(240,246,252,0.10)] bg-[#161B22]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-r from-[#2EA043] to-[#1ABC9C]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight font-heading">Toolvise</span>
          </Link>
          <nav className="ml-8 hidden items-center gap-6 text-sm md:flex text-[#8B949E]">
            <Link href="/explore" className="hover:text-[#E6EDF3] transition-colors">Explore</Link>
            <Link href="/people" className="text-[#E6EDF3] font-medium transition-colors">People</Link>
            <Link href="/leaderboard" className="hover:text-[#E6EDF3] transition-colors">Leaderboard</Link>
          </nav>
          <div className="ml-auto">
            {user ? (
              <Link href="/dashboard" className="text-sm font-medium text-[#8B949E] hover:text-[#E6EDF3] transition-colors">
                Dashboard →
              </Link>
            ) : (
              <Link href="/login" className="btn-ghost px-4 py-2 text-sm">Sign In</Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        {/* Page heading */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#2EA043] to-[#1ABC9C] flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold font-heading text-[#E6EDF3]">Discover People</h1>
          </div>
          <p className="text-[#8B949E]">Connect with developers, founders, and students building with Toolvise.</p>
        </div>

        {/* Client component handles search + filter + grid */}
        <PeopleClient
          profiles={(profiles as ProfileSummary[]) || []}
          currentUserId={currentUserId}
          followingIds={followingIds}
        />
      </main>
    </div>
  )
}
