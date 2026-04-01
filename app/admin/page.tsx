"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Bug,
  ChevronDown,
  Layers,
  Megaphone,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  TrendingUp,
  Users,
  Star,
  Eye,
  EyeOff,
  X,
  Activity,
  AlertTriangle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

// ── Types ───────────────────────────────────────────────────────────────────

interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  is_admin: boolean
  stacks_count: number
  created_at: string
}

interface Stack {
  id: string
  user_input: string | null
  build_style: string | null
  goal: string | null
  is_public: boolean
  is_featured: boolean
  upvotes: number
  score_card: { overallScore?: number } | null
  created_at: string
  share_slug: string | null
  user_id: string | null
}

interface BugReport {
  id: string
  name: string | null
  email: string | null
  bug_type: string | null
  page_name: string | null
  description: string | null
  status: string
  created_at: string
}

interface Announcement {
  id: string
  message: string
  is_active: boolean
  created_at: string
}

interface ApiLog {
  id: string
  provider: string
  model: string | null
  success: boolean
  is_fallback: boolean | null
  duration_ms: number | null
  error_message: string | null
  tokens_used: number | null
  created_at: string
}

interface ToastState {
  msg: string
  ok: boolean
}

type TabKey = "overview" | "users" | "stacks" | "bugs" | "announcements" | "api"

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <TrendingUp className="h-4 w-4" /> },
  { key: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { key: "stacks", label: "Stacks", icon: <Layers className="h-4 w-4" /> },
  { key: "bugs", label: "Bug Reports", icon: <Bug className="h-4 w-4" /> },
  { key: "announcements", label: "Announcements", icon: <Megaphone className="h-4 w-4" /> },
  { key: "api", label: "API Monitor", icon: <Activity className="h-4 w-4" /> },
]

// ── Main Component ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter()

  // Auth
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  // Tabs
  const [activeTab, setActiveTab] = React.useState<TabKey>("overview")

  // Overview
  const [totalUsers, setTotalUsers] = React.useState(0)
  const [totalStacks, setTotalStacks] = React.useState(0)
  const [todayStacks, setTodayStacks] = React.useState(0)
  const [openBugs, setOpenBugs] = React.useState(0)
  const [recentStacks, setRecentStacks] = React.useState<{ build_style: string | null }[]>([])
  const [goalStats, setGoalStats] = React.useState<{ goal: string | null }[]>([])

  // Users
  const [users, setUsers] = React.useState<Profile[]>([])
  const [userSearch, setUserSearch] = React.useState("")

  // Stacks
  const [stacks, setStacks] = React.useState<Stack[]>([])
  const [stackSearch, setStackSearch] = React.useState("")
  const [stackBuildFilter, setStackBuildFilter] = React.useState("all")
  const [stackPublicFilter, setStackPublicFilter] = React.useState("all")

  // Bugs
  const [bugs, setBugs] = React.useState<BugReport[]>([])
  const [bugFilter, setBugFilter] = React.useState("all")
  const [expandedBug, setExpandedBug] = React.useState<string | null>(null)

  // Announcements
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([])
  const [newMessage, setNewMessage] = React.useState("")

  // API Logs
  const [apiLogs, setApiLogs] = React.useState<ApiLog[]>([])

  // Toast
  const [toast, setToast] = React.useState<ToastState | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Admin check + data load ─────────────────────────────────────────────

  React.useEffect(() => {
    async function checkAdmin() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single()

        if (!profile?.is_admin) {
          router.push("/")
          return
        }

        setIsAdmin(true)
        await loadAllData()
      } catch (err) {
        console.error("Admin check failed:", err)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }
    checkAdmin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAllData() {
    try {
      const supabase = createClient()
      const todayISO = new Date().toISOString().split("T")[0]

      const [
        usersCount,
        stacksCount,
        todayCount,
        bugsCount,
        recent,
        buildStyles,
        goals,
        usersData,
        stacksData,
        bugsData,
        announcementsData,
        apiLogsData,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("stacks").select("*", { count: "exact", head: true }),
        supabase.from("stacks").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("bug_reports").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("stacks").select("build_style").order("created_at", { ascending: false }).limit(100),
        supabase.from("stacks").select("build_style"),
        supabase.from("stacks").select("goal"),
        supabase.from("profiles").select("id, username, display_name, avatar_url, is_admin, stacks_count, created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("stacks").select("id, user_input, build_style, goal, is_public, is_featured, upvotes, score_card, created_at, share_slug, user_id").order("created_at", { ascending: false }).limit(50),
        supabase.from("bug_reports").select("*").order("created_at", { ascending: false }),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }),
        supabase.from('api_usage_logs').select('*').order('created_at', { ascending: false }).limit(100),
      ])

      setTotalUsers(usersCount.count ?? 0)
      setTotalStacks(stacksCount.count ?? 0)
      setTodayStacks(todayCount.count ?? 0)
      setOpenBugs(bugsCount.count ?? 0)
      setRecentStacks((recent.data as { build_style: string | null }[]) || [])
      setGoalStats((goals.data as { goal: string | null }[]) || [])
      setUsers((usersData.data as Profile[]) || [])
      setStacks((stacksData.data as Stack[]) || [])
      setBugs((bugsData.data as BugReport[]) || [])
      setAnnouncements((announcementsData.data as Announcement[]) || [])
      setApiLogs((apiLogsData?.data as ApiLog[]) || [])
    } catch (err) {
      console.error("Failed to load data:", err)
      showToast("Failed to load data", false)
    }
  }

  // ── Stack Actions ───────────────────────────────────────────────────────

  async function handleDeleteStack(stackId: string) {
    if (!window.confirm("Are you sure you want to delete this stack? This cannot be undone.")) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from("stacks").delete().eq("id", stackId)
      if (error) throw error
      setStacks(prev => prev.filter(s => s.id !== stackId))
      setTotalStacks(prev => prev - 1)
      showToast("Stack deleted successfully")
    } catch (err) {
      console.error("Delete stack failed:", err)
      showToast("Failed to delete stack", false)
    }
  }

  async function handleFeatureStack(stackId: string, featured: boolean) {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("stacks").update({ is_featured: featured }).eq("id", stackId)
      if (error) throw error
      setStacks(prev => prev.map(s => s.id === stackId ? { ...s, is_featured: featured } : s))
      showToast(featured ? "Stack featured!" : "Stack unfeatured")
    } catch (err) {
      console.error("Feature stack failed:", err)
      showToast("Failed to update stack", false)
    }
  }

  // ── Bug Actions ─────────────────────────────────────────────────────────

  async function updateBugStatus(bugId: string, status: string) {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("bug_reports").update({ status }).eq("id", bugId)
      if (error) throw error
      setBugs(prev => prev.map(b => b.id === bugId ? { ...b, status } : b))
      if (status === "resolved") setOpenBugs(prev => Math.max(0, prev - 1))
      if (status === "open") setOpenBugs(prev => prev + 1)
      showToast(`Bug marked as ${status.replace("_", " ")}`)
    } catch (err) {
      console.error("Update bug failed:", err)
      showToast("Failed to update bug status", false)
    }
  }

  // ── Announcement Actions ────────────────────────────────────────────────

  async function postAnnouncement() {
    if (!newMessage.trim()) return
    try {
      const supabase = createClient()

      // Deactivate all existing
      await supabase.from("announcements").update({ is_active: false }).eq("is_active", true)

      // Insert new
      const { data, error } = await supabase
        .from("announcements")
        .insert({ message: newMessage.trim(), is_active: true })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setAnnouncements(prev => [data as Announcement, ...prev.map(a => ({ ...a, is_active: false }))])
      }
      setNewMessage("")
      showToast("Announcement posted!")
    } catch (err) {
      console.error("Post announcement failed:", err)
      showToast("Failed to post announcement", false)
    }
  }

  async function toggleAnnouncementActive(id: string, isActive: boolean) {
    try {
      const supabase = createClient()

      if (isActive) {
        // Deactivate all first
        await supabase.from("announcements").update({ is_active: false }).eq("is_active", true)
      }

      const { error } = await supabase.from("announcements").update({ is_active: isActive }).eq("id", id)
      if (error) throw error

      setAnnouncements(prev =>
        prev.map(a => {
          if (a.id === id) return { ...a, is_active: isActive }
          if (isActive) return { ...a, is_active: false }
          return a
        })
      )
      showToast(isActive ? "Announcement activated" : "Announcement deactivated")
    } catch (err) {
      console.error("Toggle announcement failed:", err)
      showToast("Failed to update announcement", false)
    }
  }

  async function deleteAnnouncement(id: string) {
    if (!window.confirm("Delete this announcement?")) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from("announcements").delete().eq("id", id)
      if (error) throw error
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      showToast("Announcement deleted")
    } catch (err) {
      console.error("Delete announcement failed:", err)
      showToast("Failed to delete announcement", false)
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  function truncate(str: string | null, len: number) {
    if (!str) return "—"
    return str.length > len ? str.slice(0, len) + "…" : str
  }

  // ── Computed ────────────────────────────────────────────────────────────

  const filteredUsers = (users || []).filter(u => {
    if (!userSearch) return true
    const q = userSearch.toLowerCase()
    return (u.username?.toLowerCase().includes(q)) || (u.display_name?.toLowerCase().includes(q))
  })

  const filteredStacks = (stacks || []).filter(s => {
    if (stackSearch && !s.user_input?.toLowerCase().includes(stackSearch.toLowerCase())) return false
    if (stackBuildFilter !== "all" && s.build_style !== stackBuildFilter) return false
    if (stackPublicFilter === "public" && !s.is_public) return false
    if (stackPublicFilter === "private" && s.is_public) return false
    return true
  })

  const filteredBugs = (bugs || []).filter(b => {
    if (bugFilter === "all") return true
    return b.status === bugFilter
  })

  // Build style stats
  const buildStyleCounts = React.useMemo(() => {
    const counts: Record<string, number> = { traditional: 0, vibe: 0, nocode: 0 }
    for (const s of recentStacks || []) {
      if (s.build_style && counts[s.build_style] !== undefined) {
        counts[s.build_style]++
      }
    }
    return counts
  }, [recentStacks])

  // Goal stats
  const topGoals = React.useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of goalStats || []) {
      const g = s.goal || "Unknown"
      counts[g] = (counts[g] || 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [goalStats])

  // ── Loading State ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#fff1d6]">
        <header className="sticky top-0 z-50 border-b border-[#FFD896] bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#F97316] to-[#FB923C] flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                <div className="h-3 w-24 rounded bg-gray-100 animate-pulse mt-1" />
              </div>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 rounded-xl bg-white border border-[#FFD896] animate-pulse" />
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[1, 2].map(i => (
              <div key={i} className="h-64 rounded-xl bg-white border border-[#FFD896] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-[#fff1d6]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#FFD896] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#F97316] to-[#FB923C] flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-[#111827]">Admin Dashboard</h1>
              <p className="text-xs text-[#6B7280]">Toolvise Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setLoading(true)
                loadAllData().finally(() => setLoading(false))
              }}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-[#6B7280] hover:bg-[#fff1d6] hover:text-[#111827] transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <Link
              href="/"
              className="text-sm text-[#6B7280] hover:text-[#111827] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Site
            </Link>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-[#FFD896] bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-2 scrollbar-hide" aria-label="Admin tabs">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  activeTab === tab.key
                    ? "bg-[#F97316] text-white shadow-md shadow-[#F97316]/20"
                    : "text-[#6B7280] hover:bg-[#fff1d6] hover:text-[#111827]"
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.key === "bugs" && openBugs > 0 && (
                  <span className={cn(
                    "ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-bold",
                    activeTab === "bugs" ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
                  )}>
                    {openBugs}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Users", value: totalUsers, icon: <Users className="h-5 w-5 text-blue-500" />, color: "bg-blue-50" },
                { label: "Total Stacks", value: totalStacks, icon: <Layers className="h-5 w-5 text-amber-500" />, color: "bg-amber-50" },
                { label: "Stacks Today", value: todayStacks, icon: <TrendingUp className="h-5 w-5 text-green-500" />, color: "bg-green-50" },
                { label: "Open Bug Reports", value: openBugs, icon: <Bug className="h-5 w-5 text-red-500" />, color: "bg-red-50" },
              ].map(card => (
                <div
                  key={card.label}
                  className="rounded-xl border border-[#FFD896] bg-white p-6 transition-all hover:shadow-md hover:shadow-[#F97316]/5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#6B7280] font-medium">{card.label}</p>
                      <p className={cn(
                        "text-3xl font-black mt-1",
                        card.label === "Open Bug Reports" && openBugs > 0 ? "text-red-600" : "text-[#111827]"
                      )}>
                        {card.value}
                      </p>
                    </div>
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", card.color)}>
                      {card.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Build Style + Goals */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Build Style Distribution */}
              <div className="rounded-xl border border-[#FFD896] bg-white p-6">
                <h3 className="font-semibold text-[#111827] mb-4">Build Style Distribution</h3>
                <div className="space-y-4">
                  {(["traditional", "vibe", "nocode"] as const).map(style => {
                    const count = buildStyleCounts[style] || 0
                    const total = recentStacks?.length || 1
                    const pct = Math.round((count / total) * 100)
                    return (
                      <div key={style} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#111827]/70 font-medium">
                            {style === "vibe" ? "Vibe Coding ✨" : style === "nocode" ? "No-Code 🧩" : "Traditional 💻"}
                          </span>
                          <span className="font-semibold text-[#111827]">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-[#FFD896]/60 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#F97316] to-[#FB923C] rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-4 text-xs text-[#6B7280]">Based on last 100 stacks</p>
              </div>

              {/* Top Goals */}
              <div className="rounded-xl border border-[#FFD896] bg-white p-6">
                <h3 className="font-semibold text-[#111827] mb-4">Top Project Goals</h3>
                {topGoals.length === 0 ? (
                  <p className="text-sm text-[#6B7280]">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {topGoals.map(([goal, count], idx) => {
                      const total = goalStats?.length || 1
                      const pct = Math.round((count / total) * 100)
                      return (
                        <div key={goal} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-[#111827]/70 font-medium flex items-center gap-2">
                              <span className={cn(
                                "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
                                idx === 0 ? "bg-[#F97316] text-white" : "bg-[#fff1d6] text-[#111827]/60"
                              )}>
                                {idx + 1}
                              </span>
                              {goal}
                            </span>
                            <span className="font-semibold text-[#111827]">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#FFD896]/60 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#FB923C] to-[#F97316] rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS TAB ────────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Search users by name or username..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#FFD896] bg-white pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#6B7280]/60 focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316]"
                />
              </div>
              <span className="text-sm text-[#6B7280]">{filteredUsers.length} users</span>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-[#FFD896] bg-white overflow-hidden">
              <div className="max-w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#FFD896] bg-[#fff1d6]/40">
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">User</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Username</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Stacks</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Joined</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Role</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#6B7280]">
                          {userSearch ? "No users match your search" : "No users found"}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.id} className="border-b border-[#FFD896]/50 hover:bg-[#fff1d6]/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#F97316] to-[#FB923C] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  (user.display_name || user.username || "?").charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="font-medium text-[#111827] truncate max-w-[150px]">
                                {user.display_name || user.username || "Unknown"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#6B7280]">@{user.username || "—"}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1d6] px-2.5 py-0.5 text-xs font-semibold text-[#111827]">
                              <Layers className="h-3 w-3 text-[#F97316]" />
                              {user.stacks_count ?? 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#6B7280] text-xs">{formatDate(user.created_at)}</td>
                          <td className="py-3 px-4">
                            {user.is_admin ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#F97316]/10 px-2.5 py-0.5 text-xs font-bold text-[#F97316]">
                                <Shield className="h-3 w-3" />
                                Admin
                              </span>
                            ) : (
                              <span className="text-xs text-[#6B7280]">User</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Link
                              href={`/profile/${user.username}`}
                              className="text-xs font-medium text-[#F97316] hover:text-[#EA6C0A] transition-colors"
                            >
                              View Profile →
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── STACKS TAB ───────────────────────────────────────────────────── */}
        {activeTab === "stacks" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Search stacks..."
                  value={stackSearch}
                  onChange={e => setStackSearch(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#FFD896] bg-white pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#6B7280]/60 focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316]"
                />
              </div>
              <select
                value={stackBuildFilter}
                onChange={e => setStackBuildFilter(e.target.value)}
                className="h-10 rounded-lg border border-[#FFD896] bg-white px-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F97316]/30"
              >
                <option value="all">All Styles</option>
                <option value="traditional">Traditional</option>
                <option value="vibe">Vibe Coding</option>
                <option value="nocode">No-Code</option>
              </select>
              <select
                value={stackPublicFilter}
                onChange={e => setStackPublicFilter(e.target.value)}
                className="h-10 rounded-lg border border-[#FFD896] bg-white px-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F97316]/30"
              >
                <option value="all">All Visibility</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <span className="text-sm text-[#6B7280]">{filteredStacks.length} stacks</span>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-[#FFD896] bg-white overflow-hidden">
              <div className="max-w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#FFD896] bg-[#fff1d6]/40">
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Project</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Style</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Score</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Visibility</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Upvotes</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Date</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStacks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[#6B7280]">
                          No stacks found
                        </td>
                      </tr>
                    ) : (
                      filteredStacks.map(stack => {
                        const score = stack.score_card?.overallScore
                        return (
                          <tr key={stack.id} className="border-b border-[#FFD896]/50 hover:bg-[#fff1d6]/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="max-w-[250px]">
                                <p className="font-medium text-[#111827] truncate">{truncate(stack.user_input, 50)}</p>
                                {stack.goal && (
                                  <p className="text-xs text-[#6B7280] mt-0.5">{stack.goal}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                stack.build_style === "vibe" ? "bg-purple-50 text-purple-600" :
                                  stack.build_style === "nocode" ? "bg-blue-50 text-blue-600" :
                                    "bg-gray-100 text-gray-600"
                              )}>
                                {stack.build_style === "vibe" ? "Vibe ✨" : stack.build_style === "nocode" ? "No-Code" : "Traditional"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {score != null ? (
                                <span className={cn(
                                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
                                  score >= 80 ? "bg-green-50 text-green-600" :
                                    score >= 60 ? "bg-amber-50 text-amber-600" :
                                      "bg-red-50 text-red-600"
                                )}>
                                  {score}/100
                                </span>
                              ) : (
                                <span className="text-xs text-[#6B7280]">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {stack.is_public ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600">
                                  <Eye className="h-3 w-3" />
                                  Public
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                                  <EyeOff className="h-3 w-3" />
                                  Private
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[#111827] font-medium">{stack.upvotes ?? 0}</td>
                            <td className="py-3 px-4 text-[#6B7280] text-xs">{formatDate(stack.created_at)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {stack.share_slug && (
                                  <Link
                                    href={`/result?slug=${stack.share_slug}`}
                                    className="text-xs font-medium text-[#F97316] hover:text-[#EA6C0A] transition-colors"
                                  >
                                    View
                                  </Link>
                                )}
                                <button
                                  onClick={() => handleFeatureStack(stack.id, !stack.is_featured)}
                                  className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    stack.is_featured
                                      ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                                      : "text-[#6B7280] hover:bg-[#fff1d6] hover:text-[#F97316]"
                                  )}
                                  title={stack.is_featured ? "Unfeature" : "Feature"}
                                >
                                  <Star className={cn("h-3.5 w-3.5", stack.is_featured && "fill-current")} />
                                </button>
                                <button
                                  onClick={() => handleDeleteStack(stack.id)}
                                  className="p-1.5 rounded-lg text-[#6B7280] hover:bg-red-50 hover:text-red-600 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── BUG REPORTS TAB ──────────────────────────────────────────────── */}
        {activeTab === "bugs" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: "all", label: "All" },
                { key: "open", label: "Open" },
                { key: "in_progress", label: "In Progress" },
                { key: "resolved", label: "Resolved" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setBugFilter(f.key)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    bugFilter === f.key
                      ? "bg-[#F97316] text-white shadow-md shadow-[#F97316]/20"
                      : "bg-white text-[#6B7280] border border-[#FFD896] hover:bg-[#fff1d6] hover:text-[#111827]"
                  )}
                >
                  {f.label}
                </button>
              ))}
              <span className="ml-auto text-sm text-[#6B7280]">{filteredBugs.length} reports</span>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-[#FFD896] bg-white overflow-hidden">
              <div className="max-w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#FFD896] bg-[#fff1d6]/40">
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Type</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Page</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Description</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Reporter</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBugs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#6B7280]">
                          {bugFilter === "all" ? "No bug reports yet 🎉" : `No ${bugFilter.replace("_", " ")} bugs`}
                        </td>
                      </tr>
                    ) : (
                      filteredBugs.map(bug => (
                        <React.Fragment key={bug.id}>
                          <tr
                            className={cn(
                              "border-b border-[#FFD896]/50 hover:bg-[#fff1d6]/30 transition-colors cursor-pointer",
                              expandedBug === bug.id && "bg-[#fff1d6]/40"
                            )}
                            onClick={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
                          >
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center rounded-full bg-[#fff1d6] px-2.5 py-0.5 text-xs font-semibold text-[#111827]">
                                {bug.bug_type || "Unknown"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                                {bug.page_name || "—"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 max-w-[300px]">
                                <ChevronDown className={cn(
                                  "h-3.5 w-3.5 text-[#6B7280] transition-transform shrink-0",
                                  expandedBug === bug.id && "rotate-180"
                                )} />
                                <span className="text-[#111827] truncate">{truncate(bug.description, 60)}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[#6B7280] text-xs">
                              {bug.name || bug.email || "Anonymous"}
                            </td>
                            <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                              <select
                                value={bug.status}
                                onChange={e => updateBugStatus(bug.id, e.target.value)}
                                className={cn(
                                  "rounded-full px-3 py-1 text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F97316]/30",
                                  bug.status === "open" ? "bg-red-50 text-red-600" :
                                    bug.status === "in_progress" ? "bg-amber-50 text-amber-600" :
                                      "bg-green-50 text-green-600"
                                )}
                              >
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-[#6B7280] text-xs">{formatDate(bug.created_at)}</td>
                          </tr>
                          {expandedBug === bug.id && (
                            <tr className="bg-[#fff1d6]/20">
                              <td colSpan={6} className="px-6 py-4">
                                <div className="rounded-lg bg-white border border-[#FFD896] p-4">
                                  <p className="text-sm font-medium text-[#111827] mb-2">Full Description</p>
                                  <p className="text-sm text-[#6B7280] whitespace-pre-wrap">{bug.description || "No description provided"}</p>
                                  {bug.email && (
                                    <p className="mt-3 text-xs text-[#6B7280]">
                                      Contact: <a href={`mailto:${bug.email}`} className="text-[#F97316] hover:underline">{bug.email}</a>
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ANNOUNCEMENTS TAB ────────────────────────────────────────────── */}
        {activeTab === "announcements" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* New Announcement */}
            <div className="rounded-xl border border-[#FFD896] bg-white p-6">
              <h3 className="font-semibold text-[#111827] mb-3">Post New Announcement</h3>
              <p className="text-xs text-[#6B7280] mb-4">
                This will appear as a banner on the landing page. Only one announcement can be active at a time.
              </p>
              <div className="flex gap-3">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Write your announcement message..."
                  rows={2}
                  className="flex-1 resize-none rounded-lg border border-[#FFD896] bg-[#fff1d6]/30 px-4 py-3 text-sm text-[#111827] placeholder:text-[#6B7280]/60 focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316]"
                />
                <button
                  onClick={postAnnouncement}
                  disabled={!newMessage.trim()}
                  className={cn(
                    "shrink-0 rounded-lg px-5 py-2 text-sm font-semibold transition-all self-end",
                    newMessage.trim()
                      ? "bg-[#F97316] text-white hover:bg-[#EA6C0A] shadow-md shadow-[#F97316]/20"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Megaphone className="inline h-4 w-4 mr-1.5" />
                  Post
                </button>
              </div>
            </div>

            {/* Announcements List */}
            <div className="space-y-3">
              {(announcements || []).length === 0 ? (
                <div className="rounded-xl border border-[#FFD896] bg-white p-12 text-center text-[#6B7280]">
                  No announcements yet
                </div>
              ) : (
                (announcements || []).map(a => (
                  <div
                    key={a.id}
                    className={cn(
                      "rounded-xl border bg-white p-5 transition-all",
                      a.is_active ? "border-[#F97316] shadow-md shadow-[#F97316]/10" : "border-[#FFD896]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {a.is_active ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-600">
                              ● Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                              Inactive
                            </span>
                          )}
                          <span className="text-xs text-[#6B7280]">{formatDate(a.created_at)}</span>
                        </div>
                        <p className="text-sm text-[#111827]">{a.message}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleAnnouncementActive(a.id, !a.is_active)}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                            a.is_active
                              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              : "bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316]/20"
                          )}
                        >
                          {a.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => deleteAnnouncement(a.id)}
                          className="p-1.5 rounded-lg text-[#6B7280] hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── API MONITOR TAB ──────────────────────────────────────────────── */}
        {activeTab === "api" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* API Stats Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-[#FFD896] bg-white p-5">
                <p className="text-xs font-medium text-[#6B7280] mb-1">
                  Total API Calls
                </p>
                <p className="text-3xl font-black text-[#111827]">
                  {apiLogs.length}
                </p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-xs font-medium text-blue-600 mb-1">
                  Gemini Calls
                </p>
                <p className="text-3xl font-black text-blue-700">
                  {apiLogs.filter(l => l.provider === 'gemini').length}
                </p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <p className="text-xs font-medium text-amber-600 mb-1">
                  Groq Fallbacks
                </p>
                <p className="text-3xl font-black text-amber-700">
                  {apiLogs.filter(l => l.is_fallback).length}
                </p>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                <p className="text-xs font-medium text-red-500 mb-1">
                  Failed Calls
                </p>
                <p className="text-3xl font-black text-red-600">
                  {apiLogs.filter(l => !l.success).length}
                </p>
              </div>
            </div>

            {/* Health + Daily Usage */}
            <div className="grid gap-6 lg:grid-cols-2">

              {/* API Health */}
              <div className="rounded-xl border border-[#FFD896] bg-white p-6">
                <h3 className="font-semibold text-[#111827] mb-4">
                  API Health
                </h3>
                {(() => {
                  const total = apiLogs.length || 1
                  const success = apiLogs.filter(l => l.success).length
                  const rate = Math.round(success / total * 100)
                  const geminiTotal = apiLogs.filter(l => l.provider === 'gemini').length || 1
                  const geminiSuccess = apiLogs.filter(l => l.provider === 'gemini' && l.success).length
                  const geminiRate = Math.round(geminiSuccess / geminiTotal * 100)
                  const timeLogs = apiLogs.filter(l => l.duration_ms)
                  const avgTime = timeLogs.length
                    ? Math.round(timeLogs.reduce((s, l) => s + (l.duration_ms || 0), 0) / timeLogs.length)
                    : 0
                  return (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#6B7280]">
                            Overall Success Rate
                          </span>
                          <span className={cn(
                            "font-bold",
                            rate >= 90 ? "text-green-600" : rate >= 70 ? "text-amber-600" : "text-red-600"
                          )}>
                            {rate}%
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-[#FFD896]/50">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              rate >= 90 ? "bg-green-500" : rate >= 70 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width:`${rate}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#6B7280]">
                            Gemini Reliability
                          </span>
                          <span className="font-bold text-blue-600">
                            {geminiRate}%
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-blue-100">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width:`${geminiRate}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#FFD896]">
                        <span className="text-sm text-[#6B7280]">
                          Avg Response Time
                        </span>
                        <span className="font-bold text-[#111827]">
                          {avgTime > 0 ? `${avgTime}ms` : "—"}
                        </span>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Daily Usage */}
              <div className="rounded-xl border border-[#FFD896] bg-white p-6">
                <h3 className="font-semibold text-[#111827] mb-4">
                  Usage Last 7 Days
                </h3>
                {(() => {
                  const last7 = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date()
                    d.setDate(d.getDate() - (6 - i))
                    return d.toISOString().split('T')[0]
                  })
                  const counts = last7.map(day => 
                    apiLogs.filter(l => l.created_at.startsWith(day)).length
                  )
                  const maxCount = Math.max(...counts, 1)
                  return (
                    <div className="space-y-2">
                      {last7.map((day, i) => {
                        const count = counts[i]
                        const pct = Math.round(count / maxCount * 100)
                        const label = new Date(day).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })
                        return (
                          <div key={day} className="flex items-center gap-3">
                            <span className="text-xs text-[#6B7280] w-24 shrink-0 truncate">
                              {label}
                            </span>
                            <div className="flex-1 h-6 rounded-lg bg-[#FFD896]/30 overflow-hidden">
                              <div
                                className="h-full rounded-lg bg-[#F97316] transition-all duration-500"
                                style={{ width:`${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-[#111827] w-5 text-right">
                              {count}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Free Tier Warning */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 mb-2">
                    Free Tier Limits
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 text-sm text-amber-700">
                    <div className="rounded-lg bg-white/60 px-3 py-2">
                      <p className="font-semibold text-blue-700">
                        🔵 Gemini (Free)
                      </p>
                      <p className="text-xs mt-1">
                        1,500 req/day • 15 req/min
                      </p>
                      <p className="text-xs font-bold text-blue-600 mt-1">
                        Today: {apiLogs.filter(
                          l => l.provider === 'gemini' && 
                          l.created_at.startsWith(new Date().toISOString().split('T')[0])
                        ).length} / 1,500 used
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/60 px-3 py-2">
                      <p className="font-semibold text-amber-700">
                        🟡 Groq (Free)
                      </p>
                      <p className="text-xs mt-1">
                        14,400 req/day • 30 req/min
                      </p>
                      <p className="text-xs font-bold text-amber-600 mt-1">
                        Today: {apiLogs.filter(
                          l => l.provider === 'groq' && 
                          l.created_at.startsWith(new Date().toISOString().split('T')[0])
                        ).length} / 14,400 used
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Logs Table */}
            <div className="rounded-xl border border-[#FFD896] bg-white overflow-hidden">
              <div className="p-4 border-b border-[#FFD896] flex items-center justify-between">
                <h3 className="font-semibold text-[#111827]">
                  Recent API Calls
                </h3>
                <span className="text-xs text-[#6B7280]">
                  Last 100 calls
                </span>
              </div>
              <div className="max-w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#FFD896] bg-[#fff1d6]/40">
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Provider</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Model</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Type</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Time</th>
                      <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#6B7280]">
                          No API calls logged yet. Generate a stack to see logs here.
                        </td>
                      </tr>
                    ) : (
                      apiLogs.map(log => (
                        <tr key={log.id} className="border-b border-[#FFD896]/50 hover:bg-[#fff1d6]/30 transition-colors">
                          <td className="py-3 px-4">
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                              log.provider === 'gemini'
                                ? "bg-blue-50 text-blue-600"
                                : "bg-amber-50 text-amber-600"
                            )}>
                              {log.provider === 'gemini'
                                ? '🔵 Gemini'
                                : '🟡 Groq'
                              }
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-[#6B7280]">
                            {log.model || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                              log.success
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-600"
                            )}>
                              {log.success
                                ? "✓ Success"
                                : "✕ Failed"
                              }
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs text-[#6B7280]">
                              {log.is_fallback
                                ? "⚡ Fallback"
                                : "Primary"
                              }
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-[#6B7280]">
                            {log.duration_ms
                              ? `${log.duration_ms}ms`
                              : '—'
                            }
                          </td>
                          <td className="py-3 px-4 text-xs text-[#6B7280]">
                            {formatDate(log.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className={cn(
            "rounded-xl px-5 py-3 text-sm font-medium shadow-lg flex items-center gap-2",
            toast.ok
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-600"
          )}>
            {toast.ok ? "✓" : "✕"} {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}
