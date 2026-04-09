"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  Github,
  Globe,
  Linkedin,
  Twitter,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Code2,
  FolderOpen,
  Layers,
  Pencil,
  Trash2,
  Check,
  Plus,
  ExternalLink,
  Building2,
  BadgeCheck,
  Users,
  Sparkles,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FollowButton } from "@/components/FollowButton"
import { FollowersPanel } from "@/components/FollowersPanel"
import { SkillsManager } from "@/components/SkillsManager"
import type { WorkExperience, Education, Skill, PortfolioProject } from "@/lib/types"

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  developer: "bg-[#2EA043]/20 border-[#2EA043]/40 text-[#2EA043]",
  student: "bg-[#388BFD]/20 border-[#388BFD]/40 text-[#388BFD]",
  company: "bg-[#F0A500]/20 border-[#F0A500]/40 text-[#F0A500]",
  startup: "bg-[#1ABC9C]/20 border-[#1ABC9C]/40 text-[#1ABC9C]",
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  developer: "👨‍💻 Developer",
  student: "🎓 Student",
  company: "🏢 Company",
  startup: "🚀 Startup",
}

const OPEN_TO_LABELS: Record<string, string> = {
  fulltime: "Full-time",
  internship: "Internship",
  freelance: "Freelance",
  cofounding: "Co-founding",
  mentoring: "Mentoring",
  hiring: "Hiring",
}

const TABS = [
  { key: "overview", label: "Overview", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { key: "experience", label: "Experience", icon: <Briefcase className="h-3.5 w-3.5" /> },
  { key: "education", label: "Education", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { key: "skills", label: "Skills", icon: <Code2 className="h-3.5 w-3.5" /> },
  { key: "portfolio", label: "Portfolio", icon: <FolderOpen className="h-3.5 w-3.5" /> },
  { key: "stacks", label: "Stacks", icon: <Layers className="h-3.5 w-3.5" /> },
] as const

type TabKey = "overview" | "experience" | "education" | "skills" | "portfolio" | "stacks"

// Minimum typed shape for profile data from Supabase
interface ProfileData {
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

interface StackData {
  id: string
  user_input: string | null
  tools: { name: string }[] | null
  share_slug: string | null
}

interface Props {
  profile: ProfileData
  workExperience: WorkExperience[]
  education: Education[]
  skills: Skill[]
  endorsedSkillIds: string[]
  portfolioProjects: PortfolioProject[]
  stacks: StackData[]
  isOwnProfile: boolean
  currentUserId: string | null
}

function formatDateRange(start: string, end: string | null, isCurrent: boolean): string {
  const fmt = (d: string) => {
    const [year, month] = d.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  }
  return `${fmt(start)} – ${isCurrent || !end ? "Present" : fmt(end)}`
}

export function ProfilePageClient({
  profile,
  workExperience,
  education,
  skills,
  endorsedSkillIds,
  portfolioProjects,
  stacks,
  isOwnProfile,
  currentUserId,
}: Props) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<TabKey>("overview")
  const [localEndorsed, setLocalEndorsed] = useState<Set<string>>(new Set(endorsedSkillIds))
  const [endorsingId, setEndorsingId] = useState<string | null>(null)
  const [skillCounts, setSkillCounts] = useState<Record<string, number>>(
    Object.fromEntries(skills.map((s) => [s.id, s.endorsements_count]))
  )

  // Portfolio state
  const [localProjects, setLocalProjects] = useState<PortfolioProject[]>(portfolioProjects)
  const [showAddProject, setShowAddProject] = useState(false)
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null)
  const [projectForm, setProjectForm] = useState({
    title: "", description: "", url: "", github_url: "", tech_tags: "", stack_id: ""
  })
  const [savingProject, setSavingProject] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)

  const initials = ((profile.display_name as string) || (profile.username as string) || "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const joinDate = new Date(profile.created_at as string).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  })

  const accountType = (profile.account_type as string) || "developer"
  const openTo = (profile.open_to as string[]) || []

  // ── Endorse / Un-endorse ──────────────────────────────────────────────────
  async function handleEndorse(skillId: string) {
    if (!currentUserId || isOwnProfile || endorsingId) return
    const wasEndorsed = localEndorsed.has(skillId)
    setEndorsingId(skillId)

    try {
      if (wasEndorsed) {
        const newSet = new Set(localEndorsed)
        newSet.delete(skillId)
        setLocalEndorsed(newSet)
        setSkillCounts((prev) => ({ ...prev, [skillId]: Math.max(0, (prev[skillId] || 0) - 1) }))
        await supabase.from("skill_endorsements")
          .delete()
          .eq("skill_id", skillId)
          .eq("endorser_id", currentUserId)
      } else {
        const newSet = new Set(localEndorsed)
        newSet.add(skillId)
        setLocalEndorsed(newSet)
        setSkillCounts((prev) => ({ ...prev, [skillId]: (prev[skillId] || 0) + 1 }))
        await supabase.from("skill_endorsements")
          .insert({ skill_id: skillId, endorser_id: currentUserId })
      }
    } catch {
      // Revert optimistic update
      if (wasEndorsed) {
        const newSet = new Set(localEndorsed)
        newSet.add(skillId)
        setLocalEndorsed(newSet)
        setSkillCounts((prev) => ({ ...prev, [skillId]: (prev[skillId] || 0) + 1 }))
      } else {
        const newSet = new Set(localEndorsed)
        newSet.delete(skillId)
        setLocalEndorsed(newSet)
        setSkillCounts((prev) => ({ ...prev, [skillId]: Math.max(0, (prev[skillId] || 0) - 1) }))
      }
    } finally {
      setEndorsingId(null)
    }
  }

  // ── Portfolio CRUD ────────────────────────────────────────────────────────
  function openAddProject() {
    setEditingProject(null)
    setProjectForm({ title: "", description: "", url: "", github_url: "", tech_tags: "", stack_id: "" })
    setShowAddProject(true)
  }

  function openEditProject(proj: PortfolioProject) {
    setEditingProject(proj)
    setProjectForm({
      title: proj.title,
      description: proj.description || "",
      url: proj.url || "",
      github_url: proj.github_url || "",
      tech_tags: proj.tech_tags.join(", "),
      stack_id: proj.stack_id || "",
    })
    setShowAddProject(true)
  }

  async function handleSaveProject() {
    if (!currentUserId || !projectForm.title.trim()) return
    setSavingProject(true)
    try {
      const payload = {
        user_id: currentUserId,
        title: projectForm.title.trim(),
        description: projectForm.description.trim() || null,
        url: projectForm.url.trim() || null,
        github_url: projectForm.github_url.trim() || null,
        tech_tags: projectForm.tech_tags.split(",").map((t) => t.trim()).filter(Boolean),
        stack_id: projectForm.stack_id || null,
      }

      if (editingProject) {
        const { data } = await supabase.from("portfolio_projects")
          .update(payload)
          .eq("id", editingProject.id)
          .select()
          .maybeSingle()
        if (data) {
          setLocalProjects((prev) => prev.map((p) => p.id === editingProject.id ? data as PortfolioProject : p))
        }
      } else {
        const { data } = await supabase.from("portfolio_projects")
          .insert(payload)
          .select()
          .maybeSingle()
        if (data) setLocalProjects((prev) => [data as PortfolioProject, ...prev])
      }
      setShowAddProject(false)
    } catch {
      // silent
    } finally {
      setSavingProject(false)
    }
  }

  async function handleDeleteProject(id: string) {
    if (deletingProjectId !== id) { setDeletingProjectId(id); return }
    try {
      await supabase.from("portfolio_projects").delete().eq("id", id)
      setLocalProjects((prev) => prev.filter((p) => p.id !== id))
    } catch {
      // silent
    } finally {
      setDeletingProjectId(null)
    }
  }

  // ── Hero ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Cover + Avatar */}
      <div className="relative">
        <div className="h-40 w-full overflow-hidden">
          {profile.cover_url ? (
            <img src={profile.cover_url as string} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-[#0D1117] via-[#161B22] to-[#0D1117] border-b border-[rgba(240,246,252,0.08)]" />
          )}
        </div>

        {/* Avatar overlapping */}
        <div className="absolute -bottom-12 left-6">
          <Avatar className="h-24 w-24 border-4 border-[#0D1117] shadow-xl">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url as string} alt={profile.display_name as string || ""} className="object-cover" />
            )}
            <AvatarFallback className="bg-gradient-to-br from-[#2EA043] to-[#1ABC9C] text-white text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Edit/Follow button top-right */}
        <div className="absolute bottom-4 right-6">
          {isOwnProfile ? (
            <Link href="/settings">
              <Button variant="outline" className="btn-ghost text-sm h-9">
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Profile
              </Button>
            </Link>
          ) : (
            <FollowButton
              profileUserId={profile.id as string}
              currentUserId={currentUserId}
              initialIsFollowing={false}
              initialFollowersCount={profile.followers_count as number ?? 0}
            />
          )}
        </div>
      </div>

      {/* Identity info */}
      <div className="mt-14 px-6 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-[#E6EDF3] font-heading">
            {(profile.display_name as string) || (profile.username as string)}
          </h1>
          {profile.is_verified && (
            <BadgeCheck className="h-5 w-5 text-[#388BFD]" />
          )}
          <Badge className={cn("border text-xs px-2.5 py-0.5 rounded-full", ACCOUNT_TYPE_COLORS[accountType])}>
            {ACCOUNT_TYPE_LABELS[accountType]}
          </Badge>
          {profile.is_hiring && (
            <Badge className="bg-[#F0A500]/20 border-[#F0A500]/40 text-[#F0A500] text-xs px-2.5 py-0.5 rounded-full border">
              🔥 Hiring
            </Badge>
          )}
          {profile.skill_level && (
            <Badge className="border border-[rgba(240,246,252,0.15)] text-[#8B949E] text-xs px-2.5 py-0.5">
              {profile.skill_level as string}
            </Badge>
          )}
        </div>

        <p className="text-sm text-[#8B949E]">@{profile.username as string}</p>

        {profile.headline && (
          <p className="text-base text-[#E6EDF3]/80 max-w-xl">{profile.headline as string}</p>
        )}

        {openTo.length > 0 && (
          <p className="text-xs text-[#1ABC9C]">
            Open to: {openTo.map((o) => OPEN_TO_LABELS[o] || o).join(" · ")}
          </p>
        )}

        {/* Social links */}
        <div className="flex items-center gap-4 flex-wrap text-[#8B949E]">
          {profile.location && (
            <span className="flex items-center gap-1.5 text-xs">
              <MapPin className="h-3.5 w-3.5" /> {profile.location as string}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5" /> Joined {joinDate}
          </span>
          {profile.github_url && (
            <a href={profile.github_url as string} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs hover:text-[#E6EDF3] transition-colors">
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
          )}
          {profile.twitter_url && (
            <a href={profile.twitter_url as string} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs hover:text-[#E6EDF3] transition-colors">
              <Twitter className="h-3.5 w-3.5" /> Twitter
            </a>
          )}
          {profile.linkedin_url && (
            <a href={profile.linkedin_url as string} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs hover:text-[#E6EDF3] transition-colors">
              <Linkedin className="h-3.5 w-3.5" /> LinkedIn
            </a>
          )}
          {profile.website && (
            <a href={(profile.website as string).startsWith("http") ? profile.website as string : `https://${profile.website as string}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs hover:text-[#E6EDF3] transition-colors">
              <Globe className="h-3.5 w-3.5" /> Website
            </a>
          )}
        </div>

        {/* Stats */}
        <FollowersPanel
          profileId={profile.id as string}
          followersCount={profile.followers_count as number ?? 0}
          followingCount={profile.following_count as number ?? 0}
          stacksCount={profile.stacks_count as number ?? 0}
        />
      </div>

      {/* Tab Navigation */}
      <div className="mt-6 border-b border-[rgba(240,246,252,0.08)]">
        <div className="flex overflow-x-auto scrollbar-none gap-1 px-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all",
                activeTab === tab.key
                  ? "border-[#2EA043] text-[#2EA043]"
                  : "border-transparent text-[#8B949E] hover:text-[#E6EDF3]"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* About */}
            {profile.bio && (
              <div className="card-3d p-6">
                <h2 className="text-sm font-semibold text-[#8B949E] uppercase tracking-wider mb-3">About</h2>
                <p className="text-[#E6EDF3]/80 leading-relaxed">{profile.bio as string}</p>
              </div>
            )}

            {/* Company info for company/startup */}
            {(accountType === "company" || accountType === "startup") && profile.company_name && (
              <div className="card-3d p-6">
                <h2 className="text-sm font-semibold text-[#8B949E] uppercase tracking-wider mb-4">Organization</h2>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[#161B22] border border-[rgba(240,246,252,0.10)] flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-[#F0A500]" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-[#E6EDF3]">{profile.company_name as string}</p>
                    {profile.industry && <p className="text-sm text-[#8B949E]">{profile.industry as string}</p>}
                    <div className="flex items-center gap-3 text-xs text-[#484F58] flex-wrap mt-2">
                      {profile.company_size && <span>👥 {profile.company_size as string} employees</span>}
                      {profile.funding_stage && <span>💰 {profile.funding_stage as string}</span>}
                      {profile.company_website && (
                        <a href={profile.company_website as string} target="_blank" rel="noopener noreferrer"
                          className="text-[#2EA043] flex items-center gap-1 hover:underline">
                          <Globe className="h-3 w-3" /> Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Stacks", value: profile.stacks_count as number || 0 },
                { label: "Followers", value: profile.followers_count as number || 0 },
                { label: "Skills", value: skills.length },
              ].map((stat) => (
                <div key={stat.label} className="card-3d p-4 text-center">
                  <p className="text-2xl font-bold text-[#E6EDF3]">{stat.value}</p>
                  <p className="text-xs text-[#8B949E] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Top Skills preview */}
            {skills.length > 0 && (
              <div className="card-3d p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-[#8B949E] uppercase tracking-wider">Top Skills</h2>
                  <button onClick={() => setActiveTab("skills")} className="text-xs text-[#2EA043] hover:underline">View all →</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 8).map((skill) => (
                    <span key={skill.id}
                      className="px-3 py-1.5 rounded-full bg-[#0D1117] border border-[rgba(240,246,252,0.10)] text-xs text-[#E6EDF3]/80">
                      {skill.name} {skillCounts[skill.id] > 0 && <span className="text-[#484F58]">· {skillCounts[skill.id]}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience preview */}
            {workExperience.length > 0 && (
              <div className="card-3d p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-[#8B949E] uppercase tracking-wider">Experience</h2>
                  <button onClick={() => setActiveTab("experience")} className="text-xs text-[#2EA043] hover:underline">View all →</button>
                </div>
                <div className="space-y-4">
                  {workExperience.slice(0, 2).map((exp) => (
                    <div key={exp.id} className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-[#0D1117] border border-[rgba(240,246,252,0.10)] flex items-center justify-center shrink-0">
                        <Briefcase className="h-4 w-4 text-[#2EA043]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#E6EDF3]">{exp.title}</p>
                        <p className="text-xs text-[#8B949E]">{exp.company}</p>
                        <p className="text-xs text-[#484F58]">{formatDateRange(exp.start_date, exp.end_date, exp.is_current)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EXPERIENCE ── */}
        {activeTab === "experience" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#E6EDF3]">Work Experience</h2>
              {isOwnProfile && (
                <Link href="/settings/experience">
                  <Button variant="outline" className="btn-ghost text-sm h-8 px-3">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
                  </Button>
                </Link>
              )}
            </div>

            {workExperience.length === 0 ? (
              <div className="card-3d p-12 text-center">
                <Briefcase className="h-10 w-10 text-[#484F58] mx-auto mb-4" />
                <p className="text-[#E6EDF3]/60">No work experience added yet.</p>
                {isOwnProfile && (
                  <Link href="/settings/experience">
                    <Button className="mt-4 btn-primary text-sm">Add Experience</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="card-3d divide-y divide-[rgba(240,246,252,0.06)]">
                {workExperience.map((exp) => (
                  <div key={exp.id} className="p-5 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-[#0D1117] border border-[rgba(240,246,252,0.10)] flex items-center justify-center shrink-0 mt-0.5">
                      <Briefcase className="h-5 w-5 text-[#2EA043]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[#E6EDF3]">{exp.title}</p>
                        {exp.employment_type && (
                          <Badge className="border border-[rgba(240,246,252,0.10)] text-[#8B949E] text-xs px-2 py-0.5">
                            {exp.employment_type}
                          </Badge>
                        )}
                        {exp.is_current && (
                          <Badge className="bg-[#2EA043]/20 border-[#2EA043]/40 text-[#2EA043] text-xs px-2 py-0.5 border">Current</Badge>
                        )}
                      </div>
                      <p className="text-sm text-[#8B949E] mt-0.5">{exp.company}</p>
                      <p className="text-xs text-[#484F58] mt-0.5">{formatDateRange(exp.start_date, exp.end_date, exp.is_current)}</p>
                      {exp.description && (
                        <p className="text-sm text-[#E6EDF3]/60 mt-2 leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                    {isOwnProfile && (
                      <Link href="/settings/experience" className="shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#484F58] hover:text-[#E6EDF3]">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EDUCATION ── */}
        {activeTab === "education" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#E6EDF3]">Education</h2>
              {isOwnProfile && (
                <Link href="/settings/education">
                  <Button variant="outline" className="btn-ghost text-sm h-8 px-3">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
                  </Button>
                </Link>
              )}
            </div>

            {education.length === 0 ? (
              <div className="card-3d p-12 text-center">
                <GraduationCap className="h-10 w-10 text-[#484F58] mx-auto mb-4" />
                <p className="text-[#E6EDF3]/60">No education added yet.</p>
                {isOwnProfile && (
                  <Link href="/settings/education">
                    <Button className="mt-4 btn-primary text-sm">Add Education</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="card-3d divide-y divide-[rgba(240,246,252,0.06)]">
                {education.map((edu) => (
                  <div key={edu.id} className="p-5 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-[#0D1117] border border-[rgba(240,246,252,0.10)] flex items-center justify-center shrink-0 mt-0.5">
                      <GraduationCap className="h-5 w-5 text-[#388BFD]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#E6EDF3]">{edu.institution}</p>
                      {(edu.degree || edu.field_of_study) && (
                        <p className="text-sm text-[#8B949E] mt-0.5">
                          {[edu.degree, edu.field_of_study].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {(edu.start_year || edu.end_year) && (
                        <p className="text-xs text-[#484F58] mt-0.5">
                          {edu.start_year} – {edu.is_current ? "Present" : edu.end_year || ""}
                        </p>
                      )}
                      {edu.grade && (
                        <p className="text-xs text-[#8B949E] mt-0.5">Grade: {edu.grade}</p>
                      )}
                    </div>
                    {isOwnProfile && (
                      <Link href="/settings/education" className="shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#484F58] hover:text-[#E6EDF3]">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SKILLS ── */}
        {activeTab === "skills" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#E6EDF3]">Skills</h2>
            </div>

            {isOwnProfile && currentUserId && (
              <SkillsManager userId={currentUserId} initialSkills={skills} />
            )}

            {skills.length === 0 && !isOwnProfile ? (
              <div className="card-3d p-12 text-center">
                <Code2 className="h-10 w-10 text-[#484F58] mx-auto mb-4" />
                <p className="text-[#E6EDF3]/60">No skills added yet.</p>
              </div>
            ) : skills.length > 0 && (
              <div>
                {!isOwnProfile && <h3 className="text-sm text-[#8B949E] mb-3">Click Endorse to validate a skill</h3>}
                <div className="flex flex-wrap gap-2.5">
                  {skills.map((skill) => {
                    const endorsed = localEndorsed.has(skill.id)
                    const count = skillCounts[skill.id] ?? 0
                    return (
                      <div key={skill.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0D1117] border border-[rgba(240,246,252,0.10)] group">
                        <span className="text-sm text-[#E6EDF3]">{skill.name}</span>
                        {count > 0 && <span className="text-xs text-[#484F58]">{count}</span>}
                        {!isOwnProfile && (
                          <button
                            onClick={() => handleEndorse(skill.id)}
                            disabled={!currentUserId || endorsingId === skill.id}
                            className={cn(
                              "ml-1 flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium transition-all",
                              endorsed
                                ? "bg-[#2EA043]/20 text-[#2EA043]"
                                : "bg-[#161B22] text-[#484F58] hover:text-[#8B949E]",
                              (!currentUserId) && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <Check className="h-3 w-3" />
                            {endorsed ? "Endorsed" : "Endorse"}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PORTFOLIO ── */}
        {activeTab === "portfolio" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#E6EDF3]">Portfolio</h2>
              {isOwnProfile && !showAddProject && (
                <Button onClick={openAddProject} className="btn-primary text-sm h-8 px-3">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Project
                </Button>
              )}
            </div>

            {/* Add/Edit Form */}
            {showAddProject && (
              <div className="card-3d p-6 space-y-4">
                <h3 className="text-base font-semibold text-[#E6EDF3]">
                  {editingProject ? "Edit Project" : "Add Project"}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-[#E6EDF3]/80 text-sm">Project Title *</Label>
                    <Input value={projectForm.title} onChange={(e) => setProjectForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="My Awesome Project" className="input-dark" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-[#E6EDF3]/80 text-sm">Description</Label>
                    <Textarea value={projectForm.description} onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="What does this project do?" rows={3} className="input-dark resize-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#E6EDF3]/80 text-sm">Live URL</Label>
                    <Input value={projectForm.url} onChange={(e) => setProjectForm((p) => ({ ...p, url: e.target.value }))}
                      placeholder="https://myproject.com" className="input-dark" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#E6EDF3]/80 text-sm">GitHub URL</Label>
                    <Input value={projectForm.github_url} onChange={(e) => setProjectForm((p) => ({ ...p, github_url: e.target.value }))}
                      placeholder="https://github.com/user/repo" className="input-dark" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-[#E6EDF3]/80 text-sm">Tech Tags (comma-separated)</Label>
                    <Input value={projectForm.tech_tags} onChange={(e) => setProjectForm((p) => ({ ...p, tech_tags: e.target.value }))}
                      placeholder="Next.js, TypeScript, Supabase" className="input-dark" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={handleSaveProject} disabled={savingProject || !projectForm.title.trim()} className="btn-primary text-sm">
                    {savingProject ? "Saving…" : editingProject ? "Update" : "Add Project"}
                  </Button>
                  <Button variant="outline" className="btn-ghost text-sm" onClick={() => setShowAddProject(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {localProjects.length === 0 ? (
              <div className="card-3d p-12 text-center">
                <FolderOpen className="h-10 w-10 text-[#484F58] mx-auto mb-4" />
                <p className="text-[#E6EDF3]/60">Showcase your projects here.</p>
                {isOwnProfile && (
                  <Button onClick={openAddProject} className="mt-4 btn-primary text-sm">Add First Project</Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {localProjects.map((proj) => (
                  <Card key={proj.id} className="card-3d rounded-2xl group">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-[#E6EDF3] leading-tight">{proj.title}</p>
                        {isOwnProfile && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => openEditProject(proj)} className="h-7 w-7 flex items-center justify-center rounded-lg text-[#484F58] hover:text-[#E6EDF3] hover:bg-[#161B22] transition-all">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteProject(proj.id)}
                              className={cn("h-7 w-7 flex items-center justify-center rounded-lg transition-all",
                                deletingProjectId === proj.id ? "text-red-400 bg-red-900/20" : "text-[#484F58] hover:text-red-400")}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {proj.description && (
                        <p className="text-xs text-[#8B949E] line-clamp-2 leading-relaxed">{proj.description}</p>
                      )}

                      {proj.tech_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {proj.tech_tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded-md bg-[#0D1117] border border-[rgba(240,246,252,0.08)] text-[10px] text-[#484F58]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-1">
                        {proj.url && (
                          <a href={proj.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-[#2EA043] hover:underline">
                            <ExternalLink className="h-3 w-3" /> Live
                          </a>
                        )}
                        {proj.github_url && (
                          <a href={proj.github_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-[#8B949E] hover:text-[#E6EDF3]">
                            <Github className="h-3 w-3" /> Code
                          </a>
                        )}
                        {proj.stack_id && (
                          <Link href={`/result?stackId=${proj.stack_id}`}
                            className="flex items-center gap-1 text-xs text-[#8B949E] hover:text-[#E6EDF3]">
                            <Layers className="h-3 w-3" /> Stack
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STACKS ── */}
        {activeTab === "stacks" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#E6EDF3]">Public Stacks</h2>
            {stacks.length === 0 ? (
              <div className="card-3d p-12 text-center">
                <Layers className="h-10 w-10 text-[#484F58] mx-auto mb-4" />
                <p className="text-[#E6EDF3]/60">
                  {isOwnProfile ? "Generate your first stack with AI!" : "No public stacks yet."}
                </p>
                {isOwnProfile && (
                  <Link href="/advisor">
                    <Button className="mt-4 btn-primary text-sm">
                      <Sparkles className="mr-2 h-4 w-4" /> Create a Stack
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stacks.map((stack) => (
                  <Card key={stack.id} className="card-3d hover:shadow-lg transition-all rounded-2xl">
                    <CardContent className="p-5 space-y-3">
                      <p className="text-sm font-medium text-[#E6EDF3] line-clamp-2">
                        &quot;{stack.user_input}&quot;
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(stack.tools || []).slice(0, 3).map((t, idx) => (
                          <Badge key={idx} className="border card-3d text-[#E6EDF3]/70 text-xs">{t.name}</Badge>
                        ))}
                      </div>
                      <Link href={`/result?slug=${stack.share_slug}`}
                        className="flex items-center gap-1 text-sm font-semibold text-[#2EA043] hover:underline transition-colors pt-1">
                        View Stack <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
