"use client"
import React from "react"
import { useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTableCustom } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
   Search, Plus, Eye, Edit2, Loader2, Calendar, Trash2,
   RotateCcw, RefreshCw, Filter, Tag, AlertTriangle,
   DollarSign, TrendingUp, Sun,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { usePermission } from "@/lib/role-context"
import { useSettings } from "@/lib/settings-context"
import type { Income } from "@/types"
import { toastSuccess, toastError, toastWarn } from "@/lib/toast"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { DatePicker } from "@/components/ui/DatePicker"
import { useFinanceCategories } from "@/hooks/finances/use-category"
import { useIncomes, useAllIncomes, useIncomeMutations } from "@/hooks/finances/use-income"

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }

const ACCENT = {
   text: "text-[#03624C] dark:text-[#1857D8]",
   iconBg: "bg-[#03624C] dark:bg-[#1857D8]",
}

const INPUT =
   "w-full h-9 px-3 text-[14px] rounded-lg outline-none transition-all " +
   "bg-white dark:bg-[#22263a] border border-gray-200/80 dark:border-white/[0.08] " +
   "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/20 " +
   "focus:border-[#03624C] dark:focus:border-[#1857D8] focus:ring-2 focus:ring-[#03624C]/10 " +
   "dark:focus:ring-[#1857D8]/10 shadow-sm dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"

const SEL_T =
   "h-9 text-[14px] rounded-lg border border-gray-200/80 dark:border-white/[0.08] " +
   "bg-white dark:bg-[#22263a] text-gray-700 dark:text-white/70 shadow-sm dark:shadow-none"

const SEL_C = "bg-white dark:bg-[#22263a] border-gray-100 dark:border-white/[0.12] rounded-xl"
const SEL_I = "text-[14px] text-gray-800 dark:text-white/80 focus:bg-[#03624C]/10 dark:focus:bg-[#1857D8]/10"
const ERR = "border-rose-400 dark:border-rose-500/50 focus:border-rose-400"

const AUTO_CAT = "Sales"
const FALLBACK_CATS = ["Other", "Rental", "Service", "Investment", "Donation", "Refund"]

const KPI = {
   total: {
      bg: "bg-white dark:bg-[#22263a]",
      border: "border-white dark:border-[#22263a]",
      text: "!text-[#03624C] dark:!text-emerald-300",
      label: "text-gray-600 dark:text-gray-200",
      icon: "text-[#03624C] dark:text-emerald-300",
      iconBg: "bg-[#03624C]/10 dark:bg-emerald-400/20",
   },
   order: {
      bg: "bg-white dark:bg-[#22263a]",
      border: "border-white dark:border-[#22263a]",
      text: "!text-indigo-700 dark:!text-indigo-300",
      label: "text-gray-600 dark:text-gray-200",
      icon: "text-indigo-500 dark:text-indigo-400",
      iconBg: "bg-indigo-100 dark:bg-indigo-400/20",
   },
   manual: {
      bg: "bg-white dark:bg-[#22263a]",
      border: "border-white dark:border-[#22263a]",
      text: "!text-blue-700 dark:!text-blue-300",
      label: "text-gray-600 dark:text-gray-200",
      icon: "text-blue-500 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-400/20",
   },
   today: {
      bg: "bg-white dark:bg-[#22263a]",
      border: "border-white dark:border-[#22263a]",
      text: "!text-amber-700 dark:!text-amber-300",
      label: "text-gray-600 dark:text-gray-200",
      icon: "text-amber-600 dark:text-amber-300",
      iconBg: "bg-amber-100 dark:bg-amber-400/20",
   },
}

const ErrMsg = ({ msg }: { msg: string }) => (
   <p className="flex items-center gap-1 text-[14px] text-rose-500 dark:text-rose-400 mt-1">
      <AlertTriangle className="w-3 h-3 shrink-0" />{msg}
   </p>
)

function fmtDate(d: string) {
   if (!d) return ""
   const dt = new Date(d)
   return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function isToday(dateStr: string) {
   const d = new Date(dateStr)
   const now = new Date()
   return d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
}

// 1000 -> 1K, 1500 -> 1.5K, 1000000 -> 1M, 2500000 -> 2.5M
function formatCompact(value: number): string {
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

function KpiCard({
   label, value, sub, prefix, style, icon: Icon, delay, isCount = false,
}: {
   label: string
   value: number
   sub?: string
   prefix?: string
   style: typeof KPI.total
   icon: React.ElementType
   delay: number
   isCount?: boolean
}) {
   return (
      <motion.div
         initial={{ opacity: 0, y: 14 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.35, delay, ease: "easeOut" }}
         whileHover={{ y: -3, transition: { duration: 0.18 } }}
         className="flex-1 min-w-[160px]" >
         <Card className={cn("border rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40", style.bg, style.border)}>
            <CardContent className="p-2">
               <div className="flex items-center justify-between gap-3 mb-4">
                  <p className={cn("flex items-center gap-1.5 min-w-0 text-[14px] font-bold uppercase", style.label)}>
                     <span className="truncate">{label}</span>
                  </p>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", style.iconBg)}>
                     <Icon className={cn("w-4 h-4", style.icon)} />
                  </div>
               </div>
               <p
                  className={cn("text-[22px] font-bold text-center leading-none tabular-nums mb-2.5", style.text)}
                  title={isCount ? undefined : `${prefix}${value.toFixed(2)}`}
               >
                  {isCount ? value : <>{prefix}{formatCompact(value)}</>}
               </p>
               {sub && (
                  <div className="flex items-center gap-1.5">
                     <p className={cn("text-[14px]", style.label)}>{sub}</p>
                  </div>
               )}
            </CardContent>
         </Card>
      </motion.div>
   )
}

export default function IncomePage() {
   const { t, i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"
   // FIX: ប្រើ key "income" (role-context ធ្លាក់ទៅ "finance" ស្វ័យប្រវត្តិបើគ្មាន key income)
   const { can } = usePermission("income")
   const settings = useSettings()
   const cur = (settings as any).currencySymbol || (settings as any).currency || "$"

   const [page, setPage] = useState(1)
   const [search, setSearch] = useState("")
   const [start, setStart] = useState("")
   const [end, setEnd] = useState("")
   const [catF, setCatF] = useState("all")
   const [sort, setSort] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: "date", direction: "desc" })
   const PER = 10

   const { data: allCats = [] } = useFinanceCategories()
   const cats = useMemo(
      () => allCats.filter((c: any) => c.type === "income").map((c: any) => c.name),
      [allCats]
   )

   const {
      data: incomesRes,
      isLoading: loadingIncomes,
      isFetching: fetchingIncomes,
      refetch: refetchIncomes,
   } = useIncomes({
      start_date: start || undefined,
      end_date: end || undefined,
      category: catF !== "all" ? catF : undefined,
      search: search || undefined,
      per_page: PER,
      page,
   })
   const { data: allIncomes = [], isLoading: loadingAll, isFetching: fetchingAll } = useAllIncomes()
   const { create, update, remove } = useIncomeMutations()

   const incomes = incomesRes?.data?.data ?? []
   const total = incomesRes?.data?.total ?? 0
   const lastPage = incomesRes?.data?.last_page ?? 1
   const summary = (incomesRes as any)?.summary as
      { total: number; order_income: number; manual_income: number } | undefined

   const loading = loadingIncomes || loadingAll
   const isFetching = fetchingIncomes || fetchingAll
   const saving = create.isPending || update.isPending
   const deleting = remove.isPending

   const [open, setOpen] = useState(false)
   const [viewMode, setViewMode] = useState(false)
   const [item, setItem] = useState<any>(null)
   const [delItem, setDelItem] = useState<any>(null)
   const [delOpen, setDelOpen] = useState(false)
   const [errs, setErrs] = useState<{ title?: string; amount?: string; category?: string }>({})
   const snap = useRef("")

   const rows = useMemo(() => {
      const r = [...incomes]
      if (sort.key) {
         r.sort((a, b) => {
            let av: any = a[sort.key as keyof Income]
            let bv: any = b[sort.key as keyof Income]
            if (sort.key === "date") { av = new Date(a.date).getTime(); bv = new Date(b.date).getTime() }
            if (sort.key === "amount") { av = Number(a.amount); bv = Number(b.amount) }
            if (av < bv) return sort.direction === "asc" ? -1 : 1
            if (av > bv) return sort.direction === "asc" ? 1 : -1
            return 0
         })
      } else {
         r.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }
      return r
   }, [incomes, sort])

   const kpi = useMemo(() => {
      const todayTotal = allIncomes
         .filter((inc: Income) => isToday(inc.date))
         .reduce((s: number, inc: Income) => s + Number(inc.amount), 0)
      return {
         total: summary?.total ?? 0,
         order: summary?.order_income ?? 0,
         manual: summary?.manual_income ?? 0,
         today: todayTotal,
      }
   }, [summary, allIncomes])

   const openAdd = () => {
      setViewMode(false)
      setItem({
         title: "", amount: "", category: cats[0] || FALLBACK_CATS[0],
         date: new Date().toISOString().slice(0, 10), payment_method: "", description: "",
      })
      setErrs({})
      snap.current = ""
      setOpen(true)
   }

   const openEdit = (inc: Income) => {
      if (inc.isAutoGenerated) {
         toastWarn(isKh ? "មិនអាចកែប្រែចំណូលដោយស្វ័យប្រវត្តិ" : "Auto income cannot be edited")
         return
      }
      setViewMode(false)
      setItem({ ...inc })
      setErrs({})
      snap.current = JSON.stringify({
         title: inc.title, amount: Number(inc.amount), category: inc.category,
         date: inc.date, payment_method: inc.payment_method, description: inc.description,
      })
      setOpen(true)
   }

   const save = async () => {
      const e: typeof errs = {}
      if (!item.title?.trim()) e.title = isKh ? "សូមបញ្ចូលបរិយាយ" : "Description required"
      if (!item.amount || Number(item.amount) <= 0) e.amount = isKh ? "សូមបញ្ចូលទឹកប្រាក់ត្រឹមត្រូវ" : "Valid amount required"
      if (!item.category) e.category = isKh ? "សូមជ្រើសរើសប្រភេទ" : "Category required"
      if (Object.keys(e).length) { setErrs(e); return }

      if (item.id) {
         const c = JSON.stringify({
            title: item.title, amount: Number(item.amount), category: item.category,
            date: item.date, payment_method: item.payment_method, description: item.description,
         })
         if (c === snap.current) {
            toastWarn(isKh ? "មិនមានការផ្លាស់ប្តូរ" : "No changes", isKh ? "សូមកែប្រែមុន" : "Make changes first")
            return
         }
      }

      try {
         if (item.id) {
            await update.mutateAsync({
               id: item.id,
               payload: {
                  title: item.title, amount: Number(item.amount), date: item.date,
                  category: item.category, payment_method: item.payment_method, description: item.description,
               },
            })
            toastSuccess(
               isKh ? "កែប្រែបានជោគជ័យ" : "Updated successfully",
               isKh ? `ចំណូល "${item.title}" ត្រូវបានកែប្រែដោយជោគជ័យ` : `Income "${item.title}" has been updated successfully`
            )
         } else {
            await create.mutateAsync({
               title: item.title, amount: Number(item.amount), date: item.date,
               category: item.category, payment_method: item.payment_method, description: item.description,
            })
            toastSuccess(
               isKh ? "រក្សាទុកបានជោគជ័យ" : "Added successfully",
               isKh ? `ចំណូល "${item.title}" ត្រូវបានបន្ថែមដោយជោគជ័យ ` : `Income "${item.title}" has been added successfully`
            )
         }
         setOpen(false)
      } catch (err: any) {
         toastError(isKh ? "មានបញ្ហា" : "Save failed", err?.response?.data?.message ?? err?.message)
      }
   }

   const del = async () => {
      if (!delItem || delItem.isAutoGenerated) return
      try {
         await remove.mutateAsync(delItem.id)
         toastSuccess(
            isKh ? "លុបបានសម្រេច" : "Deleted",
            isKh ? `ចំណូល "${delItem.title}" ត្រូវបានលុបដោយជោគជ័យ` : `Income "${delItem.title}" has been deleted successfully`
         )
         setDelOpen(false); setDelItem(null)
      } catch (err: any) {
         toastError(isKh ? "លុបមិនបាន" : "Delete failed", err?.response?.data?.message ?? err?.message)
      }
   }

   const reset = () => { setSearch(""); setCatF("all"); setStart(""); setEnd(""); setPage(1) }
   const hasFilter = search || start || end || catF !== "all"

   const columns = [
      {
         key: "no", header: isKh ? "ល.រ" : "No.",
         render: (_: any, i: number) => (
            <span className="text-[14px] text-gray-600 dark:text-white/25 tabular-nums">
               {String((page - 1) * PER + i + 1).padStart(2, "0")}
            </span>
         ),
      },
      {
         key: "title", sortable: true, header: isKh ? "បរិយាយ" : "Description",
         render: (r: Income) => (
            <div className="flex flex-col leading-tight">
               <span className=" text-gray-800 dark:text-white text-[14px]">{r.title}</span>
               <span className={cn("text-[12px] opacity-80", ACCENT.text)}>
                  {r.isAutoGenerated ? (isKh ? "ការលក់" : "Order") : (isKh ? "បន្ថែមដោយដៃ" : "Manual")}
               </span>
            </div>
         ),
      },
      {
         key: "date", sortable: true, header: isKh ? "កាលបរិច្ឆេទ" : "Date",
         render: (r: Income) => (
            <div className="flex items-center gap-1.5 text-[14px] text-gray-700 dark:text-white/70">
               <Calendar className={cn("w-3 h-3 shrink-0", ACCENT.text)} />{fmtDate(r.date)}
            </div>
         ),
      },
      {
         key: "category", header: isKh ? "ប្រភេទ" : "Category",
         render: (r: Income) => (
            <Badge variant="outline" className={cn(
               "flex items-center gap-1 py-0.5 shadow-none border uppercase text-[12px] tracking-wider",
               r.isAutoGenerated
                  ? "bg-[#03624C]/10 dark:bg-[#1857D8]/10 text-[#03624C] dark:text-[#1857D8] border-[#03624C] dark:border-[#1857D8]"
                  : "bg-[#03624C]/10 dark:bg-[#1857D8]/10 text-[#03624C] dark:text-[#1857D8] border-[#03624C]/20 dark:border-[#1857D8]/30"
            )}>
               {r.isAutoGenerated ? <TrendingUp className="w-2.5 h-2.5" /> : <Tag className="w-2.5 h-2.5" />}
               {r.category}
            </Badge>
         ),
      },
      {
         key: "amount", sortable: true, header: isKh ? "ទឹកប្រាក់" : "Amount",
         render: (r: Income) => (
            // FIX: បិទ ] ដែលបាត់ក្នុង class
            <span className="text-[#03624C] dark:text-[#1857D8] text-[14px]">
               {cur}{Number(r.amount).toFixed(2)}
            </span>
         ),
      },
      {
         key: "actions",
         header: isKh ? "សកម្មភាព" : "Actions",
         className: "text-right",
         render: (r: Income) => (
            <div className="flex items-center justify-end gap-1.5">
               <button
                  onClick={() => { setViewMode(true); setItem(r); setOpen(true) }}
                  className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                  text-blue-700 bg-blue-50 border border-blue-200
                  hover:bg-blue-100 hover:border-blue-300
                  dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-700/40
                  dark:hover:bg-blue-900/40 dark:hover:border-blue-500
                  transition-all duration-150"
                  title={isKh ? "មើលព័ត៌មាន" : "View Details"} >
                  <Eye className="w-3.5 h-3.5" />
               </button>

               {!r.isAutoGenerated && can("edit") && (
                  <button
                     onClick={() => openEdit(r)}
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

               {!r.isAutoGenerated && can("delete") && (
                  <button
                     onClick={() => { setDelItem(r); setDelOpen(true) }}
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

   const showInitialLoading = loading && incomes.length === 0

   return (
      <div className="flex h-screen bg-gray-50 dark:bg-[#13151f] overflow-hidden transition-colors duration-300" style={SORA}>
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
               title={isKh ? "បញ្ជីចំណូល" : "Income Records"}
               subtitle={isKh ? "គ្រប់គ្រងរាល់ចំណូល" : "Manage all income"}
            />
            {showInitialLoading ? (
               <div className="flex-1 flex items-center justify-center flex-col gap-4">
                  <Loader2 className={cn("w-5 h-5 animate-spin", ACCENT.text)} />
                  <span className={cn("text-[14px] font-bold uppercase tracking-[0.2em] animate-pulse", ACCENT.text)}>
                     {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
                  </span>
               </div>
            ) : (
               <main className="flex-1 overflow-auto p-5 space-y-4 flex flex-col">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                     <KpiCard
                        label={isKh ? "ចំណូលសរុប" : "Total Income"}
                        value={kpi.total} prefix={cur}
                        style={KPI.total} icon={DollarSign} delay={0}
                        sub={`${total} ${isKh ? "កំណត់ត្រា" : "records"}`}
                     />
                     <KpiCard
                        label={isKh ? "ចំណូលពីការលក់" : "Order Income"}
                        value={kpi.order} prefix={cur}
                        style={KPI.order} icon={TrendingUp} delay={0.07}
                        sub={isKh ? "ស្វ័យប្រវត្តិ" : "auto generated"}
                     />
                     <KpiCard
                        label={isKh ? "ចំណូលបន្ថែម" : "Manual Income"}
                        value={kpi.manual} prefix={cur}
                        style={KPI.manual} icon={Tag} delay={0.14}
                        sub={isKh ? "បន្ថែមដោយដៃ" : "manual entries"}
                     />
                     <KpiCard
                        label={isKh ? "ចំណូលថ្ងៃនេះ" : "Today Income"}
                        value={kpi.today} prefix={cur}
                        style={KPI.today} icon={Sun} delay={0.21}
                        sub={isKh ? "នៅថ្ងៃនេះ" : "earned today"}
                     />
                  </div>

                  <motion.div
                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.25, delay: 0.25 }}
                     className="flex flex-wrap gap-2 items-center justify-between shrink-0" >
                     <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white/25 pointer-events-none" />
                           <input
                              className={cn(INPUT, "w-56 pl-8")}
                              placeholder={isKh ? "ស្វែងរក..." : "Search..."}
                              value={search}
                              onChange={e => { setSearch(e.target.value); setPage(1) }}
                           />
                        </div>
                        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07] shrink-0" />
                        <Select value={catF} onValueChange={v => { setCatF(v); setPage(1) }}>
                           <SelectTrigger className={cn(SEL_T, "w-44")}>
                              <Filter className={cn("w-3.5 h-3.5 mr-1.5 shrink-0", ACCENT.text)} />
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="all" className={SEL_I}>{isKh ? "គ្រប់ប្រភេទ" : "All"}</SelectItem>
                              <SelectItem value={AUTO_CAT} className={SEL_I}>{isKh ? "ចំណូលការលក់" : "Sales (Auto)"}</SelectItem>
                              {cats.map((c: string) => <SelectItem key={c} value={c} className={SEL_I}>{c}</SelectItem>)}
                           </SelectContent>
                        </Select>
                        <DateRangePicker
                           startDate={start} endDate={end}
                           onStartChange={v => { setStart(v); setPage(1) }}
                           onEndChange={v => { setEnd(v); setPage(1) }}
                        />
                        <AnimatePresence>
                           {hasFilter && (
                              <motion.button
                                 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                 onClick={reset}
                                 className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all" >
                                 <RotateCcw className="w-3.5 h-3.5" />
                              </motion.button>
                           )}
                        </AnimatePresence>
                        <button
                           onClick={() => refetchIncomes()}
                           className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] text-gray-400 dark:text-white/40 hover:text-[#03624C] dark:hover:text-[#1857D8] transition-all" >
                           <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
                        </button>
                     </div>
                     {can("create") && (
                        <motion.button
                           whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                           whileTap={{ scale: 0.97 }}
                           onClick={openAdd}
                           className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] text-white transition-all bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                           <Plus className="w-3.5 h-3.5" />{isKh ? "បន្ថែមចំណូល" : "Add Income"}
                        </motion.button>
                     )}
                  </motion.div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.25, delay: 0.32 }}
                     className="flex-1 overflow-hidden" >
                     <Card className="h-full border-0 shadow-none bg-transparent flex flex-col">
                        <DataTableCustom
                           data={rows} columns={columns} sortConfig={sort}
                           onSort={k => setSort(p => ({ key: k, direction: p.key === k && p.direction === "asc" ? "desc" : "asc" }))}
                           currentPage={page} totalPages={lastPage} onPageChange={setPage}
                           itemsPerPage={PER} totalItems={total} language={i18n.language as any}
                        />
                     </Card>
                  </motion.div>
               </main>
            )}
         </div>
         <Dialog open={open} onOpenChange={v => !saving && setOpen(v)}>
            <DialogContent className="max-w-md p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden" style={SORA}>
               <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0 bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
                  <div className="flex items-center gap-2.5">
                     <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", ACCENT.iconBg)}>
                        <DollarSign className="w-4 h-4 text-white" />
                     </div>
                     <div>
                        <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                           {viewMode
                              ? (isKh ? "ព័ត៌មានចំណូល" : "Income Details")
                              : item?.id
                                 ? (isKh ? "កែប្រែ" : "Edit Income")
                                 : (isKh ? "បន្ថែមថ្មី" : "Add New Income")}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Income form</DialogDescription>
                     </div>
                  </div>
               </DialogHeader>
               <div className="px-6 py-5 space-y-4">
                  <div className="space-y-1.5">
                     <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", errs.title && "text-rose-500")}>
                        {isKh ? "បរិយាយ" : "Description"}
                        {!viewMode && !item?.isAutoGenerated && <span className="text-rose-500 ml-0.5">*</span>}
                     </Label>
                     <input
                        disabled={viewMode || item?.isAutoGenerated}
                        className={cn(INPUT, errs.title && ERR)}
                        value={item?.title || ""}
                        onChange={e => { setItem({ ...item, title: e.target.value }); setErrs(p => ({ ...p, title: undefined })) }}
                        placeholder={isKh ? "បញ្ចូលបរិយាយ..." : "Enter description..."}
                     />
                     {errs.title && <ErrMsg msg={errs.title} />}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", errs.amount && "text-rose-500")}>
                           {isKh ? "ទឹកប្រាក់" : "Amount"}
                           {!viewMode && !item?.isAutoGenerated && <span className="text-rose-500 ml-0.5">*</span>}
                        </Label>
                        <input
                           type="number"
                           disabled={viewMode || item?.isAutoGenerated}
                           className={cn(INPUT, "text-emerald-600 dark:text-emerald-400 font-semibold", errs.amount && ERR)}
                           value={item?.amount || ""}
                           onChange={e => { setItem({ ...item, amount: e.target.value }); setErrs(p => ({ ...p, amount: undefined })) }}
                           placeholder="0.00"
                        />
                        {errs.amount && <ErrMsg msg={errs.amount} />}
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[14px] text-gray-600 dark:text-white/30">
                           {isKh ? "កាលបរិច្ឆេទ" : "Date"}
                        </Label>
                        <DatePicker
                           value={item?.date?.slice(0, 10) || ""}
                           onChange={v => setItem({ ...item, date: v })}
                           disabled={viewMode || item?.isAutoGenerated}
                           placeholder="Select date"
                        />
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", errs.category && "text-rose-500")}>
                        {isKh ? "ប្រភេទ" : "Category"}
                        {!viewMode && !item?.isAutoGenerated && <span className="text-rose-500 ml-0.5">*</span>}
                     </Label>
                     {item?.isAutoGenerated ? (
                        <input disabled className={INPUT} value={item?.category || AUTO_CAT} />
                     ) : (
                        <Select
                           disabled={viewMode}
                           value={item?.category || ""}
                           onValueChange={v => { setItem({ ...item, category: v }); setErrs(p => ({ ...p, category: undefined })) }}  >
                           <SelectTrigger className={cn(SEL_T, "w-full", errs.category && "border-rose-400 dark:border-rose-500/50")}>
                              <SelectValue placeholder={isKh ? "ជ្រើស..." : "Select..."} />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              {(cats.length > 0 ? cats : FALLBACK_CATS).map((c: string) => (
                                 <SelectItem key={c} value={c} className={SEL_I}>{c}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     )}
                     {errs.category && <ErrMsg msg={errs.category} />}
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-[14px] text-gray-600 dark:text-white/30">
                        {isKh ? "វិធីបង់ប្រាក់" : "Payment Method"}
                     </Label>
                     {viewMode || item?.isAutoGenerated ? (
                        <input disabled className={INPUT} value={item?.payment_method || ""} />
                     ) : (
                        <Select value={item?.payment_method || ""} onValueChange={v => setItem({ ...item, payment_method: v })}>
                           <SelectTrigger className={cn(SEL_T, "w-full")}>
                              <SelectValue placeholder={isKh ? "ជ្រើស..." : "Select..."} />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="cash" className={SEL_I}>{isKh ? "សាច់ប្រាក់" : "Cash"}</SelectItem>
                              <SelectItem value="card" className={SEL_I}>{isKh ? "ប័ណ្ណ" : "Card"}</SelectItem>
                              <SelectItem value="mobile" className={SEL_I}>{isKh ? "ទូរស័ព្ទ" : "Mobile"}</SelectItem>
                           </SelectContent>
                        </Select>
                     )}
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-[14px] text-gray-600 dark:text-white/30">
                        {isKh ? "កំណត់ចំណាំ" : "Notes"}
                     </Label>
                     <textarea
                        disabled={viewMode || item?.isAutoGenerated}
                        className={cn(INPUT, "h-20 resize-none")}
                        value={item?.description || ""}
                        onChange={e => setItem({ ...item, description: e.target.value })}
                        placeholder={isKh ? "ព័ត៌មានបន្ថែម..." : "Additional info..."}
                     />
                  </div>
               </div>
               <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg">
                  {!viewMode && !item?.isAutoGenerated ? (
                     <div className="flex justify-end gap-2 w-full">
                        <button onClick={() => setOpen(false)} disabled={saving}
                           className="h-9 px-5 rounded-lg text-[14px]  transition-all border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50" >
                           {t("cancel")}
                        </button>
                        <button onClick={save} disabled={saving}
                           className="h-9 px-6 rounded-lg text-[14px] text-white flex items-center gap-2 transition-all disabled:opacity-60 active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                           {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                           {saving ? (isKh ? "កំពុងរក្សា..." : "Saving...") : t("save")}
                        </button>
                     </div>
                  ) : (
                     <button onClick={() => setOpen(false)}
                        className="h-9 px-5 rounded-lg text-[14px] bg-gray-100 dark:bg-white/[0.08] text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-all" >
                        {t("close")}
                     </button>
                  )}
               </DialogFooter>
            </DialogContent>
         </Dialog>
         <ConfirmDialog
            open={delOpen} onOpenChange={setDelOpen} onConfirm={del} loading={deleting}
            variant="danger" icon={Trash2}
            title={isKh ? "បញ្ជាក់ការលុប" : "Confirm Delete"}
            description={isKh ? "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។" : "This action cannot be undone."}
            highlight={delItem?.title}
            confirmLabel={isKh ? "លុបចោល" : "Delete"}
            cancelLabel={isKh ? "បោះបង់" : "Cancel"}
         />
      </div>
   )
}