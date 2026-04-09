"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Layers,
  Settings,
  User,
  ArrowUpRight,
  Plus,
  Search,
  Trash2,
  Globe,
  Lock,
  BarChart3,
  CalendarDays,
  Flame,
  ChevronDown,
  X,
  AlertTriangle,
  Bookmark,
  MoreVertical,
  Check,
  Copy,
  BookmarkMinus,
  ArrowUp,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/Navbar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
interface Tool {
  name: string;
  category: string;
  isFree: boolean;
}

interface ScoreCard {
  overallScore: number;
  verdict: string;
}

interface Stack {
  id: string;
  share_slug: string;
  user_input: string;
  skill_level: string;
  budget: string;
  goal: string;
  tools: Tool[];
  score_card: ScoreCard | null;
  is_public: boolean;
  upvotes: number;
  created_at: string;
}

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  stacks_count: number | null;
  followers_count: number | null;
  following_count: number | null;
}

type SortKey = "newest" | "score" | "upvotes";
type FilterKey = "all" | "public" | "private";
type TabKey = "my" | "saved";

// ── Confirm Delete Dialog ─────────────────────────────────────────────────
function DeleteDialog({
  stack,
  onConfirm,
  onCancel,
  loading,
}: {
  stack: Stack;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm card-3d p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-900/20 border border-red-500/30">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-[#E6EDF3]">Delete Stack?</h3>
            <p className="text-xs text-[#E6EDF3]/50">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-sm text-[#E6EDF3]/70 mb-6 line-clamp-2 bg-[#0D1117] border border-[rgba(240,246,252,0.10)] rounded-lg px-3 py-2">
          &quot;{stack.user_input}&quot;
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-red-900/200 hover:bg-red-600 text-[#E6EDF3] rounded-xl"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── My Stack Card (with three-dot menu) ──────────────────────────────────
function StackCard({
  stack,
  onDelete,
  onToggleVisibility,
}: {
  stack: Stack;
  onDelete: (stack: Stack) => void;
  onToggleVisibility: (stack: Stack) => void;
}) {
  const score = stack.score_card?.overallScore ?? null;
  const date = new Date(stack.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <Card className="group relative flex flex-col card-3d overflow-hidden">
      {/* Visibility badge (read-only display) */}
      <div className="absolute top-3 left-3 z-10">
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
            stack.is_public
              ? "bg-[#1ABC9C]/10 text-[#1ABC9C] border border-[#00D4FF]/30"
              : "bg-[#0D1117] text-[#E6EDF3]/50 border border-[rgba(240,246,252,0.10)]"
          )}
        >
          {stack.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {stack.is_public ? "Public" : "Private"}
        </span>
      </div>

      {/* Three-dot menu */}
      <div ref={menuRef} className="absolute top-3 right-3 z-20">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="h-7 w-7 flex items-center justify-center rounded-full bg-[#161B22]/80 border border-[rgba(240,246,252,0.10)] hover:bg-[#0D1117] transition-colors"
        >
          <MoreVertical className="h-4 w-4 text-[#E6EDF3]/50" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-9 w-44 glass-strong py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/result?slug=${stack.share_slug}`);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[#E6EDF3]/70 hover:bg-[#0D1117] hover:text-[#E6EDF3] transition-colors"
            >
              <Copy className="h-3.5 w-3.5" /> Copy Link
            </button>
            <button
              onClick={() => { onToggleVisibility(stack); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[#E6EDF3]/70 hover:bg-[#0D1117] hover:text-[#E6EDF3] transition-colors"
            >
              {stack.is_public ? (
                <><Lock className="h-3.5 w-3.5" /> Make Private</>
              ) : (
                <><Globe className="h-3.5 w-3.5" /> Make Public</>
              )}
            </button>
            <Link
              href={`/result?slug=${stack.share_slug}`}
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[#E6EDF3]/70 hover:bg-[#0D1117] hover:text-[#E6EDF3] transition-colors"
            >
              <ArrowUpRight className="h-3.5 w-3.5" /> View Stack
            </Link>
            <div className="border-t border-[rgba(240,246,252,0.10)]/50 my-1" />
            <button
              onClick={() => { onDelete(stack); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Stack
            </button>
          </div>
        )}
      </div>

      <CardContent className="flex flex-col flex-1 p-5 pt-12 space-y-3">
        <p className="text-sm font-medium text-[#E6EDF3] line-clamp-2 leading-relaxed">
          &quot;{stack.user_input}&quot;
        </p>

        <div className="flex flex-wrap gap-1.5">
          {(stack.tools || []).slice(0, 3).map((t, idx) => (
            <Badge key={idx} className="border border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3]/70 text-xs">
              {t.name}
            </Badge>
          ))}
          {(stack.tools || []).length > 3 && (
            <Badge className="border border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3]/40 text-xs">
              +{stack.tools.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#E6EDF3]/40 flex-wrap">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {date}
          </span>
          {stack.upvotes > 0 && (
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-[#2EA043]" />
              {stack.upvotes}
            </span>
          )}
          {score !== null && (
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-[#2EA043]" />
              {score}/100
            </span>
          )}
        </div>

        <div className="pt-2 border-t border-[rgba(240,246,252,0.10)]/60">
          <Link
            href={`/result?slug=${stack.share_slug}`}
            className="flex items-center gap-1 text-sm font-semibold text-[#2EA043] hover:text-[#2EA043] transition-colors"
          >
            View Stack
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Saved Stack Card (read-only) ──────────────────────────────────────────
function SavedStackCard({
  stack,
  onRemove,
}: {
  stack: Stack;
  onRemove: (stackId: string) => void;
}) {
  return (
    <Card className="group relative flex flex-col card-3d overflow-hidden">
      {/* Read-only badge */}
      <div className="absolute top-3 right-3 z-10">
        <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#2EA043]/10 text-blue-500 border border-[#2EA043]/20">
          <Bookmark className="h-3 w-3 fill-blue-500" />
          Saved
        </span>
      </div>

      <CardContent className="flex flex-col flex-1 p-5 pt-4 space-y-3">
        <p className="text-sm font-medium text-[#E6EDF3] line-clamp-2 pr-20 leading-relaxed">
          &quot;{stack.user_input}&quot;
        </p>

        <div className="flex flex-wrap gap-1.5">
          {(stack.tools || []).slice(0, 3).map((t, idx) => (
            <Badge
              key={idx}
              className="border border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3]/70 text-xs"
            >
              {t.name}
            </Badge>
          ))}
          {(stack.tools || []).length > 3 && (
            <Badge className="border border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3]/40 text-xs">
              +{stack.tools.length - 3}
            </Badge>
          )}
        </div>

        {stack.score_card?.overallScore != null && (
          <div className="flex items-center gap-1 text-xs text-[#E6EDF3]/40">
            <BarChart3 className="h-3 w-3 text-[#2EA043]" />
            Score: {stack.score_card.overallScore}/100
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-[rgba(240,246,252,0.10)]/60">
          <button
            onClick={() => onRemove(stack.id)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#E6EDF3]/60 hover:text-[#E6EDF3] bg-[#0D1117]/50 hover:bg-[#0D1117] border border-[rgba(240,246,252,0.10)]/50 rounded-full px-3 py-1.5 transition-colors"
          >
            <BookmarkMinus className="h-3.5 w-3.5" />
            Unsave
          </button>
          <Link
            href={`/result?slug=${stack.share_slug}`}
            className="flex items-center gap-1 text-sm font-semibold text-[#2EA043] hover:text-[#2EA043] transition-colors"
          >
            View Stack
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = React.useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [stacks, setStacks] = React.useState<Stack[]>([]);
  const [savedStacks, setSavedStacks] = React.useState<Stack[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Tab
  const [activeTab, setActiveTab] = React.useState<TabKey>("my");

  // Filters & sort (My Stacks only)
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [sort, setSort] = React.useState<SortKey>("newest");

  // Delete dialog state
  const [deletingStack, setDeletingStack] = React.useState<Stack | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Toast
  const [toast, setToast] = React.useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = React.useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Load user + data in parallel ──────────────────────────────────────
  React.useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();

      if (!u) {
        router.push("/login");
        return;
      }

      setUser({ id: u.id, email: u.email ?? "" });

      // Fetch profile, my stacks, and bookmarked stacks
      const [
        { data: profileData },
        { data: myStacksData },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.id).maybeSingle(),
        supabase
          .from("stacks")
          .select("*")
          .eq("user_id", u.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let bookmarksData: any = null;
      try {
        const { data } = await supabase
          .from("bookmarks")
          .select("stack_id, stacks(*)")
          .eq("user_id", u.id)
          .order("created_at", { ascending: false })
          .limit(50);
        bookmarksData = data;
      } catch {
        bookmarksData = [];
      }

      setProfile(profileData);
      setStacks(myStacksData ?? []);

      // bookmarksData rows have shape { stack_id, stacks: Stack }
      const saved = (bookmarksData ?? [])
        .map((b: { stack_id: string; stacks: Stack | Stack[] }) => {
          const s = b.stacks;
          return Array.isArray(s) ? s[0] : s;
        })
        .filter(Boolean) as Stack[];

      setSavedStacks(saved);
      setLoading(false);
    }

    load();
  }, [router]);

  // ── Derived stats ─────────────────────────────────────────────────────
  // thisMonthCount previously here

  const topScore = React.useMemo(
    () => Math.max(0, ...stacks.map((s) => s.score_card?.overallScore ?? 0)),
    [stacks]
  );

  const totalUpvotes = React.useMemo(
    () => stacks.reduce((sum, s) => sum + (s.upvotes ?? 0), 0),
    [stacks]
  );

  // ── Filtered + sorted my stacks ───────────────────────────────────────
  const filteredStacks = React.useMemo(() => {
    let result = [...stacks];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.user_input.toLowerCase().includes(q) ||
          (s.tools || []).some((t) => t.name.toLowerCase().includes(q))
      );
    }

    if (filter === "public") result = result.filter((s) => s.is_public);
    if (filter === "private") result = result.filter((s) => !s.is_public);

    if (sort === "score") {
      result.sort((a, b) => (b.score_card?.overallScore ?? 0) - (a.score_card?.overallScore ?? 0));
    } else if (sort === "upvotes") {
      result.sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0));
    }

    return result;
  }, [stacks, search, filter, sort]);

  // ── Delete my stack ───────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingStack) return;
    setDeleteLoading(true);

    const res = await fetch("/api/stacks/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stackId: deletingStack.id }),
    });

    if (res.ok) {
      setStacks((prev) => prev.filter((s) => s.id !== deletingStack.id));
      showToast("Stack deleted successfully");
    } else {
      showToast("Failed to delete stack", false);
    }

    setDeleteLoading(false);
    setDeletingStack(null);
  };

  // ── Toggle visibility ─────────────────────────────────────────────────
  const handleToggleVisibility = async (stack: Stack) => {
    const newVal = !stack.is_public;

    setStacks((prev) =>
      prev.map((s) => (s.id === stack.id ? { ...s, is_public: newVal } : s))
    );

    const res = await fetch("/api/stacks/visibility", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stackId: stack.id, isPublic: newVal }),
    });

    if (res.ok) {
      showToast(newVal ? "Stack made public" : "Stack set to private");
    } else {
      setStacks((prev) =>
        prev.map((s) => (s.id === stack.id ? { ...s, is_public: !newVal } : s))
      );
      showToast("Failed to update visibility", false);
    }
  };

  // ── Remove bookmark ───────────────────────────────────────────────────
  const handleRemoveBookmark = async (stackId: string) => {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", u.id)
      .eq("stack_id", stackId);

    if (!error) {
      setSavedStacks((prev) => prev.filter((s) => s.id !== stackId));
      showToast("Removed from saved stacks");
    } else {
      showToast("Failed to remove bookmark", false);
    }
  };

  // ── Display name ──────────────────────────────────────────────────────
  const displayName =
    profile?.display_name || profile?.username || user?.email?.split("@")[0] || "Builder";

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh bg-[#0D1117] text-[#E6EDF3]">
        <header className="sticky top-0 z-50 border-b border-[rgba(240,246,252,0.10)] bg-[#161B22]/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#2EA043] to-[#1ABC9C] animate-pulse" />
              <div className="h-5 w-24 rounded bg-[#2EA043]/60 animate-pulse" />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
          <div className="h-10 w-64 rounded-xl bg-[#2EA043]/60 animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 card-3d animate-pulse" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-52 card-3d animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0D1117] text-[#E6EDF3]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">

        {/* ── Welcome + Stats ── */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {displayName} 👋
              </h1>
              <p className="text-[#E6EDF3]/50 mt-1 text-sm">
                Here&apos;s your stack command center.
              </p>
            </div>
            <Link href="/advisor">
              <Button className="btn-primary gap-2">
                <Plus className="h-4 w-4" />
                Generate New Stack
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              {
                label: "My Stacks",
                value: stacks.length,
                icon: <Layers className="h-5 w-5 text-[#2EA043]" />,
                sub: "Generated by you",
              },
              {
                label: "Saved Stacks",
                value: savedStacks.length,
                icon: <Bookmark className="h-5 w-5 text-[#2EA043]" />,
                sub: "Bookmarked from others",
              },
              {
                label: "Top Score",
                value: topScore > 0 ? `${topScore}/100` : "—",
                icon: <BarChart3 className="h-5 w-5 text-[#2EA043]" />,
                sub: "Best stack score",
              },
              {
                label: "Upvotes Received",
                value: totalUpvotes,
                icon: <ArrowUp className="h-5 w-5 text-[#2EA043]" />,
                sub: "Across all your stacks",
              },
              {
                label: "Followers",
                value: profile?.followers_count ?? 0,
                icon: <Users className="h-5 w-5 text-[#2EA043]" />,
                sub: "People following you",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="card-3d p-5 flex items-center gap-4"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0D1117] border border-[rgba(240,246,252,0.10)] shrink-0">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#E6EDF3]">{stat.value}</p>
                  <p className="text-xs text-[#E6EDF3]/50">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Quick Actions ── */}
        <section className="flex flex-wrap gap-3">
          <Link href="/advisor">
            <Button className="btn-primary gap-2">
              <Sparkles className="h-4 w-4" />
              Generate New Stack →
            </Button>
          </Link>
          <Link href={`/profile/${profile?.username ?? ""}`}>
            <Button
              variant="outline"
              className="btn-ghost gap-2"
            >
              <User className="h-4 w-4" />
              View My Profile →
            </Button>
          </Link>
          <Link href="/explore">
            <Button
              variant="outline"
              className="btn-ghost gap-2"
            >
              <Layers className="h-4 w-4" />
              Explore Community
            </Button>
          </Link>
        </section>

        {/* ── Tab Switcher ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-1 p-1 bg-[#0D1117] border border-[rgba(240,246,252,0.10)] rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("my")}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                activeTab === "my"
                  ? "bg-[#0D1117] text-[#E6EDF3] shadow-sm"
                  : "text-[#E6EDF3]/60 hover:text-[#E6EDF3]"
              )}
            >
              My Stacks
              <span className="ml-2 text-xs opacity-70">({stacks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("saved")}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                activeTab === "saved"
                  ? "bg-[#0D1117] text-[#E6EDF3] shadow-sm"
                  : "text-[#E6EDF3]/60 hover:text-[#E6EDF3]"
              )}
            >
              Saved Stacks
              <span className="ml-2 text-xs opacity-70">({savedStacks.length})</span>
            </button>
          </div>

          {/* ── MY STACKS TAB ── */}
          {activeTab === "my" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Search + Filter + Sort bar */}
              {stacks.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#E6EDF3]/40" />
                    <Input
                      placeholder="Search stacks…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="input-dark pl-9 h-10"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E6EDF3]/30 hover:text-[#E6EDF3]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(["all", "public", "private"] as FilterKey[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                          filter === f
                            ? "bg-[#0D1117] text-[#E6EDF3] shadow-sm"
                            : "bg-[#0D1117] border border-[rgba(240,246,252,0.10)] text-[#E6EDF3]/60 hover:text-[#E6EDF3]"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <div className="relative shrink-0">
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      className="input-dark appearance-none h-10 pl-3 pr-8 text-sm font-medium cursor-pointer"
                    >
                      <option value="newest">Newest First</option>
                      <option value="score">Highest Score</option>
                      <option value="upvotes">Most Upvoted</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#E6EDF3]/40" />
                  </div>
                </div>
              )}

              {filteredStacks.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
                  {filteredStacks.map((stack) => (
                    <StackCard
                      key={stack.id}
                      stack={stack}
                      onDelete={setDeletingStack}
                      onToggleVisibility={handleToggleVisibility}
                    />
                  ))}
                </div>
              ) : stacks.length === 0 ? (
                <div className="card-3d p-14 text-center animate-in fade-in duration-300">
                  <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-[#0D1117] border border-[rgba(240,246,252,0.10)]">
                    <Layers className="h-8 w-8 text-[#2EA043]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#E6EDF3] mb-2">
                    You haven&apos;t generated any stacks yet
                  </h3>
                  <p className="text-sm text-[#E6EDF3]/50 mb-6 max-w-sm mx-auto">
                    Describe your project and our AI will recommend the perfect tech stack, tools, and learning path.
                  </p>
                  <Link href="/advisor">
                    <Button className="btn-primary gap-2">
                      <Sparkles className="h-4 w-4" />
                      Generate Your First Stack →
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="card-3d p-10 text-center animate-in fade-in duration-300">
                  <Search className="h-8 w-8 text-[#E6EDF3]/20 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-[#E6EDF3] mb-1">No stacks match</h3>
                  <p className="text-sm text-[#E6EDF3]/50">Try adjusting your search or filter</p>
                  <button
                    onClick={() => { setSearch(""); setFilter("all"); }}
                    className="mt-4 text-sm font-semibold text-[#2EA043] hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── SAVED STACKS TAB ── */}
          {activeTab === "saved" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {savedStacks.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {savedStacks.map((stack) => (
                    <SavedStackCard
                      key={stack.id}
                      stack={stack}
                      onRemove={handleRemoveBookmark}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-[rgba(240,246,252,0.10)] bg-[#0D1117] p-14 text-center animate-in fade-in duration-300">
                  <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-[#0D1117] border border-[rgba(240,246,252,0.10)]">
                    <Bookmark className="h-8 w-8 text-[#2EA043]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#E6EDF3] mb-2">
                    You haven&apos;t saved any stacks yet
                  </h3>
                  <p className="text-sm text-[#E6EDF3]/50 mb-6 max-w-sm mx-auto">
                    Browse the explore page and save stacks that inspire you.
                  </p>
                  <Link href="/explore">
                    <Button className="bg-[#0D1117] text-[#E6EDF3] hover:bg-[#2EA043] rounded-xl shadow-lg shadow-[#4F8EF7]/20 gap-2">
                      <Layers className="h-4 w-4" />
                      Explore Stacks →
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* ── Delete Confirm Dialog ── */}
      {deletingStack && (
        <DeleteDialog
          stack={deletingStack}
          onConfirm={handleDelete}
          onCancel={() => setDeletingStack(null)}
          loading={deleteLoading}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div
            className={cn(
              "rounded-xl px-5 py-3 text-sm font-medium shadow-lg backdrop-blur-md",
              toast.ok
                ? "bg-[#1ABC9C]/100/10 border border-green-500/20 text-[#1ABC9C]"
                : "bg-red-900/200/10 border border-red-500/20 text-red-400"
            )}
          >
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
