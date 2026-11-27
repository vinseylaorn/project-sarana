"use client"

import React, { useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import { DataTableCustom } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
   Search, Plus, Eye, Edit2, Loader2,
   TrendingDown, Calendar, Trash2, RotateCcw, RefreshCw,
   Box, Filter, Tag, AlertTriangle, DollarSign, Sun,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Expense } from "@/types"
import { usePermission } from "@/lib/role-context"
import { useSettings } from "@/lib/settings-context"
import { toastSuccess, toastError, toastWarn } from "@/lib/toast"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { DatePicker } from "@/components/ui/DatePicker"
import { useFinanceCategories } from "@/hooks/finances/use-category"
import { useExpenses, useExpenseMutations } from "@/hooks/finances/use-expense"

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }

const ACCENT = {
   text: "text-[#03624C] dark:text-[#1857D8]",
   iconBg: "bg-[#03624C] dark:bg-[#1857D8]",
}

const INPUT =
   "w-full h-9 px-3 text-[14px] rounded-lg outline-none transition-all " +
   "bg-white dark:bg-[#22263a] border border-gray-200/80 dark:border-white/[0.08] " +
   "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/30 " +
   "focus:border-[#03624C] dark:focus:border-[#1857D8] focus:ring-2 focus:ring-[#03624C]/10 " +
   "dark:focus:ring-[#1857D8]/10 shadow-sm dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"

const SEL_T =
   "h-9 text-[14px] rounded-lg border border-gray-200/80 dark:border-white/[0.08] " +
   "bg-white dark:bg-[#22263a] text-gray-700 dark:text-white/70 shadow-sm dark:shadow-none"

const SEL_C = "bg-white dark:bg-[#22263a] border-gray-100 dark:border-white/[0.12] rounded-xl"
const SEL_I = "text-[14px] text-gray-800 dark:text-white/80 focus:bg-[#03624C]/10 dark:focus:bg-[#1857D8]/10"
const ERR = "border-rose-400 dark:border-rose-500/50 focus:border-rose-400"

const KPI = {
   total: {
      bg: "bg-white dark:bg-[#22263a]",
      border: "border-white dark:border-[#22263a]",
      text: "!text-emerald-600 dark:!text-emerald-400",
      label: "text-gray-600 dark:text-gray-200",
      icon: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
   },
   today: {
      bg: "bg-white dark:bg-[#22263a]",
      border: "border-white dark:border-[#22263a]",
      text: "!text-blue-600 dark:!text-blue-400",
      label: "text-gray-600 dark:text-gray-200",
      icon: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-500/10",
   },
   avg: {
      bg: "bg-white dark:bg-[#22263a]",
      border: "border-white dark:border-[#22263a]",
      text: "!text-[#03624C] dark:!text-violet-400",
      label: "text-gray-600 dark:text-gray-200",
      icon: "text-[#03624C] dark:text-[#03624C]",
      iconBg: "bg-violet-50 dark:bg-violet-500/10",
   },
   rose: {
      bg: "bg-white dark:bg-[#22263a]",
      border: "border-white dark:border-[#22263a]",
      text: "!text-amber-600 dark:!text-amber-400",
      label: "text-gray-600 dark:text-gray-200",
      icon: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-500/10",
   },
}

const ErrMsg = ({ msg }: { msg: string }) => (
   <p className="flex items-center gap-1 text-[14px] text-rose-500 dark:text-rose-400 mt-1">
      <AlertTriangle className="w-3 h-3 shrink-0" />{msg}
   </p>
)

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
   label, value, sub, prefix, style, icon: Icon, delay,
}: {
   label: string
   value: number
   sub?: string
   prefix: string
   style: typeof KPI.total
   icon: React.ElementType
   delay: number
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
                  title={`${prefix}${value.toFixed(2)}`} >
                  {prefix}{formatCompact(value)}
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

export default function ExpensePage() {
   const { t, i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"
   // FIX: ប្រើ key "expense" (role-context ធ្លាក់ទៅ "finance" ស្វ័យប្រវត្តិបើគ្មាន key expense)
   const { can } = usePermission("expense")
   const settings = useSettings()
   const cur = (settings as any).currencySymbol || (settings as any).currency || "$"

   const {
      data: expenseList = [],
      isLoading: loadingExpenses,
      isFetching: fetchingExpenses,
      refetch: refetchExpenses,
   } = useExpenses()
   const {
      data: allCats = [],
      isLoading: loadingCats,
      isFetching: fetchingCats,
   } = useFinanceCategories()
   const categories = useMemo(() => allCats.filter((c: any) => c.type === "expense"), [allCats])
   const { create, update, remove } = useExpenseMutations()

   const loading = loadingExpenses || loadingCats
   const isFetching = fetchingExpenses || fetchingCats
   const saving = create.isPending || update.isPending
   const deleting = remove.isPending

   const [search, setSearch] = useState("")
   const [startDate, setStartDate] = useState("")
   const [endDate, setEndDate] = useState("")
   const [categoryFilter, setCategoryFilter] = useState("all")
   const [currentPage, setCurrentPage] = useState(1)
   const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: "date", direction: "desc" })
   const itemsPerPage = 10

   const [isDialogOpen, setIsDialogOpen] = useState(false)
   const [isViewMode, setIsViewMode] = useState(false)
   const [currentItem, setCurrentItem] = useState<any>(null)
   const [itemToDelete, setItemToDelete] = useState<any>(null)
   const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
   const [fieldErrors, setFieldErrors] = useState<{ title?: string; amount?: string; category?: string }>({})
   const originalSnapshot = useRef<string>("")

   const totalExpense = useMemo(
      () => expenseList.reduce((s: number, i: Expense) => s + Number(i.amount), 0),
      [expenseList]
   )
   const todayExpense = useMemo(() => {
      const today = new Date().toISOString().split("T")[0]
      return expenseList
         .filter((i: Expense) => i.date === today)
         .reduce((s: number, i: Expense) => s + Number(i.amount), 0)
   }, [expenseList])
   const avgExpense = useMemo(
      () => (expenseList.length ? totalExpense / expenseList.length : 0),
      [expenseList, totalExpense]
   )

   const resetFilters = () => {
      setSearch(""); setCategoryFilter("all"); setStartDate(""); setEndDate(""); setCurrentPage(1)
   }
   const hasFilter = search || startDate || endDate || categoryFilter !== "all"

   const handleOpenAdd = () => {
      setIsViewMode(false)
      setCurrentItem({ title: "", amount: "", category: "", date: new Date().toISOString().split("T")[0], isAuto: false })
      setFieldErrors({})
      originalSnapshot.current = ""
      setIsDialogOpen(true)
   }

   const handleOpenEdit = (item: any) => {
      setIsViewMode(false)
      setCurrentItem({ ...item })
      setFieldErrors({})
      originalSnapshot.current = JSON.stringify({ title: item.title, amount: Number(item.amount), category: item.category, date: item.date })
      setIsDialogOpen(true)
   }

   const handleSave = async () => {
      const errs: typeof fieldErrors = {}
      if (!currentItem.title?.trim()) errs.title = isKh ? "សូមបញ្ចូលបរិយាយ" : "Description is required"
      if (!currentItem.amount || Number(currentItem.amount) <= 0) errs.amount = isKh ? "សូមបញ្ចូលទឹកប្រាក់ត្រឹមត្រូវ" : "Please enter a valid amount"
      if (!currentItem.category) errs.category = isKh ? "សូមជ្រើសរើសប្រភេទ" : "Please select a category"
      if (Object.keys(errs).length) { setFieldErrors(errs); return }

      const isAuto = currentItem.isAuto || currentItem.is_auto

      if (currentItem.id && !isAuto) {
         const snap = JSON.stringify({ title: currentItem.title, amount: Number(currentItem.amount), category: currentItem.category, date: currentItem.date })
         if (snap === originalSnapshot.current) {
            toastWarn(isKh ? "មិនមានការផ្លាស់ប្តូរ" : "No changes detected", isKh ? "សូមកែប្រែមុន" : "Make changes first")
            return
         }
      }

      try {
         if (currentItem.id && !isAuto) {
            const updated = await update.mutateAsync({
               id: Number(currentItem.id),
               payload: {
                  title: currentItem.title, amount: Number(currentItem.amount),
                  category: currentItem.category, date: currentItem.date,
               },
            })
            toastSuccess(
               isKh ? "កែប្រែបានជោគជ័យ" : "Updated successfully",
               isKh
                  ? `ការចំណាយ"${updated.title}"ត្រូវបានកែប្រែដោយជោគជ័យ`
                  : `Expense "${updated.title}" has been updated successfully`
            )
         } else {
            const created = await create.mutateAsync({
               title: currentItem.title, amount: Number(currentItem.amount),
               category: currentItem.category,
               date: currentItem.date || new Date().toISOString().split("T")[0],
               is_auto: false,
            })
            toastSuccess(isKh ? "រក្សាទុកបានជោគជ័យ" : "Added successfully",
               isKh
                  ? `ការចំណាយ"${created.title}"ត្រូវបានបន្ថែមដោយជោគជ័យ`
                  : `Expense "${created.title}" has been added successfully`
            )
         }
         setIsDialogOpen(false)
      } catch (err: any) {
         toastError(err?.response?.data?.message ?? err?.message ?? (isKh ? "មានបញ្ហា" : "Something went wrong"))
      }
   }

   const confirmDelete = async () => {
      if (!itemToDelete || itemToDelete.isAuto || itemToDelete.is_auto) return
      try {
         await remove.mutateAsync(Number(itemToDelete.id))
         toastSuccess(
            isKh ? "លុបបានសម្រេច" : "Deleted successfully",
            isKh
               ? `ការចំណាយ"${itemToDelete.title}"ត្រូវបានលុបដោយជោគជ័យ`
               : `Expense "${itemToDelete.title}" has been deleted successfully`
         )
         setIsDeleteAlertOpen(false); setItemToDelete(null)
      } catch (err: any) {
         toastError(err?.response?.data?.message ?? err?.message ?? (isKh ? "លុបមិនបាន" : "Failed to delete"))
      }
   }

   const filteredData = useMemo(() => {
      let r = expenseList.filter((i: Expense) => {
         const ms = (i.title || "").toLowerCase().includes(search.toLowerCase())
         const md = (!startDate || (i.date || "") >= startDate) && (!endDate || (i.date || "") <= endDate)
         const mc = categoryFilter === "all" || i.category === categoryFilter
         return ms && md && mc
      })
      if (sortConfig.key) {
         r = [...r].sort((a: any, b: any) => {
            let aV = a[sortConfig.key!] ?? ""; let bV = b[sortConfig.key!] ?? ""
            if (sortConfig.key === "amount") { aV = Number(aV); bV = Number(bV) }
            return sortConfig.direction === "asc"
               ? (aV < bV ? -1 : aV > bV ? 1 : 0)
               : (aV > bV ? -1 : aV < bV ? 1 : 0)
         })
      }
      return r
   }, [expenseList, search, startDate, endDate, categoryFilter, sortConfig])

   const columns = [
      {
         key: "no", header: isKh ? "ល.រ" : "No.",
         render: (_: any, i: number) => (
            <span className="text-[14px] text-gray-600 dark:text-white/30 font-mono tabular-nums">
               {String((currentPage - 1) * itemsPerPage + i + 1).padStart(2, "0")}
            </span>
         ),
      },
      {
         key: "title", sortable: true, header: isKh ? "បរិយាយ" : "Description",
         render: (item: any) => (
            <div className="flex flex-col leading-tight">
               <span className=" text-gray-800 dark:text-white text-[14px]">{item.title}</span>
               <span className={cn("text-[12px] font-medium opacity-70", ACCENT.text)}>
                  {item.isAuto || item.is_auto ? (isKh ? "ស្វ័យប្រវត្តិ" : "Auto") : (isKh ? "បន្ថែមដោយដៃ" : "Manual")}
               </span>
            </div>
         ),
      },
      {
         key: "category", header: isKh ? "ប្រភេទ" : "Category",
         render: (item: any) => (
            <Badge variant="outline" className={cn(
               "flex items-center gap-1  py-0.5 shadow-none border uppercase text-[12px] tracking-wider",
               item.isAuto || item.is_auto
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/25"
                  : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/25"
            )}>
               {item.isAuto || item.is_auto ? <Box className="w-2.5 h-2.5" /> : <Tag className="w-2.5 h-2.5" />}
               {item.category || "—"}
            </Badge>
         ),
      },
      {
         key: "date", sortable: true, header: isKh ? "កាលបរិច្ឆេទ" : "Date",
         render: (item: any) => (
            <div className="flex items-center gap-1.5 text-[14px] text-gray-700 dark:text-white/80">
               <Calendar className={cn("w-3 h-3 shrink-0", ACCENT.text)} />
               {item.date?.split("-").reverse().join("/") || "—"}
            </div>
         ),
      },
      {
         key: "amount", sortable: true, header: isKh ? "ទឹកប្រាក់" : "Amount",
         render: (item: any) => (
            <span className="text-rose-600 dark:text-rose-400 text-[14px]">
               -{cur}{Number(item.amount).toFixed(2)}
            </span>
         ),
      },
      {
         key: "actions",
         header: isKh ? "សកម្មភាព" : "Action",
         className: "text-right",
         render: (item: any) => {
            const isAuto = item.isAuto || item.is_auto
            return (
               <div className="flex items-center justify-end gap-1.5">
                  <button
                     onClick={() => { setCurrentItem(item); setIsViewMode(true); setIsDialogOpen(true) }}
                     className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                     text-blue-700 bg-blue-50 border border-blue-200
                     hover:bg-blue-100 hover:border-blue-300
                     dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-700/40
                     dark:hover:bg-blue-900/40 dark:hover:border-blue-500
                     transition-all duration-150"
                     title={isKh ? "មើលព័ត៌មាន" : "View Details"} >
                     <Eye className="w-3.5 h-3.5" />
                  </button>
                  {!isAuto && can("edit") && (
                     <button
                        onClick={() => handleOpenEdit(item)}
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
                  {!isAuto && can("delete") && (
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
            )
         },
      },
   ]

   const showInitialLoading = loading && expenseList.length === 0

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
               title={isKh ? "បញ្ជីចំណាយ" : "Expense Records"}
               subtitle={isKh ? "គ្រប់គ្រងរាល់ការចំណាយ" : "Manage all expenditures"}
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
                        label={isKh ? "ចំណាយសរុប" : "Total Expense"}
                        value={totalExpense} prefix={cur}
                        style={KPI.total} icon={TrendingDown} delay={0}
                        sub={`${expenseList.length} ${isKh ? "កំណត់ត្រា" : "records"}`}
                     />
                     <KpiCard
                        label={isKh ? "ចំណាយថ្ងៃនេះ" : "Today Expense"}
                        value={todayExpense} prefix={cur}
                        style={KPI.today} icon={Sun} delay={0.07}
                        sub={isKh ? "នៅថ្ងៃនេះ" : "spent today"}
                     />
                     <KpiCard
                        label={isKh ? "ចំណាយត្រងបាន" : "Filtered Total"}
                        value={filteredData.reduce((s: number, i: Expense) => s + Number(i.amount), 0)} prefix={cur}
                        style={KPI.rose} icon={Filter} delay={0.14}
                        sub={`${filteredData.length} ${isKh ? "លទ្ធផល" : "results"}`}
                     />
                     <KpiCard
                        label={isKh ? "មធ្យមចំណាយ" : "Avg per Record"}
                        value={avgExpense} prefix={cur}
                        style={KPI.avg} icon={DollarSign} delay={0.21}
                        sub={isKh ? "ជាមធ្យម" : "average value"}
                     />
                  </div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.25, delay: 0.25 }}
                     className="flex flex-wrap gap-2 items-center justify-between shrink-0" >
                     <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white/30 pointer-events-none" />
                           <input
                              className={cn(INPUT, "w-56 pl-8")}
                              placeholder={isKh ? "ស្វែងរក..." : "Search..."}
                              value={search}
                              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                           />
                        </div>
                        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07] shrink-0" />
                        <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setCurrentPage(1) }}>
                           <SelectTrigger className={cn(SEL_T, "w-44")}>
                              <Filter className={cn("w-3.5 h-3.5 mr-1.5 shrink-0", ACCENT.text)} />
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="all" className={SEL_I}>{isKh ? "គ្រប់ប្រភេទ" : "All"}</SelectItem>
                              {categories.map((c: any) => (
                                 <SelectItem key={c.id} value={c.name} className={SEL_I}>{c.name}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <DateRangePicker
                           startDate={startDate} endDate={endDate}
                           onStartChange={v => { setStartDate(v); setCurrentPage(1) }}
                           onEndChange={v => { setEndDate(v); setCurrentPage(1) }}
                        />
                        <AnimatePresence>
                           {hasFilter && (
                              <motion.button
                                 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                 onClick={resetFilters}
                                 className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all" >
                                 <RotateCcw className="w-3.5 h-3.5" />
                              </motion.button>
                           )}
                        </AnimatePresence>
                        <button
                           onClick={() => refetchExpenses()}
                           className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] text-gray-600 dark:text-white/40 hover:text-[#03624C] dark:hover:text-[#1857D8] transition-all" >
                           <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
                        </button>
                     </div>
                     {can("create") && (
                        <motion.button
                           whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                           whileTap={{ scale: 0.97 }}
                           onClick={handleOpenAdd}
                           className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] text-white transition-all bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                           <Plus className="w-3.5 h-3.5" />{isKh ? "បន្ថែមចំណាយ" : "Add Expense"}
                        </motion.button>
                     )}
                  </motion.div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.25, delay: 0.32 }}
                     className="flex-1 overflow-hidden" >
                     <Card className="h-full border-0 shadow-none bg-transparent flex flex-col">
                        <DataTableCustom
                           data={filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                           columns={columns}
                           sortConfig={sortConfig}
                           onSort={key => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }))}
                           currentPage={currentPage}
                           totalPages={Math.ceil(filteredData.length / itemsPerPage) || 1}
                           onPageChange={setCurrentPage}
                           itemsPerPage={itemsPerPage}
                           totalItems={filteredData.length}
                           language={i18n.language as any}
                        />
                     </Card>
                  </motion.div>
               </main>
            )}
         </div>
         <Dialog open={isDialogOpen} onOpenChange={v => { if (!saving) setIsDialogOpen(v) }}>
            <DialogContent className="max-w-md p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden" style={SORA}>
               <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0 bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
                  <div className="flex items-center gap-2.5">
                     <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", ACCENT.iconBg)}>
                        <TrendingDown className="w-4 h-4 text-white" />
                     </div>
                     <div>
                        <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                           {isViewMode
                              ? (isKh ? "ព័ត៌មានចំណាយ" : "Expense Details")
                              : currentItem?.id
                                 ? (isKh ? "កែប្រែ" : "Edit Expense")
                                 : (isKh ? "បន្ថែមថ្មី" : "Add New Expense")}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Expense form</DialogDescription>
                     </div>
                  </div>
               </DialogHeader>
               <div className="px-6 py-5 space-y-4">
                  <div className="space-y-1.5">
                     <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", fieldErrors.title && "text-rose-500")}>
                        {isKh ? "បរិយាយ" : "Description"}
                        {!isViewMode && <span className="text-rose-500 ml-0.5">*</span>}
                     </Label>
                     <input
                        disabled={isViewMode || currentItem?.isAuto || currentItem?.is_auto}
                        className={cn(INPUT, fieldErrors.title && ERR)}
                        value={currentItem?.title || ""}
                        onChange={e => { setCurrentItem({ ...currentItem, title: e.target.value }); setFieldErrors(er => ({ ...er, title: undefined })) }}
                        placeholder={isKh ? "បញ្ចូលបរិយាយ..." : "Enter description..."}
                     />
                     {fieldErrors.title && <ErrMsg msg={fieldErrors.title} />}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", fieldErrors.amount && "text-rose-500")}>
                           {isKh ? "ទឹកប្រាក់" : "Amount"}
                           {!isViewMode && <span className="text-rose-500 ml-0.5">*</span>}
                        </Label>
                        <input
                           type="number"
                           disabled={isViewMode || currentItem?.isAuto || currentItem?.is_auto}
                           className={cn(INPUT, "text-rose-600 dark:text-rose-400 font-semibold", fieldErrors.amount && ERR)}
                           value={currentItem?.amount || ""}
                           onChange={e => { setCurrentItem({ ...currentItem, amount: e.target.value }); setFieldErrors(er => ({ ...er, amount: undefined })) }}
                           placeholder="0.00"
                        />
                        {fieldErrors.amount && <ErrMsg msg={fieldErrors.amount} />}
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[14px] text-gray-600 dark:text-white/30">
                           {isKh ? "កាលបរិច្ឆេទ" : "Date"}
                        </Label>
                        <DatePicker
                           value={currentItem?.date || ""}
                           onChange={v => setCurrentItem({ ...currentItem, date: v })}
                           disabled={isViewMode || currentItem?.isAuto || currentItem?.is_auto}
                           placeholder="Select date"
                        />
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", fieldErrors.category && "text-rose-500")}>
                        {isKh ? "ប្រភេទ" : "Category"}
                        {!isViewMode && <span className="text-rose-500 ml-0.5">*</span>}
                     </Label>
                     <Select
                        disabled={isViewMode || currentItem?.isAuto || currentItem?.is_auto}
                        value={currentItem?.category || ""}
                        onValueChange={v => { setCurrentItem({ ...currentItem, category: v }); setFieldErrors(er => ({ ...er, category: undefined })) }} >
                        <SelectTrigger className={cn(SEL_T, "w-full", fieldErrors.category && "border-rose-400 dark:border-rose-500/50")}>
                           <SelectValue placeholder={isKh ? "ជ្រើស..." : "Select..."} />
                        </SelectTrigger>
                        <SelectContent className={SEL_C} style={SORA}>
                           {categories.length > 0
                              ? categories.map((c: any) => (
                                 <SelectItem key={c.id} value={c.name} className={SEL_I}>{c.name}</SelectItem>
                              ))
                              : (
                                 <SelectItem value="none" disabled className={SEL_I}>
                                    {isKh ? "សូមបង្កើត Category ជាមុន" : "Create expense category first"}
                                 </SelectItem>
                              )
                           }
                        </SelectContent>
                     </Select>
                     {fieldErrors.category && <ErrMsg msg={fieldErrors.category} />}
                  </div>
               </div>
               <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg">
                  {!isViewMode && !currentItem?.isAuto && !currentItem?.is_auto ? (
                     <div className="flex justify-end gap-2 w-full">
                        <button onClick={() => setIsDialogOpen(false)} disabled={saving}
                           className="h-9 px-5 rounded-lg text-[14px] font-bold transition-all border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50" >
                           {isKh ? "បោះបង់" : "Cancel"}
                        </button>
                        <button onClick={handleSave} disabled={saving}
                           className="h-9 px-6 rounded-lg text-[14px] font-bold text-white flex items-center gap-2 transition-all disabled:opacity-60 active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                           {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                           {saving ? (isKh ? "កំពុងរក្សា..." : "Saving...") : (isKh ? "រក្សាទុក" : "Save")}
                        </button>
                     </div>
                  ) : (
                     <button onClick={() => setIsDialogOpen(false)}
                        className="h-9 px-5 rounded-lg text-[14px] font-bold bg-gray-100 dark:bg-white/[0.08] text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-all" >
                        {isKh ? "បិទ" : "Close"}
                     </button>
                  )}
               </DialogFooter>
            </DialogContent>
         </Dialog>
         <ConfirmDialog
            open={isDeleteAlertOpen}
            onOpenChange={setIsDeleteAlertOpen}
            onConfirm={confirmDelete}
            loading={deleting}
            variant="danger"
            icon={Trash2}
            title={isKh ? "បញ្ជាក់ការលុប" : "Confirm Delete"}
            description={isKh ? "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។" : "This action cannot be undone."}
            highlight={itemToDelete?.title}
            confirmLabel={isKh ? "លុបចោល" : "Delete"}
            cancelLabel={isKh ? "បោះបង់" : "Cancel"}
         />
      </div>
   )
}