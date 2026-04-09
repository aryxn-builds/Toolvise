"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Check,
  Loader2,
  Briefcase,
  Sparkles,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { Switch } from "@/components/ui/switch"
import type { WorkExperience, EmploymentType } from "@/lib/types"

const EMPLOYMENT_TYPES: EmploymentType[] = [
  "Full-time", "Part-time", "Internship", "Contract", "Freelance"
]

const EMPTY_FORM = {
  title: "",
  company: "",
  employment_type: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
}

function formatDateRange(start: string, end: string | null, isCurrent: boolean): string {
  const fmt = (d: string) => {
    const [year, month] = d.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  }
  return `${fmt(start)} – ${isCurrent || !end ? "Present" : fmt(end)}`
}

export default function ExperiencePage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState("")
  const [experiences, setExperiences] = useState<WorkExperience[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      if (mounted) setUserId(user.id)

      try {
        const { data } = await supabase
          .from("work_experience")
          .select("*")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false })
        if (mounted) setExperiences((data as WorkExperience[]) || [])
      } catch { /* silent */ } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [supabase, router])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(exp: WorkExperience) {
    setEditingId(exp.id)
    setForm({
      title: exp.title,
      company: exp.company,
      employment_type: exp.employment_type || "",
      start_date: exp.start_date,
      end_date: exp.end_date || "",
      is_current: exp.is_current,
      description: exp.description || "",
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.company.trim() || !form.start_date) return
    setSaving(true)
    try {
      const payload = {
        user_id: userId,
        title: form.title.trim(),
        company: form.company.trim(),
        employment_type: form.employment_type || null,
        start_date: form.start_date,
        end_date: form.is_current ? null : form.end_date || null,
        is_current: form.is_current,
        description: form.description.trim().slice(0, 500) || null,
      }

      if (editingId) {
        const { data } = await supabase
          .from("work_experience")
          .update(payload)
          .eq("id", editingId)
          .select()
          .maybeSingle()
        if (data) {
          setExperiences((prev) => prev.map((e) => e.id === editingId ? data as WorkExperience : e))
        }
      } else {
        const { data } = await supabase
          .from("work_experience")
          .insert(payload)
          .select()
          .maybeSingle()
        if (data) setExperiences((prev) => [data as WorkExperience, ...prev])
      }

      setShowForm(false)
      showToast(editingId ? "Updated!" : "Experience added!")
    } catch { /* silent */ } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return }
    try {
      await supabase.from("work_experience").delete().eq("id", id)
      setExperiences((prev) => prev.filter((e) => e.id !== id))
      showToast("Deleted.")
    } catch { /* silent */ } finally {
      setConfirmDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#0D1117] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2EA043]" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#0D1117] text-[#E6EDF3]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[rgba(240,246,252,0.10)] bg-[#161B22]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-r from-[#2EA043] to-[#1ABC9C]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight font-heading">Toolvise</span>
          </Link>
          <div className="ml-auto">
            <Link href="/settings" className="flex items-center gap-2 text-sm text-[#8B949E] hover:text-[#E6EDF3] transition-colors">
              <ArrowLeft className="h-4 w-4" /> Settings
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-8">
        {/* Breadcrumb */}
        <div>
          <p className="text-xs text-[#484F58] mb-2">
            <Link href="/settings" className="hover:text-[#8B949E]">Settings</Link>
            {" → "}
            <span className="text-[#8B949E]">Work Experience</span>
          </p>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[#E6EDF3]">Work Experience</h1>
              <p className="text-[#8B949E] text-sm mt-1">Add your professional history to your profile.</p>
            </div>
            {!showForm && (
              <Button onClick={openAdd} className="btn-primary text-sm h-9">
                <Plus className="mr-1.5 h-4 w-4" /> Add Experience
              </Button>
            )}
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl border border-[#2EA043]/30 bg-[#2EA043]/10 px-4 py-3 text-sm text-[#2EA043] shadow-lg animate-in fade-in slide-in-from-top-2">
            <Check className="h-4 w-4" /> {toast}
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="card-3d p-6 space-y-5">
            <h2 className="text-base font-semibold text-[#E6EDF3] font-heading">
              {editingId ? "Edit Experience" : "Add Experience"}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[#E6EDF3]/80 text-sm">Job Title *</Label>
                <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Software Engineer" className="input-dark" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#E6EDF3]/80 text-sm">Company *</Label>
                <Input value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                  placeholder="e.g. Acme Inc." className="input-dark" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#E6EDF3]/80 text-sm">Employment Type</Label>
                <Select value={form.employment_type} onValueChange={(v) => setForm((p) => ({ ...p, employment_type: v }))}>
                  <SelectTrigger className="input-dark"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent className="bg-[#0D1117] border-[rgba(240,246,252,0.10)] text-[#E6EDF3]">
                    {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#E6EDF3]/80 text-sm">Start Date *</Label>
                <Input type="month" value={form.start_date}
                  onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                  className="input-dark" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#E6EDF3]/80 text-sm">End Date</Label>
                <Input type="month" value={form.end_date} disabled={form.is_current}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                  className={cn("input-dark", form.is_current && "opacity-40")} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0D1117] border border-[rgba(240,246,252,0.08)]">
                <div>
                  <p className="text-sm font-medium text-[#E6EDF3]">Currently working here</p>
                </div>
                <Switch checked={form.is_current}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, is_current: v, end_date: v ? "" : p.end_date }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#E6EDF3]/80 text-sm">
                Description <span className="text-[#484F58] font-normal">({form.description.length}/500)</span>
              </Label>
              <Textarea value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value.slice(0, 500) }))}
                placeholder="What did you build, achieve, or learn?" rows={4}
                className="input-dark resize-none" />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.company.trim() || !form.start_date}
                className="btn-primary text-sm">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : <><Check className="mr-2 h-4 w-4" /> Save</>}
              </Button>
              <Button variant="outline" className="btn-ghost text-sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* List */}
        {experiences.length === 0 && !showForm ? (
          <div className="card-3d p-12 text-center">
            <Briefcase className="h-10 w-10 text-[#484F58] mx-auto mb-4" />
            <p className="text-[#E6EDF3]/60 mb-4">No work experience added yet.</p>
            <Button onClick={openAdd} className="btn-primary text-sm">Add Experience</Button>
          </div>
        ) : (
          <div className="card-3d divide-y divide-[rgba(240,246,252,0.06)]">
            {experiences.map((exp) => (
              <div key={exp.id} className="p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#0D1117] border border-[rgba(240,246,252,0.10)] flex items-center justify-center shrink-0 mt-0.5">
                  <Briefcase className="h-5 w-5 text-[#2EA043]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#E6EDF3]">{exp.title}</p>
                  <p className="text-sm text-[#8B949E]">{exp.company}
                    {exp.employment_type && <span className="text-[#484F58]"> · {exp.employment_type}</span>}
                  </p>
                  <p className="text-xs text-[#484F58] mt-0.5">
                    {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                  </p>
                  {exp.description && (
                    <p className="text-sm text-[#8B949E] mt-2 leading-relaxed line-clamp-2">{exp.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(exp)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-[#484F58] hover:text-[#E6EDF3] hover:bg-[#161B22] transition-all">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(exp.id)}
                    className={cn("h-8 w-8 flex items-center justify-center rounded-lg transition-all",
                      confirmDeleteId === exp.id ? "text-red-400 bg-red-900/20" : "text-[#484F58] hover:text-red-400")}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
