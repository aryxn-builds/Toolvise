"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sends the token via URL hash — detect the session
  useEffect(() => {
    const supabase = createClient();

    // onAuthStateChange fires once the hash token is consumed
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true);
        }
      }
    );

    // Also check if already in a recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  };

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#4F8EF7] to-[#00D4FF] shadow-lg shadow-[#4F8EF7]/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#F8F8F8]">
              Toolvise
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-8 shadow-sm">
          {success ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-[#00D4FF]" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-[#F8F8F8]">
                Password updated!
              </h1>
              <div className="rounded-lg border border-[#00D4FF]/30 bg-[#00D4FF]/10 p-3 text-sm text-[#00D4FF]">
                Your password has been changed successfully. Redirecting to
                sign in...
              </div>
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-[#4F8EF7]" />
              </div>
            </div>
          ) : (
            /* Form */
            <>
              <h1 className="text-2xl font-bold text-[#F8F8F8] text-center mb-2">
                Set new password
              </h1>
              <p className="text-sm text-[#F8F8F8]/50 text-center mb-8">
                Choose a strong password for your account
              </p>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-500 mb-4">
                  {error}
                </div>
              )}

              {!sessionReady && (
                <div className="rounded-lg border border-white/8 bg-[#0A0A0A] p-3 text-sm text-[#4F8EF7] mb-4">
                  Verifying your reset link... If you arrived here directly,
                  please use the link from your email.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#F8F8F8]/80">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="h-11 bg-[#0A0A0A] border-white/10 text-[#F8F8F8] placeholder:text-[#F8F8F8]/30 focus-visible:ring-[#4F8EF7]/30 focus-visible:border-[#4F8EF7] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[#F8F8F8]/40 hover:text-[#F8F8F8]/70 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[#F8F8F8]/40">
                    Minimum 8 characters
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[#F8F8F8]/80">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={`h-11 bg-[#0A0A0A] text-[#F8F8F8] placeholder:text-[#F8F8F8]/30 focus-visible:ring-[#4F8EF7]/30 pr-10 ${
                        passwordsMismatch
                          ? "border-red-400 focus-visible:border-red-400"
                          : passwordsMatch
                          ? "border-green-400 focus-visible:border-green-400"
                          : "border-white/10 focus-visible:border-[#4F8EF7]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-3 text-[#F8F8F8]/40 hover:text-[#F8F8F8]/70 transition-colors"
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordsMismatch && (
                    <p className="text-xs text-red-500">
                      Passwords do not match
                    </p>
                  )}
                  {passwordsMatch && (
                    <p className="text-xs text-[#00D4FF]">Passwords match ✓</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !sessionReady}
                  className="w-full h-11 rounded-xl bg-[#0A0A0A] text-white hover:bg-[#4F8EF7] font-semibold shadow-lg shadow-[#4F8EF7]/20 transition-all"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-[#F8F8F8]/50 hover:text-[#F8F8F8] transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
