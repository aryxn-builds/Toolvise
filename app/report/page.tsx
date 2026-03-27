"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Bug, Loader2, CheckCircle2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase-client"

import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ReportBugPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const bug_type = formData.get("bug_type") as string
    const page_name = formData.get("page_name") as string
    const description = formData.get("description") as string

    if (!description || !bug_type || !page_name) {
      setError("Please fill out all required fields.")
      setLoading(false)
      return
    }

    try {
      const supabase = createBrowserClient()

      const { error: dbError } = await supabase.from("bug_reports").insert({
        name: name || null,
        email: email || null,
        bug_type,
        page_name,
        description,
      })

      if (dbError) throw dbError

      setSuccess(true)
      // Reset form
      e.currentTarget.reset()
    } catch (err: unknown) {
      console.error("Bug report error:", err)
      setError("Failed to submit report. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-white bg-[radial-gradient(900px_circle_at_15%_15%,rgba(249,115,22,0.15),transparent_55%),radial-gradient(900px_circle_at_85%_20%,rgba(251,146,60,0.12),transparent_55%)] font-sans text-[#111827]/90 selection:bg-amber-500/30">
      <header className="fixed top-0 z-50 w-full border-b border-[#FFD896] bg-[#fff1d6]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
              <span className="text-lg font-bold text-[#111827]">T</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#111827]">Toolvise</span>
          </Link>
          <div className="ml-auto">
            <Link href="/" className="text-sm font-medium text-[#111827]/60 hover:text-[#111827] flex items-center gap-2 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-32 pb-24 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 mb-6">
            <Bug className="h-6 w-6 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl mb-3">
            Report a Bug 🐛
          </h1>
          <p className="text-lg text-[#111827]/60">
            Found something broken? Tell us and we'll fix it fast.
          </p>
        </div>

        <div className="rounded-2xl border border-[#FFD896] bg-white p-6 backdrop-blur-xl sm:p-8">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
              <div className="mb-4 rounded-full bg-green-500/20 p-3">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-[#111827] mb-2">Thanks! We&apos;ll look into this ASAP. 🙏</h3>
              <p className="text-[#111827]/60 mb-8 max-w-sm">
                Your report helps us make Toolvise better for everyone.
              </p>
              <Link href="/" className={buttonVariants({ className: "h-11 rounded-full bg-white text-black hover:bg-white/90 px-8 font-semibold" })}>
                Return to Home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#111827]/80">Your Name <span className="text-[#111827]/40 font-normal">(optional)</span></Label>
                  <Input id="name" name="name" placeholder="John Doe" className="h-11 bg-white border-[#FFD896] text-[#111827] placeholder:text-[#111827]/30 focus-visible:ring-amber-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#111827]/80">Email <span className="text-[#111827]/40 font-normal">(optional)</span></Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" className="h-11 bg-white border-[#FFD896] text-[#111827] placeholder:text-[#111827]/30 focus-visible:ring-amber-500" />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bug_type" className="text-[#111827]/80">Bug Type <span className="text-red-400">*</span></Label>
                  <Select name="bug_type" required>
                    <SelectTrigger className="h-11 bg-white border-[#FFD896] text-[#111827] focus:ring-amber-500">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#FFD896] text-[#111827]">
                      <SelectItem value="UI/Design Issue">UI/Design Issue</SelectItem>
                      <SelectItem value="AI Result Problem">AI Result Problem</SelectItem>
                      <SelectItem value="Page Not Loading">Page Not Loading</SelectItem>
                      <SelectItem value="Feature Not Working">Feature Not Working</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="page_name" className="text-[#111827]/80">Page Where Bug Occurred <span className="text-red-400">*</span></Label>
                  <Select name="page_name" required>
                    <SelectTrigger className="h-11 bg-white border-[#FFD896] text-[#111827] focus:ring-amber-500">
                      <SelectValue placeholder="Select page" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#FFD896] text-[#111827]">
                      <SelectItem value="Landing Page">Landing Page</SelectItem>
                      <SelectItem value="Advisor Form">Advisor Form</SelectItem>
                      <SelectItem value="Result Page">Result Page</SelectItem>
                      <SelectItem value="Explore Page">Explore Page</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[#111827]/80">Bug Description <span className="text-red-400">*</span></Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  required
                  rows={5}
                  placeholder="Describe what happened, what you expected, and steps to reproduce..." 
                  className="resize-none bg-white border-[#FFD896] text-[#111827] placeholder:text-[#111827]/30 focus-visible:ring-amber-500" 
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="h-12 w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-[#111827] font-semibold shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Bug className="mr-2 h-5 w-5" />}
                {loading ? "Submitting..." : "Submit Report 🐛"}
              </Button>
            </form>
          )}
        </div>
      </main>
      <footer className="border-t border-[#FFD896] bg-white mt-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-10 text-sm text-[#111827]/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Toolvise © 2025 • Built for builders</p>
          <div className="flex items-center gap-4">
            <Link className="transition-colors hover:text-[#111827]" href="/">
              Home
            </Link>
            <Link className="transition-colors hover:text-[#111827]" href="/explore">
              Explore
            </Link>
            <Link className="transition-colors hover:text-[#111827]" href="/about">
              About
            </Link>
            <Link className="transition-colors hover:text-[#111827] flex items-center gap-1" href="/report">
              Report a Bug 🐛
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
