"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Navbar } from "@/components/Navbar"

// ── Types ──────────────────────────────────────────────────────────────────
interface FormState {
  description: string
  skillLevel: string
  budget: string
  goal: string
  detailLevel: string
  buildStyle: string
}

interface FormErrors {
  description?: string
  skillLevel?: string
  budget?: string
  goal?: string
  detailLevel?: string
  buildStyle?: string
}

const BUDGET_OPTIONS = [
  { value: "free", label: "Free Only" },
  { value: "mix", label: "Mix of Free & Paid" },
  { value: "any", label: "Budget doesn't matter" },
]

const SKILL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
]

const GOAL_OPTIONS = [
  { value: "learn", label: "Learn & Practice" },
  { value: "mvp", label: "Build MVP Fast" },
  { value: "production", label: "Production Ready App" },
  { value: "freelance", label: "Freelance Project" },
  { value: "startup", label: "Startup Product" },
]

const DETAIL_LEVEL_OPTIONS = [
  { value: "quick", label: "⚡ Quick Glance", subtitle: "Core stack, fast results" },
  { value: "balanced", label: "🎯 Balanced", subtitle: "Clear reasoning included" },
  { value: "deep", label: "🔬 Deep Dive", subtitle: "Full analysis + alternatives" },
]

const BUILD_STYLE_OPTIONS = [
  { value: "traditional", label: "Traditional Coding" },
  { value: "vibe", label: "Vibe Coding ✨" },
  { value: "nocode", label: "No-Code / Low-Code" },
]

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdvisorPage() {
  const router = useRouter()

  const [form, setForm] = React.useState<FormState>({
    description: "",
    skillLevel: "",
    budget: "",
    goal: "",
    detailLevel: "balanced",
    buildStyle: "",
  })

  const [errors, setErrors] = React.useState<FormErrors>({})
  const [loading, setLoading] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  // ── Validation ────────────────────────────────────────────────────────
  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!form.description.trim()) {
      newErrors.description = "Please describe your project."
    } else if (form.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters."
    }

    if (!form.skillLevel) {
      newErrors.skillLevel = "Please select your skill level."
    }

    if (!form.budget) {
      newErrors.budget = "Please choose a budget option."
    }

    if (!form.goal) {
      newErrors.goal = "Please select your goal."
    }

    if (!form.buildStyle) {
      newErrors.buildStyle = "Please select how you want to build."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!validate()) return

    setLoading(true)

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.error ?? `Server error (${res.status})`)
      }

      const data = await res.json()

      // Store result + form inputs in localStorage for the result page
      localStorage.setItem(
        "toolvise_result",
        JSON.stringify({ 
          ...data, 
          formInput: form 
        })
      )

      // Always redirect with slug so result
      // page can fetch fresh from Supabase
      if (data.shareSlug) {
        router.push(`/result?slug=${data.shareSlug}`)
      } else {
        // Fallback to localStorage if no slug
        router.push("/result")
      }
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Field helpers ─────────────────────────────────────────────────────
  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const charCount = form.description.length

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3]">
      <Navbar />

      {/* ── Main ── */}
      <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16">

        {/* Page heading */}
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Find Your Perfect Stack
          </h1>
          <p className="text-sm leading-relaxed text-neutral-300">
            Tell us about your project and we&apos;ll recommend the best tools,
            frameworks, and resources — tailored just for you.
          </p>
        </div>

        {/* Form card */}
        <div className="glass-strong rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-7">

            {/* ── Field 1: Project Description ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-[#E6EDF3]/90">
                  Project Description
                  <span className="ml-1 text-[#2EA043]">*</span>
                </Label>
                <span
                  className={cn(
                    "text-xs tabular-nums transition-colors",
                    charCount < 20 ? "text-[#E6EDF3]/30" : "text-[#E6EDF3]/50"
                  )}
                >
                  {charCount} chars {charCount < 20 && charCount > 0 && `(${20 - charCount} more)`}
                </span>
              </div>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="e.g. I want to build a task management app for students..."
                rows={4}
                className={cn(
                  "input-dark resize-none placeholder:text-[#E6EDF3]/25",
                  errors.description && "border-red-500/60 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                )}
                aria-describedby={errors.description ? "description-error" : undefined}
              />
              {errors.description && (
                <FieldError id="description-error" message={errors.description} />
              )}
            </div>

            {/* ── Field 2: Skill Level ── */}
            <div className="space-y-2">
              <Label htmlFor="skillLevel" className="text-[#E6EDF3]/90">
                Skill Level
                <span className="ml-1 text-[#2EA043]">*</span>
              </Label>
              <Select
                value={form.skillLevel}
                onValueChange={(v) => setField("skillLevel", v)}
              >
                <SelectTrigger
                  id="skillLevel"
                  className={cn(
                    "input-dark h-10 data-[placeholder]:text-[#E6EDF3]/30",
                    errors.skillLevel && "border-red-500/60"
                  )}
                >
                  <SelectValue placeholder="Select your skill level…" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3]">
                  {SKILL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="focus:bg-[#0D1117] focus:text-[#E6EDF3]">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.skillLevel && (
                <FieldError message={errors.skillLevel} />
              )}
            </div>

            {/* ── Field 3: Budget (toggle buttons) ── */}
            <div className="space-y-2">
              <Label className="text-[#E6EDF3]/90">
                Budget
                <span className="ml-1 text-[#2EA043]">*</span>
              </Label>
              <div
                className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                role="group"
                aria-label="Budget options"
              >
                {BUDGET_OPTIONS.map((o) => {
                  const selected = form.budget === o.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setField("budget", o.value)}
                      aria-pressed={selected}
                      className={cn(
                        "relative rounded-xl border px-3 py-3 text-sm font-medium transition-all duration-150 text-center select-none",
                        selected
                          ? "border-[#2EA043] bg-[#0D1117]/15 text-[#E6EDF3] shadow-[0_0_0_1px_rgba(0,212,255,0.5)]"
                          : "border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3]/60 hover:border-[rgba(240,246,252,0.10)] hover:bg-[#0D1117] hover:text-[#E6EDF3]/85",
                        errors.budget && !selected && "border-red-500/30"
                      )}
                    >
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#0D1117]">
                          <svg className="h-2.5 w-2.5 text-[#E6EDF3]" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                      {o.label}
                    </button>
                  )
                })}
              </div>
              {errors.budget && (
                <FieldError message={errors.budget} />
              )}
            </div>

            {/* ── Field 4: Goal ── */}
            <div className="space-y-2">
              <Label htmlFor="goal" className="text-[#E6EDF3]/90">
                Goal
                <span className="ml-1 text-[#2EA043]">*</span>
              </Label>
              <Select
                value={form.goal}
                onValueChange={(v) => setField("goal", v)}
              >
                <SelectTrigger
                  id="goal"
                  className={cn(
                    "input-dark h-10 data-[placeholder]:text-[#E6EDF3]/30",
                    errors.goal && "border-red-500/60"
                  )}
                >
                  <SelectValue placeholder="What are you building towards?" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3]">
                  {GOAL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="focus:bg-[#0D1117] focus:text-[#E6EDF3]">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.goal && (
                <FieldError message={errors.goal} />
              )}
            </div>

            {/* ── Field 5: Detail Level (toggle buttons) ── */}
            <div className="space-y-2">
              <Label className="text-[#E6EDF3]/90">
                How deep should we go?
                <span className="ml-1 text-[#2EA043]">*</span>
              </Label>
              <div
                className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                role="group"
                aria-label="Detail level options"
              >
                {DETAIL_LEVEL_OPTIONS.map((o) => {
                  const selected = form.detailLevel === o.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setField("detailLevel", o.value)}
                      aria-pressed={selected}
                      className={cn(
                        "relative rounded-xl border px-3 py-3 text-sm font-medium transition-all duration-150 text-center select-none",
                        selected
                          ? "border-[#2EA043] bg-[#0D1117]/15 text-[#E6EDF3] shadow-[0_0_0_1px_rgba(0,212,255,0.5)]"
                          : "border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3]/60 hover:border-[rgba(240,246,252,0.10)] hover:bg-[#0D1117] hover:text-[#E6EDF3]/85",
                        errors.detailLevel && !selected && "border-red-500/30"
                      )}
                    >
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#0D1117]">
                          <svg className="h-2.5 w-2.5 text-[#E6EDF3]" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                      {o.label}
                      <span className="block text-[11px] text-[#E6EDF3]/40 font-normal mt-0.5">{o.subtitle}</span>
                    </button>
                  )
                })}
              </div>
              {errors.detailLevel && (
                <FieldError message={errors.detailLevel} />
              )}
            </div>

            {/* ── Field 6: Build Style (toggle buttons) ── */}
            <div className="space-y-2">
              <Label className="text-[#E6EDF3]/90">
                How do you want to build this?
                <span className="ml-1 text-[#2EA043]">*</span>
              </Label>
              <div
                className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                role="group"
                aria-label="Build style options"
              >
                {BUILD_STYLE_OPTIONS.map((o) => {
                  const selected = form.buildStyle === o.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setField("buildStyle", o.value)}
                      aria-pressed={selected}
                      className={cn(
                        "relative rounded-xl border px-3 py-3 text-sm font-medium transition-all duration-150 text-center select-none",
                        selected
                          ? "border-[#2EA043] bg-[#0D1117]/15 text-[#E6EDF3] shadow-[0_0_0_1px_rgba(0,212,255,0.5)]"
                          : "border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3]/60 hover:border-[rgba(240,246,252,0.10)] hover:bg-[#0D1117] hover:text-[#E6EDF3]/85",
                        errors.buildStyle && !selected && "border-red-500/30"
                      )}
                    >
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#0D1117]">
                          <svg className="h-2.5 w-2.5 text-[#E6EDF3]" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                      {o.label}
                    </button>
                  )
                })}
              </div>
              {errors.buildStyle && (
                <FieldError message={errors.buildStyle} />
              )}
            </div>

            {/* ── API / global error ── */}
            {submitError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "btn-primary glow-green w-full py-3 flex items-center justify-center gap-2 relative",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing your project…
                </>
              ) : (
                <>
                  Find My Stack
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-[#E6EDF3]/30">
              Powered by Gemini AI · Usually takes 5–10 seconds
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}

// ── FieldError helper ──────────────────────────────────────────────────────
function FieldError({ id, message }: { id?: string; message: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="flex items-center gap-1.5 text-xs text-red-400"
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  )
}
