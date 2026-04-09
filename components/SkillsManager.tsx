"use client"

import React, { useState, useEffect, useRef } from "react"
import { Check, Plus, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import type { Skill } from "@/lib/types"

interface Props {
  userId: string
  initialSkills: Skill[]
}

export function SkillsManager({ userId, initialSkills }: Props) {
  const supabase = createClient()
  const [skills, setSkills] = useState<Skill[]>(initialSkills)
  const [input, setInput] = useState("")
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Clear notice after 2.5s
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 2500)
    return () => clearTimeout(t)
  }, [notice])

  async function handleAdd() {
    const name = input.trim().slice(0, 40)
    if (!name || adding) return
    if (skills.length >= 30) { setNotice("Maximum 30 skills"); return }
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setNotice("Already added")
      return
    }

    setAdding(true)
    try {
      const { data, error } = await supabase
        .from("skills")
        .insert({ user_id: userId, name })
        .select()
        .maybeSingle()

      if (error) {
        if (error.code === "23505") { setNotice("Already added"); return }
        return
      }
      if (data) {
        setSkills((prev) => [...prev, data as Skill])
        setInput("")
      }
    } catch {
      // silent
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(skillId: string) {
    setSkills((prev) => prev.filter((s) => s.id !== skillId))
    try {
      await supabase.from("skills").delete().eq("id", skillId)
    } catch {
      // silent — already removed from UI
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); handleAdd() }
  }

  return (
    <div className="card-3d p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#8B949E] uppercase tracking-wider">Manage Skills</h3>
        <span className="text-xs text-[#484F58]">{skills.length}/30</span>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 40))}
          onKeyDown={handleKeyDown}
          placeholder="Add a skill (e.g. React, Python…)"
          className="input-dark flex-1"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !input.trim()}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
            "bg-[#2EA043]/20 border border-[#2EA043]/40 text-[#2EA043]",
            "hover:bg-[#2EA043]/30 disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          <Plus className="h-4 w-4" />
          {adding ? "Adding…" : "Add"}
        </button>
      </div>

      {/* Notice */}
      {notice && (
        <p className="text-xs text-[#F0A500] flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5" /> {notice}
        </p>
      )}

      {/* Skills chips */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <div key={skill.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0D1117] border border-[rgba(240,246,252,0.10)] text-sm text-[#E6EDF3]/80 group">
              {skill.name}
              <button
                onClick={() => handleRemove(skill.id)}
                className="ml-0.5 text-[#484F58] hover:text-red-400 transition-colors"
                aria-label={`Remove ${skill.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
