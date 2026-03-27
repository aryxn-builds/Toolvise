"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, Sparkles, AlertCircle } from "lucide-react"
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
        JSON.stringify({ ...data, formInput: form })
      )

      router.push("/result")
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#2563eb] shadow-[0_8px_24px_rgba(124,58,237,0.3)]">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-wide">Toolvise</span>
          </a>
          <span className="text-xs text-white/40">No signup needed</span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16">

        {/* Page heading */}
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Find Your Perfect Stack
          </h1>
          <p className="text-sm leading-relaxed text-white/55">
            Tell us about your project and we&apos;ll recommend the best tools,
            frameworks, and resources — tailored just for you.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_32px_80px_rgba(0,0,0,0.6)] sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-7">

            {/* ── Field 1: Project Description ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-white/90">
                  Project Description
                  <span className="ml-1 text-[#7c3aed]">*</span>
                </Label>
                <span
                  className={cn(
                    "text-xs tabular-nums transition-colors",
                    charCount < 20 ? "text-white/30" : "text-white/50"
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
                  "resize-none bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#7c3aed] focus-visible:ring-[#7c3aed]/20",
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
              <Label htmlFor="skillLevel" className="text-white/90">
                Skill Level
                <span className="ml-1 text-[#7c3aed]">*</span>
              </Label>
              <Select
                value={form.skillLevel}
                onValueChange={(v) => setField("skillLevel", v)}
              >
                <SelectTrigger
                  id="skillLevel"
                  className={cn(
                    "w-full h-10 bg-white/5 border-white/10 text-white data-[placeholder]:text-white/30 focus:border-[#7c3aed] focus:ring-[#7c3aed]/20",
                    errors.skillLevel && "border-red-500/60"
                  )}
                >
                  <SelectValue placeholder="Select your skill level…" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                  {SKILL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="focus:bg-white/10 focus:text-white">
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
              <Label className="text-white/90">
                Budget
                <span className="ml-1 text-[#7c3aed]">*</span>
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
                          ? "border-[#7c3aed] bg-[#7c3aed]/15 text-white shadow-[0_0_0_1px_rgba(124,58,237,0.5)]"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:bg-white/8 hover:text-white/85",
                        errors.budget && !selected && "border-red-500/30"
                      )}
                    >
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#7c3aed]">
                          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
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
              <Label htmlFor="goal" className="text-white/90">
                Goal
                <span className="ml-1 text-[#7c3aed]">*</span>
              </Label>
              <Select
                value={form.goal}
                onValueChange={(v) => setField("goal", v)}
              >
                <SelectTrigger
                  id="goal"
                  className={cn(
                    "w-full h-10 bg-white/5 border-white/10 text-white data-[placeholder]:text-white/30 focus:border-[#7c3aed] focus:ring-[#7c3aed]/20",
                    errors.goal && "border-red-500/60"
                  )}
                >
                  <SelectValue placeholder="What are you building towards?" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                  {GOAL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="focus:bg-white/10 focus:text-white">
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
              <Label className="text-white/90">
                How deep should we go?
                <span className="ml-1 text-[#7c3aed]">*</span>
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
                          ? "border-[#7c3aed] bg-[#7c3aed]/15 text-white shadow-[0_0_0_1px_rgba(124,58,237,0.5)]"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:bg-white/8 hover:text-white/85",
                        errors.detailLevel && !selected && "border-red-500/30"
                      )}
                    >
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#7c3aed]">
                          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                      {o.label}
                      <span className="block text-[11px] text-white/40 font-normal mt-0.5">{o.subtitle}</span>
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
              <Label className="text-white/90">
                How do you want to build this?
                <span className="ml-1 text-[#7c3aed]">*</span>
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
                          ? "border-[#7c3aed] bg-[#7c3aed]/15 text-white shadow-[0_0_0_1px_rgba(124,58,237,0.5)]"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:bg-white/8 hover:text-white/85",
                        errors.buildStyle && !selected && "border-red-500/30"
                      )}
                    >
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#7c3aed]">
                          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
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
                "relative w-full rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-150",
                "bg-[#7c3aed] shadow-[0_12px_40px_rgba(124,58,237,0.28)]",
                "hover:-translate-y-0.5 hover:bg-[#6d28d9] hover:shadow-[0_16px_48px_rgba(124,58,237,0.38)]",
                "active:translate-y-0 active:shadow-none",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
                "flex items-center justify-center gap-2"
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

            <p className="text-center text-xs text-white/30">
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
