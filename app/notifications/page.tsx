"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Heart,
  MessageSquare,
  UserPlus,
  Megaphone,
  ArrowLeft,
  Loader2,
  Inbox,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/Navbar";
import {
  getNotifications,
  markAllRead,
  markOneRead,
  timeAgo,
  type Notification,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

// ── Icon map for notification types ──────────────────────────────────────────
function NotifIcon({ type }: { type: string }) {
  const base = "h-4 w-4";
  switch (type) {
    case "follow":
      return <UserPlus className={cn(base, "text-blue-400")} />;
    case "upvote":
      return <Heart className={cn(base, "text-[#2EA043]")} />;
    case "comment":
      return <MessageSquare className={cn(base, "text-purple-400")} />;
    case "announcement":
      return <Megaphone className={cn(base, "text-[#1ABC9C]")} />;
    default:
      return <Bell className={cn(base, "text-[#8B949E]")} />;
  }
}

function NotifIconBg({ type }: { type: string }) {
  switch (type) {
    case "follow":
      return "bg-blue-900/30 border-blue-500/20";
    case "upvote":
      return "bg-[#2EA043]/10 border-[#2EA043]/20";
    case "comment":
      return "bg-purple-900/30 border-purple-500/20";
    case "announcement":
      return "bg-[#1ABC9C]/10 border-[#1ABC9C]/20";
    default:
      return "bg-[#161B22] border-[rgba(240,246,252,0.10)]";
  }
}

// ── Group notifications by date ───────────────────────────────────────────
function groupByDate(notifications: Notification[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const groups: { label: string; items: Notification[] }[] = [
    { label: "Today", items: [] },
    { label: "Earlier", items: [] },
  ];

  for (const n of notifications) {
    const notifDate = new Date(n.created_at);
    notifDate.setHours(0, 0, 0, 0);
    if (notifDate.getTime() >= today.getTime()) {
      groups[0].items.push(n);
    } else {
      groups[1].items.push(n);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [markingAll, setMarkingAll] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      const data = await getNotifications(user.id);
      setNotifications(data);
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleMarkAllRead() {
    if (!userId) return;
    setMarkingAll(true);
    await markAllRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setMarkingAll(false);
  }

  async function handleMarkOne(notifId: string) {
    await markOneRead(notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const grouped = groupByDate(notifications);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-dvh bg-[#0D1117] text-[#E6EDF3]">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#2EA043]" />
            <p className="text-sm text-[#8B949E]">Loading notifications…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0D1117] text-[#E6EDF3]">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(240,246,252,0.10)] bg-[#161B22] text-[#8B949E] transition-all hover:bg-[#0D1117] hover:text-[#E6EDF3]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Bell className="h-6 w-6 text-[#2EA043]" />
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-[#8B949E] mt-0.5">
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-2 rounded-xl border border-[rgba(240,246,252,0.10)] bg-[#161B22] px-4 py-2 text-sm font-medium text-[#E6EDF3]/70 transition-all hover:bg-[#0D1117] hover:text-[#E6EDF3] disabled:opacity-50"
            >
              {markingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Mark all read
            </button>
          )}
        </div>

        {/* Empty state */}
        {notifications.length === 0 && (
          <div className="card-3d p-16 text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-[#0D1117] border border-[rgba(240,246,252,0.10)]">
              <Inbox className="h-8 w-8 text-[#2EA043]/50" />
            </div>
            <h2 className="text-lg font-semibold text-[#E6EDF3] mb-2">
              All caught up!
            </h2>
            <p className="text-sm text-[#8B949E] max-w-xs mx-auto">
              You don&apos;t have any notifications yet. Follow people and share stacks to get started.
            </p>
            <Link
              href="/explore"
              className="btn-primary mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              Explore Community
            </Link>
          </div>
        )}

        {/* Grouped notification list */}
        {grouped.map((group) => (
          <div key={group.label} className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-3 px-1">
              {group.label}
            </h2>
            <div className="space-y-2">
              {group.items.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "relative flex items-start gap-4 rounded-2xl border p-4 transition-all",
                    notif.is_read
                      ? "border-[rgba(240,246,252,0.06)] bg-[#161B22]/50"
                      : "border-[rgba(240,246,252,0.10)] bg-[#161B22] shadow-sm"
                  )}
                >
                  {/* Unread dot */}
                  {!notif.is_read && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[#2EA043]" />
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border",
                      NotifIconBg({ type: notif.type })
                    )}
                  >
                    <NotifIcon type={notif.type} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        notif.is_read ? "text-[#8B949E]" : "text-[#E6EDF3]"
                      )}
                    >
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[#484F58]">
                        {timeAgo(notif.created_at)}
                      </span>
                      {notif.stack_id && (
                        <Link
                          href={`/result?stackId=${notif.stack_id}`}
                          className="text-xs text-[#2EA043] hover:underline"
                        >
                          View Stack →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Mark as read button */}
                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkOne(notif.id)}
                      className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#8B949E] transition-all hover:text-[#2EA043]"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
