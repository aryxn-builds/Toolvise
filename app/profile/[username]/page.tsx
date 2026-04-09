import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ProfilePageClient } from "@/components/ProfilePageClient"
import type { WorkExperience, Education, Skill, PortfolioProject } from "@/lib/types"

type ProfileData = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  cover_url: string | null
  bio: string | null
  headline: string | null
  website: string | null
  github_url: string | null
  twitter_url: string | null
  linkedin_url: string | null
  location: string | null
  skill_level: string | null
  account_type: string | null
  open_to: string[] | null
  company_name: string | null
  industry: string | null
  company_size: string | null
  funding_stage: string | null
  company_website: string | null
  is_hiring: boolean | null
  is_verified: boolean | null
  stacks_count: number | null
  followers_count: number | null
  following_count: number | null
  created_at: string
}

type StackData = {
  id: string
  user_input: string | null
  tools: { name: string }[] | null
  share_slug: string | null
}

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle()

  if (!profile) notFound()

  // Get current viewer
  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === profile.id
  const currentUserId = user?.id ?? null

  // Fetch all data in parallel
  const [
    { data: workExperience },
    { data: education },
    { data: skills },
    { data: portfolioProjects },
    { data: stacks },
  ] = await Promise.all([
    supabase
      .from("work_experience")
      .select("*")
      .eq("user_id", profile.id)
      .order("start_date", { ascending: false }),
    supabase
      .from("education")
      .select("*")
      .eq("user_id", profile.id)
      .order("start_year", { ascending: false }),
    supabase
      .from("skills")
      .select("*")
      .eq("user_id", profile.id)
      .order("endorsements_count", { ascending: false })
      .limit(20),
    supabase
      .from("portfolio_projects")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("stacks")
      .select("*")
      .eq("user_id", profile.id)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  // Fetch viewer's endorsements for this profile's skills
  let endorsedSkillIds: string[] = []
  if (currentUserId && skills && skills.length > 0) {
    const skillIds = skills.map((s: Skill) => s.id)
    const { data: endorsements } = await supabase
      .from("skill_endorsements")
      .select("skill_id")
      .eq("endorser_id", currentUserId)
      .in("skill_id", skillIds)
    endorsedSkillIds = (endorsements || []).map((e: { skill_id: string }) => e.skill_id)
  }

  return (
    <div className="min-h-dvh bg-[#0D1117] text-[#E6EDF3]">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-[rgba(240,246,252,0.10)] bg-[#161B22]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-r from-[#2EA043] to-[#1ABC9C]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight font-heading">Toolvise</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/people"
              className="text-sm text-[#8B949E] hover:text-[#E6EDF3] transition-colors hidden sm:block"
            >
              People
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[#E6EDF3]/60 hover:text-[#E6EDF3] flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl pb-16">
        <ProfilePageClient
          profile={profile as ProfileData}
          workExperience={(workExperience as WorkExperience[]) || []}
          education={(education as Education[]) || []}
          skills={(skills as Skill[]) || []}
          endorsedSkillIds={endorsedSkillIds}
          portfolioProjects={(portfolioProjects as PortfolioProject[]) || []}
          stacks={(stacks as StackData[]) || []}
          isOwnProfile={isOwnProfile}
          currentUserId={currentUserId}
        />
      </main>
    </div>
  )
}
