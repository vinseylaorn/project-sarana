import type React from "react"

export const KANTUMRUY: React.CSSProperties = {
  fontFamily: "var(--font-kantumruy), sans-serif",
}
export const SORA = KANTUMRUY

export const INPUT =
  "w-full h-9 px-3 text-[14px] rounded-lg outline-none transition-all " +
  "bg-white dark:bg-[#22263a] border border-gray-200/80 dark:border-white/[0.08] " +
  "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/20 " +
  "focus:border-[#03624C] dark:focus:border-[#1857D8] focus:ring-2 focus:ring-[#03624C]/10 " +
  "dark:focus:ring-[#1857D8]/10 shadow-sm dark:shadow-none"

export const SEL_T =
  "h-9 text-[14px] rounded-lg border border-gray-200/80 dark:border-white/[0.08] " +
  "bg-white dark:bg-[#22263a] text-gray-700 dark:text-white/70 shadow-sm dark:shadow-none"

export const SEL_C =
  "bg-white dark:bg-[#1e2235] border border-gray-100 dark:border-white/[0.10] rounded-lg shadow-xl"

export const SEL_I =
  "text-[14px] text-gray-800 dark:text-white/80 rounded-lg " +
  "focus:bg-violet-50 dark:focus:bg-violet-500/10 dark:focus:text-violet-300"

export const ACCENT = {
  text:   "text-[#03624C] dark:text-[#1857D8]",
  iconBg: "bg-[#03624C] dark:bg-[#1857D8]",
  border: "border-[#03624C]/30 dark:border-[#1857D8]/30",
}

export const CARD_STYLES = {
  total: {
    bg: "bg-white dark:bg-[#22263a]",
    border: "border-white dark:border-[#22263a]",
    text: "text-[#03624C] dark:text-emerald-300",
    label: "text-gray-600 dark:text-gray-200",
    icon: "text-[#03624C] dark:text-emerald-300",
    iconBg: "bg-[#03624C]/10 dark:bg-emerald-400/20",
  },
  category: {
    bg:     "bg-white dark:bg-[#22263a]",
    border: "border-white dark:border-[#22263a]",
    text:   "text-[#1857D8] dark:text-[#6b9fff]",
    label:  "text-gray-600 dark:text-gray-200",
    icon:   "text-[#1857D8] dark:text-[#6b9fff]",
    iconBg: "bg-[#1857D8]/10 dark:bg-[#1857D8]/20",
  },
  today: {
    bg:     "bg-white dark:bg-[#22263a]",
    border: "border-white dark:border-[#22263a]",
    text:   "text-rose-800 dark:text-rose-100",
    label:    "text-gray-600 dark:text-gray-200",
    icon:   "text-rose-600 dark:text-rose-300",
    iconBg: "bg-rose-100 dark:bg-rose-500/20",
  },
  filtered: {
    bg:     "bg-white dark:bg-[#22263a]",
    border: "border-white dark:border-[#22263a]",
    text:   "text-amber-900 dark:text-amber-100",
    label:    "text-gray-600 dark:text-gray-200",
    icon:   "text-amber-600 dark:text-amber-300",
    iconBg: "bg-amber-100 dark:bg-amber-500/20",
  },
}

export function formatDateParts(dateStr: string | null | undefined): { date: string; time: string } | null {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return {
      date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`,
      time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  } catch { return null }
}

export const UNIT_MAP: Record<string, string> = {
  "គីឡូក្រាម": "kg",
  "ក្រាម": "g",
  "លីត្រ": "l",
  "មីលីលីត្រ": "ml",
  "កំប៉ុង": "can",
  "ដប": "bottle",
  "កេស": "box",
  "កញ្ចប់": "pack",
  "ថង់": "bag",
  "pcs": "pcs",
}