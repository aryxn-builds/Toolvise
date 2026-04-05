"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

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
                  <MailCheck className="h-8 w-8 text-[#1ABC9C]" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-[#E6EDF3]">
                Check your email!
              </h1>
              <p className="text-sm text-[#E6EDF3]/60 leading-relaxed">
                We sent a reset link to{" "}
                <span className="font-semibold text-[#E6EDF3]">{email}</span>{" "}
                📬
                <br />
                Click the link in the email to set a new password.
              </p>
              <div className="rounded-lg border border-[#00D4FF]/30 bg-[#1ABC9C]/10 p-3 text-sm text-[#1ABC9C]">
                Didn&apos;t receive it? Check your spam folder, or{" "}
                <button
                  onClick={() => setSuccess(false)}
                  className="font-semibold underline hover:no-underline"
                >
                  try again
                </button>
                .
              </div>
            </div>
          ) : (
            /* Form state */
            <>
              <h1 className="text-2xl font-bold text-[#E6EDF3] text-center mb-2">
                Reset your password
              </h1>
              <p className="text-sm text-[#E6EDF3]/50 text-center mb-8">
                Enter your email and we&apos;ll send you a reset link
              </p>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-3 text-sm text-red-500 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#E6EDF3]/80">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="h-11 bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3] placeholder:text-[#E6EDF3]/30 focus-visible:ring-[#4F8EF7]/30 focus-visible:border-[#2EA043]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl btn-primary font-semibold"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Back to login */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[#E6EDF3]/50 hover:text-[#E6EDF3] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
