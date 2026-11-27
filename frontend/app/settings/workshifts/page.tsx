"use client"

import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { DataTableCustom } from "@/components/ui/table"
import {
   Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import {
   Search, Eye, Trash2, Loader2, RotateCcw, Clock, Filter, RefreshCw,
   Timer, CalendarDays, ShoppingBag, TrendingUp, CheckCircle2, AlertCircle, AlertTriangle, Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { WorkingShift } from "@/types"
import { usePermission } from "@/lib/role-context"
import { toastSuccess, toastError } from "@/lib/toast"
import { getAvatarUrl } from "@/lib/avatar"
import { useWorkingShiftsList, useWorkingShiftsSummary, useWorkingShiftsMutations } from "@/hooks/settings/use-working-shifts"

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }

const ACCENT = {
   text: "text-[#03624C] dark:text-[#4dab8e]",
   iconBg: "bg-[#03624C] dark:bg-[#4dab8e]",
   subtle: "bg-[#03624C]/[0.08] dark:bg-[#03624C]/[0.15]",
   subtleBorder: "border-[#03624C]/20 dark:border-[#03624C]/25",
   gradient: "from-[#03624C] to-[#03624C]/60",
   lbl: "text-[#03624C]/70 dark:text-[#4dab8e]/70",
   ibg: "bg-[#03624C]/10 dark:bg-[#03624C]/20",
   blob: "bg-[#03624C]/10",
}

const SEL_C = "bg-white dark:bg-[#22263a] border-gray-100 dark:border-white/[0.12] rounded-xl"
const SEL_I = "text-[14px] text-gray-800 dark:text-white/80 focus:bg-[#03624C]/10 dark:focus:bg-[#4dab8e]/10 dark:focus:text-[#4dab8e]"

const INPUT =
   "w-full h-9 px-3 text-[14px] rounded-xl outline-none transition-all " +
   "bg-white dark:bg-[#22263a] border border-gray-200/80 dark:border-white/[0.08] " +
   "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/20 " +
   "focus:border-[#03624C] dark:focus:border-[#4dab8e] focus:ring-2 focus:ring-[#03624C]/10 " +
   "dark:focus:ring-[#4dab8e]/10 shadow-sm dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"

// Only used to DISPLAY the KHR line when the backend sends no KHR value.
// It is NOT used for variance any more.
const KHR_RATE = 4100

const fmt_usd = (v: number) =>
   "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt_khr = (v: number) =>
   "៛" + Math.round(v).toLocaleString("en-US")

/**
 * Variance now comes from the POS.
 * When a shift is closed in the POS, the backend saves:
 *   expected_cash_usd   = open cash + CASH-only revenue (rate from System Settings)
 *   cash_difference_usd = actual close cash - expected
 * We only read those values, so this page always matches the POS close-shift screen.
 *
 * Returns null when the shift is open, or was closed before the POS saved these values
 * (we do NOT guess, because a guessed number would be wrong).
 */
const getVariance = (s: WorkingShift) => {
   if (s.shift_status !== "Closed") return null
   const a = s as any
   if (a.expected_cash_usd == null || a.cash_difference_usd == null) return null

   const expected = Number(a.expected_cash_usd)

   // Expected cash can never be 0 when the drawer was opened with money in it
   // (expected = opening float + cash sales). A 0 means the backend did not save
   // the reconciliation (column default), so show "—" instead of a fake "Balanced".
   const hadOpeningCash = (Number(s.open_amount_usd) || 0) > 0 || (Number(s.open_amount_khr) || 0) > 0
   if (expected <= 0 && hadOpeningCash) return null

   const diff = Math.round(Number(a.cash_difference_usd) * 100) / 100
   const actual = Math.round((expected + diff) * 100) / 100
   return { expected, actual, diff }
}

function VarianceBadge({ item, isKh }: { item: WorkingShift; isKh: boolean }) {
   const v = getVariance(item)
   if (!v) {
      return (
         <span
            className="text-[14px] text-gray-300 dark:text-white/20"
            title={item.shift_status === "Closed"
               ? (isKh ? "គ្មានទិន្នន័យផ្ទៀងផ្ទាត់ (បិទមុនមានមុខងារនេះ)" : "No reconciliation data (closed before this feature)")
               : undefined}
         >—</span>
      )
   }

   const isShort = v.diff < 0
   const isOver = v.diff > 0
   return (
      <div className={cn(
         "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold border",
         isShort && "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30",
         isOver && "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30",
         !isShort && !isOver && "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
      )}>
         {isShort || isOver ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
         {isShort
            ? `${isKh ? "ខ្វះ" : "Short"} ${fmt_usd(Math.abs(v.diff))}`
            : isOver
               ? `${isKh ? "លើស" : "Over"} ${fmt_usd(v.diff)}`
               : (isKh ? "ត្រឹមត្រូវ" : "Balanced")}
      </div>
   )
}

function AmountCell({ usd, khr }: { usd: number; khr?: number }) {
   return (
      <div className="space-y-0.5">
         <p className="text-[14px]  text-gray-700 dark:text-white/80">{fmt_usd(usd)}</p>
         <p className="text-[12px]  text-gray-600 dark:text-white/30">{fmt_khr(khr ?? usd * KHR_RATE)}</p>
      </div>
   )
}

function TimeCell({ time, color }: { time?: string | null; color: string }) {
   if (!time) return <span className="text-[14px] text-gray-300 dark:text-white/20">—</span>
   const [datePart, timePart] = (time ?? "").split(" ")
   return (
      <div className="space-y-0.5">
         <div className={cn("flex items-center gap-1 text-[14px] ", color)}>
            <CalendarDays className="w-3 h-3 shrink-0" />{datePart}
         </div>
         <p className={cn("text-[14px] ", color)}>{timePart}</p>
      </div>
   )
}

export default function WorkingShiftPage() {
   const { t, i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"
   const { can } = usePermission("staff")

   const [search, setSearch] = useState("")
   const [statusFilter, setStatusFilter] = useState("all")
   const [shiftFilter, setShiftFilter] = useState("all")
   const [varianceFilter, setVarianceFilter] = useState("all")
   const [startDate, setStartDate] = useState("")
   const [endDate, setEndDate] = useState("")
   const [currentPage, setCurrentPage] = useState(1)

   const [viewItem, setViewItem] = useState<WorkingShift | null>(null)
   const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
   const [itemToDelete, setItemToDelete] = useState<WorkingShift | null>(null)
   const itemsPerPage = 10

   const dateParams = { start_date: startDate || undefined, end_date: endDate || undefined }
   const {
      data: shifts = [],
      isLoading: shiftsLoading,
      isFetching: shiftsFetching,
      refetch: refetchShifts,
   } = useWorkingShiftsList(dateParams)
   const {
      data: summary,
      isLoading: summaryLoading,
      isFetching: summaryFetching,
      refetch: refetchSummary,
   } = useWorkingShiftsSummary(dateParams)
   const loading = shiftsLoading || summaryLoading
   const isFetching = shiftsFetching || summaryFetching
   const refreshing = isFetching
   const { remove } = useWorkingShiftsMutations()
   const deleting = remove.isPending

   const loadData = () => { refetchShifts(); refetchSummary() }

   useEffect(() => { setCurrentPage(1) }, [search, statusFilter, shiftFilter, varianceFilter, startDate, endDate])

   const confirmDelete = async () => {
      if (!itemToDelete) return
      if (itemToDelete.shift_status === "Closed") {
         toastError(
            isKh ? "លុបមិនបាន" : "Delete failed",
            isKh ? "វេនដែលបិទហើយមិនអាចលុបបានទេ" : "Closed shifts cannot be deleted"
         )
         setIsDeleteAlertOpen(false); setItemToDelete(null)
         return
      }
      try {
         await remove.mutateAsync(itemToDelete.id)
         toastSuccess(
            isKh ? "លុបបានជោគជ័យ" : "Deleted successfully",
            isKh ? `ការងារ "${itemToDelete.staff_name}" បានលុបដោយជោគជ័យ` : `Working shift "${itemToDelete.staff_name}" has been deleted successfully`
         )
      } catch (err: any) {
         toastError(isKh ? "លុបមិនបាន" : "Delete failed", err?.message)
      } finally {
         setIsDeleteAlertOpen(false); setItemToDelete(null)
      }
   }

   const hasFilter = search || statusFilter !== "all" || shiftFilter !== "all" || varianceFilter !== "all" || startDate || endDate

   const processedData = useMemo(() =>
      shifts.filter(s => {
         const matchSearch = (s.staff_name || "").toLowerCase().includes(search.toLowerCase())
         const matchStatus = statusFilter === "all" || s.shift_status === statusFilter
         const matchShift = shiftFilter === "all" || s.shift_type === shiftFilter
         let matchVariance = true
         if (varianceFilter !== "all") {
            const v = getVariance(s)
            if (!v) matchVariance = false
            else if (varianceFilter === "short") matchVariance = v.diff < 0
            else if (varianceFilter === "over") matchVariance = v.diff > 0
            else if (varianceFilter === "balanced") matchVariance = v.diff === 0
         }
         return matchSearch && matchStatus && matchShift && matchVariance
      }),
      [shifts, search, statusFilter, shiftFilter, varianceFilter]
   )

   const shortCount = useMemo(
      () => shifts.filter(s => (getVariance(s)?.diff ?? 0) < 0).length,
      [shifts]
   )
   const shortTotal = useMemo(
      () => shifts.reduce((sum, s) => {
         const d = getVariance(s)?.diff ?? 0
         return d < 0 ? sum + Math.abs(d) : sum
      }, 0),
      [shifts]
   )

   const reset = () => {
      setSearch(""); setStatusFilter("all"); setShiftFilter("all"); setVarianceFilter("all")
      setStartDate(""); setEndDate(""); setCurrentPage(1)
   }

   const columns = [
      {
         key: "no", header: isKh ? "ល.រ" : "No.",
         render: (_: any, i: number) => (
            <span className="text-[14px] text-gray-600 dark:text-white/25 tabular-nums">
               {String((currentPage - 1) * itemsPerPage + i + 1).padStart(2, "0")}
            </span>
         ),
      },
      {
         key: "staff", header: isKh ? "បុគ្គលិក" : "Staff",
         render: (item: WorkingShift) => (
            <div className="flex items-center gap-2.5 py-1">
               <Avatar className="w-8 h-8 rounded-xl border border-gray-100 dark:border-white/[0.08] shrink-0">
                  <AvatarImage src={getAvatarUrl(item.staff_image) || undefined} className="object-cover" />
                  <AvatarFallback className={cn(
                     "text-[12px] font-bold rounded-xl",
                     ACCENT.ibg, ACCENT.text,
                  )}>
                     {(item.staff_name || "?").charAt(0)}
                  </AvatarFallback>
               </Avatar>
               <div>
                  <p className="text-[14px] text-gray-800 dark:text-white/90">{item.staff_name}</p>
                  {item.staff_position && (
                     <p className="text-[12px] text-gray-600 dark:text-white/30">{item.staff_position}</p>
                  )}
               </div>
            </div>
         ),
      },
      {
         key: "open_time", header: isKh ? "ចូលការ" : "Open Shift",
         render: (item: WorkingShift) => (
            <TimeCell time={item.open_time} color="text-teal-600 dark:text-teal-400" />
         ),
      },
      {
         key: "open_amount", header: isKh ? "ទឹកប្រាក់ចូល" : "Open Amount",
         render: (item: WorkingShift) => (
            <AmountCell usd={item.open_amount_usd ?? 0} khr={item.open_amount_khr ?? 0} />
         ),
      },
      {
         key: "close_time", header: isKh ? "ចេញការ" : "Close Shift",
         render: (item: WorkingShift) => (
            item.close_time
               ? <TimeCell time={item.close_time} color="text-rose-500 dark:text-rose-400" />
               : <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] border animate-pulse",
                  "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
               )}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
                  {isKh ? "កំពុងធ្វើការ" : "On shift"}
               </span>
         ),
      },
      {
         key: "close_amount", header: isKh ? "ទឹកប្រាក់ចេញ" : "Close Amount",
         render: (item: WorkingShift) => (
            item.shift_status === "Closed"
               ? <AmountCell usd={item.close_amount_usd ?? 0} khr={item.close_amount_khr ?? 0} />
               : <span className="text-[14px] text-gray-300 dark:text-white/20">—</span>
         ),
      },
      {
         key: "variance", header: isKh ? "ខ្វះ/លើស" : "Variance",
         render: (item: WorkingShift) => <VarianceBadge item={item} isKh={isKh} />,
      },
      {
         key: "total_orders", header: isKh ? "ការបញ្ជាទិញ" : "Total Orders",
         render: (item: WorkingShift) => (
            <div className="flex items-center gap-1.5">
               <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-[14px] shrink-0",
                  (item.total_orders ?? 0) > 0
                     ? cn(ACCENT.ibg, ACCENT.text)
                     : "bg-gray-50 text-gray-300 dark:bg-white/[0.03] dark:text-white/20"
               )}>
                  {item.total_orders ?? 0}
               </div>
               <span className="text-[12px] text-gray-600 dark:text-white/30">{isKh ? "បញ្ជា" : "orders"}</span>
            </div>
         ),
      },
      {
         key: "shift_status", header: isKh ? "ស្ថានភាព" : "Status",
         render: (item: WorkingShift) => (
            <div className={cn(
               "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] border",
               item.shift_status === "Open"
                  ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                  : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
            )}>
               <div className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                  item.shift_status === "Open" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
               )} />
               {item.shift_status === "Open" ? (isKh ? "បើកហើយ" : "Open") : (isKh ? "បិទហើយ" : "Closed")}
            </div>
         ),
      },
      {
         key: "actions",
         header: isKh ? "សកម្មភាព" : "Actions",
         className: "text-right",
         render: (item: WorkingShift) => (
            <div className="flex items-center justify-end gap-1.5">
               <button
                  onClick={() => setViewItem(item)}
                  className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                  text-blue-700 bg-blue-50 border border-blue-200
                  hover:bg-blue-100 hover:border-blue-300
                  dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-700/40
                  dark:hover:bg-blue-900/40 dark:hover:border-blue-500
                  transition-all duration-150"
                  title={isKh ? "មើលលម្អិត" : "View Details"} >
                  <Eye className="w-3.5 h-3.5" />
               </button>
               {can("delete") && item.shift_status !== "Closed" && (
                  <button
                     onClick={() => { setItemToDelete(item); setIsDeleteAlertOpen(true) }}
                     className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                     text-rose-700 bg-rose-50 border border-rose-200
                     hover:bg-rose-100 hover:border-rose-300
                     dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-700/40
                     dark:hover:bg-rose-900/40 dark:hover:border-rose-500
                     transition-all duration-150"
                     title={isKh ? "លុបចោល" : "Delete"} >
                     <Trash2 className="w-3.5 h-3.5" />
                  </button>
               )}
            </div>
         ),
      },
   ]

   const showInitialLoading = loading && shifts.length === 0

   const statCards = [
      {
         label: isKh ? "វេនសរុប" : "Total Shifts",
         value: summary?.total ?? shifts.length,
         sub: isKh ? "វេន" : "shifts",
         icon: Clock,
         bg: "bg-white dark:bg-[#22263a]",
         border: "border-white dark:border-[#22263a]",
         text: "!text-[#03624C] dark:!text-[#4dab8e]",
         lbl: "text-gray-600 dark:text-gray-200",
         ibg: ACCENT.ibg,
      },
      {
         label: isKh ? "បើកហើយ" : "Open Shifts",
         value: summary?.open ?? 0,
         sub: isKh ? "វេន" : "shifts",
         icon: AlertCircle,
         bg: "bg-white dark:bg-[#22263a]",
         border: "border-white dark:border-[#22263a]",
         text: "!text-amber-700 dark:!text-amber-300",
         lbl: "text-gray-600 dark:text-gray-200",
         ibg: "bg-amber-100 dark:bg-amber-400/20",
      },
      {
         label: isKh ? "ការបញ្ជាទិញ" : "Total Orders",
         value: summary?.total_orders ?? 0,
         sub: isKh ? "លើក" : "orders",
         icon: ShoppingBag,
         bg: "bg-white dark:bg-[#22263a]",
         border: "border-white dark:border-[#22263a]",
         text: "!text-violet-700 dark:!text-violet-300",
         lbl: "text-gray-600 dark:text-gray-200",
         ibg: "bg-violet-100 dark:bg-violet-400/20",
      },
      {
         label: isKh ? "វេនខ្វះលុយ" : "Cash Shortage",
         value: shortCount,
         sub: shortCount > 0
            ? `${isKh ? "សរុបខ្វះ" : "Total short"} ${fmt_usd(shortTotal)}`
            : (isKh ? "គ្មានបញ្ហា" : "No issues"),
         icon: AlertTriangle,
         bg: "bg-white dark:bg-[#22263a]",
         border: shortCount > 0 ? "border-rose-200 dark:border-rose-500/30" : "border-white dark:border-[#22263a]",
         text: "!text-rose-700 dark:!text-rose-300",
         lbl: "text-gray-600 dark:text-gray-200",
         ibg: "bg-rose-100 dark:bg-rose-400/20",
      },
   ]

   const variance = viewItem ? getVariance(viewItem) : null

   return (
      <div className="flex h-screen bg-gray-50 dark:bg-[#13151f] overflow-hidden transition-colors duration-300" style={SORA}>
         <AnimatePresence>
            {isFetching && !loading && (
               <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed top-0 left-0 right-0 h-[2px] bg-[#03624C] dark:bg-[#4dab8e] origin-left z-[100]"
               />
            )}
         </AnimatePresence>
         <Sidebar />
         <div className="flex-1 flex flex-col overflow-hidden">
            <Header
               title={isKh ? "វេនការងារ" : "Working Shifts"}
               subtitle={isKh ? "ទិន្នន័យត្រូវបាន record ស្វ័យប្រវត្តិពី POS" : "Auto-recorded from POS open & close shift"}
            />
            {showInitialLoading ? (
               <div className="flex-1 flex items-center justify-center flex-col gap-4">
                  <Loader2 className={cn("w-5 h-5 animate-spin", ACCENT.text)} />
                  <span className={cn("text-[14px] font-bold uppercase tracking-[0.2em] animate-pulse", ACCENT.text)}>
                     {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
                  </span>
               </div>
            ) : (
               <main className="flex-1 p-5 space-y-4 overflow-hidden flex flex-col">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                     {statCards.map((s, i) => (
                        <motion.div key={s.label}
                           initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                           transition={{ duration: 0.35, delay: i * 0.07, ease: "easeOut" }}
                           whileHover={{ y: -3, transition: { duration: 0.18 } }}
                           className="flex-1 min-w-[160px]">
                           <Card className={cn("border rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40", s.bg, s.border)}>
                              <div className="p-2">
                                 <div className="flex items-center justify-between gap-3 mb-4">
                                    <p className={cn("flex items-center gap-1.5 min-w-0 text-[14px] font-bold uppercase", s.lbl)}>
                                       <span className="truncate">{s.label}</span>
                                    </p>
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", s.ibg)}>
                                       <s.icon className={cn("w-4 h-4", s.text)} />
                                    </div>
                                 </div>
                                 <p className={cn("text-[22px] font-bold text-center leading-none tabular-nums mb-2.5", s.text)}>
                                    {s.value}
                                 </p>
                                 <div className="flex items-center gap-1.5">
                                    <p className={cn("text-[14px] ", s.lbl)}>{s.sub}</p>
                                 </div>
                              </div>
                           </Card>
                        </motion.div>
                     ))}
                  </div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.28 }}
                     className="flex flex-wrap gap-2 items-center justify-between shrink-0">
                     <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 dark:text-white/25 pointer-events-none" />
                           <input className={cn(INPUT, "w-52 pl-8 rounded-lg")}
                              placeholder={isKh ? "ស្វែងរកបុគ្គលិក..." : "Search staff..."}
                              value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07] shrink-0" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                           <SelectTrigger className="h-9 text-[14px]  rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] text-gray-700 dark:text-white/70 shadow-sm w-36 flex items-center gap-1.5">
                              <Filter className={cn("w-3.5 h-3.5 shrink-0", ACCENT.text)} />
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="all" className={SEL_I}>{isKh ? "ស្ថានភាពទាំងអស់" : "All Status"}</SelectItem>
                              <SelectItem value="Open" className={SEL_I}>{isKh ? "បើកហើយ" : "Open"}</SelectItem>
                              <SelectItem value="Closed" className={SEL_I}>{isKh ? "បិទហើយ" : "Closed"}</SelectItem>
                           </SelectContent>
                        </Select>
                        <Select value={shiftFilter} onValueChange={setShiftFilter}>
                           <SelectTrigger className="h-9 text-[14px]  rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] text-gray-700 dark:text-white/70 shadow-sm w-36 flex items-center gap-1.5">
                              <Clock className={cn("w-3.5 h-3.5 shrink-0", ACCENT.text)} />
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="all" className={SEL_I}>{isKh ? "វេនទាំងអស់" : "All Shifts"}</SelectItem>
                              <SelectItem value="Morning" className={SEL_I}>{isKh ? "ព្រឹក" : "Morning"}</SelectItem>
                              <SelectItem value="Afternoon" className={SEL_I}>{isKh ? "រសៀល" : "Afternoon"}</SelectItem>
                              <SelectItem value="Night" className={SEL_I}>{isKh ? "យប់" : "Night"}</SelectItem>
                              <SelectItem value="Full Day" className={SEL_I}>{isKh ? "ពេញថ្ងៃ" : "Full Day"}</SelectItem>
                           </SelectContent>
                        </Select>
                        <Select value={varianceFilter} onValueChange={setVarianceFilter}>
                           <SelectTrigger className="h-9 text-[14px]  rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] text-gray-700 dark:text-white/70 shadow-sm w-40 flex items-center gap-1.5">
                              <Wallet className={cn("w-3.5 h-3.5 shrink-0", ACCENT.text)} />
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="all" className={SEL_I}>{isKh ? "ខ្វះ/លើស ទាំងអស់" : "All Variance"}</SelectItem>
                              <SelectItem value="short" className={SEL_I}>{isKh ? "ខ្វះលុយ" : "Cash Short"}</SelectItem>
                              <SelectItem value="over" className={SEL_I}>{isKh ? "លើសលុយ" : "Cash Over"}</SelectItem>
                              <SelectItem value="balanced" className={SEL_I}>{isKh ? "ត្រឹមត្រូវ" : "Balanced"}</SelectItem>
                           </SelectContent>
                        </Select>
                        <DateRangePicker
                           startDate={startDate} endDate={endDate}
                           onStartChange={v => { setStartDate(v); setCurrentPage(1) }}
                           onEndChange={v => { setEndDate(v); setCurrentPage(1) }}
                        />
                        <AnimatePresence>
                           {hasFilter && (
                              <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                 onClick={reset}
                                 className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all">
                                 <RotateCcw className="w-3.5 h-3.5" />
                              </motion.button>
                           )}
                        </AnimatePresence>
                        <button onClick={loadData} disabled={refreshing}
                           className={cn(
                              "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                              "border border-gray-200/80 dark:border-white/[0.08]",
                              "bg-white dark:bg-[#22263a]",
                              "text-gray-600 dark:text-white/40",
                              "hover:text-[#03624C] dark:hover:text-[#4dab8e]",
                              "hover:border-[#03624C]/40 dark:hover:border-[#4dab8e]/40",
                              "disabled:opacity-50 disabled:cursor-not-allowed",
                           )}>
                           <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
                        </button>
                     </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }}
                     className="flex-1 overflow-hidden">
                     <Card className="h-full border-0 shadow-none bg-transparent flex flex-col">
                        <DataTableCustom
                           data={processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                           columns={columns}
                           sortConfig={{ key: null, direction: "asc" }}
                           onSort={() => { }}
                           currentPage={currentPage}
                           totalPages={Math.ceil(processedData.length / itemsPerPage) || 1}
                           onPageChange={setCurrentPage}
                           itemsPerPage={itemsPerPage}
                           totalItems={processedData.length}
                           language={i18n.language as any}
                        />
                     </Card>
                  </motion.div>
               </main>
            )}
         </div>
         <Dialog open={!!viewItem} onOpenChange={v => !v && setViewItem(null)}>
            <DialogContent className="max-w-lg p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden" style={SORA}>
               <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0 bg-gray-50 dark:bg-[#22263a] rounded-t-3xl">
                  <div className="flex items-center gap-2.5">
                     <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", ACCENT.iconBg)}>
                        <Clock className="w-4 h-4 text-white" />
                     </div>
                     <div>
                        <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90">
                           {isKh ? "ព័ត៌មានលម្អិតវេនការងារ" : "Shift Record Details"}
                        </DialogTitle>
                        <DialogDescription className="text-[12px] text-gray-600 dark:text-white/30 mt-0.5">
                           {viewItem?.staff_name} — {viewItem?.date}
                        </DialogDescription>
                     </div>
                  </div>
               </DialogHeader>
               {viewItem && (
                  <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
                     <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                        <Avatar className="w-12 h-12 rounded-xl border border-gray-100 dark:border-white/[0.08]">
                           <AvatarImage src={getAvatarUrl(viewItem.staff_image) || undefined} className="object-cover" />
                           <AvatarFallback className={cn("font-bold text-lg rounded-xl", ACCENT.ibg, ACCENT.text)}>
                              {(viewItem.staff_name || "?").charAt(0)}
                           </AvatarFallback>
                        </Avatar>
                        <div>
                           <p className="text-[14px] font-bold text-gray-800 dark:text-white/90">{viewItem.staff_name}</p>
                           <p className="text-[12px] text-gray-600 dark:text-white/30">{viewItem.staff_position || "—"}</p>
                        </div>
                        <div className="ml-auto">
                           <div className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold border",
                              viewItem.shift_status === "Open"
                                 ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                 : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                           )}>
                              <div className={cn("w-2 h-2 rounded-full",
                                 viewItem.shift_status === "Open" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                              )} />
                              {viewItem.shift_status === "Open" ? (isKh ? "បើកហើយ" : "Open") : (isKh ? "បិទហើយ" : "Closed")}
                           </div>
                        </div>
                     </div>
                     <div className="rounded-xl border border-teal-100 dark:border-teal-500/20 overflow-hidden">
                        <div className="px-4 py-2 bg-teal-50 dark:bg-teal-500/10 flex items-center gap-2">
                           <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                           <span className="text-[12px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">
                              {isKh ? "ចូលការ (Open Shift)" : "Open Shift"}
                           </span>
                        </div>
                        <div className="px-4 py-3 grid grid-cols-2 gap-4">
                           <div>
                              <p className="text-[14px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/30 mb-1">{isKh ? "ថ្ងៃ & ម៉ោង" : "Date & Time"}</p>
                              <p className="text-[14px] font-bold text-gray-700 dark:text-white/80">{viewItem.open_time || "—"}</p>
                           </div>
                           <div>
                              <p className="text-[14px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/30 mb-1">{isKh ? "ទឹកប្រាក់" : "Cash Amount"}</p>
                              <p className="text-[14px] font-black text-teal-600 dark:text-teal-400 font-mono">{fmt_usd(viewItem.open_amount_usd ?? 0)}</p>
                              <p className="text-[12px] text-gray-600 dark:text-white/30 font-mono">{fmt_khr(viewItem.open_amount_khr ?? 0)}</p>
                           </div>
                        </div>
                     </div>
                     <div className={cn("rounded-xl border overflow-hidden",
                        viewItem.shift_status === "Closed" ? "border-rose-100 dark:border-rose-500/20" : "border-gray-100 dark:border-white/[0.07]"
                     )}>
                        <div className={cn("px-4 py-2 flex items-center gap-2",
                           viewItem.shift_status === "Closed" ? "bg-rose-50 dark:bg-rose-500/10" : "bg-gray-50 dark:bg-white/[0.03]"
                        )}>
                           {viewItem.shift_status === "Closed"
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
                              : <Timer className="w-3.5 h-3.5 text-gray-600 dark:text-white/30 animate-spin" />
                           }
                           <span className={cn("text-[12px] font-black uppercase tracking-widest",
                              viewItem.shift_status === "Closed" ? "text-rose-600 dark:text-rose-400" : "text-gray-600 dark:text-white/30"
                           )}>
                              {isKh ? "ចេញការ (Close Shift)" : "Close Shift"}
                           </span>
                        </div>
                        {viewItem.shift_status === "Closed" ? (
                           <div className="px-4 py-3 grid grid-cols-2 gap-4">
                              <div>
                                 <p className="text-[14px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/30 mb-1">{isKh ? "ថ្ងៃ & ម៉ោង" : "Date & Time"}</p>
                                 <p className="text-[14px] font-bold text-gray-700 dark:text-white/80">{viewItem.close_time || "—"}</p>
                              </div>
                              <div>
                                 <p className="text-[14px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/30 mb-1">{isKh ? "ទឹកប្រាក់" : "Cash Amount"}</p>
                                 <p className="text-[14px] font-black text-rose-500 dark:text-rose-400 font-mono">{fmt_usd(viewItem.close_amount_usd ?? 0)}</p>
                                 <p className="text-[12px] text-gray-600 dark:text-white/30 font-mono">{fmt_khr(viewItem.close_amount_khr ?? 0)}</p>
                              </div>
                           </div>
                        ) : (
                           <div className="px-4 py-3">
                              <p className="text-[12px] text-gray-600 dark:text-white/25 italic">{isKh ? "កំពុងធ្វើការ..." : "Shift still open..."}</p>
                           </div>
                        )}
                     </div>

                     {variance && (() => {
                        const isShort = variance.diff < 0
                        const isOver = variance.diff > 0
                        return (
                           <div className={cn("rounded-xl border p-4 space-y-2",
                              isShort && "border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10",
                              isOver && "border-orange-200 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-500/10",
                              !isShort && !isOver && "border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10",
                           )}>
                              <div className="flex items-center gap-2 mb-1">
                                 {isShort || isOver
                                    ? <AlertTriangle className={cn("w-4 h-4", isShort ? "text-rose-500" : "text-orange-500")} />
                                    : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                 <span className="text-[12px] font-black uppercase tracking-widest text-gray-600 dark:text-white/50">
                                    {isKh ? "ការផ្ទៀងផ្ទាត់ប្រាក់" : "Cash Reconciliation"}
                                 </span>
                              </div>
                              <div className="flex justify-between text-[14px] text-gray-700 dark:text-white/70">
                                 <span>{isKh ? "ប្រាក់គួរមាន" : "Expected"}</span>
                                 <span className="font-mono">{fmt_usd(variance.expected)}</span>
                              </div>
                              <div className="flex justify-between text-[14px] text-gray-700 dark:text-white/70">
                                 <span>{isKh ? "ប្រាក់ចេញពិតប្រាកដ" : "Actual"}</span>
                                 <span className="font-mono">{fmt_usd(variance.actual)}</span>
                              </div>
                              <div className={cn("flex justify-between text-[15px] font-black pt-2 border-t",
                                 isShort && "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30",
                                 isOver && "text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30",
                                 !isShort && !isOver && "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
                              )}>
                                 <span>
                                    {isShort ? (isKh ? "ខ្វះលុយ" : "Cash Shortage")
                                       : isOver ? (isKh ? "លើសលុយ" : "Cash Over")
                                          : (isKh ? "ត្រឹមត្រូវ" : "Balanced")}
                                 </span>
                                 <span className="font-mono">{isOver ? "+" : ""}{fmt_usd(variance.diff)}</span>
                              </div>
                           </div>
                        )
                     })()}

                     {/* Closed shift with no saved reconciliation (closed before this feature) */}
                     {!variance && viewItem.shift_status === "Closed" && (
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07]">
                           <p className="text-[12px] text-gray-600 dark:text-white/40">
                              {isKh
                                 ? "វេននេះបិទមុនមានមុខងារផ្ទៀងផ្ទាត់ប្រាក់ ដូច្នេះមិនមានទិន្នន័យខ្វះ/លើសទេ។"
                                 : "This shift was closed before cash reconciliation was recorded, so there is no variance data."}
                           </p>
                        </div>
                     )}

                     <div className="grid grid-cols-3 gap-3">
                        <div className={cn("p-3 rounded-xl border text-center", ACCENT.ibg, ACCENT.subtleBorder)}>
                           <ShoppingBag className={cn("w-4 h-4 mx-auto mb-1", ACCENT.text)} />
                           <p className={cn("text-[20px] font-black tabular-nums", ACCENT.text)}>{viewItem.total_orders ?? 0}</p>
                           <p className={cn("text-[12px] font-bold uppercase tracking-wider", ACCENT.lbl)}>{isKh ? "ការបញ្ជាទិញ" : "Orders"}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-center">
                           <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                           <p className="text-[14px] font-black text-emerald-700 dark:text-emerald-300 font-mono">{fmt_usd(viewItem.total_revenue_usd ?? 0)}</p>
                           <p className="text-[12px] text-emerald-500 font-mono">{fmt_khr(viewItem.total_revenue_khr ?? 0)}</p>
                           <p className="text-[12px] font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">{isKh ? "ចំណូល" : "Revenue"}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 text-center">
                           <Timer className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                           <p className="text-[20px] font-black text-orange-700 dark:text-orange-300 tabular-nums">
                              {(viewItem.overtime_hours ?? 0) > 0 ? `+${viewItem.overtime_hours}h` : "—"}
                           </p>
                           <p className="text-[12px] font-bold uppercase tracking-wider text-orange-500 dark:text-orange-400">Overtime</p>
                        </div>
                     </div>
                     {viewItem.note && (
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07]">
                           <p className="text-[14px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/30 mb-1">{isKh ? "កំណត់សម្គាល់" : "Note"}</p>
                           <p className="text-[14px] text-gray-600 dark:text-white/60">{viewItem.note}</p>
                        </div>
                     )}
                  </div>
               )}
               <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-3xl shrink-0 flex justify-end">
                  <button onClick={() => setViewItem(null)}
                     className="h-9 px-5 rounded-xl text-[14px] font-bold border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all">
                     {t("close")}
                  </button>
               </div>
            </DialogContent>
         </Dialog>
         <ConfirmDialog
            open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}
            onConfirm={confirmDelete} loading={deleting} variant="danger" icon={Trash2}
            title={isKh ? "បញ្ជាក់ការលុប" : "Confirm Delete"}
            description={isKh ? "ការលុបនេះនឹងលុបទិន្នន័យវេនការងារចេញពីប្រព័ន្ធ។" : "This will permanently remove the shift record."}
            highlight={itemToDelete?.staff_name}
            confirmLabel={isKh ? "លុបចោល" : t("delete")}
            cancelLabel={t("cancel")}
         />
      </div>
   )
}