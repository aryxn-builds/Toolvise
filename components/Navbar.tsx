"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Bell,
  Activity,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { getUnreadCount } from "@/lib/notifications";

interface Profile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser({ id: u.id, email: u.email });
        // Fetch profile
        supabase
          .from("profiles")
          .select("username, display_name, avatar_url")
          .eq("id", u.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setProfile(data as Profile);
          });

        // Initial unread count fetch
        getUnreadCount(u.id).then(setUnreadCount);

        // Poll every 30 seconds
        pollRef.current = setInterval(() => {
          getUnreadCount(u.id).then(setUnreadCount);
        }, 30_000);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
      } else {
        setUser(null);
        setProfile(null);
        setUnreadCount(0);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [supabase]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push("/");
    router.refresh();
  };

  const initials = (profile?.display_name || profile?.username || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(240,246,252,0.10)] bg-[#0D1117]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-r from-[#2EA043] to-[#1ABC9C]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-heading font-semibold text-[#E6EDF3] tracking-tight">
            Toolvise
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-6 text-sm md:flex font-sans font-medium text-[#8B949E]">
          <Link className="transition-colors hover:text-[#E6EDF3] px-1 py-5" href="/">
            Home
          </Link>
          <Link
            className="transition-colors hover:text-[#E6EDF3] px-1 py-5"
            href="/explore"
          >
            Explore
          </Link>
          <Link
            className="transition-colors hover:text-[#E6EDF3] px-1 py-5"
            href="/people"
          >
            People
          </Link>
          <Link
            className="transition-colors hover:text-[#E6EDF3] px-1 py-5"
            href="/leaderboard"
          >
            Leaderboard
          </Link>
          {user && (
            <Link
              className="transition-colors hover:text-[#E6EDF3] px-1 py-5 flex items-center gap-1.5"
              href="/activity"
            >
              <Activity className="h-3.5 w-3.5" />
              Activity
            </Link>
          )}
          <Link
            className="transition-colors hover:text-[#E6EDF3] px-1 py-5"
            href="/about"
          >
            About
          </Link>
        </nav>

        {/* Auth section */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notification bell */}
              <Link
                href="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(240,246,252,0.10)] bg-[#161B22] text-[#8B949E] transition-all hover:bg-[#0D1117] hover:text-[#E6EDF3]"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2EA043] text-[9px] font-bold text-white shadow-lg">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Logged in — avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-[rgba(240,246,252,0.10)] bg-[#0D1117] px-2 py-1.5 transition-all hover:bg-[#0D1117]"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#2EA043] to-[#1ABC9C] flex items-center justify-center text-[#E6EDF3] text-xs font-bold">
                      {initials}
                    </div>
                  )}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-[#E6EDF3]/50 transition-transform",
                      dropdownOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-[rgba(240,246,252,0.10)] bg-[#161B22] shadow-glass py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-[rgba(240,246,252,0.10)]/50">
                      <p className="text-sm font-semibold text-[#E6EDF3]/80 truncate">
                        {profile?.display_name || profile?.username}
                      </p>
                      <p className="text-xs text-[#484F58] truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#E6EDF3]/70 hover:bg-[#0D1117] hover:text-[#E6EDF3] transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      My Dashboard
                    </Link>
                    <Link
                      href={`/profile/${profile?.username || ""}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#E6EDF3]/70 hover:bg-[#0D1117] hover:text-[#E6EDF3] transition-colors"
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                    <Link
                      href="/notifications"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#E6EDF3]/70 hover:bg-[#0D1117] hover:text-[#E6EDF3] transition-colors"
                    >
                      <Bell className="h-4 w-4" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#2EA043] px-1 text-[10px] font-bold text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#E6EDF3]/70 hover:bg-[#0D1117] hover:text-[#E6EDF3] transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>

                    <div className="border-t border-[rgba(240,246,252,0.10)]/50 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Not logged in — Sign In / Sign Up */
            <>
              <Link
                href="/login"
                className="btn-ghost px-4 py-2 text-sm hidden sm:inline-flex"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="btn-primary px-5 py-2 text-sm hidden sm:inline-flex"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
