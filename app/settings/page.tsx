"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  Sparkles,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [skillLevel, setSkillLevel] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setDisplayName(profile.display_name || "");
        setBio(profile.bio || "");
        setWebsite(profile.website || "");
        setSkillLevel(profile.skill_level || "");
      }
      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        bio: bio.trim().slice(0, 160),
        website: website.trim(),
        skill_level: skillLevel,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#fff1d6] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#F97316]" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#fff1d6] text-[#111827]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#FFD896] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#F97316] to-[#FB923C] shadow-lg shadow-amber-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Toolvise</span>
          </Link>
          <div className="ml-auto">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[#111827]/60 hover:text-[#111827] flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Profile card */}
          <div className="rounded-2xl border border-[#FFD896] bg-white p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-semibold">Profile Information</h2>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-600">
                Profile updated successfully! ✅
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-[#111827]/80">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="h-11 bg-white border-[#FFD896] text-[#111827] placeholder:text-[#111827]/30 focus-visible:ring-[#F97316]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-[#111827]/80">
                Bio{" "}
                <span className="text-[#111827]/40 font-normal">
                  ({bio.length}/160)
                </span>
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                placeholder="Tell people about yourself..."
                rows={3}
                className="resize-none bg-white border-[#FFD896] text-[#111827] placeholder:text-[#111827]/30 focus-visible:ring-[#F97316]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-[#111827]/80">
                Website
              </Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yoursite.com"
                className="h-11 bg-white border-[#FFD896] text-[#111827] placeholder:text-[#111827]/30 focus-visible:ring-[#F97316]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillLevel" className="text-[#111827]/80">
                Skill Level
              </Label>
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger className="h-11 bg-white border-[#FFD896] text-[#111827] focus:ring-[#F97316]">
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#FFD896] text-[#111827]">
                  {SKILL_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="h-11 rounded-xl bg-[#F97316] text-white hover:bg-[#EA6C0A] font-semibold shadow-lg shadow-amber-500/20 transition-all"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </form>

        {/* Danger zone */}
        <div className="mt-10 rounded-2xl border border-red-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-[#111827]/70">
                Sign out of your account on this device.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleSignOut}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
