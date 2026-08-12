"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { SORA, getAccent } from "./Discount.config"

interface Option {
  id:      string
  label:   string
  image?:  string | null
}

interface MultiSelectDialogProps {
  open:      boolean
  onClose:   () => void
  options:   Option[]
  selected:  string[]
  onConfirm: (ids: string[]) => void
  title:     string
  isKh:      boolean
}

export function MultiSelectDialog({
  open, onClose, options, selected, onConfirm, title, isKh,
}: MultiSelectDialogProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = !mounted || resolvedTheme === "dark"
  const accent = getAccent(isDark)

  const [search,  setSearch]  = useState("")
  const [checked, setChecked] = useState<string[]>([])

  useEffect(() => {
    if (open) { setChecked(selected); setSearch("") }
  }, [open, selected])

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id: string) =>
    setChecked(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const toggleAll = () =>
    setChecked(checked.length === filtered.length ? [] : filtered.map(o => o.id))

  const allChecked = filtered.length > 0 && checked.length === filtered.length
  const someChecked = checked.length > 0 && !allChecked

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
        style={SORA} >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-[420px] bg-white dark:bg-[#1e2235] rounded-lg shadow-2xl border border-gray-100 dark:border-white/[0.08] overflow-hidden flex flex-col max-h-[75vh]" >
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] flex items-center justify-between shrink-0">
            <div>
              <p className="text-[15px]  text-gray-800 dark:text-white/90">{title}</p>
              <p className="text-[12px] text-gray-400 dark:text-white/30 mt-0.5">
                {isKh ? `បានជ្រើស ${checked.length}` : `${checked.length} selected`}
              </p>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all">
              <X className="w-3.5 h-3.5 text-gray-500 dark:text-white/40" />
            </button>
          </div>
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.07] shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                autoFocus
                className="w-full h-9 pl-9 pr-3 text-[13px] rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.04] text-gray-800 dark:text-white placeholder:text-gray-400 outline-none transition-all"
                placeholder={isKh ? "ស្វែងរក..." : "Search..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}15` }}
                onBlur={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = "" }}
              />
            </div>
          </div>

          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.07] shrink-0">
            <button
              onClick={toggleAll}
              className="flex items-center gap-2.5 w-full hover:bg-gray-50 dark:hover:bg-white/[0.03] rounded-lg px-1 py-1 transition-all" >
              <div
                className="w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all shrink-0"
                style={
                  allChecked
                    ? { background: accent, borderColor: accent }
                    : someChecked
                    ? { background: `${accent}25`, borderColor: `${accent}70` }
                    : undefined
                } >
                {allChecked && (
                  <svg viewBox="0 0 10 8" className="w-2.5 h-2.5">
                    <path d="M1 4l3 3 5-6" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {someChecked && <div className="w-2 h-0.5 rounded" style={{ background: accent }} />}
              </div>
              <span className="text-[13px]  text-gray-600 dark:text-white/60">
                {isKh ? "ជ្រើសទាំងអស់" : "Select All"} ({filtered.length})
              </span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-gray-400 dark:text-white/25">
                {isKh ? "រកមិនឃើញ" : "No results found"}
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map(o => {
                  const isChecked = checked.includes(o.id)
                  return (
                    <button
                      key={o.id}
                      onClick={() => toggle(o.id)}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border transition-all text-left",
                        isChecked
                          ? "bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.10]"
                          : "bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:border-gray-100 dark:hover:border-white/[0.06]"
                      )} >
                      <div
                        className="w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all shrink-0"
                        style={isChecked ? { background: accent, borderColor: accent } : undefined} >
                        {isChecked && (
                          <svg viewBox="0 0 10 8" className="w-2.5 h-2.5">
                            <path d="M1 4l3 3 5-6" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      {o.image !== undefined && (
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/[0.05] shrink-0">
                          <img src={o.image ?? "/placeholder.svg"} alt={o.label} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <span
                        className="text-[13px] font-semibold flex-1 truncate text-gray-700 dark:text-white/70"
                        style={isChecked ? { color: accent } : undefined} >
                        {o.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] flex items-center justify-between shrink-0">
            <button onClick={() => setChecked([])} className="text-[14px]  text-rose-400 hover:text-rose-500 transition-colors">
              {isKh ? "លុបការជ្រើស" : "Clear all"}
            </button>
            <div className="flex gap-2">
              <button onClick={onClose} className="h-8 px-4 rounded-lg text-[14px]  border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all">
                {isKh ? "បោះបង់" : "Cancel"}
              </button>
              <button
                onClick={() => { onConfirm(checked); onClose() }}
                className="h-8 px-4 rounded-lg text-[14px]  text-white flex items-center gap-1.5 transition-all active:scale-[0.97]"
                style={{ background: accent, boxShadow: `0 4px 14px ${accent}30` }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.88" }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1" }} >
                <Sparkles className="w-3 h-3" />
                {isKh ? `យល់ព្រម (${checked.length})` : `Confirm (${checked.length})`}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}