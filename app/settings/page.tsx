"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  Sparkles,
  AlertTriangle,
  LogOut,
  Upload,
  User,
  Github,
  Twitter,
  Linkedin,
  MapPin,
  Globe,
  Clock,
  Code2,
  Bell,
  UserPlus,
  Heart,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/Navbar";
import { cn } from "@/lib/utils";

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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const TIMEZONE_OPTIONS = [
  "UTC-12:00", "UTC-11:00", "UTC-10:00 (Hawaii)", "UTC-08:00 (PST)",
  "UTC-07:00 (MST)", "UTC-06:00 (CST)", "UTC-05:00 (EST)",
  "UTC-04:00 (AST)", "UTC-03:00 (BRT)", "UTC-01:00 (CVT)", "UTC+00:00 (GMT)",
  "UTC+01:00 (CET)", "UTC+02:00 (EET)", "UTC+03:00 (MSK)",
  "UTC+04:00 (GST)", "UTC+05:00 (PKT)", "UTC+05:30 (IST)",
  "UTC+06:00 (BST)", "UTC+07:00 (ICT)", "UTC+08:00 (CST/SGT)",
  "UTC+09:00 (JST/KST)", "UTC+10:00 (AEST)", "UTC+12:00 (NZST)",
];

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

  // Existing fields
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // New demographic fields
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [preferredLanguages, setPreferredLanguages] = useState("");
  const [timezone, setTimezone] = useState("");

  // Phase 6 identity fields
  const [headline, setHeadline] = useState("");
  const [accountType, setAccountType] = useState<string>("developer");
  const [openTo, setOpenTo] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [fundingStage, setFundingStage] = useState("");
  const [isHiring, setIsHiring] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");

  // Notification preferences
  const [notifFollows, setNotifFollows] = useState(true);
  const [notifUpvotes, setNotifUpvotes] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [savingNotifs, setSavingNotifs] = useState(false);

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
        setGender(profile.gender || "");
        setLocation(profile.location || "");
        setPreferredLanguages(profile.preferred_languages || "");
        setTimezone(profile.timezone || "");
        setNotifFollows(profile.notif_follows ?? true);
        setNotifUpvotes(profile.notif_upvotes ?? true);
        setNotifComments(profile.notif_comments ?? true);
        // Phase 6 identity fields
        setHeadline(profile.headline || "");
        setAccountType(profile.account_type || "developer");
        setOpenTo(profile.open_to || []);
        setCompanyName(profile.company_name || "");
        setIndustry(profile.industry || "");
        setCompanySize(profile.company_size || "");
        setFundingStage(profile.funding_stage || "");
        setIsHiring(profile.is_hiring ?? false);
        setCoverUrl(profile.cover_url || "");
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

      if (file.size > 2 * 1024 * 1024) {
        setError("Image must be under 2MB.");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
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
        gender: gender || null,
        location: location.trim() || null,
        preferred_languages: preferredLanguages.trim() || null,
        timezone: timezone || null,
        // Phase 6 identity fields
        headline: headline.trim().slice(0, 120) || null,
        account_type: accountType,
        open_to: openTo,
        company_name: companyName.trim() || null,
        industry: industry.trim() || null,
        company_size: companySize || null,
        funding_stage: fundingStage || null,
        is_hiring: isHiring,
        cover_url: coverUrl || null,
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

  // Save notification preferences
  const handleSaveNotifs = async () => {
    if (!userId) return;
    setSavingNotifs(true);
    await supabase
      .from("profiles")
      .update({
        notif_follows: notifFollows,
        notif_upvotes: notifUpvotes,
        notif_comments: notifComments,
      })
      .eq("id", userId);
    setSavingNotifs(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#0D1117] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2EA043]" />
      </div>
    );
  }

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="min-h-dvh bg-[#0D1117] text-[#E6EDF3]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-[#E6EDF3]/60 mt-2">Manage your profile and account preferences.</p>
        </div>

        {/* Sub-page navigation */}
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/settings/experience", label: "Work Experience" },
            { href: "/settings/education", label: "Education" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[rgba(240,246,252,0.10)] bg-[#161B22] text-sm text-[#8B949E] hover:text-[#E6EDF3] hover:border-[rgba(240,246,252,0.20)] transition-all"
            >
              {label} →
            </Link>
          ))}
        </div>

        <form onSubmit={handleSave} className="space-y-8">

          {/* ── Account Info ── */}
          <div className="card-3d p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-[#2EA043]" /> Account Info
            </h2>
            <div className="grid gap-2">
              <span className="text-sm font-medium text-[#E6EDF3]/60">Email</span>
              <div className="h-11 flex items-center px-3 rounded-lg bg-[#161B22]/5 border border-[rgba(240,246,252,0.10)] text-[#E6EDF3]/70 font-mono text-sm">
                {userEmail}
              </div>
              <p className="text-xs text-[#E6EDF3]/50 mt-1">Your email cannot be changed at this time.</p>
            </div>
          </div>

          {/* ── Identity Section (Phase 6) ── */}
          <div className="card-3d p-6 space-y-5">
            <h2 className="text-base font-semibold text-[#E6EDF3] font-heading">Identity</h2>

            {/* Account type */}
            <div className="space-y-2">
              <Label className="text-[#E6EDF3]/80 text-sm">I am a</Label>
              <div className="flex flex-wrap gap-2">
                {(['developer', 'student', 'company', 'startup'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium border transition-all capitalize",
                      accountType === type
                        ? "bg-[#2EA043] border-[#2EA043] text-white"
                        : "border-[rgba(240,246,252,0.10)] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[rgba(240,246,252,0.20)]"
                    )}
                  >
                    {type === 'developer' ? '👨‍💻 Developer' : type === 'student' ? '🎓 Student' : type === 'company' ? '🏢 Company' : '🚀 Startup'}
                  </button>
                ))}
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <Label className="text-[#E6EDF3]/80 text-sm">Headline <span className="text-[#484F58] font-normal">({headline.length}/120)</span></Label>
              <Input
                value={headline}
                onChange={e => setHeadline(e.target.value.slice(0, 120))}
                placeholder="e.g. Full-stack developer building AI products"
                className="input-dark"
              />
            </div>

            {/* Open to */}
            <div className="space-y-2">
              <Label className="text-[#E6EDF3]/80 text-sm">Open to</Label>
              <div className="flex flex-wrap gap-2">
                {(['fulltime', 'internship', 'freelance', 'cofounding', 'mentoring', 'hiring'] as const).map(opt => {
                  const labels: Record<string, string> = {
                    fulltime: 'Full-time', internship: 'Internship', freelance: 'Freelance',
                    cofounding: 'Co-founding', mentoring: 'Mentoring', hiring: 'Hiring'
                  }
                  const selected = openTo.includes(opt)
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setOpenTo(prev => selected ? prev.filter(o => o !== opt) : [...prev, opt])}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        selected
                          ? "bg-[#2EA043]/20 border-[#2EA043]/50 text-[#2EA043]"
                          : "border-[rgba(240,246,252,0.10)] text-[#8B949E] hover:text-[#E6EDF3]"
                      )}
                    >
                      {labels[opt]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Company/Startup fields */}
            {(accountType === 'company' || accountType === 'startup') && (
              <div className="space-y-4 pt-2 border-t border-[rgba(240,246,252,0.08)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#E6EDF3]/80 text-sm">Company / Startup Name</Label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Corp" className="input-dark" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#E6EDF3]/80 text-sm">Industry</Label>
                    <Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="SaaS, Fintech, EdTech..." className="input-dark" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#E6EDF3]/80 text-sm">Company Size</Label>
                    <Select value={companySize} onValueChange={setCompanySize}>
                      <SelectTrigger className="input-dark"><SelectValue placeholder="Select size" /></SelectTrigger>
                      <SelectContent className="bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3]">
                        {['1-10', '11-50', '51-200', '201-500', '500+'].map(s => (
                          <SelectItem key={s} value={s}>{s} employees</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#E6EDF3]/80 text-sm">Funding Stage</Label>
                    <Select value={fundingStage} onValueChange={setFundingStage}>
                      <SelectTrigger className="input-dark"><SelectValue placeholder="Select stage" /></SelectTrigger>
                      <SelectContent className="bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3]">
                        {['Bootstrapped', 'Pre-seed', 'Seed', 'Series A', 'Series B+'].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#0D1117] border border-[rgba(240,246,252,0.08)]">
                  <div>
                    <p className="text-sm font-medium text-[#E6EDF3]">Currently Hiring</p>
                    <p className="text-xs text-[#8B949E]">Show a hiring badge on your profile</p>
                  </div>
                  <Switch checked={isHiring} onCheckedChange={setIsHiring} />
                </div>
              </div>
            )}
          </div>

          {/* ── Profile Information ── */}
          <div className="card-3d p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-semibold">Profile Information</h2>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-3 text-sm text-red-400">{error}</div>
            )}
            {success && (
              <div className="rounded-lg border border-green-300 bg-[#1ABC9C]/10 p-3 text-sm text-[#1ABC9C]">
                Profile updated successfully! ✅
              </div>
            )}

            {/* Avatar Upload */}
            <div className="space-y-3">
              <Label className="text-[#E6EDF3]/80">Profile Picture</Label>
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 border-2 card-3d shadow-sm">
                  <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                  <AvatarFallback className="text-xl font-bold text-[#2EA043] bg-[#0D1117]">
                    {initials}
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
                    className="border-[rgba(240,246,252,0.10)] hover:bg-[#0D1117] hover:text-[#2EA043] text-sm h-10"
                  >
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {uploading ? "Uploading…" : "Upload Photo"}
                  </Button>
                  <p className="text-xs text-[#E6EDF3]/50 mt-2">Max 2MB · JPG, PNG, WebP</p>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-[#E6EDF3]/80">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="h-11 bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3] placeholder:text-[#E6EDF3]/30 focus-visible:ring-[#4F8EF7]/30"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-[#E6EDF3]/80">
                Bio{" "}
                <span className="text-[#E6EDF3]/40 font-normal">({bio.length}/160)</span>
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                placeholder="Tell people about yourself..."
                rows={3}
                className="resize-none bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3] placeholder:text-[#E6EDF3]/30 focus-visible:ring-[#4F8EF7]/30"
              />
            </div>

            {/* Gender + Skill Level row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-[#E6EDF3]/80">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="h-11 bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3] focus:ring-[#4F8EF7]/30">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3]">
                    {GENDER_OPTIONS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skillLevel" className="text-[#E6EDF3]/80">Skill Level</Label>
                <Select value={skillLevel} onValueChange={setSkillLevel}>
                  <SelectTrigger className="h-11 bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3] focus:ring-[#4F8EF7]/30">
                    <SelectValue placeholder="Select skill level" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3]">
                    {SKILL_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-[#E6EDF3]/80">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-[#E6EDF3]/40" />
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mumbai, India"
                  className="h-11 pl-9 bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3] placeholder:text-[#E6EDF3]/30 focus-visible:ring-[#4F8EF7]/30"
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-[#E6EDF3]/80 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Timezone
              </Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="h-11 bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3] focus:ring-[#4F8EF7]/30">
                  <SelectValue placeholder="Select your timezone" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3] max-h-60">
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preferred Languages */}
            <div className="space-y-2">
              <Label htmlFor="preferredLanguages" className="text-[#E6EDF3]/80 flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5" /> Preferred Languages / Frameworks
              </Label>
              <Input
                id="preferredLanguages"
                value={preferredLanguages}
                onChange={(e) => setPreferredLanguages(e.target.value)}
                placeholder="e.g. TypeScript, Python, React, Next.js"
                className="h-11 bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3] placeholder:text-[#E6EDF3]/30 focus-visible:ring-[#4F8EF7]/30"
              />
              <p className="text-xs text-[#E6EDF3]/40">Comma-separated. Helps us give better recommendations.</p>
            </div>
          </div>

          {/* ── Social Links ── */}
          <div className="card-3d p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-semibold">Social Links</h2>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-[#E6EDF3]/80">Website URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3.5 h-4 w-4 text-[#E6EDF3]/40" />
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yoursite.com"
                  className="h-11 pl-9 bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3] placeholder:text-[#E6EDF3]/30 focus-visible:ring-[#4F8EF7]/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="github" className="text-[#E6EDF3]/80">GitHub URL</Label>
              <div className="relative">
                <Github className="absolute left-3 top-3.5 h-4 w-4 text-[#E6EDF3]/40" />
                <Input
                  id="github"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="h-11 pl-9 bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3] placeholder:text-[#E6EDF3]/30 focus-visible:ring-[#4F8EF7]/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter" className="text-[#E6EDF3]/80">Twitter (X) URL</Label>
              <div className="relative">
                <Twitter className="absolute left-3 top-3.5 h-4 w-4 text-[#E6EDF3]/40" />
                <Input
                  id="twitter"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com/username"
                  className="h-11 pl-9 bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3] placeholder:text-[#E6EDF3]/30 focus-visible:ring-[#4F8EF7]/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin" className="text-[#E6EDF3]/80">LinkedIn URL</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-3.5 h-4 w-4 text-[#E6EDF3]/40" />
                <Input
                  id="linkedin"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="h-11 pl-9 bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3] placeholder:text-[#E6EDF3]/30 focus-visible:ring-[#4F8EF7]/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="mt-2 h-11 w-full sm:w-auto rounded-xl btn-primary font-semibold transition-all"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>

        {/* ── Notification Preferences ── */}
        <div className="rounded-2xl border border-[rgba(240,246,252,0.10)] bg-[#161B22] p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#E6EDF3] flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#2EA043]" />
                Notification Preferences
              </h2>
              <p className="text-sm text-[#8B949E] mt-1">Choose what you want to be notified about.</p>
            </div>
            <button
              type="button"
              onClick={handleSaveNotifs}
              disabled={savingNotifs}
              className="flex items-center gap-2 rounded-xl bg-[#2EA043]/10 border border-[#2EA043]/30 px-4 py-2 text-sm font-semibold text-[#2EA043] hover:bg-[#2EA043]/20 transition-all disabled:opacity-50"
            >
              {savingNotifs ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </button>
          </div>

          {[
            {
              label: "New Followers",
              description: "When someone follows you",
              icon: <UserPlus className="h-4 w-4 text-blue-400" />,
              value: notifFollows,
              onChange: setNotifFollows,
            },
            {
              label: "Stack Upvotes",
              description: "When someone upvotes your stack",
              icon: <Heart className="h-4 w-4 text-[#2EA043]" />,
              value: notifUpvotes,
              onChange: setNotifUpvotes,
            },
            {
              label: "New Comments",
              description: "When someone comments on your stack",
              icon: <MessageSquare className="h-4 w-4 text-purple-400" />,
              value: notifComments,
              onChange: setNotifComments,
            },
          ].map((pref) => (
            <div
              key={pref.label}
              className="flex items-center justify-between gap-4 rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl border border-[rgba(240,246,252,0.10)] bg-[#161B22]">
                  {pref.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#E6EDF3]">{pref.label}</p>
                  <p className="text-xs text-[#8B949E]">{pref.description}</p>
                </div>
              </div>
              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={pref.value}
                onClick={() => pref.onChange(!pref.value)}
                className={`relative h-6 w-11 shrink-0 rounded-full border transition-all duration-200 focus:outline-none ${
                  pref.value
                    ? "bg-[#2EA043] border-[#2EA043]"
                    : "bg-[#161B22] border-[rgba(240,246,252,0.15)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    pref.value ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* ── Danger Zone ── */}
        <div className="rounded-2xl border border-red-500/30 bg-red-900/10 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-[#E6EDF3]/70">Sign out of your account on this device.</p>
            </div>
          <Button
              type="button"
              onClick={handleSignOut}
              variant="outline"
              className="border-red-500/40 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-xl"
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
