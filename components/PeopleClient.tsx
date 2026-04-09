"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { Users, Search, Layers } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FollowButton } from "@/components/FollowButton"
import { cn } from "@/lib/utils"

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  developer: "bg-[#2EA043]/20 border-[#2EA043]/40 text-[#2EA043]",
  student: "bg-[#388BFD]/20 border-[#388BFD]/40 text-[#388BFD]",
  company: "bg-[#F0A500]/20 border-[#F0A500]/40 text-[#F0A500]",
  startup: "bg-[#1ABC9C]/20 border-[#1ABC9C]/40 text-[#1ABC9C]",
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  developer: "Developer",
  student: "Student",
  company: "Company",
  startup: "Startup",
}

type FilterType = "all" | "developer" | "student" | "company" | "startup"

interface ProfileSummary {
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

interface PersonCardProps {
  profile: ProfileSummary
  currentUserId: string | null
  initialIsFollowing: boolean
}

function PersonCard({ profile, currentUserId, initialIsFollowing }: PersonCardProps) {
  const accountType = profile.account_type || "developer"
  const initials = (profile.display_name || profile.username || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="card-3d p-5 flex flex-col gap-4 rounded-2xl hover:shadow-lg transition-all">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 border-2 border-[rgba(240,246,252,0.10)] shrink-0">
          {profile.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={profile.display_name || ""} className="object-cover" />
          )}
          <AvatarFallback className="bg-gradient-to-br from-[#2EA043] to-[#1ABC9C] text-white font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-[#E6EDF3] truncate">
              {profile.display_name || profile.username}
            </p>
            <Badge className={cn("border text-[10px] px-2 py-0.5 rounded-full", ACCOUNT_TYPE_COLORS[accountType])}>
              {ACCOUNT_TYPE_LABELS[accountType]}
            </Badge>
          </div>
          <p className="text-xs text-[#484F58]">@{profile.username}</p>
          {profile.headline && (
            <p className="text-xs text-[#8B949E] mt-1 line-clamp-2">{profile.headline}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-[#484F58]">
        <span className="flex items-center gap-1">
          <Layers className="h-3 w-3" /> {profile.stacks_count ?? 0} stacks
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" /> {profile.followers_count ?? 0} followers
        </span>
        {profile.skill_level && (
          <Badge className="border border-[rgba(240,246,252,0.10)] text-[#8B949E] text-[10px] px-1.5 py-0">
            {profile.skill_level}
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-[rgba(240,246,252,0.06)]">
        <Link
          href={`/profile/${profile.username}`}
          className="flex-1 text-center px-3 py-1.5 rounded-xl text-xs font-medium text-[#8B949E] border border-[rgba(240,246,252,0.10)] hover:text-[#E6EDF3] hover:border-[rgba(240,246,252,0.20)] transition-all"
        >
          View Profile
        </Link>
        {currentUserId && currentUserId !== profile.id && (
          <FollowButton
            profileUserId={profile.id}
            currentUserId={currentUserId}
            initialIsFollowing={initialIsFollowing}
            initialFollowersCount={profile.followers_count ?? 0}
          />
        )}
      </div>
    </div>
  )
}

interface PeopleClientProps {
  profiles: ProfileSummary[]
  currentUserId: string | null
  followingIds: string[]
}

export function PeopleClient({ profiles, currentUserId, followingIds }: PeopleClientProps) {
  const [filter, setFilter] = useState<FilterType>("all")
  const [search, setSearch] = useState("")

  const followingSet = new Set(followingIds)

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      const matchesFilter = filter === "all" || (p.account_type || "developer") === filter
      const q = search.toLowerCase()
      const matchesSearch = !q ||
        (p.display_name || "").toLowerCase().includes(q) ||
        (p.username || "").toLowerCase().includes(q) ||
        (p.headline || "").toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
  }, [profiles, filter, search])

  const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "developer", label: "Developers" },
    { key: "student", label: "Students" },
    { key: "company", label: "Companies" },
    { key: "startup", label: "Startups" },
  ]

  return (
    <>
      {/* Search + Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#484F58]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, or headline…"
            className="input-dark pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                filter === opt.key
                  ? "bg-[#2EA043] border-[#2EA043] text-white"
                  : "border-[rgba(240,246,252,0.10)] text-[#8B949E] hover:text-[#E6EDF3]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-[#484F58]">{filtered.length} {filtered.length === 1 ? "person" : "people"} found</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card-3d p-12 text-center">
          <Users className="h-10 w-10 text-[#484F58] mx-auto mb-4" />
          <p className="text-[#E6EDF3]/60">No people found matching your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((profile) => (
            <PersonCard
              key={profile.id as string}
              profile={profile}
              currentUserId={currentUserId}
              initialIsFollowing={followingSet.has(profile.id as string)}
            />
          ))}
        </div>
      )}
    </>
  )
}
