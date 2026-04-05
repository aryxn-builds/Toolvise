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
    <div className="min-h-dvh bg-[#0D1117] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-lg shadow-[#4F8EF7]/20">
              <Sparkles className="h-5 w-5 text-[#E6EDF3]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#E6EDF3]">
              Toolvise
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="card-3d p-8 shadow-sm">
          {success ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-[#1ABC9C]/10 border border-[#00D4FF]/30 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-[#1ABC9C]" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-[#E6EDF3]">
                Password updated!
              </h1>
              <div className="rounded-lg border border-[#00D4FF]/30 bg-[#1ABC9C]/10 p-3 text-sm text-[#1ABC9C]">
                Your password has been changed successfully. Redirecting to
                sign in...
              </div>
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-[#2EA043]" />
              </div>
            </div>
          ) : (
            /* Form */
            <>
              <h1 className="text-2xl font-bold text-[#E6EDF3] text-center mb-2">
                Set new password
              </h1>
              <p className="text-sm text-[#E6EDF3]/50 text-center mb-8">
                Choose a strong password for your account
              </p>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-3 text-sm text-red-400 mb-4">
                  {error}
                </div>
              )}

              {!sessionReady && (
                <div className="rounded-lg border card-3d p-3 text-sm text-[#2EA043] mb-4">
                  Verifying your reset link... If you arrived here directly,
                  please use the link from your email.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#E6EDF3]/80">
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
                      className="h-11 bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3] placeholder:text-[#E6EDF3]/30 focus-visible:ring-[#4F8EF7]/30 focus-visible:border-[#2EA043] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[#E6EDF3]/40 hover:text-[#E6EDF3]/70 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[#E6EDF3]/40">
                    Minimum 8 characters
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[#E6EDF3]/80">
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
                      className={`h-11 bg-[#0D1117] text-[#E6EDF3] placeholder:text-[#E6EDF3]/30 focus-visible:ring-[#4F8EF7]/30 pr-10 ${
                        passwordsMismatch
                          ? "border-red-400 focus-visible:border-red-400"
                          : passwordsMatch
                          ? "border-green-400 focus-visible:border-green-400"
                          : "border-[rgba(240,246,252,0.10)] focus-visible:border-[#2EA043]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-3 text-[#E6EDF3]/40 hover:text-[#E6EDF3]/70 transition-colors"
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
                    <p className="text-xs text-[#1ABC9C]">Passwords match ✓</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !sessionReady}
                  className="w-full h-11 rounded-xl btn-primary font-semibold"
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
            className="text-sm text-[#E6EDF3]/50 hover:text-[#E6EDF3] transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
