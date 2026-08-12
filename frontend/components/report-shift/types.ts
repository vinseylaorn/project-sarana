import type { WorkingShift } from "@/types"

export const KHR = 4100
export const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }

export const PIE_COLORS = ["#03624C", "#1857D8", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444"]

export const SHIFT_META: Record<string, {
   Icon: any; bg: string; text: string; border: string; bar: string; emoji: string; ring: string
}> = {
   Morning: { 
      Icon: null, bg: "bg-amber-100 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", 
      border: "border-amber-200 dark:border-amber-500/20", bar: "#f59e0b", emoji: "🌅", ring: "ring-amber-400/30" 
   },
   Afternoon: { 
      Icon: null, bg: "bg-sky-100 dark:bg-sky-500/10", text: "text-sky-600 dark:text-sky-400", 
      border: "border-sky-200 dark:border-sky-500/20", bar: "#38bdf8", emoji: "☀️", ring: "ring-sky-400/30" 
   },
   Night: { 
      Icon: null, bg: "bg-violet-100 dark:bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", 
      border: "border-violet-200 dark:border-violet-500/20", bar: "#8b5cf6", emoji: "🌙", ring: "ring-violet-400/30" 
   },
   "Full Day": { 
      Icon: null, bg: "bg-teal-100 dark:bg-teal-500/10", text: "text-teal-600 dark:text-teal-400", 
      border: "border-teal-200 dark:border-teal-500/20", bar: "#14b8a6", emoji: "📅", ring: "ring-teal-400/30" 
   },
}

export const fmt = (v?: number | null) => 
   "$" + Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const fmtKhr = (v?: number | null) => 
   "៛" + Math.round((v ?? 0) * KHR).toLocaleString("en-US")
export const fmtKhrR = (v?: number | null) => 
   "៛" + Math.round(v ?? 0).toLocaleString("en-US")

export function formatCompact(value: number): string {
   const abs = Math.abs(value)
   if (abs >= 1_000_000) {
      const n = value / 1_000_000
      return `${Number.isInteger(n) ? n : n.toFixed(1)}M`
   }
   if (abs >= 1_000) {
      const n = value / 1_000
      return `${Number.isInteger(n) ? n : n.toFixed(1)}K`
   }
   return value.toFixed(2)
}

export const fmtCompact = (v?: number | null) => "$" + formatCompact(Number(v ?? 0))

export const fmtKhrCompact = (v?: number | null) => "៛" + formatCompact(Math.round(v ?? 0))

export function formatCambodiaTime(isoString: string): { date: string; time: string } {
   if (!isoString) return { date: "-", time: "-" }
   const d = new Date(isoString)
   return {
      date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
   }
}

export function exportToCSV(data: any[], filename: string) {
   if (!data.length) return
   const headers = Object.keys(data[0])
   const rows = [headers.join(","), ...data.map(row =>
      headers.map(h => { const v = row[h]; return typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v }).join(",")
   )]
   const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" })
   const url = URL.createObjectURL(blob)
   const a = document.createElement("a"); a.href = url; a.download = filename; a.click()
   URL.revokeObjectURL(url)
}

export function computeShiftStats(shifts: WorkingShift[]) {
   return {
      openShifts: shifts.filter(s => s.shift_status === "Open").length,
      closedShifts: shifts.filter(s => s.shift_status === "Closed").length,
      openingCashUSD: shifts.reduce((s, x) => s + (x.open_amount_usd ?? 0), 0),
      openingCashKHR: shifts.reduce((s, x) => s + (x.open_amount_khr ?? 0), 0),
      closingCashUSD: shifts.reduce((s, x) => s + (x.close_amount_usd ?? 0), 0),
      closingCashKHR: shifts.reduce((s, x) => s + (x.close_amount_khr ?? 0), 0),
   }
}

export interface StaffInfo {
   id: number
   name: string
   position?: string | null
}