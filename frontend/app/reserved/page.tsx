"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { DataTableCustom } from "@/components/ui/table"
import {
   Dialog, DialogContent, DialogHeader, DialogTitle,
   DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import {
   Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
   Search, Plus, Eye, Edit2, Trash2, Loader2, Calendar, RotateCcw,
   AlertTriangle, TrendingUp, Clock, User, Phone, TableIcon,
   CheckSquare, ShoppingCart, UtensilsCrossed, Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Reservation } from "@/types"
import { usePermission } from "@/lib/role-context"
import { useTranslation } from "react-i18next"
import { toastSuccess, toastError } from "@/lib/toast"
import { ReserveDialog } from "@/components/pos/reserve-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

import { useReservations, useReservationMutations } from "@/hooks/reservation/use-reservations"

const ITEMS_PER_PAGE = 10

const AC = {
   text: "text-[#03624C] dark:text-white",
   iconBg: "bg-[#03624C] dark:bg-[#1857D8]",
   pill: "bg-[#03624C]/10 dark:bg-[#1857D8]/20 border-[#03624C]/20 dark:border-[#1857D8]/40 text-[#03624C] dark:text-white",
}

const SEL_T =
   "h-9 rounded-lg border border-gray-200/80 dark:border-white/[0.08] " +
   "bg-white dark:bg-[#22263a] text-[14px] " +
   "text-gray-700 dark:text-white/70 shadow-sm dark:shadow-none " +
   "focus:ring-0 focus:ring-offset-0 transition-all"

const SEL_C =
   "rounded-xl border border-gray-100 dark:border-white/[0.10] " +
   "bg-white dark:bg-[#22263a] shadow-lg p-1"

const SEL_I =
   "text-[14px] rounded-lg cursor-pointer " +
   "text-gray-700 dark:text-white/70 " +
   "focus:bg-[#03624C]/10 dark:focus:bg-[#1857D8]/20 " +
   "focus:text-[#03624C] dark:focus:text-white"

const STATUS_CFG = {
   confirmed: { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/30", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
   pending: { bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/30", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
   cancelled: { bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-200 dark:border-rose-500/30", text: "text-rose-700 dark:text-rose-300", dot: "bg-rose-500" },
   completed: { bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/30", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
} as const

const CARD_BASE = "bg-white dark:bg-[#22263a] border-gray-100 dark:border-white/[0.06]"

const CARD_STYLES = {
   total: {
      bg: CARD_BASE,
      text: "!text-[#03624C] dark:!text-[#1857D8]", label: "text-gray-600 dark:text-gray-200",
      icon: "text-[#03624C] dark:text-[#1857D8]", iconBg: "bg-[#03624C]/10 dark:bg-[#1857D8]/10",
   },
   confirmed: {
      bg: CARD_BASE,
      text: "!text-emerald-600 dark:!text-emerald-400", label: "text-gray-600 dark:text-gray-200",
      icon: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
   },
   pending: {
      bg: CARD_BASE,
      text: "!text-amber-600 dark:!text-amber-400", label: "text-gray-600 dark:text-gray-200",
      icon: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-50 dark:bg-amber-500/10",
   },
   cancelled: {
      bg: CARD_BASE,
      text: "!text-rose-600 dark:!text-rose-400", label: "text-gray-600 dark:text-gray-200",
      icon: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-50 dark:bg-rose-500/10",
   },
} as const

const CARD_KEYS = ["total", "confirmed", "pending", "cancelled"] as const

const STATUS_OPTIONS = [
   { value: "all", kh: "គ្រប់ស្ថានភាព", en: "All Status" },
   { value: "confirmed", kh: "បានបញ្ជាក់", en: "Confirmed" },
   { value: "pending", kh: "រង់ចាំ", en: "Pending" },
   { value: "cancelled", kh: "បានលុប", en: "Cancelled" },
   { value: "completed", kh: "រួចរាល់", en: "Completed" },
] as const

const statusLabel = (v: string, isKh: boolean) => {
   const o = STATUS_OPTIONS.find(x => x.value === v)
   return o ? (isKh ? o.kh : o.en) : v
}

const formatDatetime = (dt?: string | null) => {
   if (!dt) return "—"
   const d = new Date(dt)
   if (isNaN(d.getTime())) return "—"
   const date = d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
   const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
   return `${date} · ${time}`
}

const formatDateParts = (dt?: string | null): { date: string; time: string } | null => {
   if (!dt) return null
   const d = new Date(dt)
   if (isNaN(d.getTime())) return null
   return {
      date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`,
      time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
   }
}

const getTableNames = (tables: Reservation["tables"]) =>
   tables?.map(t => t.name).join(", ") || "—"

function ViewDialog({
   open, onClose, item, isKh,
}: {
   open: boolean
   onClose: () => void
   item: Reservation | null
   isKh: boolean
}) {
   if (!item) return null
   const s = STATUS_CFG[item.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending

   return (
      <Dialog open={open} onOpenChange={onClose}>
         <DialogContent
            className="max-w-[480px] p-0 overflow-hidden border border-gray-200 dark:border-white/[0.10] shadow-2xl rounded-2xl bg-white dark:bg-[#1e2235] [&>button]:hidden flex flex-col max-h-[85vh]" >
            <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] shrink-0">
               <div className="flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", AC.iconBg)}>
                     <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div>
                     <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90">
                        {isKh ? "ព័ត៌មានលម្អិត" : "View Reservation"}
                     </DialogTitle>
                     <DialogDescription className="text-[12px] text-gray-600 dark:text-white/30">
                        {isKh ? "អានតែប៉ុណ្ណោះ" : "Read-only"}
                     </DialogDescription>
                  </div>
               </div>
            </DialogHeader>
            <div className="px-6 py-5 space-y-2.5 overflow-y-auto">
               {[
                  { icon: User, label: isKh ? "ឈ្មោះ" : "Name", value: item.customer_name },
                  { icon: Phone, label: isKh ? "លេខទូរស័ព្ទ" : "Phone", value: item.customer_phone },
                  { icon: TableIcon, label: isKh ? "តុ" : "Table", value: getTableNames(item.tables) },
                  { icon: Clock, label: isKh ? "ថ្ងៃខែ & ម៉ោង" : "Date & Time", value: formatDatetime(item.arrival_datetime) },
               ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                     <Icon className={cn("w-3.5 h-3.5 shrink-0", AC.text)} />
                     <span className="text-[14px] font-bold text-gray-600 dark:text-white/40 w-24 shrink-0">{label}</span>
                     <span className="text-[14px] text-gray-800 dark:text-white/85">{value}</span>
                  </div>
               ))}
               <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", s.dot)} />
                  <span className="text-[14px] font-bold text-gray-600 dark:text-white/40 w-24 shrink-0">
                     {isKh ? "ស្ថានភាព" : "Status"}
                  </span>
                  <span className={cn("text-[12px] px-2.5 py-0.5 rounded-full border", s.bg, s.border, s.text)}>
                     {statusLabel(item.status, isKh)}
                  </span>
               </div>
               {item.items && item.items.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                     <p className="text-[14px] text-gray-600 dark:text-white/40 flex items-center gap-1.5 px-1">
                        <ShoppingCart className="w-3 h-3" />
                        {isKh ? "មុខម្ហូបដែលបានកក់" : "Pre-ordered Items"}
                     </p>
                     <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                        {item.items.map((i, idx) => (
                           <div key={idx} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07]">
                              <UtensilsCrossed className="w-3.5 h-3.5 text-gray-300 dark:text-white/20 shrink-0" />
                              <span className="flex-1 text-[14px] text-gray-800 dark:text-white/85 truncate">{i.name}</span>
                              <span className="text-[14px] text-gray-600 dark:text-white/40">{i.quantity} × ${Number(i.price).toFixed(2)}</span>
                              <span className={cn("text-[14px] font-bold", AC.text)}>
                                 ${(Number(i.price) * i.quantity).toFixed(2)}
                              </span>
                           </div>
                        ))}
                     </div>
                     <div className="flex justify-between items-center px-3 py-2 border-t border-gray-100 dark:border-white/[0.07] mt-1">
                        <span className="text-[14px] text-gray-600 dark:text-white/40">
                           {isKh ? "សរុប" : "Total"}
                        </span>
                        <span className={cn("text-[16px] font-bold", AC.text)}>
                           ${Number(item.total_price).toFixed(2)}
                        </span>
                     </div>
                  </div>
               )}
            </div>
            <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] shrink-0">
               <button
                  onClick={onClose}
                  className="h-9 px-5 rounded-xl text-[14px] font-bold border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all" >
                  {isKh ? "បិទ" : "Close"}
               </button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   )
}

type Row = Reservation & { _isCancelledRow?: boolean; _rowKey: string }

export default function ReservationsPage() {
   const { i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"
   const { can } = usePermission("reserved")
   const { data: reservations = [], isLoading: loading, isFetching } = useReservations()
   const { remove, invalidate } = useReservationMutations()

   const [search, setSearch] = useState("")
   const [startDate, setStartDate] = useState("")
   const [endDate, setEndDate] = useState("")
   const [statusFilter, setStatusFilter] = useState("all")
   const [currentPage, setCurrentPage] = useState(1)
   const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" })

   const [reserveOpen, setReserveOpen] = useState(false)
   const [editItem, setEditItem] = useState<Reservation | null>(null)
   const [viewOpen, setViewOpen] = useState(false)
   const [viewItem, setViewItem] = useState<Reservation | null>(null)
   const [deleteOpen, setDeleteOpen] = useState(false)
   const [deleteItem, setDeleteItem] = useState<Reservation | null>(null)

   const handleDelete = async () => {
      if (!deleteItem) return
      try {
         await remove.mutateAsync(deleteItem.id)
         toastSuccess(isKh ? "លុបបានជោគជ័យ" : "Deleted", `"${deleteItem.customer_name}"`)
         setDeleteOpen(false)
         setDeleteItem(null)
      } catch (err: any) {
         toastError(err?.message ?? (isKh ? "លុបមិនបាន" : "Failed to delete"))
      }
   }

   const stats = useMemo(() => ({
      total: reservations.length,
      confirmed: reservations.filter(r => r.status === "confirmed").length,
      pending: reservations.filter(r => r.status === "pending").length,
      cancelled: reservations.filter(r => r.status === "cancelled").length,
   }), [reservations])

   const processedData = useMemo(() => {
      const rows: Row[] = []

      reservations.forEach(r => {
         const allTables = r.tables ?? []
         const cancelledTables = allTables.filter(t => t.status === "cancelled")
         const activeTables = allTables.filter(t => t.status !== "cancelled")
         const isPartialCancel = cancelledTables.length > 0 && activeTables.length > 0

         if (isPartialCancel) {
            rows.push({ ...r, tables: cancelledTables, status: "cancelled", _isCancelledRow: true, _rowKey: `${r.id}-c` })
            rows.push({ ...r, tables: activeTables, status: r.status, _isCancelledRow: false, _rowKey: `${r.id}-a` })
         } else if (cancelledTables.length > 0 && activeTables.length === 0) {
            rows.push({ ...r, tables: cancelledTables, status: "cancelled", _isCancelledRow: true, _rowKey: `${r.id}-c` })
         } else {
            rows.push({ ...r, _isCancelledRow: false, _rowKey: `${r.id}-a` })
         }
      })

      const q = search.toLowerCase()
      let result = rows.filter(r => {
         const matchSearch =
            (r.customer_name ?? "").toLowerCase().includes(q) ||
            (r.customer_phone ?? "").includes(search) ||
            getTableNames(r.tables).toLowerCase().includes(q)
         if (!matchSearch) return false
         if (startDate || endDate) {
            // filter by the date shown in the table (arrival), not created_at
            const d = r.arrival_datetime?.slice(0, 10) ?? null
            if (!d || (startDate && d < startDate) || (endDate && d > endDate)) return false
         }
         if (statusFilter !== "all" && r.status !== statusFilter) return false
         return true
      })

      if (sortConfig.key) {
         result = [...result].sort((a: any, b: any) => {
            const dir = sortConfig.direction === "asc" ? 1 : -1
            return a[sortConfig.key!] < b[sortConfig.key!] ? -dir : a[sortConfig.key!] > b[sortConfig.key!] ? dir : 0
         })
      }

      return result
   }, [reservations, search, startDate, endDate, statusFilter, sortConfig])

   const hasActiveFilter = search || startDate || endDate || statusFilter !== "all"

   const columns = [
      {
         key: "no", header: isKh ? "ល.រ" : "No.",
         render: (_: any, i: number) => (
            <span className="text-[14px] text-gray-600 dark:text-white/40 font-mono tabular-nums">
               {String((currentPage - 1) * ITEMS_PER_PAGE + i + 1).padStart(2, "0")}
            </span>
         ),
      },
      {
         key: "customer_name", header: isKh ? "ឈ្មោះអតិថិជន" : "Customer", sortable: true,
         render: (item: Reservation) => (
            <div className="py-0.5">
               <p className="text-[14px] text-gray-800 dark:text-white/90">{item.customer_name}</p>
               <p className="text-[12px] text-gray-600 dark:text-white/40 font-mono">{item.customer_phone}</p>
            </div>
         ),
      },
      {
         key: "arrival_datetime", header: isKh ? "ថ្ងៃខែ & ម៉ោង" : "Date & Time", sortable: true,
         render: (item: Reservation) => {
            const p = formatDateParts(item.arrival_datetime)
            if (!p) return <span className="text-gray-300 dark:text-white/20 text-[14px]">—</span>
            return (
               <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] text-gray-700 dark:text-white/70">{p.date}</span>
                  <span className="text-[12px] text-gray-600 dark:text-white/40">{p.time}</span>
               </div>
            )
         },
      },
      {
         key: "tables", header: isKh ? "តុ" : "Table",
         render: (item: Reservation) => (
            <span
               title={getTableNames(item.tables)}
               className={cn(
                  "inline-flex items-center max-w-[160px] truncate text-[14px] px-2.5 py-0.5 rounded-full border",
                  AC.pill,
               )}>
               <span className="truncate">{getTableNames(item.tables)}</span>
            </span>
         ),
      },
      {
         key: "status", header: isKh ? "ស្ថានភាព" : "Status",
         render: (item: Reservation) => {
            const s = STATUS_CFG[item.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending
            return (
               <span className={cn(
                  "inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border",
                  s.bg, s.border, s.text,
               )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot,
                     item.status === "pending" && "animate-pulse"
                  )} />
                  {statusLabel(item.status, isKh)}
               </span>
            )
         },
      },
      {
         key: "total_price", header: isKh ? "សរុប" : "Total",
         render: (item: Reservation) => (
            <span className={cn("text-[14px] font-mono", AC.text)}>
               ${Number(item.total_price).toFixed(2)}
            </span>
         ),
      },
      {
         key: "actions",
         header: isKh ? "សកម្មភាព" : "Actions",
         className: "text-right",
         render: (item: any) => (
            <div className="flex items-center justify-end gap-1.5">
               <button
                  onClick={() => { setViewItem(item); setViewOpen(true) }}
                  className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
              text-blue-700 bg-blue-50 border border-blue-200
              hover:bg-blue-100 hover:border-blue-300
              dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-700/40
              dark:hover:bg-blue-900/40 dark:hover:border-blue-500
              transition-all duration-150"
                  title={isKh ? "មើលព័ត៌មាន" : "View Details"} >
                  <Eye className="w-3.5 h-3.5" />
               </button>
               {!item._isCancelledRow && can("edit") && item.status !== "cancelled" && item.status !== "completed" && (
                  <button
                     onClick={() => { setEditItem(item); setReserveOpen(true) }}
                     className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                text-amber-700 bg-amber-50 border border-amber-200
                hover:bg-amber-100 hover:border-amber-300
                dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-700/40
                dark:hover:bg-amber-900/40 dark:hover:border-amber-500
                transition-all duration-150"
                     title={isKh ? "កែប្រែ" : "Edit"} >
                     <Edit2 className="w-3.5 h-3.5" />
                  </button>
               )}
               {!item._isCancelledRow && can("delete") && (
                  <button
                     onClick={() => { setDeleteItem(item); setDeleteOpen(true) }}
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

   const showInitialLoading = loading && reservations.length === 0

   const icons = {
      total: <Calendar className="w-4 h-4" />,
      confirmed: <CheckSquare className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      cancelled: <AlertTriangle className="w-4 h-4" />,
   }
   const labels = {
      total: isKh ? "ការកក់សរុប" : "Total",
      confirmed: isKh ? "បានបញ្ជាក់" : "Confirmed",
      pending: isKh ? "រង់ចាំ" : "Pending",
      cancelled: isKh ? "បានលុប" : "Cancelled",
   }

   return (
      <div className="flex h-screen bg-gray-50 dark:bg-[#13151f] overflow-hidden transition-colors duration-300">
         <AnimatePresence>
            {isFetching && !loading && (
               <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed top-0 left-0 right-0 h-[2px] bg-[#03624C] dark:bg-[#1857D8] origin-left z-[100]"
               />
            )}
         </AnimatePresence>
         <Sidebar />
         <div className="flex-1 flex flex-col overflow-hidden">
            <Header
               title={isKh ? "គ្រប់គ្រងការកក់" : "Reservations"}
               subtitle={isKh ? "គ្រប់គ្រងការកក់តុ" : "Manage your table reservations"}
            />
            {showInitialLoading ? (
               <div className="flex-1 flex items-center justify-center flex-col gap-4">
                  <Loader2 className={cn("w-5 h-5 animate-spin", AC.text)} />
                  <span className={cn("text-[12px] font-bold uppercase tracking-[0.2em] animate-pulse", AC.text)}>
                     {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
                  </span>
               </div>
            ) : (
               <main className="flex-1 p-5 space-y-4 overflow-hidden flex flex-col">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                     {CARD_KEYS.map((key, i) => {
                        const st = CARD_STYLES[key]
                        return (
                           <motion.div key={key}
                              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: i * 0.07 }}
                              whileHover={{ y: -3, transition: { duration: 0.18 } }} >
                              <Card className={cn("border rounded-xl shadow-sm hover:shadow-md transition-shadow", st.bg)}>
                                 <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                       <p className={cn("flex items-center gap-1.5 min-w-0 text-[14px] font-bold uppercase", st.label)}>
                                          <span className="truncate">{labels[key]}</span>
                                       </p>
                                       <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", st.iconBg)}>
                                          <span className={st.icon}>{icons[key]}</span>
                                       </div>
                                    </div>
                                    <p className={cn("text-[22px] font-bold text-center leading-none tabular-nums mb-3", st.text)}>{stats[key]}</p>
                                    <div className="flex items-center gap-1.5">
                                       <TrendingUp className={cn("w-3 h-3 shrink-0", st.icon)} />
                                       <p className={cn("text-[12px]", st.label)}>{isKh ? "ការកក់" : "reservations"}</p>
                                    </div>
                                 </CardContent>
                              </Card>
                           </motion.div>
                        )
                     })}
                  </div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.2 }}
                     className="flex flex-wrap gap-2 items-center justify-between shrink-0" >
                     <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white/25 pointer-events-none" />
                           <input
                              className="w-56 h-9 pl-9 pr-3 text-[14px] rounded-lg outline-none transition-all bg-white dark:bg-[#22263a] border border-gray-200/80 dark:border-white/[0.08] text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/20 shadow-sm focus:border-[#03624C] dark:focus:border-[#4dab8e] focus:ring-2 focus:ring-[#03624C]/10 dark:focus:ring-[#4dab8e]/10"
                              placeholder={isKh ? "ស្វែងរក..." : "Search..."}
                              value={search}
                              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                           />
                        </div>
                        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07] shrink-0" />
                        <DateRangePicker
                           startDate={startDate} endDate={endDate}
                           onStartChange={(v: string) => { setStartDate(v); setCurrentPage(1) }}
                           onEndChange={(v: string) => { setEndDate(v); setCurrentPage(1) }}
                        />
                        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07] shrink-0" />
                        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1) }}>
                           <SelectTrigger className={cn(SEL_T, "w-44")}>
                              <Filter className={cn("w-3.5 h-3.5 mr-1.5 shrink-0", AC.text)} />
                              <SelectValue placeholder={isKh ? "ស្ថានភាព" : "Status"} />
                           </SelectTrigger>
                           <SelectContent className={SEL_C}>
                              {STATUS_OPTIONS.map(opt => (
                                 <SelectItem key={opt.value} value={opt.value} className={SEL_I}>
                                    {isKh ? opt.kh : opt.en}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <AnimatePresence>
                           {hasActiveFilter && (
                              <motion.button
                                 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                 onClick={() => { setSearch(""); setStartDate(""); setEndDate(""); setStatusFilter("all"); setCurrentPage(1) }}
                                 className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all" >
                                 <RotateCcw className="w-3.5 h-3.5" />
                              </motion.button>
                           )}
                        </AnimatePresence>
                     </div>
                     {can("create") && (
                        <button
                           onClick={() => { setEditItem(null); setReserveOpen(true) }}
                           className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] text-white bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90 transition-all active:scale-[0.97] shadow-md shadow-[#03624C]/20 dark:shadow-[#1857D8]/10" >
                           <Plus className="w-4 h-4" />
                           {isKh ? "បន្ថែមថ្មី" : "Add New"}
                        </button>
                     )}
                  </motion.div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.28 }}
                     className="flex-1 overflow-hidden" >
                     <Card className="h-full border-0 shadow-none bg-transparent flex flex-col">
                        <DataTableCustom
                           data={processedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)}
                           columns={columns}
                           currentPage={currentPage}
                           totalPages={Math.ceil(processedData.length / ITEMS_PER_PAGE) || 1}
                           onPageChange={setCurrentPage}
                           totalItems={processedData.length}
                           sortConfig={sortConfig}
                           onSort={key => setSortConfig(prev => ({
                              key,
                              direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
                           }))}
                           itemsPerPage={ITEMS_PER_PAGE}
                           language={i18n.language as any}
                        />
                     </Card>
                  </motion.div>
               </main>
            )}
         </div>
         <ReserveDialog
            open={reserveOpen}
            onOpenChange={open => { setReserveOpen(open); if (!open) setEditItem(null) }}
            language={isKh ? "khmer" : "en"}
            editData={editItem}
            onSuccess={() => { invalidate(); setReserveOpen(false); setEditItem(null) }}
         />
         <ViewDialog
            open={viewOpen}
            onClose={() => setViewOpen(false)}
            item={viewItem}
            isKh={isKh}
         />
         <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onConfirm={handleDelete}
            loading={remove.isPending}
            variant="danger"
            icon={Trash2}
            title={isKh ? "បញ្ជាក់ការលុប" : "Confirm Delete"}
            description={isKh
               ? "ការកក់ទាំងមូល (រួមទាំងតុផ្សេងទៀត) នឹងត្រូវលុប។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។"
               : "The entire reservation, including all its tables, will be deleted. This action cannot be undone."}
            highlight={deleteItem?.customer_name}
            confirmLabel={isKh ? "លុបចោល" : "Delete"}
            cancelLabel={isKh ? "បោះបង់" : "Cancel"}
         />
      </div>
   )
}