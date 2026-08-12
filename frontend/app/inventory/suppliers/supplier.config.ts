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
  "bg-white dark:bg-[#1e2235] border border-gray-100 dark:border-white/[0.10] rounded-lg shadow-lg"

export const SEL_I =
  "text-[14px] text-gray-800 dark:text-white/80 rounded-lg " +
  "focus:bg-[#03624C]/5 dark:focus:bg-[#1857D8]/10 dark:focus:text-[#1857D8]"

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
    blob: "bg-[#03624C]/10 dark:bg-emerald-400/10",
    gradient: "from-[#03624C] to-[#03624C]/60",
  },
  active: {
    bg: "bg-white dark:bg-[#22263a]",
    border: "border-white dark:border-[#22263a]",
    text: "text-[#1857D8] dark:text-blue-300",        
    label: "text-gray-600 dark:text-gray-200",
    icon: "text-[#1857D8] dark:text-blue-300",        
    iconBg: "bg-[#1857D8]/10 dark:bg-blue-400/20",
    blob: "bg-[#1857D8]/10 dark:bg-blue-400/10",
    gradient: "from-[#1857D8] to-[#1857D8]/40",
  },
  inactive: {
    bg: "bg-white dark:bg-[#22263a]",
    border: "border-white dark:border-[#22263a]",
    text: "text-amber-800 dark:text-amber-200",      
    label: "text-gray-600 dark:text-gray-200",
    icon: "text-amber-600 dark:text-amber-300",
    iconBg: "bg-amber-100 dark:bg-amber-400/20",
    blob: "bg-amber-200/40 dark:bg-amber-400/10",
    gradient: "from-amber-500 to-amber-400/60",
  },
  category: {
      bg:       "bg-white dark:bg-[#22263a]",
      border:   "border-white dark:border-[#22263a]",
      text:     "text-orange-700 dark:text-orange-200",
      label:    "text-gray-600 dark:text-gray-200",
      icon:     "text-orange-500 dark:text-orange-300",
      iconBg:   "bg-orange-100 dark:bg-orange-500/20",
      blob:     "bg-orange-200/40",
      gradient: "from-orange-500 to-orange-400/60",
  },
}

export function formatKhmerPhone(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, "")

  if (cleaned.startsWith("+855")) {
    const local = "0" + cleaned.slice(4).replace(/\D/g, "")
    return formatLocalKhmer(local)
  }
  if (cleaned.startsWith("855") && cleaned.length >= 11) {
    const local = "0" + cleaned.slice(3)
    return formatLocalKhmer(local)
  }

  return formatLocalKhmer(cleaned)
}

function formatLocalKhmer(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
  return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 10)}`
}

export function validateKhmerPhone(raw: string, isKh: boolean): string {
  const digits = raw.replace(/[\s+]/g, "")

  let local = digits
  if (local.startsWith("855")) local = "0" + local.slice(3)
  if (!/^0[1-9]\d{7,8}$/.test(local)) {
    return isKh
      ? "លេខទូរស័ព្ទត្រូវមាន ៩ ឬ ១០ ខ្ទង់ (ឧ. 012 345 678 ឬ 012 34 56 789)"
      : "Phone must be 9 or 10 digits (e.g. 012 345 678 or 012 34 56 789)"
  }
  return ""
}
