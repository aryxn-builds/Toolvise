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
  GraduationCap,
  Sparkles,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Education } from "@/lib/types"

const EMPTY_FORM = {
  institution: "",
  degree: "",
  field_of_study: "",
  start_year: "",
  end_year: "",
  is_current: false,
  grade: "",
}

export default function EducationPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState("")
  const [educations, setEducations] = useState<Education[]>([])
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
          .from("education")
          .select("*")
          .eq("user_id", user.id)
          .order("start_year", { ascending: false })
        if (mounted) setEducations((data as Education[]) || [])
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

  function openEdit(edu: Education) {
    setEditingId(edu.id)
    setForm({
      institution: edu.institution,
      degree: edu.degree || "",
      field_of_study: edu.field_of_study || "",
      start_year: edu.start_year?.toString() || "",
      end_year: edu.end_year?.toString() || "",
      is_current: edu.is_current,
      grade: edu.grade || "",
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.institution.trim()) return
    setSaving(true)
    try {
      const payload = {
        user_id: userId,
        institution: form.institution.trim(),
        degree: form.degree.trim() || null,
        field_of_study: form.field_of_study.trim() || null,
        start_year: form.start_year ? parseInt(form.start_year) : null,
        end_year: form.is_current ? null : (form.end_year ? parseInt(form.end_year) : null),
        is_current: form.is_current,
        grade: form.grade.trim() || null,
      }

      if (editingId) {
        const { data } = await supabase
          .from("education")
          .update(payload)
          .eq("id", editingId)
          .select()
          .maybeSingle()
        if (data) {
          setEducations((prev) => prev.map((e) => e.id === editingId ? data as Education : e))
        }
      } else {
        const { data } = await supabase
          .from("education")
          .insert(payload)
          .select()
          .maybeSingle()
        if (data) setEducations((prev) => [data as Education, ...prev])
      }

      setShowForm(false)
      showToast(editingId ? "Updated!" : "Education added!")
    } catch { /* silent */ } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return }
    try {
      await supabase.from("education").delete().eq("id", id)
      setEducations((prev) => prev.filter((e) => e.id !== id))
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
            <span className="text-[#8B949E]">Education</span>
          </p>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[#E6EDF3]">Education</h1>
              <p className="text-[#8B949E] text-sm mt-1">Add your academic background to your profile.</p>
            </div>
            {!showForm && (
              <Button onClick={openAdd} className="btn-primary text-sm h-9">
                <Plus className="mr-1.5 h-4 w-4" /> Add Education
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

        {/* Form */}
        {showForm && (
          <div className="card-3d p-6 space-y-5">
            <h2 className="text-base font-semibold text-[#E6EDF3] font-heading">
              {editingId ? "Edit Education" : "Add Education"}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[#E6EDF3]/80 text-sm">Institution *</Label>
                <Input value={form.institution} onChange={(e) => setForm((p) => ({ ...p, institution: e.target.value }))}
                  placeholder="e.g. MIT, IIT Delhi" className="input-dark" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#E6EDF3]/80 text-sm">Degree</Label>
                <Input value={form.degree} onChange={(e) => setForm((p) => ({ ...p, degree: e.target.value }))}
                  placeholder="e.g. B.Tech, BSc, MBA" className="input-dark" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#E6EDF3]/80 text-sm">Field of Study</Label>
                <Input value={form.field_of_study} onChange={(e) => setForm((p) => ({ ...p, field_of_study: e.target.value }))}
                  placeholder="e.g. Computer Science" className="input-dark" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#E6EDF3]/80 text-sm">Start Year</Label>
                <Input type="number" min={1990} max={2030} value={form.start_year}
                  onChange={(e) => setForm((p) => ({ ...p, start_year: e.target.value }))}
                  placeholder="2020" className="input-dark" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#E6EDF3]/80 text-sm">End Year</Label>
                <Input type="number" min={1990} max={2030} value={form.end_year} disabled={form.is_current}
                  onChange={(e) => setForm((p) => ({ ...p, end_year: e.target.value }))}
                  placeholder="2024" className={cn("input-dark", form.is_current && "opacity-40")} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0D1117] border border-[rgba(240,246,252,0.08)]">
                <p className="text-sm font-medium text-[#E6EDF3]">Currently studying here</p>
                <Switch checked={form.is_current}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, is_current: v, end_year: v ? "" : p.end_year }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-[#E6EDF3]/80 text-sm">Grade / GPA <span className="text-[#484F58] font-normal">(optional)</span></Label>
                <Input value={form.grade} onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))}
                  placeholder="e.g. 3.8 GPA, First Class" className="input-dark" />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving || !form.institution.trim()} className="btn-primary text-sm">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : <><Check className="mr-2 h-4 w-4" /> Save</>}
              </Button>
              <Button variant="outline" className="btn-ghost text-sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* List */}
        {educations.length === 0 && !showForm ? (
          <div className="card-3d p-12 text-center">
            <GraduationCap className="h-10 w-10 text-[#484F58] mx-auto mb-4" />
            <p className="text-[#E6EDF3]/60 mb-4">No education added yet.</p>
            <Button onClick={openAdd} className="btn-primary text-sm">Add Education</Button>
          </div>
        ) : (
          <div className="card-3d divide-y divide-[rgba(240,246,252,0.06)]">
            {educations.map((edu) => (
              <div key={edu.id} className="p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#0D1117] border border-[rgba(240,246,252,0.10)] flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="h-5 w-5 text-[#388BFD]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#E6EDF3]">{edu.institution}</p>
                  {(edu.degree || edu.field_of_study) && (
                    <p className="text-sm text-[#8B949E] mt-0.5">
                      {[edu.degree, edu.field_of_study].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {(edu.start_year || edu.end_year) && (
                    <p className="text-xs text-[#484F58] mt-0.5">
                      {edu.start_year} – {edu.is_current ? "Present" : edu.end_year || ""}
                    </p>
                  )}
                  {edu.grade && <p className="text-xs text-[#8B949E] mt-0.5">Grade: {edu.grade}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(edu)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-[#484F58] hover:text-[#E6EDF3] hover:bg-[#161B22] transition-all">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(edu.id)}
                    className={cn("h-8 w-8 flex items-center justify-center rounded-lg transition-all",
                      confirmDeleteId === edu.id ? "text-red-400 bg-red-900/20" : "text-[#484F58] hover:text-red-400")}>
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
