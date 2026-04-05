"use client"

import * as React from "react"
import Link from "next/link"
import { Search, ArrowUpRight, Flame, Layers, Loader2, Inbox, Bookmark } from "lucide-react"
import { useRouter } from "next/navigation"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Navbar } from "@/components/Navbar"

const FILTERS = ["All", "Frontend", "Backend", "AI", "Mobile", "Full Stack"]

interface Tool {
  name: string
  category: string
  isFree: boolean
}

// Map the DB Columns
interface StackDB {
  id: string
  created_at: string
  share_slug: string
  user_input: string
  skill_level: string
  budget: string
  goal: string
  tools: Tool[]
  upvotes: number
  _voted?: boolean // local optimistic flag
}

export default function ExplorePage() {
  const router = useRouter()
  const [stacks, setStacks] = React.useState<StackDB[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(true)
  const [page, setPage] = React.useState(0)
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)

  const [activeFilter, setActiveFilter] = React.useState("All")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [bookmarked, setBookmarked] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  React.useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)

      if (user) {
        try {
          const { data: userBookmarks } = await supabase
            .from('bookmarks')
            .select('stack_id')
            .eq('user_id', user.id)
          setBookmarked(new Set(userBookmarks?.map((b: { stack_id: string }) => b.stack_id) || []))
        } catch {
          setBookmarked(new Set())
        }
      }
    }
    checkAuth()
  }, [])

  // Initial Fetch & Filter Changes
  React.useEffect(() => {
    setPage(0)
    fetchStacks(0, activeFilter, debouncedSearch, false)
    // check local votes
    const localVotes = JSON.parse(localStorage.getItem("toolvise_voted") || "[]")
    setVotedCache(localVotes)
  }, [activeFilter, debouncedSearch])

  const [votedCache, setVotedCache] = React.useState<string[]>([])

  const fetchStacks = async (pageIndex: number, filter: string, search: string, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    const supabase = createClient()
    let query = supabase.from("stacks").select("*", { count: "exact" }).eq("is_public", true)

    // Build standard PostgREST matching logic
    if (search.trim()) {
      query = query.ilike("user_input", `%${search.trim()}%`)
    }

    if (filter !== "All") {
      switch (filter) {
        case "Frontend":
          query = query.or("user_input.ilike.%frontend%,goal.eq.Build MVP Fast")
          break
        case "Backend":
          query = query.or("user_input.ilike.%backend%,user_input.ilike.%api%")
          break
        case "AI":
          query = query.or("user_input.ilike.%AI%,user_input.ilike.%machine learning%")
          break
        case "Mobile":
          query = query.or("user_input.ilike.%mobile%,user_input.ilike.%app%")
          break
        case "Full Stack":
          query = query.or("user_input.ilike.%full stack%,user_input.ilike.%fullstack%")
          break
      }
    }

    const from = pageIndex * 20
    const to = from + 19
    query = query.order("created_at", { ascending: false }).range(from, to)

    const { data, count, error } = await query

    if (error) {
      console.error("[explore] Failed to fetch stacks", error)
      if (!isLoadMore) setStacks([])
    } else if (data) {
      const formatted = data.map((d: unknown) => {
        const row = d as StackDB;
        return {
          ...row,
          upvotes: row.upvotes ?? 0
        };
      })

      if (isLoadMore) {
        setStacks(prev => [...prev, ...formatted])
      } else {
        setStacks(formatted)
        if (count !== null) setTotalCount(count)
      }
      setHasMore(data.length === 20)
    }

    setLoading(false)
    setLoadingMore(false)
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchStacks(nextPage, activeFilter, debouncedSearch, true)
  }

  const [toastError, setToastError] = React.useState<string | null>(null)

  const handleUpvote = async (stack: StackDB) => {
    if (!isLoggedIn) {
      router.push(`/login?next=/explore`)
      return
    }

    if (votedCache.includes(stack.id) || stack._voted) return

    const previousUpvotes = stack.upvotes

    setStacks(prev => 
      prev.map(s => 
        s.id === stack.id 
          ? { ...s, upvotes: s.upvotes + 1, _voted: true } 
          : s
      )
    )
    
    const newVotes = [...votedCache, stack.id]
    setVotedCache(newVotes)
    localStorage.setItem("toolvise_voted", JSON.stringify(newVotes))

    try {
      const res = await fetch("/api/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stackId: stack.id }),
      })

      if (!res.ok) throw new Error("Upvote API failed")
    } catch {
      setStacks(prev =>
        prev.map(s =>
          s.id === stack.id
            ? { ...s, upvotes: previousUpvotes, _voted: false }
            : s
        )
      )
      const revertedVotes = votedCache.filter(id => id !== stack.id)
      setVotedCache(revertedVotes)
      localStorage.setItem("toolvise_voted", JSON.stringify(revertedVotes))
      
      setToastError("Upvote failed. Please try again.")
      setTimeout(() => setToastError(null), 3000)
    }
  }

  const handleBookmark = async (stackId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login?next=/explore')
      return
    }

    if (bookmarked.has(stackId)) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('stack_id', stackId)
      setBookmarked(prev => {
        const next = new Set(prev)
        next.delete(stackId)
        return next
      })
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, stack_id: stackId })
      setBookmarked(prev => new Set(Array.from(prev).concat(stackId)))
    }
  }

  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-[#F8F8F8] selection:bg-white/2 relative pb-24">
      <Navbar />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(232,162,78,0.12)_0%,transparent_70%)]" />

      <main className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        
        {/* 1. HEADER */}
        <header className="mb-14 text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <Badge variant="outline" className="border-[#4F8EF7]/25 bg-[#0A0A0A]/10 text-[#A0A0A0] px-4 py-1.5 text-sm">
            <Layers className="mr-2 h-4 w-4" />
            {totalCount.toLocaleString()} Generated Stacks
          </Badge>
          <h1 className="bg-gradient-to-br from-[#4F8EF7] to-[#00D4FF] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl">
            Explore Stacks
          </h1>
          <p className="text-lg text-[#F8F8F8]/50 max-w-2xl mx-auto font-medium">
            See what others are building with Toolvise and discover the perfect blueprint for your next project.
          </p>
        </header>

        {/* 2. SEARCH & FILTER BAR */}
        <div className="mb-12 space-y-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300 delay-75 fill-mode-both">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-[#F8F8F8]/40" />
            <Input
              type="text"
              placeholder="Search by tech, idea, or tags... (e.g. Next.js, AI CRM)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full pl-12 rounded-xl bg-[#0A0A0A] border-white/10 text-[#F8F8F8] placeholder:text-[#F8F8F8]/30 focus-visible:ring-1 focus-visible:ring-[#4F8EF7]/30 focus-visible:border-[#4F8EF7] transition-all text-base"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl">
            {FILTERS.map(filter => (
              <Button
                key={filter}
                variant="outline"
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "rounded-full border-white/10 px-5 transition-all text-sm font-semibold",
                  activeFilter === filter 
                    ? "bg-[#0A0A0A] text-[#F8F8F8] border-[#4F8EF7] shadow-[0_0_15px_rgba(0,212,255,0.4)]" 
                    : "bg-[#0A0A0A] text-[#F8F8F8]/60 hover:bg-[#0A0A0A] hover:text-[#F8F8F8]"
                )}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {/* 3. STACKS GRID */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <Card key={n} className="h-72 bg-[#0A0A0A] border-white/10 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : stacks.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in fill-mode-both duration-300 delay-100">
            {stacks.map((stack) => {
              const hasVoted = votedCache.includes(stack.id) || stack._voted;
              
              return (
                <Card 
                  key={stack.id} 
                  className="group relative flex flex-col overflow-hidden bg-[#0A0A0A] border-white/10 hover:border-white/10 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all rounded-2xl h-[320px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
                  
                  <CardContent className="flex flex-1 flex-col p-6 h-full">
                    {/* Top Badges */}
                    <div className="flex items-start justify-between gap-2 mb-4 shrink-0">
                      <Badge className="bg-[#0A0A0A] text-[#F8F8F8]/80 border-0 uppercase tracking-wider text-[10px] font-bold">
                        {stack.skill_level}
                      </Badge>
                      <Badge className="bg-[#0A0A0A]/20 text-[#A0A0A0] border-0 text-[10px] font-bold uppercase tracking-wider">
                        {stack.goal}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-sm font-medium text-[#F8F8F8]/90 leading-relaxed line-clamp-3 mb-4">
                      &quot;{stack.user_input}&quot;
                    </p>

                    {/* Tools Preview */}
                    <div className="flex flex-wrap gap-2 mb-auto shrink-0">
                      {stack.tools?.slice(0, 3).map((t, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-[#F8F8F8]/50 bg-[#0A0A0A] rounded-md px-2 py-1">
                          <span className={t.isFree ? "text-green-500" : "text-yellow-500"}>
                            {t.isFree ? "●" : "◎"}
                          </span>
                          {t.name}
                        </div>
                      ))}
                      {stack.tools?.length > 3 && (
                        <div className="text-xs text-[#F8F8F8]/40 bg-[#0A0A0A] rounded-md px-2 py-1 flex items-center">
                          +{stack.tools.length - 3} more
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="relative group/upvote">
                          <button
                            onClick={() => handleUpvote(stack)}
                            disabled={hasVoted}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all",
                              hasVoted
                                ? "bg-[#0F0F0F]/20 text-[#4F8EF7]"
                                : "bg-[#0A0A0A] text-[#F8F8F8]/50 hover:bg-[#0A0A0A] hover:text-[#F8F8F8]"
                            )}
                          >
                            <Flame className={cn("h-4 w-4", hasVoted && "fill-[#4F8EF7]")} />
                            {stack.upvotes.toLocaleString()}
                          </button>
                          {!isLoggedIn && (
                            <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover/upvote:block whitespace-nowrap rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs text-white pointer-events-none shadow-lg">
                              Sign in to upvote
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleBookmark(stack.id)}
                          className={cn(
                            "flex items-center gap-1 text-xs transition-colors",
                            bookmarked.has(stack.id)
                              ? "text-[#4F8EF7] font-semibold"
                              : "text-[#F8F8F8]/30 hover:text-[#4F8EF7]"
                          )}
                        >
                          <Bookmark className={cn("h-3.5 w-3.5", bookmarked.has(stack.id) && "fill-[#00D4FF]")} />
                          {bookmarked.has(stack.id) ? "Saved" : "Save"}
                        </button>
                      </div>

                      <Link
                        href={`/result?slug=${stack.share_slug}`}
                        className="flex items-center gap-1.5 text-sm font-semibold text-[#4F8EF7] hover:text-[#4F8EF7] transition-colors"
                      >
                        View Stack
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
            <div className="h-20 w-20 rounded-full bg-[#0A0A0A] flex items-center justify-center mb-6">
              <Inbox className="h-8 w-8 text-[#F8F8F8]/30" />
            </div>
            <h3 className="text-xl font-bold text-[#F8F8F8] mb-2">No stacks found</h3>
            <p className="text-[#F8F8F8]/50 max-w-sm">
              We couldn&apos;t find any generated stacks matching your current filters. Try adjusting your search!
            </p>
          </div>
        )}

        {/* 4. LOAD MORE BUTTON */}
        {!loading && stacks.length > 0 && (
          <div className="mt-16 flex justify-center">
            {hasMore ? (
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                className="h-12 px-8 rounded-full border-white/10 bg-[#0A0A0A] text-[#F8F8F8] hover:bg-[#0A0A0A] gap-2 font-semibold"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin text-[#4F8EF7]" />}
                {loadingMore ? "Loading..." : "Load More Stacks"}
              </Button>
            ) : (
              <p className="text-sm font-medium text-[#F8F8F8]/40 bg-[#0A0A0A] px-6 py-2 rounded-full border border-white/10 shadow-inner">
                No more stacks to display
              </p>
            )}
          </div>
        )}

      </main>

      {/* Toast error */}
      {toastError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-md px-5 py-3 text-sm font-medium text-red-400 shadow-lg">
            {toastError}
          </div>
        </div>
      )}
    </div>
  )
}
