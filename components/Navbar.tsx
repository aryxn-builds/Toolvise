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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

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
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      }
    });

    return () => subscription.unsubscribe();
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
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0A0A0A]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-r from-[#4F8EF7] to-[#00D4FF]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-heading font-semibold text-white tracking-tight">
            Toolvise
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-6 text-sm md:flex font-sans font-medium text-white/60">
          <Link className="transition-colors hover:text-white px-1 py-5" href="/">
            Home
          </Link>
          <Link
            className="transition-colors hover:text-white px-1 py-5"
            href="/explore"
          >
            Explore
          </Link>
          <Link
            className="transition-colors hover:text-white px-1 py-5"
            href="/leaderboard"
          >
            Leaderboard
          </Link>
          <Link
            className="transition-colors hover:text-white px-1 py-5"
            href="/about"
          >
            About
          </Link>
        </nav>

        {/* Auth section */}
        <div className="flex items-center gap-3">
          {user ? (
            /* Logged in — avatar dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0A0A0A] px-2 py-1.5 transition-all hover:bg-[#0A0A0A]"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#4F8EF7] to-[#00D4FF] flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                )}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-[#F8F8F8]/50 transition-transform",
                    dropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-glass py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-white/10/50">
                    <p className="text-sm font-semibold text-white/80 truncate">
                      {profile?.display_name || profile?.username}
                    </p>
                    <p className="text-xs text-white/40 truncate">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#F8F8F8]/70 hover:bg-[#0A0A0A] hover:text-[#F8F8F8] transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    My Dashboard
                  </Link>
                  <Link
                    href={`/profile/${profile?.username || ""}`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#F8F8F8]/70 hover:bg-[#0A0A0A] hover:text-[#F8F8F8] transition-colors"
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#F8F8F8]/70 hover:bg-[#0A0A0A] hover:text-[#F8F8F8] transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>

                  <div className="border-t border-white/10/50 mt-1 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Not logged in — Sign In / Sign Up */
            <>
              <Link
                href="/login"
                className="bg-white/5 border border-white/10 text-white hover:bg-white/8 hover:border-white/15 rounded-lg px-4 py-2 text-sm hidden sm:inline-flex transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="btn-primary px-5 py-2 text-sm font-semibold rounded-lg hidden sm:inline-flex"
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
