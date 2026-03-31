"use client"

import * as React from "react"
import { Megaphone, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function AnnouncementBanner() {
  const [msg, setMsg] = React.useState<string | null>(null)
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("announcements")
          .select("message")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (data?.message) setMsg(data.message)
      } catch {
        // Silently fail — banner is non-critical
      }
    }
    fetchAnnouncement()
  }, [])

  if (!msg || dismissed) return null

  return (
    <div className="w-full bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white px-4 py-2.5 flex items-center justify-between gap-4 text-sm font-medium shadow-md shadow-[#F97316]/20">
      <div className="flex items-center gap-2 flex-1 justify-center">
        <Megaphone className="h-4 w-4 shrink-0" />
        <span>{msg}</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 hover:opacity-70 transition-opacity rounded-full p-0.5"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
