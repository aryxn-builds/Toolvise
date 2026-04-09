"use client"

import * as React from "react"
import { X, Loader2, UserCircle } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"

interface MinProfile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

interface FollowersPanelProps {
  profileId: string
  followersCount: number
  followingCount: number
  stacksCount: number
}

export function FollowersPanel({
  profileId,
  followersCount,
  followingCount,
  stacksCount,
}: FollowersPanelProps) {
  const [open, setOpen] = React.useState<"followers" | "following" | null>(null)
  const [users, setUsers] = React.useState<MinProfile[]>([])
  const [loading, setLoading] = React.useState(false)

  const fetchUsers = async (type: "followers" | "following") => {
    setLoading(true)
    setUsers([])

    let mounted = true
    const supabase = createClient()

    try {
      if (type === "followers") {
        // rows where following_id = profileId → give us the follower_id profiles
        const { data } = await supabase
          .from("follows")
          .select("follower:follower_id(id, username, display_name, avatar_url)")
          .eq("following_id", profileId)
          .order("created_at", { ascending: false })
          .limit(50)
        if (mounted && data) {
          setUsers(
            data
              .map((r: Record<string, unknown>) => r.follower as MinProfile)
              .filter(Boolean)
          )
        }
      } else {
        // rows where follower_id = profileId → give us the following_id profiles
        const { data } = await supabase
          .from("follows")
          .select("following:following_id(id, username, display_name, avatar_url)")
          .eq("follower_id", profileId)
          .order("created_at", { ascending: false })
          .limit(50)
        if (mounted && data) {
          setUsers(
            data
              .map((r: Record<string, unknown>) => r.following as MinProfile)
              .filter(Boolean)
          )
        }
      }
    } catch {
      // silent failure
    } finally {
      if (mounted) setLoading(false)
    }

    return () => { mounted = false }
  }

  const handleOpen = (type: "followers" | "following") => {
    setOpen(type)
    fetchUsers(type)
  }

  const handleClose = () => {
    setOpen(null)
    setUsers([])
  }

  return (
    <>
      {/* Stat Pills */}
      <div className="flex gap-6 text-sm pt-1">
        <div>
          <span className="font-bold text-[#E6EDF3]">{stacksCount ?? 0}</span>
          <span className="text-[#2EA043]/70 ml-1">Stacks</span>
        </div>
        <button
          onClick={() => handleOpen("followers")}
          className="hover:underline text-left transition-colors hover:text-[#2EA043] group"
        >
          <span className="font-bold text-[#E6EDF3] group-hover:text-[#2EA043]">{followersCount ?? 0}</span>
          <span className="text-[#2EA043]/70 ml-1">Followers</span>
        </button>
        <button
          onClick={() => handleOpen("following")}
          className="hover:underline text-left transition-colors hover:text-[#2EA043] group"
        >
          <span className="font-bold text-[#E6EDF3] group-hover:text-[#2EA043]">{followingCount ?? 0}</span>
          <span className="text-[#2EA043]/70 ml-1">Following</span>
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="relative w-full max-w-sm rounded-2xl border border-[rgba(240,246,252,0.10)] bg-[#161B22] shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[rgba(240,246,252,0.10)] px-5 py-4">
              <h2 className="text-base font-semibold text-[#E6EDF3] capitalize">{open}</h2>
              <button
                onClick={handleClose}
                className="text-[#8B949E] hover:text-[#E6EDF3] transition-colors rounded-md p-1 hover:bg-[#1C2128]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* User List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-[rgba(240,246,252,0.05)]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-[#2EA043]" />
                </div>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username}`}
                    onClick={handleClose}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#1C2128] transition-colors"
                  >
                    <Avatar className="h-8 w-8 border border-[rgba(240,246,252,0.10)] shrink-0">
                      {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                      <AvatarFallback className="bg-gradient-to-br from-[#2EA043] to-[#1ABC9C] text-white text-xs font-bold">
                        {(u.display_name || u.username || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#E6EDF3] truncate">
                        {u.display_name || u.username || "Unknown"}
                      </p>
                      {u.username && (
                        <p className="text-xs text-[#8B949E] truncate">@{u.username}</p>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                  <UserCircle className="h-8 w-8 text-[#484F58]" />
                  <p className="text-sm text-[#8B949E]">
                    No {open} yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
