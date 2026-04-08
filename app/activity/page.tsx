"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Activity, Users, Sparkles, ArrowUpRight, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface StackItem {
  id: string
  share_slug: string
  summary: string | null
  user_input: string | null
  created_at: string
  profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

const PAGE_SIZE = 10

export default function ActivityPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [stacks, setStacks] = useState<StackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [followedIds, setFollowedIds] = useState<string[]>([])
  const loaderRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)

  // Auth guard
  useEffect(() => {
    mountedRef.current = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mountedRef.current) return
      if (!user) {
        router.replace("/login")
        return
      }
      setUserId(user.id)
    })
    return () => { mountedRef.current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch the list of users the current user follows
  useEffect(() => {
    if (!userId) return
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId)
      .then(({ data }) => {
        if (!mountedRef.current) return
        if (data) {
          setFollowedIds(data.map((r) => r.following_id as string))
        }
      })
  }, [userId, supabase])

  const fetchStacks = useCallback(
    async (pageNum: number, append = false) => {
      if (!followedIds.length) {
        setLoading(false)
        return
      }
      if (append) setLoadingMore(true)
      else setLoading(true)

      const from = pageNum * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error } = await supabase
        .from("stacks")
        .select("id, share_slug, summary, user_input, created_at, profiles(username, display_name, avatar_url)")
        .in("user_id", followedIds)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .range(from, to)

      if (!mountedRef.current) return
      if (error) {
        console.error("[activity] fetch error:", error)
      }
      const rows = (data || []) as unknown as StackItem[]
      if (append) {
        setStacks((prev) => [...prev, ...rows])
      } else {
        setStacks(rows)
      }
      setHasMore(rows.length === PAGE_SIZE)
      setLoading(false)
      setLoadingMore(false)
    },
    [followedIds, supabase]
  )

  // Initial load when followedIds are ready
  useEffect(() => {
    if (userId) {
      setPage(0)
      fetchStacks(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followedIds])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const next = page + 1
          setPage(next)
          fetchStacks(next, true)
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, page, fetchStacks])

  // Real-time subscription for new stacks from followed users
  useEffect(() => {
    if (!followedIds.length) return
    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stacks",
          filter: `is_public=eq.true`,
        },
        async (payload) => {
          const newRow = payload.new as { user_id?: string; id: string }
          if (!followedIds.includes(newRow.user_id || "")) return
          // Fetch full row with profile
          const { data } = await supabase
            .from("stacks")
            .select("id, share_slug, summary, user_input, created_at, profiles(username, display_name, avatar_url)")
            .eq("id", newRow.id)
            .single()
          if (data && mountedRef.current) {
            setStacks((prev) => [data as unknown as StackItem, ...prev])
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [followedIds, supabase])

  const handleRefresh = () => {
    setPage(0)
    fetchStacks(0)
  }

  // ─── Skeletons ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] px-4 py-10">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-[#161B22] animate-pulse" />
            <div className="h-7 w-48 rounded-lg bg-[#161B22] animate-pulse" />
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-[rgba(240,246,252,0.10)] bg-[#161B22] p-5 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#1C2128]" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 rounded bg-[#1C2128]" />
                  <div className="h-3 w-20 rounded bg-[#1C2128]" />
                </div>
              </div>
              <div className="h-4 w-full rounded bg-[#1C2128]" />
              <div className="h-4 w-3/4 rounded bg-[#1C2128]" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Empty state ──────────────────────────────────────────────────────────
  const isEmpty = stacks.length === 0

  return (
    <div className="min-h-screen bg-[#0D1117] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2EA043] to-[#1ABC9C]">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#E6EDF3]">Activity Feed</h1>
              <p className="text-sm text-[#8B949E]">Stacks from people you follow</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(240,246,252,0.10)] bg-[#161B22] px-3 py-2 text-xs font-semibold text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2128] transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-[rgba(240,246,252,0.10)] bg-[#161B22] py-20 text-center px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1C2128]">
              <Users className="h-8 w-8 text-[#484F58]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E6EDF3] mb-2">Nothing here yet</h2>
              <p className="text-sm text-[#8B949E] leading-relaxed max-w-sm">
                Follow other builders on Toolvise to see their stacks appear here. Check out the{" "}
                <Link href="/leaderboard" className="text-[#2EA043] hover:underline">Leaderboard</Link>
                {" "}or{" "}
                <Link href="/explore" className="text-[#2EA043] hover:underline">Explore</Link>
                {" "}to discover people building cool things.
              </p>
            </div>
            <Link
              href="/explore"
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#2EA043] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#2EA043]/90 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Browse Stacks
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {stacks.map((stack) => {
              const profile = stack.profiles
              const initials = (profile?.display_name || profile?.username || "?")
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
              return (
                <Link
                  key={stack.id}
                  href={`/result?slug=${stack.share_slug}`}
                  className="group block rounded-2xl border border-[rgba(240,246,252,0.10)] bg-[#161B22] p-5 hover:border-[#2EA043]/40 hover:bg-[#1C2128] transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="shrink-0">
                      {profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatar_url}
                          alt={profile.username}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#2EA043] to-[#1ABC9C] flex items-center justify-center text-white text-xs font-bold">
                          {initials}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#E6EDF3]">
                          {profile?.display_name || profile?.username || "Unknown"}
                        </span>
                        <span className="text-xs text-[#484F58]">@{profile?.username}</span>
                        <span className="ml-auto text-xs text-[#484F58] whitespace-nowrap">
                          {formatDistanceToNow(new Date(stack.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      <p className="mt-1.5 text-sm text-[#8B949E] leading-relaxed line-clamp-2">
                        {stack.summary || stack.user_input || "Generated a new stack"}
                      </p>

                      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#2EA043] group-hover:text-[#1ABC9C] transition-colors">
                        View Stack
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* Infinite scroll loader */}
            <div ref={loaderRef} className="flex justify-center py-6">
              {loadingMore && (
                <div className="flex items-center gap-2 text-sm text-[#484F58]">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading more...
                </div>
              )}
              {!hasMore && stacks.length > 0 && (
                <p className="text-xs text-[#484F58]">You&apos;ve seen it all 🎉</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
