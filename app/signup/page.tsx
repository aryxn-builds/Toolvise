"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  const checkUsername = useCallback(async (value: string) => {
    if (value.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", value.toLowerCase().trim())
      .maybeSingle();
    setUsernameStatus(data ? "taken" : "available");
  }, []);

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsername(clean);
    const timer = setTimeout(() => checkUsername(clean), 500);
    return () => clearTimeout(timer);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      setLoading(false);
      return;
    }
    if (usernameStatus === "taken") {
      setError("That username is already taken.");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_name: username,
          full_name: username,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  async function handleGoogleSignIn() {
    setOauthLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("Google sign in error:", error);
      setError("Failed to sign in with Google. Please try again.");
      setOauthLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#fff1d6] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#F97316] to-[#FB923C] shadow-lg shadow-amber-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#111827]">
              Toolvise
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#FFD896] bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-[#111827] text-center mb-2">
            Create your account
          </h1>
          <p className="text-sm text-[#111827]/50 text-center mb-8">
            Join Toolvise and start building smarter
          </p>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={oauthLoading}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-[#FFD896] bg-white hover:bg-[#fff1d6] text-[#111827] font-medium transition-all mb-6 disabled:opacity-60"
          >
            {oauthLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#111827]/50" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#FFD896]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[#111827]/40 font-medium">or</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-500 mb-4">
              {error}
            </div>
          )}

          {/* Signup form */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[#111827]/80">
                Username
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="your_username"
                  required
                  minLength={3}
                  className="h-11 bg-white border-[#FFD896] text-[#111827] placeholder:text-[#111827]/30 focus-visible:ring-[#F97316] focus-visible:border-[#F97316] pr-10"
                />
                <div className="absolute right-3 top-3">
                  {usernameStatus === "checking" && (
                    <Loader2 className="h-4 w-4 animate-spin text-[#111827]/30" />
                  )}
                  {usernameStatus === "available" && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                  {usernameStatus === "taken" && (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              {usernameStatus === "taken" && (
                <p className="text-xs text-red-500">Username is taken</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#111827]/80">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-11 bg-white border-[#FFD896] text-[#111827] placeholder:text-[#111827]/30 focus-visible:ring-[#F97316] focus-visible:border-[#F97316]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#111827]/80">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="h-11 bg-white border-[#FFD896] text-[#111827] placeholder:text-[#111827]/30 focus-visible:ring-[#F97316] focus-visible:border-[#F97316]"
              />
              <p className="text-xs text-[#111827]/40">Minimum 8 characters</p>
            </div>

            <Button
              type="submit"
              disabled={loading || usernameStatus === "taken"}
              className="w-full h-11 rounded-xl bg-[#F97316] text-white hover:bg-[#EA6C0A] font-semibold shadow-lg shadow-amber-500/20 transition-all"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-[#111827]/50">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#F97316] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
