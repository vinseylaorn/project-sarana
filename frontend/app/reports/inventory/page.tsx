"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Variants } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import {
   Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts"
import { useInventoryReport } from "@/hooks/reports/use-inventory-report"
import { printInventoryReport } from "@/lib/utils/print-inventory-report"
import {
   Package, CheckCircle2, AlertTriangle,
   RefreshCw, Loader2, TrendingUp, Truck, Download, ChevronDown, FileText,
   Printer, FileSpreadsheet, Inbox, Trophy,
} from "lucide-react"

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }

const BLUE = "#1857D8"
const GREEN = "#03624C"
const AMBER = "#D97706"
const RED = "#DC2626"

const CATEGORY_STYLES = [
   { color: BLUE, opacity: 1 }, { color: GREEN, opacity: 1 },
   { color: BLUE, opacity: 0.6 }, { color: GREEN, opacity: 0.6 },
   { color: BLUE, opacity: 0.35 }, { color: GREEN, opacity: 0.35 },
   { color: BLUE, opacity: 0.2 }, { color: GREEN, opacity: 0.2 },
]

const dropdownVariants: Variants = {
   hidden: { opacity: 0, scale: 0.95, y: -8 },
   show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 28 } },
   exit: { opacity: 0, scale: 0.95, y: -6, transition: { duration: 0.15, ease: "easeIn" as const } },
}

const dropdownItemVariants: Variants = {
   hidden: { opacity: 0, x: -8 },
   show: (i: number) => ({
      opacity: 1, x: 0,
      transition: { delay: i * 0.05, duration: 0.22, ease: [0.22, 1, 0.36, 1] },
   }),
}

const staggerContainer = (stagger = 0.08): Variants => ({
   hidden: {},
   show: { transition: { staggerChildren: stagger } },
})

const scaleIn: Variants = {
   hidden: { opacity: 0, scale: 0.93, y: 10 },
   show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
}

// Panels: soft rounded cards. `cardBase` for plain divs, `panel` for shadcn <Card>
// (which ships with its own gap/padding, reset here so there is no dead space).
const cardBase =
   "border border-gray-100 dark:border-white/[0.07] rounded-2xl bg-white dark:bg-[#1a1d2e] " +
   "shadow-sm shadow-black/[0.04] dark:shadow-none"
const panel = cn(cardBase, "gap-0 py-0")

type DonutDatum = { label: string; value: number; color: string; opacity?: number }

function DonutChart({
   data, size = 120, strokeWidth = 16, centerLabel, centerValue,
}: {
   data: DonutDatum[]
   size?: number
   strokeWidth?: number
   centerLabel?: string
   centerValue?: string | number
}) {
   const total = data.reduce((s, d) => s + d.value, 0) || 1
   const radius = (size - strokeWidth) / 2
   const circumference = 2 * Math.PI * radius
   let cumulative = 0

   return (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
         <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle
               cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth}
               className="stroke-gray-100 dark:stroke-white/[0.06]"
            />
            {data.map((d) => {
               if (d.value <= 0) return null
               const pct = d.value / total
               const dash = pct * circumference
               const offset = cumulative * circumference
               cumulative += pct
               return (
                  <circle
                     key={d.label} cx={size / 2} cy={size / 2} r={radius} fill="none"
                     stroke={d.color} opacity={d.opacity ?? 1} strokeWidth={strokeWidth} strokeLinecap="round"
                     strokeDasharray={`${Math.max(0, dash - 3)} ${circumference - dash + 3}`}
                     strokeDashoffset={-offset}
                  />
               )
            })}
         </svg>
         {(centerLabel || centerValue !== undefined) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="font-mono tabular-nums text-[24px] font-bold text-gray-900 dark:text-white/90 leading-none">
                  {centerValue}
               </span>
               {centerLabel && <span className="text-[13px] text-gray-500 dark:text-white/40 mt-1">{centerLabel}</span>}
            </div>
         )}
      </div>
   )
}

function DonutLegend({ data }: { data: DonutDatum[] }) {
   const total = data.reduce((s, d) => s + d.value, 0) || 1
   return (
      <div className="flex-1 min-w-0 space-y-3">
         {data.map((d) => {
            const pct = Math.round((d.value / total) * 100)
            return (
               <div key={d.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[14px] gap-3">
                     <span className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color, opacity: d.opacity ?? 1 }} />
                        <span className="text-gray-600 dark:text-white/60 truncate">{d.label}</span>
                     </span>
                     <span className="font-mono tabular-nums text-gray-800 dark:text-white/80 shrink-0">
                        {d.value} <span className="text-gray-400 dark:text-white/30 text-[13px]">{pct}%</span>
                     </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                     <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color, opacity: d.opacity ?? 1 }} />
                  </div>
               </div>
            )
         })}
      </div>
   )
}

function SectionTitle({
   icon: Icon, color, children, right,
}: { icon: any; color: string; children: React.ReactNode; right?: React.ReactNode }) {
   return (
      <div className="flex items-center justify-between gap-3 mb-5">
         <h3 className="text-[16px] font-bold text-gray-800 dark:text-white/90 flex items-center gap-3">
            <span
               className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
               style={{ background: `linear-gradient(135deg, ${color}26, ${color}0D)`, color }}
            >
               <Icon className="w-5 h-5" />
            </span>
            {children}
         </h3>
         {right}
      </div>
   )
}

function EmptyState({ label }: { label: string }) {
   return (
      <div className="flex-1 flex flex-col items-center justify-center py-10 gap-2 text-gray-300 dark:text-white/20">
         <Inbox className="w-9 h-9" />
         <p className="text-[14px] text-gray-400 dark:text-white/30">{label}</p>
      </div>
   )
}

function RankedBars({
   rows, color, sign, max,
}: { rows: { name: string; qty: number }[]; color: string; sign: "+" | "-"; max: number }) {
   return (
      <div className="space-y-4">
         {rows.map((r, i) => (
            <div key={r.name} className="space-y-1.5">
               <div className="flex items-center justify-between gap-3 text-[14px]">
                  <span className="flex items-center gap-2.5 min-w-0">
                     <span
                        className="w-6 h-6 rounded-lg text-[12px] font-bold flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}1A`, color }}
                     >
                        {i + 1}
                     </span>
                     <span className="text-gray-700 dark:text-white/75 truncate">{r.name}</span>
                  </span>
                  <span className="font-mono tabular-nums font-semibold shrink-0" style={{ color }}>
                     {sign}{r.qty}
                  </span>
               </div>
               <div className="h-2.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                  <motion.div
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.max(4, (r.qty / max) * 100)}%` }}
                     transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.05 }}
                     className="h-full rounded-full"
                     style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
                  />
               </div>
            </div>
         ))}
      </div>
   )
}

function RingGauge({ pct, color, size = 84, strokeWidth = 14 }: { pct: number; color: string; size?: number; strokeWidth?: number }) {
   const r = (size - strokeWidth) / 2
   const c = 2 * Math.PI * r
   const dash = (Math.min(Math.max(pct, 0), 100) / 100) * c
   return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
         <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={strokeWidth} className="stroke-gray-100 dark:stroke-white/[0.06]" />
         {dash > 0 && (
            <circle
               cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
               strokeLinecap="round" strokeDasharray={`${dash} ${c - dash}`}
            />
         )}
      </svg>
   )
}

function MovementTooltip({ active, payload, label, isDark, isKh }: any) {
   if (!active || !payload?.length) return null
   const get = (k: string) => payload.find((p: any) => p.dataKey === k)?.value ?? 0
   const rows = [
      { name: isKh ? "ចូល" : "In", value: `+${get("in")}`, color: GREEN },
      { name: isKh ? "ចេញ" : "Out", value: `-${get("out")}`, color: BLUE },
   ]
   return (
      <div
         style={{
            background: isDark ? "#0f1220" : "#ffffff",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb"}`,
            borderRadius: 12,
            padding: "10px 14px",
            boxShadow: "0 12px 28px rgba(0,0,0,0.14)",
            pointerEvents: "none",
            minWidth: 130,
         }}
      >
         <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: isDark ? "rgba(255,255,255,0.6)" : "#4b5563" }}>{label}</p>
         {rows.map((r) => (
            <div key={r.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, fontSize: 15 }}>
               <span style={{ display: "flex", alignItems: "center", gap: 8, color: isDark ? "rgba(255,255,255,0.7)" : "#374151" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: r.color }} />
                  {r.name}
               </span>
               <span style={{ fontWeight: 800, color: r.color }}>{r.value}</span>
            </div>
         ))}
      </div>
   )
}

export default function InventoryReportPage() {
   const { i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"
   const noData = isKh ? "គ្មានទិន្នន័យ" : "No data"
   const { resolvedTheme } = useTheme()
   const isDark = resolvedTheme === "dark"
   const tick = isDark ? "rgba(255,255,255,0.55)" : "#4b5563"
   const surfaceBg = isDark ? "#1a1d2e" : "#ffffff"

   const [startDate, setStartDate] = useState("")
   const [endDate, setEndDate] = useState("")
   const [exportOpen, setExportOpen] = useState(false)

   const {
      loading, error, kpi, charts, lowStockItems, refetch,
   } = useInventoryReport(startDate, endDate)

   const exportCSV = () => {
      const rows = [
         ["Name", "Category", "Status", "Stock", "Min Stock", "Unit", "Supplier"],
         ...lowStockItems.map((item) => [
            item.name,
            item.category ?? "",
            item.stock === 0 ? "Out of stock" : "Low stock",
            item.stock,
            item.min_stock,
            item.unit,
            item.supplier ?? "",
         ]),
      ]
      const csv = rows.map((r) => r.map((c: any) => `"${c}"`).join(",")).join("\n")
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      setExportOpen(false)
   }

   const handlePrint = () => {
      try {
         printInventoryReport({
            items: lowStockItems,
            kpi,
            startDate,
            endDate,
            isKh,
            onDone: () => setExportOpen(false),
         })
      } catch {
         setExportOpen(false)
      }
   }

   const exportMenuItems = [
      { label: isKh ? "នាំចេញ PDF" : "Export PDF", icon: FileText, color: "text-rose-600 dark:text-rose-400", hover: "hover:bg-rose-50 dark:hover:bg-rose-500/10", fn: handlePrint },
      { label: isKh ? "នាំចេញ CSV" : "Export CSV", icon: FileSpreadsheet, color: "text-emerald-600 dark:text-emerald-400", hover: "hover:bg-emerald-50 dark:hover:bg-emerald-500/10", fn: exportCSV },
      { label: isKh ? "បោះពុម្ពរបាយការណ៍" : "Print Report", icon: Printer, color: "text-[#1857D8] dark:text-[#1857D8]", hover: "hover:bg-blue-50 dark:hover:bg-[#1857D8]/10", fn: handlePrint },
   ]

   const stockStatusData: DonutDatum[] = [
      { label: isKh ? "ស្តុកល្អ" : "Good", value: kpi.goodStock, color: GREEN },
      { label: isKh ? "ជិតអស់" : "Low", value: kpi.lowStock, color: AMBER },
      { label: isKh ? "អស់ស្តុក" : "Out", value: kpi.outStock, color: RED },
   ]

   const categoryData: DonutDatum[] = charts.stockByCategory.map((c, i) => ({
      label: c.name, value: c.stock, ...CATEGORY_STYLES[i % CATEGORY_STYLES.length],
   }))

   const maxTopQty = Math.max(1, ...charts.topRestocked.map((r) => r.qty), ...charts.topConsumed.map((r) => r.qty))
   const pctNum = (v: number) => (kpi.totalProducts > 0 ? Math.round((v / kpi.totalProducts) * 100) : 0)

   const totalIn = kpi.totalIn ?? 0
   const totalOut = kpi.totalOut ?? 0
   const totalSpoilage = kpi.totalSpoilage ?? 0
   const moveTotal = totalIn + totalOut + totalSpoilage
   const movePct = (v: number) => (moveTotal > 0 ? Math.round((v / moveTotal) * 100) : 0)

   const kpiCards: { key: string; label: string; value: string; visual: React.ReactNode; footer: React.ReactNode }[] = [
      {
         key: "total",
         label: isKh ? "ផលិតផលសរុប" : "Total Products",
         value: kpi.totalProducts.toLocaleString("en-US"),
         visual: <DonutChart data={stockStatusData} size={84} strokeWidth={14} />,
         footer: (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
               {stockStatusData.map((d) => (
                  <span key={d.label} className="flex items-center gap-1.5">
                     <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                     {d.label} <b className="text-gray-900 dark:text-white">{d.value}</b>
                  </span>
               ))}
            </div>
         ),
      },
      {
         key: "in",
         label: isKh ? "ចូលសរុប" : "Total Stock-In",
         value: `+${totalIn.toLocaleString("en-US")}`,
         visual: <RingGauge pct={movePct(totalIn)} color={GREEN} />,
         footer: <><b style={{ color: GREEN }}>{movePct(totalIn)}%</b> {isKh ? "នៃចលនាស្តុកទាំងអស់" : "of total movement"}</>,
      },
      {
         key: "out",
         label: isKh ? "ចេញសរុប" : "Total Stock-Out",
         value: `-${totalOut.toLocaleString("en-US")}`,
         visual: <RingGauge pct={movePct(totalOut)} color={BLUE} />,
         footer: <><b style={{ color: BLUE }}>{movePct(totalOut)}%</b> {isKh ? "នៃចលនាស្តុកទាំងអស់" : "of total movement"}</>,
      },
      {
         key: "spoilage",
         label: isKh ? "ខូចខាតសរុប" : "Total Spoilage",
         value: `-${totalSpoilage.toLocaleString("en-US")}`,
         visual: <RingGauge pct={movePct(totalSpoilage)} color={RED} />,
         footer: <><b style={{ color: RED }}>{movePct(totalSpoilage)}%</b> {isKh ? "នៃចលនាស្តុកទាំងអស់" : "of total movement"}</>,
      },
   ]

   const sumIn = charts.movementTrend.reduce((s, m) => s + m.in, 0)
   const sumOut = charts.movementTrend.reduce((s, m) => s + m.out, 0)
   const net = sumIn - sumOut

   return (
      <div className="flex h-screen bg-gray-50 dark:bg-[#13151f] overflow-hidden text-gray-900 dark:text-slate-100" style={SORA}>
         <Sidebar />
         <div className="flex-1 flex flex-col overflow-hidden">
            <Header
               title={isKh ? "របាយការណ៍ស្តុកទំនិញ" : "Inventory Report"}
               subtitle={isKh ? "តាមដានចលនា និងកម្រិតស្តុក" : "Track stock levels and movement"}
            />
            <main className="flex-1 overflow-auto p-5 lg:p-6 space-y-5">

               {/* Toolbar (same style as Overview report) */}
               <motion.div
                  initial={{ opacity: 0, y: -14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 24 }}
                  className="flex items-center gap-3 w-full relative overflow-visible z-30"
               >
                  <div className="flex items-center gap-2 flex-wrap">
                     <DateRangePicker
                        startDate={startDate} endDate={endDate}
                        onStartChange={setStartDate} onEndChange={setEndDate}
                     />
                     <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                        onClick={refetch}
                        disabled={loading}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.06] text-gray-500 dark:text-white/40 hover:text-[#03624C] hover:border-[#03624C]/40 transition-all disabled:opacity-50"
                     >
                        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                     </motion.button>
                  </div>

                  <div className="relative ml-auto self-start">
                     <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        onClick={() => setExportOpen((v) => !v)}
                        className="h-9 px-4 flex items-center gap-4 rounded-lg bg-[#03624C] hover:bg-emerald-700 text-white text-[14px] font-bold uppercase tracking-widest transition-colors shadow-lg shadow-emerald-600/20"
                     >
                        <Download className="w-3.5 h-3.5" />
                        {isKh ? "នាំចេញ" : "Export"}
                        <motion.span
                           animate={{ rotate: exportOpen ? 180 : 0 }}
                           transition={{ type: "spring", stiffness: 300, damping: 22 }}
                        >
                           <ChevronDown className="w-3 h-3" />
                        </motion.span>
                     </motion.button>
                     <AnimatePresence>
                        {exportOpen && (
                           <motion.div
                              variants={dropdownVariants} initial="hidden" animate="show" exit="exit"
                              className="min-w-full w-max absolute right-0 top-[calc(100%+6px)] bg-white dark:bg-[#22263a] border border-gray-100 dark:border-white/[0.12] rounded-lg shadow-lg z-50 overflow-hidden py-1"
                              style={{ ...SORA, pointerEvents: "auto" }}
                           >
                              {exportMenuItems.map((item, i) => (
                                 <motion.button
                                    key={item.label}
                                    custom={i} variants={dropdownItemVariants} initial="hidden" animate="show"
                                    whileHover={{ x: 4, transition: { type: "spring", stiffness: 400, damping: 20 } }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={item.fn}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-semibold whitespace-nowrap ${item.color} ${item.hover} transition-colors`}
                                 >
                                    <item.icon className="w-3.5 h-3.5" />
                                    {item.label}
                                 </motion.button>
                              ))}
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               </motion.div>

               {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                     <Loader2 className="w-7 h-7 animate-spin" style={{ color: GREEN }} />
                     <span className="text-[14px] text-gray-400 dark:text-white/30 animate-pulse">
                        {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
                     </span>
                  </div>
               ) : error ? (
                  <div className="px-5 py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-[14px] font-semibold text-red-700 dark:text-red-300">
                     {error}
                  </div>
               ) : (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-5">

                     {/* KPI cards */}
                     <motion.div
                        variants={staggerContainer(0.06)} initial="hidden" animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" >
                        {kpiCards.map((c) => (
                           <motion.div key={c.key} variants={scaleIn}>
                              <div className="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#1a1d2e] dark:shadow-none">
                                 <div className="flex items-start justify-between gap-4">
                                    <div>
                                       <p className="text-[14px] font-bold uppercase tracking-wider text-gray-900 dark:text-white/80">{c.label}</p>
                                       <p className="mt-4 text-[34px] font-black leading-none tabular-nums text-gray-900 dark:text-white">{c.value}</p>
                                    </div>
                                    <div className="flex h-[84px] items-center">{c.visual}</div>
                                 </div>
                                 <div className="mt-4 text-[15px] text-gray-500 dark:text-white/45">{c.footer}</div>
                              </div>
                           </motion.div>
                        ))}
                     </motion.div>

                     {/* Movement chart + Stock status */}
                     <div className="grid lg:grid-cols-3 gap-5 items-stretch">
                        <Card className={cn(panel, "lg:col-span-2")}>
                           <CardContent className="p-6 h-full flex flex-col">
                              <SectionTitle
                                 icon={TrendingUp} color={BLUE}
                                 right={
                                    <div className="flex items-center gap-4 text-[14px]">
                                       <span className="flex items-center gap-1.5 text-gray-500 dark:text-white/45">
                                          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: GREEN }} />{isKh ? "ចូល" : "In"}
                                       </span>
                                       <span className="flex items-center gap-1.5 text-gray-500 dark:text-white/45">
                                          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: BLUE }} />{isKh ? "ចេញ" : "Out"}
                                       </span>
                                    </div>
                                 }
                              >
                                 {isKh ? "ចលនាស្តុក ៧ ថ្ងៃ" : "7-Day Movement"}
                              </SectionTitle>

                              {charts.movementTrend.length > 0 ? (
                                 <>
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                       <div className="rounded-xl px-4 py-3 bg-gradient-to-br from-[#03624C]/15 to-[#03624C]/5">
                                          <p className="text-[13px] text-[#03624C]/80 dark:text-white/50">{isKh ? "ចូលសរុប" : "Total In"}</p>
                                          <p className="font-mono tabular-nums text-[20px] font-bold mt-0.5" style={{ color: GREEN }}>+{sumIn}</p>
                                       </div>
                                       <div className="rounded-xl px-4 py-3 bg-gradient-to-br from-[#1857D8]/15 to-[#1857D8]/5">
                                          <p className="text-[13px] text-[#1857D8]/80 dark:text-white/50">{isKh ? "ចេញសរុប" : "Total Out"}</p>
                                          <p className="font-mono tabular-nums text-[20px] font-bold mt-0.5" style={{ color: BLUE }}>-{sumOut}</p>
                                       </div>
                                       <div className="rounded-xl px-4 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.05]">
                                          <p className="text-[13px] text-gray-500 dark:text-white/40">{isKh ? "សុទ្ធ" : "Net"}</p>
                                          <p className="font-mono tabular-nums text-[20px] font-bold mt-0.5 text-gray-900 dark:text-white">
                                             {net > 0 ? "+" : ""}{net}
                                          </p>
                                       </div>
                                    </div>

                                    <div className="relative min-h-[260px] flex-1">
                                       <div className="absolute inset-0">
                                          <ResponsiveContainer width="100%" height="100%">
                                             <AreaChart data={charts.movementTrend} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                                                <defs>
                                                   <linearGradient id="mvIn" x1="0" y1="0" x2="0" y2="1">
                                                      <stop offset="0%" stopColor={GREEN} stopOpacity={0.35} />
                                                      <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
                                                   </linearGradient>
                                                   <linearGradient id="mvOut" x1="0" y1="0" x2="0" y2="1">
                                                      <stop offset="0%" stopColor={BLUE} stopOpacity={0.3} />
                                                      <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
                                                   </linearGradient>
                                                </defs>
                                                <CartesianGrid vertical={false} stroke={isDark ? "#ffffff" : "#000000"} strokeOpacity={0.07} />
                                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: tick, fontSize: 14, fontWeight: 600 }} dy={8} />
                                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: tick, fontSize: 14 }} width={44} />
                                                <Tooltip
                                                   cursor={{ stroke: isDark ? "#ffffff" : "#000000", strokeOpacity: 0.12 }}
                                                   content={(p) => <MovementTooltip {...p} isDark={isDark} isKh={isKh} />}
                                                />
                                                <Area
                                                   type="monotone" dataKey="in" stroke={GREEN} strokeWidth={3}
                                                   fill="url(#mvIn)" animationDuration={900}
                                                   dot={{ r: 4, fill: surfaceBg, stroke: GREEN, strokeWidth: 2.5 }}
                                                   activeDot={{ r: 7, fill: GREEN, stroke: surfaceBg, strokeWidth: 3 }}
                                                />
                                                <Area
                                                   type="monotone" dataKey="out" stroke={BLUE} strokeWidth={3}
                                                   fill="url(#mvOut)" animationDuration={900}
                                                   dot={{ r: 4, fill: surfaceBg, stroke: BLUE, strokeWidth: 2.5 }}
                                                   activeDot={{ r: 7, fill: BLUE, stroke: surfaceBg, strokeWidth: 3 }}
                                                />
                                             </AreaChart>
                                          </ResponsiveContainer>
                                       </div>
                                    </div>
                                 </>
                              ) : (
                                 <EmptyState label={noData} />
                              )}
                           </CardContent>
                        </Card>

                        <Card className={panel}>
                           <CardContent className="p-6 h-full flex flex-col">
                              <SectionTitle icon={CheckCircle2} color={GREEN}>{isKh ? "ស្ថានភាពស្តុក" : "Stock Status"}</SectionTitle>
                              {kpi.totalProducts > 0 ? (
                                 <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                    <DonutChart
                                       data={stockStatusData}
                                       size={160}
                                       strokeWidth={20}
                                       centerValue={kpi.totalProducts}
                                       centerLabel={isKh ? "ផលិតផល" : "products"}
                                    />
                                    <div className="w-full">
                                       <DonutLegend data={stockStatusData} />
                                    </div>
                                 </div>
                              ) : (
                                 <EmptyState label={noData} />
                              )}
                           </CardContent>
                        </Card>
                     </div>

                     {/* Category + Top lists */}
                     <div className="grid lg:grid-cols-3 gap-5">
                        <Card className={panel}>
                           <CardContent className="p-6 h-full flex flex-col">
                              <SectionTitle icon={Package} color={BLUE}>{isKh ? "ស្តុកតាមប្រភេទ" : "Stock by Category"}</SectionTitle>
                              {categoryData.length > 0 ? (
                                 <div className="flex-1 flex items-center gap-5">
                                    <DonutChart
                                       data={categoryData}
                                       size={124}
                                       strokeWidth={17}
                                       centerValue={categoryData.reduce((s, d) => s + d.value, 0)}
                                       centerLabel={isKh ? "ស្តុករួម" : "total"}
                                    />
                                    <DonutLegend data={categoryData} />
                                 </div>
                              ) : (
                                 <EmptyState label={noData} />
                              )}
                           </CardContent>
                        </Card>

                        <Card className={panel}>
                           <CardContent className="p-6 h-full flex flex-col">
                              <SectionTitle icon={Trophy} color={GREEN}>{isKh ? "បន្ថែមស្តុកច្រើនជាងគេ" : "Most Restocked"}</SectionTitle>
                              {charts.topRestocked.length > 0
                                 ? <RankedBars rows={charts.topRestocked} color={GREEN} sign="+" max={maxTopQty} />
                                 : <EmptyState label={noData} />}
                           </CardContent>
                        </Card>

                        <Card className={panel}>
                           <CardContent className="p-6 h-full flex flex-col">
                              <SectionTitle icon={Trophy} color={BLUE}>{isKh ? "ប្រើប្រាស់ស្តុកច្រើនជាងគេ" : "Most Consumed"}</SectionTitle>
                              {charts.topConsumed.length > 0
                                 ? <RankedBars rows={charts.topConsumed} color={BLUE} sign="-" max={maxTopQty} />
                                 : <EmptyState label={noData} />}
                           </CardContent>
                        </Card>
                     </div>

                     {/* Low stock table */}
                     <Card className={panel}>
                        <CardContent className="p-6">
                           <SectionTitle
                              icon={AlertTriangle} color={AMBER}
                              right={
                                 <span
                                    className="px-3 py-1 rounded-full text-[14px] font-semibold"
                                    style={{ backgroundColor: `${AMBER}1A`, color: AMBER }}
                                 >
                                    {lowStockItems.length} {isKh ? "ធាតុ" : "items"}
                                 </span>
                              }
                           >
                              {isKh ? "ផលិតផលស្តុកជិតអស់ / អស់" : "Low & Out of Stock Items"}
                           </SectionTitle>
                           <div className="overflow-x-auto -mx-2">
                              <table className="w-full text-[14px] border-separate border-spacing-0 min-w-[720px]">
                                 <thead>
                                    <tr className="text-left text-[13px] uppercase tracking-wider text-gray-500 dark:text-white/40 bg-gray-50/80 dark:bg-white/[0.03]">
                                       <th className="py-3 px-3 font-bold rounded-l-lg">{isKh ? "ឈ្មោះ" : "Item"}</th>
                                       <th className="py-3 px-3 font-bold">{isKh ? "ប្រភេទ" : "Category"}</th>
                                       <th className="py-3 px-3 font-bold">{isKh ? "ស្ថានភាព" : "Status"}</th>
                                       <th className="py-3 px-3 font-bold w-52">{isKh ? "កម្រិតស្តុក" : "Stock Level"}</th>
                                       <th className="py-3 px-3 font-bold text-right">{isKh ? "ត្រូវបន្ថែម" : "Need"}</th>
                                       <th className="py-3 px-3 font-bold rounded-r-lg">{isKh ? "អ្នកផ្គត់ផ្គង់" : "Supplier"}</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {lowStockItems.map((item) => {
                                       const out = item.stock === 0
                                       const color = out ? RED : AMBER
                                       const pct = item.min_stock > 0 ? Math.min(100, (item.stock / item.min_stock) * 100) : 0
                                       const need = Math.max(0, item.min_stock - item.stock)
                                       return (
                                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                                             <td className="py-3.5 px-3 font-semibold text-gray-800 dark:text-white/85 border-b border-gray-50 dark:border-white/[0.04]">{item.name}</td>
                                             <td className="py-3.5 px-3 text-gray-500 dark:text-white/45 border-b border-gray-50 dark:border-white/[0.04]">{item.category ?? "—"}</td>
                                             <td className="py-3.5 px-3 border-b border-gray-50 dark:border-white/[0.04]">
                                                <span
                                                   className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold"
                                                   style={out ? { backgroundColor: color, color: "#fff" } : { backgroundColor: `${color}1A`, color }}
                                                >
                                                   <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: out ? "#fff" : color }} />
                                                   {out ? (isKh ? "អស់ស្តុក" : "Out of stock") : (isKh ? "ជិតអស់" : "Low stock")}
                                                </span>
                                             </td>
                                             <td className="py-3.5 px-3 border-b border-gray-50 dark:border-white/[0.04]">
                                                <div className="space-y-1.5">
                                                   <div className="flex items-baseline justify-between font-mono tabular-nums text-[13px]">
                                                      <span className="font-bold" style={{ color }}>{item.stock}</span>
                                                      <span className="text-gray-400 dark:text-white/30">/ {item.min_stock} {item.unit}</span>
                                                   </div>
                                                   <div className="h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                                                      <div
                                                         className="h-full rounded-full"
                                                         style={{ width: `${Math.max(pct, out ? 0 : 4)}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }}
                                                      />
                                                   </div>
                                                </div>
                                             </td>
                                             <td className="py-3.5 px-3 text-right font-mono tabular-nums font-semibold text-gray-700 dark:text-white/70 border-b border-gray-50 dark:border-white/[0.04]">
                                                +{need} <span className="text-[13px] font-normal text-gray-400 dark:text-white/30">{item.unit}</span>
                                             </td>
                                             <td className="py-3.5 px-3 text-gray-500 dark:text-white/45 border-b border-gray-50 dark:border-white/[0.04]">
                                                {item.supplier ? (
                                                   <span className="inline-flex items-center gap-1.5"><Truck className="w-4 h-4" />{item.supplier}</span>
                                                ) : "—"}
                                             </td>
                                          </tr>
                                       )
                                    })}
                                    {lowStockItems.length === 0 && (
                                       <tr>
                                          <td colSpan={6} className="py-12 text-center">
                                             <div className="flex flex-col items-center gap-2 text-[#03624C]">
                                                <CheckCircle2 className="w-9 h-9" />
                                                <span className="text-[14px] text-gray-500 dark:text-white/40">
                                                   {isKh ? "ស្តុកទាំងអស់នៅកម្រិតល្អ" : "All items are well stocked"}
                                                </span>
                                             </div>
                                          </td>
                                       </tr>
                                    )}
                                 </tbody>
                              </table>
                           </div>
                        </CardContent>
                     </Card>
                  </motion.div>
               )}
            </main>
         </div>
      </div>
   )
}