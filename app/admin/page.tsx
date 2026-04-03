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
  Activity,
  AlertTriangle,
  Bookmark,
  Trophy,
  Plus,
  Loader2,
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
  followers_count: number
  following_count: number
  created_at: string
  email?: string
  profile_picture_url?: string
  name?: string
  is_owner?: boolean
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

type TabKey = "overview" | "users" | "stacks" | "bugs" | "announcements" | "api" | "admins"

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <TrendingUp className="h-4 w-4" /> },
  { key: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { key: "stacks", label: "Stacks", icon: <Layers className="h-4 w-4" /> },
  { key: "bugs", label: "Bug Reports", icon: <Bug className="h-4 w-4" /> },
  { key: "announcements", label: "Announcements", icon: <Megaphone className="h-4 w-4" /> },
  { key: "api", label: "API Monitor", icon: <Activity className="h-4 w-4" /> },
  { key: "admins", label: "Admins", icon: <Shield className="h-4 w-4" /> },
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
  const [totalBookmarks, setTotalBookmarks] = React.useState(0)
  const [avgScore, setAvgScore] = React.useState(0)
  const [todayStacks, setTodayStacks] = React.useState(0)
  const [openBugs, setOpenBugs] = React.useState(0)
  const [recentStacks, setRecentStacks] = React.useState<{ build_style: string | null }[]>([])
  const [goalStats, setGoalStats] = React.useState<{ goal: string | null }[]>([])

  // Users
  const [users, setUsers] = React.useState<Profile[]>([])
  const [userSearch, setUserSearch] = React.useState("")
  const [deletingUserId, setDeletingUserId] = React.useState<string | null>(null)
  const [expandedUser, setExpandedUser] = React.useState<string | null>(null)
  const [userStacks, setUserStacks] = React.useState<Record<string, Stack[]>>({})

  // Stacks
  const [stacks, setStacks] = React.useState<Stack[]>([])
  const [stackSearch, setStackSearch] = React.useState("")
  const [stackBuildFilter, setStackBuildFilter] = React.useState("all")
  const [stackPublicFilter, setStackPublicFilter] = React.useState("all")
  const [stacksPage, setStacksPage] = React.useState(0)
  const [loadingMoreStacks, setLoadingMoreStacks] = React.useState(false)

  // API
  const [apiLogs, setApiLogs] = React.useState<ApiLog[]>([])
  const [dailyUsage, setDailyUsage] = React.useState<number[]>([])
  const [totalApiLogs, setTotalApiLogs] = React.useState(0)
  const [totalGemini, setTotalGemini] = React.useState(0)
  const [totalGroq, setTotalGroq] = React.useState(0)
  const [totalFailed, setTotalFailed] = React.useState(0)
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null)

  // Confirm
  const [confirm, setConfirm] = React.useState<{
    title: string
    message: string
    confirmText: string
    danger: boolean
    onConfirm: () => void
  } | null>(null)

  function openConfirm(title: string, message: string, onConfirm: () => void, confirmText = "Delete", danger = true) {
    setConfirm({ title, message, onConfirm, confirmText, danger })
  }

  // Bugs
  const [bugs, setBugs] = React.useState<BugReport[]>([])
  const [bugFilter, setBugFilter] = React.useState("all")
  const [expandedBug, setExpandedBug] = React.useState<string | null>(null)

  // Announcements
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([])
  const [newMessage, setNewMessage] = React.useState("")

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
          .maybeSingle()

        if (!profile?.is_admin) {
          router.push("/")
          return
        }

        setIsAdmin(true)
        setCurrentUserId(user.id)
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
        goals,
        usersData,
        stacksData,
        bugsData,
        announcementsData,
        apiLogsData,
        totalApiLogsData,
        totalGeminiData,
        totalGroqData,
        totalFailedData,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("stacks").select("*", { count: "exact", head: true }),
        supabase.from("stacks").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("bug_reports").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("stacks").select("build_style").order("created_at", { ascending: false }).limit(100),
        supabase.from("stacks").select("goal"),
        supabase.from("profiles").select("id, username, display_name, email, avatar_url, is_admin, created_at, stacks_count, followers_count, following_count").order("created_at", { ascending: false }).limit(50),
        supabase.from("stacks").select("id, user_input, build_style, goal, is_public, is_featured, upvotes, score_card, created_at, share_slug, user_id").order("created_at", { ascending: false }).limit(50),
        supabase.from("bug_reports").select("*").order("created_at", { ascending: false }),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }),
        supabase.from('api_usage_logs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('api_usage_logs').select('id', { count: 'exact', head: true }),
        supabase.from('api_usage_logs').select('id', { count: 'exact', head: true }).eq('provider', 'gemini'),
        supabase.from('api_usage_logs').select('id', { count: 'exact', head: true }).eq('provider', 'groq'),
        supabase.from('api_usage_logs').select('id', { count: 'exact', head: true }).eq('success', false),
      ])

      // Fetch last 7 days daily counts
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setUTCDate(d.getUTCDate() - (6 - i))
        return d.toISOString().split("T")[0]
      })

      const dailyCounts = await Promise.all(
        last7Days.map(date => 
          supabase
            .from('api_usage_logs')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', `${date}T00:00:00Z`)
            .lte('created_at', `${date}T23:59:59Z`)
        )
      )
      setDailyUsage(dailyCounts.map(res => res.count || 0))

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
      setTotalApiLogs(totalApiLogsData?.count ?? 0)
      setTotalGemini(totalGeminiData?.count ?? 0)
      setTotalGroq(totalGroqData?.count ?? 0)
      setTotalFailed(totalFailedData?.count ?? 0)
    } catch (err) {
      console.error("Failed to load data:", err)
      showToast("Failed to load data", false)
    }
  }

  // ── Stack Actions ───────────────────────────────────────────────────────

  async function handleDeleteStack(stackId: string) {
    openConfirm(
      "Delete Stack?",
      "This will permanently remove this stack. Cannot be undone.",
      async () => {
        setConfirm(null)
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
    )
  }

  async function handleDeleteUser(userId: string, username: string) {
    openConfirm(
      `Delete user @${username}?`,
      "This will delete their account and all their stacks permanently.",
      async () => {
        setConfirm(null)
        setDeletingUserId(userId)
        try {
          const supabase = createClient()
          
          await supabase.from('stacks').delete().eq('user_id', userId)
          await supabase.from('bookmarks').delete().eq('user_id', userId)
          await supabase.from('profiles').delete().eq('id', userId)
          
          setUsers(prev => prev.filter(u => u.id !== userId))
          setTotalUsers(prev => prev - 1)
          showToast(`User @${username} deleted`)
        } catch (err) {
          console.error('Delete user failed:', err)
          showToast('Failed to delete user', false)
        } finally {
          setDeletingUserId(null)
        }
      }
    )
  }

  async function handleToggleAdmin(userId: string, currentStatus: boolean, username: string) {
    if (users.filter(u => u.is_admin).length === 1 && currentStatus) {
      showToast("Cannot remove the last admin", false)
      return
    }
    openConfirm(
      currentStatus ? `Remove admin rights for @${username}?` : `Make @${username} an admin?`,
      currentStatus ? "They will lose access to the admin dashboard." : "They will have full access to manage users, stacks, and announcements.",
      async () => {
        setConfirm(null)
        try {
          const supabase = createClient()
          const { error } = await supabase.from('profiles').update({ is_admin: !currentStatus }).eq('id', userId)
          if (error) throw error
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !currentStatus } : u))
          showToast(`User @${username} is ${currentStatus ? 'no longer' : 'now'} an admin`)
        } catch (err) {
          console.error('Toggle admin failed:', err)
          showToast('Failed to change admin status', false)
        }
      },
      currentStatus ? "Remove Admin" : "Make Admin",
      currentStatus
    )
  }

  async function loadMoreStacks() {
    try {
      setLoadingMoreStacks(true)
      const supabase = createClient()
      const start = (stacksPage + 1) * 100
      const end = start + 99
      const { data, error } = await supabase
        .from("stacks")
        .select("id, user_input, build_style, goal, is_public, is_featured, upvotes, score_card, created_at, share_slug, user_id, skill_level, budget, detail_level")
        .order("created_at", { ascending: false })
        .range(start, end)
      
      if (error) {
        console.error('[admin] load more stacks error:', error)
        showToast("Failed to load more stacks", false)
        return
      }
      
      if (data && data.length > 0) {
        setStacks(prev => [...prev, ...data])
        setStacksPage(prev => prev + 1)
      } else {
        showToast("No more stacks to load", true)
      }
    } catch (err) {
      console.error("Load more stacks failed:", err)
    } finally {
      setLoadingMoreStacks(false)
    }
  }

  async function loadUserStacks(userId: string) {
    if (userStacks[userId]) {
      setExpandedUser(expandedUser === userId ? null : userId)
      return
    }
    setExpandedUser(expandedUser === userId ? null : userId)
    if (expandedUser === userId) return
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('stacks')
        .select('id, user_input, created_at, score_card, share_slug')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)
        
      if (error) {
        console.error('[admin] load user stacks error:', error)
        return
      }
      
      setUserStacks(prev => ({ ...prev, [userId]: (data || []) as Stack[] }))
    } catch (err) {
      console.error("Failed to load user stacks:", err)
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
    openConfirm(
      "Delete this announcement?",
      "It will be removed permanently.",
      async () => {
        setConfirm(null)
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
    )
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
    const username = (u.username || "").toLowerCase()
    const displayName = (u.display_name || "").toLowerCase()
    return username.includes(q) || displayName.includes(q)
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
      <div className="min-h-dvh bg-background">
        <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center">
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
              <div key={i} className="h-28 rounded-xl bg-white border border-border animate-pulse" />
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[1, 2].map(i => (
              <div key={i} className="h-64 rounded-xl bg-white border border-border animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-xs text-amber-600/70">Toolvise Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setLoading(true)
                loadAllData().finally(() => setLoading(false))
              }}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-amber-600/70 hover:bg-background hover:text-amber-300 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <Link
              href="/"
              className="text-sm text-amber-600/70 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Site
            </Link>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-2 scrollbar-hide" aria-label="Admin tabs">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  activeTab === tab.key
                    ? "bg-amber-500 text-white shadow-md shadow-[#F97316]/20"
                    : "text-amber-600/70 hover:bg-background hover:text-amber-300"
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Total Users", value: totalUsers, icon: <Users className="h-5 w-5 text-blue-500" />, color: "bg-blue-50" },
                { label: "Total Stacks", value: totalStacks, icon: <Layers className="h-5 w-5 text-amber-500" />, color: "bg-amber-50" },
                { label: "Stacks Today", value: todayStacks, icon: <TrendingUp className="h-5 w-5 text-green-500" />, color: "bg-green-50" },
                { label: "Open Bug Reports", value: openBugs, icon: <Bug className="h-5 w-5 text-red-500" />, color: "bg-red-50" },
                { label: "Total Bookmarks", value: totalBookmarks, icon: <Bookmark className="h-5 w-5 text-purple-500" />, color: "bg-purple-50" },
                { label: "Avg Stack Score", value: avgScore, icon: <Trophy className="h-5 w-5 text-amber-600" />, color: "bg-amber-50" },
              ].map(card => (
                <div
                  key={card.label}
                  className="rounded-xl border border-border bg-white p-6 transition-all hover:shadow-md hover:shadow-[#F97316]/5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-600/70 font-medium">{card.label}</p>
                      <p className={cn(
                        "text-3xl font-black mt-1",
                        card.label === "Open Bug Reports" && openBugs > 0 ? "text-red-600" : "text-foreground"
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
              <div className="rounded-xl border border-border bg-white p-6">
                <h3 className="font-semibold text-foreground mb-6">Build Style Distribution</h3>
                <div className="flex items-center gap-6">
                  {(() => {
                    const total = recentStacks?.length || 1;
                    const vibe = buildStyleCounts["vibe"] || 0;
                    const nocode = buildStyleCounts["nocode"] || 0;
                    const traditional = buildStyleCounts["traditional"] || 0;
                    
                    const vibePct = Math.round((vibe / total) * 100);
                    const nocodePct = Math.round((nocode / total) * 100);
                    const tradPct = Math.round((traditional / total) * 100);
                    
                    return (
                      <>
                        <div className="relative h-32 w-32 rounded-full flex flex-col items-center justify-center shrink-0 transition-all duration-1000 animate-in zoom-in-50"
                             style={{ background: `conic-gradient(#A855F7 0% ${vibePct}%, #3B82F6 ${vibePct}% ${vibePct + nocodePct}%, #9CA3AF ${vibePct + nocodePct}% 100%)` }}>
                          <div className="absolute inset-[20%] bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                            <span className="text-xl font-black text-foreground">{total}</span>
                          </div>
                        </div>
                        <div className="w-full space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                              <span className="font-medium text-gray-700">Vibe ✨</span>
                            </div>
                            <span className="font-bold text-gray-900">{vibe} ({vibePct}%)</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span className="font-medium text-gray-700">No-Code 🧩</span>
                            </div>
                            <span className="font-bold text-gray-900">{nocode} ({nocodePct}%)</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                              <span className="font-medium text-gray-700">Traditional 💻</span>
                            </div>
                            <span className="font-bold text-gray-900">{traditional} ({tradPct}%)</span>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <p className="mt-6 text-xs text-amber-600/70 text-center">Based on last 100 stacks</p>
              </div>

              {/* Top Goals */}
              <div className="rounded-xl border border-border bg-white p-6">
                <h3 className="font-semibold text-foreground mb-4">Top Project Goals</h3>
                {topGoals.length === 0 ? (
                  <p className="text-sm text-amber-600/70">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {topGoals.map(([goal, count], idx) => {
                      const total = goalStats?.length || 1
                      const pct = Math.round((count / total) * 100)
                      return (
                        <div key={goal} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground/70 font-medium flex items-center gap-2">
                              <span className={cn(
                                "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
                                idx === 0 ? "bg-amber-500 text-white" : "bg-background text-foreground/60"
                              )}>
                                {idx + 1}
                              </span>
                              {goal}
                            </span>
                            <span className="font-semibold text-foreground">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-amber-200/60 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#FB923C] to-amber-500 rounded-full transition-all duration-700 ease-out"
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
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600/70" />
                <input
                  type="text"
                  placeholder="Search users by name or username..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-white pl-10 pr-4 text-sm text-foreground placeholder:text-amber-600/70/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>
              <span className="text-sm text-amber-600/70">{filteredUsers.length} users</span>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-white overflow-hidden">
              <div className="max-w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/40">
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">User</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Username</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold text-center">Stacks</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold text-center">Followers</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Joined</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Role</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-amber-600/70">
                          {userSearch ? "No users match your search" : "No users found"}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <React.Fragment key={user.id}>
                        <tr className={cn("border-b border-border/50 hover:bg-background/30 transition-colors cursor-pointer", expandedUser === user.id && "bg-background/40")} onClick={() => loadUserStacks(user.id)}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                                {user.avatar_url ? (
                                  <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                                  </>
                                ) : (
                                  (user.display_name || user.username || "?").charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="font-medium text-foreground truncate max-w-[150px]">
                                {user.display_name || user.username || "Unknown"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-amber-600/70">@{user.username || "—"}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-0.5 text-xs font-semibold text-foreground">
                              <Layers className="h-3 w-3 text-amber-500" />
                              {user.stacks_count ?? 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                              <Star className="h-3 w-3 text-blue-500" />
                              {user.followers_count ?? 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-amber-600/70 text-xs">{formatDate(user.created_at)}</td>
                          <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleToggleAdmin(user.id, !!user.is_admin, user.username || 'unknown')}
                              className={cn(
                                "group inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold transition-all",
                                user.is_admin 
                                  ? "bg-amber-500/10 text-amber-500 hover:bg-red-50 hover:text-red-600" 
                                  : "text-amber-600/70 bg-gray-100 hover:bg-amber-500/10 hover:text-amber-500"
                              )}
                              title={user.is_admin ? "Remove admin rights" : "Make admin"}
                            >
                              <Shield className={cn("h-3 w-3", user.is_admin ? "fill-[#F97316]/20 group-hover:fill-red-500/20" : "")} />
                              {user.is_admin ? "Admin" : "User"}
                            </button>
                          </td>
                          <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/profile/${user.username}`}
                                className="text-xs font-medium text-amber-500 hover:text-amber-600 transition-colors"
                              >
                                View Profile
                              </Link>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.username || 'unknown')}
                                disabled={user.is_admin || deletingUserId === user.id}
                                className={cn(
                                  "p-1.5 rounded-lg transition-colors",
                                  user.is_admin
                                    ? "opacity-30 cursor-not-allowed text-amber-600/70"
                                    : "text-amber-600/70 hover:bg-red-50 hover:text-red-600"
                                )}
                                title={user.is_admin ? "Cannot delete admin" : "Delete user"}
                              >
                                {deletingUserId === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedUser === user.id && (
                          <tr className="bg-background/20">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="rounded-lg bg-white border border-border p-4">
                                <p className="text-sm font-semibold text-foreground mb-3">
                                  Recent Stacks by @{user.username}
                                </p>
                                {(userStacks[user.id] || []).length === 0 ? (
                                  <p className="text-sm text-amber-600/70">No stacks yet</p>
                                ) : (
                                  <div className="space-y-2">
                                    {(userStacks[user.id] || []).map(s => (
                                      <div key={s.id} className="flex items-center justify-between gap-4 rounded-lg bg-background/50 px-4 py-2">
                                        <p className="text-sm text-foreground truncate flex-1">{s.user_input || '—'}</p>
                                        {s.share_slug && (
                                          <Link href={`/result?slug=${s.share_slug}`} className="text-xs text-amber-500 hover:underline shrink-0">
                                            View →
                                          </Link>
                                        )}
                                      </div>
                                    ))}
                                  </div>
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

        {/* ── STACKS TAB ───────────────────────────────────────────────────── */}
        {activeTab === "stacks" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600/70" />
                <input
                  type="text"
                  placeholder="Search stacks..."
                  value={stackSearch}
                  onChange={e => setStackSearch(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-white pl-10 pr-4 text-sm text-foreground placeholder:text-amber-600/70/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>
              <select
                value={stackBuildFilter}
                onChange={e => setStackBuildFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="all">All Styles</option>
                <option value="traditional">Traditional</option>
                <option value="vibe">Vibe Coding</option>
                <option value="nocode">No-Code</option>
              </select>
              <select
                value={stackPublicFilter}
                onChange={e => setStackPublicFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="all">All Visibility</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <span className="text-sm text-amber-600/70">{filteredStacks.length} stacks</span>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-white overflow-hidden">
              <div className="max-w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/40">
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Project</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Style</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Score</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Visibility</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Upvotes</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStacks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-amber-600/70">
                          No stacks found
                        </td>
                      </tr>
                    ) : (
                      filteredStacks.map(stack => {
                        const score = stack.score_card?.overallScore
                        return (
                          <tr key={stack.id} className="border-b border-border/50 hover:bg-background/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="max-w-[250px]">
                                <p className="font-medium text-foreground truncate">{truncate(stack.user_input, 50)}</p>
                                {stack.goal && (
                                  <p className="text-xs text-amber-600/70 mt-0.5">{stack.goal}</p>
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
                                <span className="text-xs text-amber-600/70">—</span>
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
                            <td className="py-3 px-4 text-foreground font-medium">{stack.upvotes ?? 0}</td>
                            <td className="py-3 px-4 text-amber-600/70 text-xs">{formatDate(stack.created_at)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {stack.share_slug && (
                                  <Link
                                    href={`/result?slug=${stack.share_slug}`}
                                    className="text-xs font-medium text-amber-500 hover:text-amber-600 transition-colors"
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
                                      : "text-amber-600/70 hover:bg-background hover:text-amber-500"
                                  )}
                                  title={stack.is_featured ? "Unfeature" : "Feature"}
                                >
                                  <Star className={cn("h-3.5 w-3.5", stack.is_featured && "fill-current")} />
                                </button>
                                <button
                                  onClick={() => handleDeleteStack(stack.id)}
                                  className="p-1.5 rounded-lg text-amber-600/70 hover:bg-red-50 hover:text-red-600 transition-colors"
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
              {filteredStacks.length > 0 && !stackSearch && stackBuildFilter === "all" && stackPublicFilter === "all" && (
                <div className="p-4 border-t border-border bg-white flex justify-center">
                  <button
                    onClick={loadMoreStacks}
                    disabled={loadingMoreStacks}
                    className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-foreground bg-background border border-border hover:bg-amber-200/50 transition-colors disabled:opacity-50"
                  >
                    {loadingMoreStacks ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Loading...</>
                    ) : (
                      "Load Next 100 Stacks"
                    )}
                  </button>
                </div>
              )}
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
                      ? "bg-amber-500 text-white shadow-md shadow-[#F97316]/20"
                      : "bg-white text-amber-600/70 border border-border hover:bg-background hover:text-amber-300"
                  )}
                >
                  {f.label}
                </button>
              ))}
              <span className="ml-auto text-sm text-amber-600/70">{filteredBugs.length} reports</span>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-white overflow-hidden">
              <div className="max-w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/40">
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Page</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Description</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Reporter</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBugs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-amber-600/70">
                          {bugFilter === "all" ? "No bug reports yet 🎉" : `No ${bugFilter.replace("_", " ")} bugs`}
                        </td>
                      </tr>
                    ) : (
                      filteredBugs.map(bug => (
                        <React.Fragment key={bug.id}>
                          <tr
                            className={cn(
                              "border-b border-border/50 hover:bg-background/30 transition-colors cursor-pointer",
                              expandedBug === bug.id && "bg-background/40"
                            )}
                            onClick={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
                          >
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center rounded-full bg-background px-2.5 py-0.5 text-xs font-semibold text-foreground">
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
                                  "h-3.5 w-3.5 text-amber-600/70 transition-transform shrink-0",
                                  expandedBug === bug.id && "rotate-180"
                                )} />
                                <span className="text-foreground truncate">{truncate(bug.description, 60)}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-amber-600/70 text-xs">
                              {bug.name || bug.email || "Anonymous"}
                            </td>
                            <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                              <select
                                value={bug.status}
                                onChange={e => updateBugStatus(bug.id, e.target.value)}
                                className={cn(
                                  "rounded-full px-3 py-1 text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/30",
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
                            <td className="py-3 px-4 text-amber-600/70 text-xs">{formatDate(bug.created_at)}</td>
                          </tr>
                          {expandedBug === bug.id && (
                            <tr className="bg-background/20">
                              <td colSpan={6} className="px-6 py-4">
                                <div className="rounded-lg bg-white border border-border p-4">
                                  <p className="text-sm font-medium text-foreground mb-2">Full Description</p>
                                  <p className="text-sm text-amber-600/70 whitespace-pre-wrap">{bug.description || "No description provided"}</p>
                                  {bug.email && (
                                    <p className="mt-3 text-xs text-amber-600/70">
                                      Contact: <a href={`mailto:${bug.email}`} className="text-amber-500 hover:underline">{bug.email}</a>
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
            <div className="rounded-xl border border-border bg-white p-6">
              <h3 className="font-semibold text-foreground mb-3">Post New Announcement</h3>
              <p className="text-xs text-amber-600/70 mb-4">
                This will appear as a banner on the landing page. Only one announcement can be active at a time.
              </p>
              <div className="flex gap-3">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Write your announcement message..."
                  rows={2}
                  className="flex-1 resize-none rounded-lg border border-border bg-background/30 px-4 py-3 text-sm text-foreground placeholder:text-amber-600/70/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <button
                  onClick={postAnnouncement}
                  disabled={!newMessage.trim()}
                  className={cn(
                    "shrink-0 rounded-lg px-5 py-2 text-sm font-semibold transition-all self-end",
                    newMessage.trim()
                      ? "bg-amber-500 text-white hover:bg-amber-400 shadow-md shadow-[#F97316]/20"
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
                <div className="rounded-xl border border-border bg-white p-12 text-center text-amber-600/70">
                  No announcements yet
                </div>
              ) : (
                (announcements || []).map(a => (
                  <div
                    key={a.id}
                    className={cn(
                      "rounded-xl border bg-white p-5 transition-all",
                      a.is_active ? "border-amber-500 shadow-md shadow-[#F97316]/10" : "border-border"
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
                          <span className="text-xs text-amber-600/70">{formatDate(a.created_at)}</span>
                        </div>
                        <p className="text-sm text-foreground">{a.message}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleAnnouncementActive(a.id, !a.is_active)}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                            a.is_active
                              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                          )}
                        >
                          {a.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => deleteAnnouncement(a.id)}
                          className="p-1.5 rounded-lg text-amber-600/70 hover:bg-red-50 hover:text-red-600 transition-colors"
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
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="text-xs font-medium text-amber-600/70 mb-1">
                  Total API Calls
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-black text-foreground">
                    {totalApiLogs}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-xs font-medium text-blue-600 mb-1">
                  Gemini Calls
                </p>
                <p className="text-3xl font-black text-blue-700">
                  {totalGemini}
                </p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <p className="text-xs font-medium text-amber-600 mb-1">
                  Groq Calls
                </p>
                <p className="text-3xl font-black text-amber-700">
                  {totalGroq}
                </p>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                <p className="text-xs font-medium text-red-500 mb-1">
                  Failed Calls
                </p>
                <p className="text-3xl font-black text-red-600">
                  {totalFailed}
                </p>
              </div>
            </div>

            {/* Health + Daily Usage */}
            {/* Health, Donut Chart, and Daily Usage */}
            <div className="grid gap-6 lg:grid-cols-3">

              {/* API Health */}
              <div className="rounded-xl border border-border bg-white p-6 lg:col-span-1">
                <h3 className="font-semibold text-foreground mb-4">
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
                          <span className="text-amber-600/70">
                            Overall Success Rate
                          </span>
                          <span className={cn(
                            "font-bold",
                            rate >= 90 ? "text-green-600" : rate >= 70 ? "text-amber-600" : "text-red-600"
                          )}>
                            {rate}%
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-amber-200/50">
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
                          <span className="text-amber-600/70">
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
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-sm text-amber-600/70">
                          Avg Response Time
                        </span>
                        <span className="font-bold text-foreground">
                          {avgTime > 0 ? `${avgTime}ms` : "—"}
                        </span>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Provider Split Donut Chart */}
              <div className="rounded-xl border border-border bg-white p-6 lg:col-span-1 flex flex-col items-center">
                <h3 className="font-semibold text-foreground mb-6 self-start">
                  Provider Split
                </h3>
                {(() => {
                  const total = apiLogs.length || 1;
                  const gemini = apiLogs.filter(l => l.provider === 'gemini').length;
                  const groq = apiLogs.filter(l => l.provider === 'groq').length;
                  const geminiPct = Math.round((gemini / total) * 100);
                  const groqPct = Math.round((groq / total) * 100);
                  
                  return (
                    <div className="flex flex-col items-center gap-6 w-full">
                      <div className="relative h-36 w-36 rounded-full flex items-center justify-center transition-all duration-1000 animate-in zoom-in-50"
                           style={{ background: `conic-gradient(#3B82F6 0% ${geminiPct}%, #F59E0B ${geminiPct}% 100%)` }}>
                        <div className="absolute inset-[18%] bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                          <span className="text-xl font-black text-foreground">{total}</span>
                          <span className="text-[10px] uppercase tracking-widest text-amber-600/70 font-semibold">Calls</span>
                        </div>
                      </div>
                      
                      <div className="w-full space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="font-medium text-gray-700">Gemini</span>
                          </div>
                          <span className="font-bold text-gray-900">{gemini} ({geminiPct}%)</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="font-medium text-gray-700">Groq</span>
                          </div>
                          <span className="font-bold text-gray-900">{groq} ({groqPct}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Daily Usage */}
              <div className="rounded-xl border border-border bg-white p-6 lg:col-span-1 flex flex-col justify-between">
                <h3 className="font-semibold text-foreground mb-4">
                  Usage Last 7 Days
                </h3>
                {(() => {
                  const last7 = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date()
                    d.setUTCDate(d.getUTCDate() - (6 - i))
                    return d.toISOString().split("T")[0]
                  })
                  const maxCount = Math.max(...dailyUsage, 1)
                  return (
                    <div className="space-y-3 mt-auto">
                      <div className="flex items-end justify-between h-32 gap-1.5 border-b border-border/50 pb-2">
                        {last7.map((day, i) => {
                          const count = dailyUsage[i] || 0
                          const pct = Math.round(count / maxCount * 100)
                          const label = new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'narrow', timeZone: 'UTC' })
                          return (
                            <div key={day} className="flex flex-col items-center justify-end gap-1 flex-1 group relative h-full">
                              {count > 0 && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none">
                                  {count} reqs
                                </div>
                              )}
                              <div className="w-full flex items-end justify-center flex-1 rounded-t-sm overflow-hidden bg-amber-200/20 group-hover:bg-amber-200/40 transition-[background]">
                                <div 
                                  className="w-full bg-amber-500 rounded-t-sm transition-all duration-1000 ease-out animate-in slide-in-from-bottom"
                                  style={{ height: `${pct}%` }} 
                                />
                              </div>
                              <span className="text-[10px] font-semibold text-amber-600/70 shrink-0">{label}</span>
                            </div>
                          )
                        })}
                      </div>
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
                      {(() => {
                        const todayLocal = new Date().toLocaleDateString('en-CA')
                        const c = apiLogs.filter(
                          l => l.provider === 'gemini' && 
                          new Date(l.created_at).toLocaleDateString('en-CA') === todayLocal
                        ).length
                        return (
                          <p className="text-xs font-bold text-blue-600 mt-1">
                            Today: {c} / 1,500 used
                          </p>
                        )
                      })()}
                    </div>
                    <div className="rounded-lg bg-white/60 px-3 py-2">
                      <p className="font-semibold text-amber-700">
                        🟡 Groq (Free)
                      </p>
                      <p className="text-xs mt-1">
                        14,400 req/day • 30 req/min
                      </p>
                      {(() => {
                        const todayLocal = new Date().toLocaleDateString('en-CA')
                        const c = apiLogs.filter(
                          l => l.provider === 'groq' && 
                          new Date(l.created_at).toLocaleDateString('en-CA') === todayLocal
                        ).length
                        return (
                          <p className="text-xs font-bold text-amber-600 mt-1">
                            Today: {c} / 14,400 used
                          </p>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Logs Table */}
            <div className="rounded-xl border border-border bg-white overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  Recent API Calls
                </h3>
                <span className="text-xs text-amber-600/70">
                  Last 100 calls
                </span>
              </div>
              <div className="max-w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/40">
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Provider</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Model</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Time</th>
                      <th className="text-left py-3 px-4 text-amber-600/70 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-amber-600/70">
                          No API calls logged yet. Generate a stack to see logs here.
                        </td>
                      </tr>
                    ) : (
                      apiLogs.map(log => (
                        <tr key={log.id} className="border-b border-border/50 hover:bg-background/30 transition-colors">
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
                          <td className="py-3 px-4 text-xs text-amber-600/70">
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
                            <span className="text-xs text-amber-600/70">
                              {log.is_fallback
                                ? "⚡ Fallback"
                                : "Primary"
                              }
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-amber-600/70">
                            {log.duration_ms
                              ? `${log.duration_ms}ms`
                              : '—'
                            }
                          </td>
                          <td className="py-3 px-4 text-xs text-amber-600/70">
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

        {/* ── Admins ─────────────────────────────────────────────────────────── */}
        {activeTab === "admins" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Admins
              </h2>
              <p className="text-sm text-amber-600/70">
                Manage administrator privileges across the platform.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white overflow-hidden p-6 space-y-8">
              <div className="max-w-md">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Add Administrator
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Email or Username"
                    id="newAdminInput"
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background/20 focus:outline-none focus:ring-2 focus:ring-amber-200 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        document.getElementById("addAdminBtn")?.click();
                      }
                    }}
                  />
                  <button
                    id="addAdminBtn"
                    onClick={async () => {
                      const inputElement = document.getElementById("newAdminInput") as HTMLInputElement
                      const value = inputElement?.value?.trim()
                      if (!value) return
                      
                      try {
                        const supabase = createClient()
                        
                        let searchValue = value;
                        if (searchValue.startsWith('@')) {
                          searchValue = searchValue.substring(1);
                        }
                        
                        let foundUser = null;
                        
                        // First try email
                        const { data: emailData, error: emailError } = await supabase
                          .from('profiles')
                          .select('*')
                          .eq('email', searchValue)
                          .limit(1);
                          
                        if (emailData && emailData.length > 0) {
                          foundUser = emailData[0];
                        } else {
                          // Fallback try username
                          const { data: usernameData, error: usernameError } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('username', searchValue)
                            .limit(1);
                            
                          if (usernameData && usernameData.length > 0) {
                            foundUser = usernameData[0];
                          }
                        }

                        if (!foundUser) {
                          // Try ilike fallback for username just in case
                          const { data: fallbackData } = await supabase
                            .from('profiles')
                            .select('*')
                            .ilike('username', `%${searchValue}%`)
                            .limit(1);
                            
                          if (fallbackData && fallbackData.length > 0) {
                            foundUser = fallbackData[0];
                          }
                        }

                        if (!foundUser) {
                          showToast("User not found.", false)
                          return
                        }
                        
                        if (foundUser.is_admin) {
                          showToast(`${foundUser.username || foundUser.email} is already an admin.`, false)
                          return
                        }

                        const { error: updateError } = await supabase
                          .rpc('grant_admin', { target_user_id: foundUser.id })
                        
                        if (updateError) throw updateError
                        
                        // Refresh local state if the user was in the current list
                        setUsers(prev => {
                          const exists = prev.find(p => p.id === foundUser.id)
                          if (exists) {
                            return prev.map(u => u.id === foundUser.id ? { ...u, is_admin: true } : u)
                          }
                          // If not in list, we might want to reload or just append if they are new admin
                          return [...prev, { ...foundUser, is_admin: true }] as Profile[]
                        })
                        
                        showToast(`Admin access granted to ${foundUser.username || foundUser.email}.`, true)
                        inputElement.value = ""
                      } catch (err) {
                        console.error(err)
                        showToast("Failed to add admin. Make sure the email column exists in profiles.", false)
                      }
                    }}
                    className="px-6 py-2 bg-amber-500 text-white text-sm font-bold rounded-lg hover:bg-amber-400 shadow-md hover:shadow-orange-200 transition-all flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
                <p className="text-xs text-amber-600/70 mt-2">
                  The user must already have signed into Toolvise once.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-4">Current Administrators</h3>
                <div className="space-y-3">
                  {users.filter(u => u.is_admin).map(admin => (
                    <div key={admin.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/20">
                      <div className="flex items-center gap-3">
                        {admin.avatar_url ? (
                          <img src={admin.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold uppercase text-sm">
                            {admin.display_name?.charAt(0) || admin.username?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                            {admin.display_name || admin.username || 'Unnamed User'}
                          </p>
                          <p className="text-xs text-amber-600/70">@{admin.username || 'unknown'}</p>
                        </div>
                      </div>

                      {/* Role Management Actions */}
                      <div className="flex items-center gap-2">
                        {admin.is_owner || admin.email === 'ay6033756@gmail.com' ? (
                           <span className="text-xs font-semibold text-gray-400 px-3">Primary Owner</span>
                        ) : admin.id === currentUserId ? (
                           <span className="text-xs font-semibold text-gray-400 px-3">Current Session</span>
                        ) : (
                          <button
                            onClick={() => {
                              setConfirm({
                                title: "Remove Admin",
                                message: `Are you sure you want to remove admin rights from ${admin.email}?`,
                                confirmText: "Remove Admin",
                                danger: true,
                                onConfirm: async () => {
                                  try {
                                    const supabase = createClient()
                                    const { error } = await supabase.rpc('revoke_admin', { target_user_id: admin.id })
                                    if (error) throw error
                                    setUsers(prev => prev.map(u => u.id === admin.id ? { ...u, is_admin: false } : u))
                                    showToast("Admin access removed", true)
                                  } catch (err) {
                                    console.error(err)
                                    showToast("Failed to remove admin", false)
                                  }
                                }
                              })
                            }}
                            className="text-xs font-semibold text-red-600 hover:text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition"
                          >
                            Revoke Access
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {users.filter(u => u.is_admin).length === 0 && (
                    <p className="text-sm text-amber-600/70 italic">No active administrators found.</p>
                  )}
                </div>
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

      {/* Confirm Dialog */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "grid h-10 w-10 place-items-center rounded-xl",
                confirm.danger ? "bg-red-50 border border-red-100" : "bg-background border border-border"
              )}>
                <AlertTriangle className={cn("h-5 w-5", confirm.danger ? "text-red-500" : "text-amber-500")} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{confirm.title}</h3>
              </div>
            </div>
            <p className="text-sm text-foreground/70 mb-6 leading-relaxed">
              {confirm.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 rounded-xl border border-border bg-white py-2.5 text-sm font-medium text-foreground/70 hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirm.onConfirm}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors",
                  confirm.danger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-400"
                )}
              >
                {confirm.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
