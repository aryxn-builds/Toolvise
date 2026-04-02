"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  Sparkles,
  AlertTriangle,
  LogOut,
  Upload,
  User,
  Github,
  Twitter,
  Linkedin
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email || "");

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
        setAvatarUrl(profile.avatar_url || "");
        setGithubUrl(profile.github_url || "");
        setTwitterUrl(profile.twitter_url || "");
        setLinkedinUrl(profile.linkedin_url || "");
      }
      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);
      
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(data.publicUrl);
    } catch (err: unknown) {
      setError("Error uploading image: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    if (!userId) {
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        bio: bio.trim().slice(0, 160),
        website: website.trim(),
        skill_level: skillLevel,
        avatar_url: avatarUrl,
        github_url: githubUrl.trim(),
        twitter_url: twitterUrl.trim(),
        linkedin_url: linkedinUrl.trim(),
      })
      .eq("id", userId);

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

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-[#111827]/60 mt-2">Manage your profile and account preferences.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Account Info */}
          <div className="rounded-2xl border border-[#FFD896] bg-white p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-[#F97316]" /> Account Info
            </h2>
            <div className="grid gap-2">
              <span className="text-sm font-medium text-[#111827]/60">Email</span>
              <div className="h-11 flex items-center px-3 rounded-lg bg-gray-50 border border-gray-200 text-[#111827]/70 font-mono text-sm">
                {userEmail}
              </div>
              <p className="text-xs text-[#111827]/50 mt-1">Your email cannot be changed at this time.</p>
            </div>
          </div>

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

            {/* Avatar Upload */}
            <div className="space-y-3">
              <Label className="text-[#111827]/80">Profile Picture</Label>
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 border border-[#FFD896] bg-orange-50">
                  <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                  <AvatarFallback className="text-xl font-bold text-orange-600">
                    {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-[#FFD896] hover:bg-orange-50 hover:text-orange-600 text-sm h-10"
                  >
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload Photo
                  </Button>
                  <p className="text-xs text-[#111827]/50 mt-2">Recommended: 256x256px JPG or PNG.</p>
                </div>
              </div>
            </div>

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
          </div>

          <div className="rounded-2xl border border-[#FFD896] bg-white p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-semibold">Social Links</h2>
            
            <div className="space-y-2">
              <Label htmlFor="website" className="text-[#111827]/80">
                Website URL
              </Label>
              <div className="relative">
                <GlobeIcon className="absolute left-3 top-3.5 h-4 w-4 text-[#111827]/40" />
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yoursite.com"
                  className="h-11 pl-9 bg-white border-[#FFD896] text-[#111827] placeholder:text-[#111827]/30 focus-visible:ring-[#F97316]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="github" className="text-[#111827]/80">
                GitHub URL
              </Label>
              <div className="relative">
                <Github className="absolute left-3 top-3.5 h-4 w-4 text-[#111827]/40" />
                <Input
                  id="github"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="h-11 pl-9 bg-white border-[#FFD896] text-[#111827] placeholder:text-[#111827]/30 focus-visible:ring-[#F97316]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter" className="text-[#111827]/80">
                Twitter (X) URL
              </Label>
              <div className="relative">
                <Twitter className="absolute left-3 top-3.5 h-4 w-4 text-[#111827]/40" />
                <Input
                  id="twitter"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com/username"
                  className="h-11 pl-9 bg-white border-[#FFD896] text-[#111827] placeholder:text-[#111827]/30 focus-visible:ring-[#F97316]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin" className="text-[#111827]/80">
                LinkedIn URL
              </Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-3.5 h-4 w-4 text-[#111827]/40" />
                <Input
                  id="linkedin"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="h-11 pl-9 bg-white border-[#FFD896] text-[#111827] placeholder:text-[#111827]/30 focus-visible:ring-[#F97316]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="mt-6 h-11 w-full sm:w-auto rounded-xl bg-[#F97316] text-white hover:bg-[#EA6C0A] font-semibold shadow-lg shadow-amber-500/20 transition-all"
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

        <div className="rounded-2xl border border-red-200 bg-white p-6 sm:p-8">
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

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
