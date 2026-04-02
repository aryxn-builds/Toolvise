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
    <header className="sticky top-0 z-50 border-b border-border bg-white shadow-nav">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 shadow-[0_10px_30px_rgba(249,115,22,0.25)]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold font-serif text-amber-500">
            Toolvise
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-6 text-sm text-[var(--text-secondary)] md:flex font-sans font-medium">
          <Link className="transition-colors hover:text-amber-500 px-1 py-5 border-b-2 border-transparent hover:border-amber-500" href="/">
            Home
          </Link>
          <Link
            className="transition-colors hover:text-amber-500 px-1 py-5 border-b-2 border-transparent hover:border-amber-500"
            href="/explore"
          >
            Explore
          </Link>
          <Link
            className="transition-colors hover:text-amber-500 px-1 py-5 border-b-2 border-transparent hover:border-amber-500"
            href="/leaderboard"
          >
            Leaderboard
          </Link>
          <Link
            className="transition-colors hover:text-amber-500 px-1 py-5 border-b-2 border-transparent hover:border-amber-500"
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
                className="flex items-center gap-2 rounded-full border border-border bg-white px-2 py-1.5 transition-all hover:bg-background"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                )}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-foreground/50 transition-transform",
                    dropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-white shadow-lg py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-border/50">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {profile?.display_name || profile?.username}
                    </p>
                    <p className="text-xs text-foreground/40 truncate">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/70 hover:bg-background hover:text-amber-300 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    My Dashboard
                  </Link>
                  <Link
                    href={`/profile/${profile?.username || ""}`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/70 hover:bg-background hover:text-amber-300 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/70 hover:bg-background hover:text-amber-300 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>

                  <div className="border-t border-border/50 mt-1 pt-1">
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
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-border bg-transparent text-foreground/70 hover:bg-white hover:text-amber-300 hidden sm:inline-flex"
                )}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "bg-amber-500 text-white hover:bg-amber-400 shadow-sm"
                )}
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
