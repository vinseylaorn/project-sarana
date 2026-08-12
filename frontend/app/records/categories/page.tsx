"use client"

import { useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTableCustom } from "@/components/ui/table"
import {
   Dialog, DialogContent, DialogHeader, DialogTitle,
   DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
   AlertDialog, AlertDialogAction, AlertDialogCancel,
   AlertDialogContent, AlertDialogDescription,
   AlertDialogFooter, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
   Select, SelectContent, SelectItem,
   SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import {
   Search, Plus, Eye, Edit2, Trash2, Loader2,
   Tags, Calendar, RotateCcw, Filter, AlertTriangle,
   TrendingUp, TrendingDown, RefreshCw, Package, Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePermission } from "@/lib/role-context"
import { toastSuccess, toastError, toastWarn } from "@/lib/toast"
import { useTranslation } from "react-i18next"

import {
   useFinanceCategories, useExpensesForCategoryCount,
   useIncomesForCategoryCount, useFinanceCategoryMutations,
} from "@/hooks/finances/use-category"

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }

const ACCENT_CLASS = {
   text: "text-[#03624C] dark:text-[#1857D8]",
   bg: "bg-[#03624C] dark:bg-[#1857D8]",
   border: "border-[#03624C]/30 dark:border-[#1857D8]/30",
   iconBg: "bg-[#03624C] dark:bg-[#1857D8]",
}

const INPUT_BASE =
   "w-full h-9 px-3 text-[14px] rounded-lg outline-none transition-all " +
   "bg-white dark:bg-[#22263a] border border-gray-200/80 dark:border-white/[0.08] " +
   "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/30 " +
   "focus:border-[#03624C] dark:focus:border-[#1857D8] focus:ring-2 focus:ring-[#03624C]/10 " +
   "dark:focus:ring-[#1857D8]/10 shadow-sm dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"

const SEL_C = "bg-white dark:bg-[#22263a] border-gray-100 dark:border-white/[0.12] rounded-xl"
const SEL_I = "text-[14px] text-gray-800 dark:text-white/80 focus:bg-[#03624C]/10 dark:focus:bg-[#1857D8]/10 dark:focus:text-[#6b9fff]"

const KPI = {
   total: {
      bg: "bg-white dark:bg-[#22263a]",
      border: "border-white dark:border-[#22263a]",
      text: "!text-emerald-600 dark:!text-emerald-400",
      label: "text-gray-600 dark:text-gray-200",
      icon: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
   },
   income: {
      bg: "bg-white dark:bg-[#22263a]",
      border: "border-white dark:border-[#22263a]",
      text: "!text-blue-600 dark:!text-blue-400",
      label: "text-gray-600 dark:text-gray-200",
      icon: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-500/10",
   },
   expense: {
      bg: "bg-white dark:bg-[#22263a]",
      border: "border-white dark:border-[#22263a]",
      text: "!text-[#03624C] dark:!text-violet-400",
      label: "text-gray-600 dark:text-gray-200",
      icon: "text-[#03624C] dark:text-[#03624C]",
      iconBg: "bg-violet-50 dark:bg-violet-500/10",
   },
}

function KpiCard({
   label, value, sub, style, icon: Icon, delay, isText = false,
}: {
   label: string
   value: number | string
   sub?: string
   style: typeof KPI.total
   icon: React.ElementType
   delay: number
   isText?: boolean
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
                  <p className={cn("flex items-center gap-1.5 min-w-0 text-[14px] uppercase", style.label)}>
                     <span className="truncate">{label}</span>
                  </p>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", style.iconBg)}>
                     <Icon className={cn("w-4 h-4", style.icon)} />
                  </div>
               </div>
               <p className={cn(
                  "text-[22px] text-center leading-none tabular-nums mb-2.5",
                  isText && "truncate px-1",
                  style.text
               )}>
                  {value}
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

function formatDateTime(dateStr?: string | null): string {
   if (!dateStr) return "—"
   const d = new Date(dateStr)
   if (isNaN(d.getTime())) return dateStr
   const dd = String(d.getDate()).padStart(2, "0")
   const mm = String(d.getMonth() + 1).padStart(2, "0")
   const yyyy = d.getFullYear()
   const hh = String(d.getHours()).padStart(2, "0")
   const min = String(d.getMinutes()).padStart(2, "0")
   return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

interface ApiFinanceCategory {
   id?: string | number
   name: string
   type: "income" | "expense"
   date?: string
   created_at?: string
   updated_at?: string
}

const ErrMsg = ({ msg }: { msg: string }) => (
   <p className="flex items-center gap-1 text-[14px] text-rose-500 dark:text-rose-400 mt-1">
      <AlertTriangle className="w-3 h-3 shrink-0" />{msg}
   </p>
)

export default function FinanceCategoriesPage() {
   const { i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"
   const { can } = usePermission("finance")

   const { data: categories = [], isLoading: loadingCats, isFetching: fetchingCats, refetch: refetchCats } = useFinanceCategories()
   const { data: expenses = [], isLoading: loadingExps, isFetching: fetchingExps } = useExpensesForCategoryCount()
   const { data: incomes = [], isLoading: loadingIncs, isFetching: fetchingIncs } = useIncomesForCategoryCount()
   const { create, update, remove } = useFinanceCategoryMutations()

   const loading = loadingCats || loadingExps || loadingIncs
   const isFetching = fetchingCats || fetchingExps || fetchingIncs

   const [search, setSearch] = useState("")
   const [typeFilter, setTypeFilter] = useState("all")
   const [startDate, setStartDate] = useState("")
   const [endDate, setEndDate] = useState("")
   const [isDialogOpen, setIsDialogOpen] = useState(false)
   const [isViewMode, setIsViewMode] = useState(false)
   const [currentCat, setCurrentCat] = useState<any>(null)
   const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
   const [itemToDelete, setItemToDelete] = useState<ApiFinanceCategory | null>(null)
   const [deleteItemCount, setDeleteItemCount] = useState(0)
   const [nameError, setNameError] = useState<string | undefined>()
   const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: "created_at", direction: "desc" })
   const [currentPage, setCurrentPage] = useState(1)
   const itemsPerPage = 10
   const originalSnapshot = useRef<string>("")

   const countForCategory = (name: string) =>
      expenses.filter((e: any) => e.category === name).length +
      incomes.filter((i: any) => i.category === name).length

   const handleOpenAdd = () => {
      setIsViewMode(false)
      setCurrentCat({ name: "", type: "income" })
      setNameError(undefined)
      originalSnapshot.current = ""
      setIsDialogOpen(true)
   }

   const handleOpenEdit = (item: ApiFinanceCategory) => {
      setIsViewMode(false)
      setCurrentCat({ ...item })
      setNameError(undefined)
      originalSnapshot.current = JSON.stringify({ name: item.name, type: item.type })
      setIsDialogOpen(true)
   }

   const handleOpenDelete = (item: ApiFinanceCategory) => {
      setItemToDelete(item)
      setDeleteItemCount(countForCategory(item.name))
      setIsDeleteAlertOpen(true)
   }

   const handleSave = async () => {
      if (!currentCat?.name?.trim()) {
         setNameError(isKh ? "សូមបញ្ចូលឈ្មោះ" : "Name is required")
         return
      }
      if (currentCat.id) {
         const snap = JSON.stringify({ name: currentCat.name, type: currentCat.type })
         if (snap === originalSnapshot.current) {
            toastWarn(
               isKh ? "មិនមានការផ្លាស់ប្តូរ" : "No changes detected",
               isKh ? "សូមកែប្រែមុនរក្សាទុក" : "Please make changes before saving"
            )
            return
         }
      }
      try {
         if (currentCat.id) {
            const updated = await update.mutateAsync({ id: currentCat.id, payload: { name: currentCat.name, type: currentCat.type } })
            toastSuccess(
               isKh ? "កែប្រែបានជោគជ័យ" : "Updated successfully",
               isKh ? `ប្រភេទ "${updated.name}" ត្រូវបានកែប្រែ` : `Category "${updated.name}" updated`
            )
         } else {
            const created = await create.mutateAsync({ name: currentCat.name, type: currentCat.type })
            toastSuccess(
               isKh ? "បន្ថែមបានជោគជ័យ" : "Created successfully",
               isKh ? `ប្រភេទ "${created.name}" ត្រូវបានបន្ថែម` : `Category "${created.name}" created`
            )
         }
         setIsDialogOpen(false)
      } catch (err: any) {
         toastError(err?.message ?? (isKh ? "មានបញ្ហា" : "Something went wrong"))
      }
   }

   const confirmDelete = async () => {
      if (!itemToDelete) return
      try {
         await remove.mutateAsync(Number(itemToDelete.id))
         toastSuccess(
            isKh ? "លុបបានជោគជ័យ" : "Deleted successfully",
            isKh
               ? `ប្រភេទ "${itemToDelete.name}" ត្រូវបានលុប`
               : `Category "${itemToDelete.name}" deleted`
         )
         setIsDeleteAlertOpen(false)
         setItemToDelete(null)
         setDeleteItemCount(0)
      } catch (err: any) {
         toastError(err?.message ?? (isKh ? "លុបមិនបាន" : "Failed to delete"))
      }
   }

   const hasFilter = search || typeFilter !== "all" || startDate || endDate

   const reset = () => {
      setSearch(""); setTypeFilter("all"); setStartDate(""); setEndDate(""); setCurrentPage(1)
   }

   const processedData = useMemo(() => {
      let r = categories.filter((c: ApiFinanceCategory) => {
         const matchSearch = (c.name || "").toLowerCase().includes(search.toLowerCase())
         const matchType = typeFilter === "all" || c.type === typeFilter
         const dateStr = c.created_at?.slice(0, 10) || c.date || ""
         const matchStart = !startDate || dateStr >= startDate
         const matchEnd = !endDate || dateStr <= endDate
         return matchSearch && matchType && matchStart && matchEnd
      })
      if (sortConfig.key) {
         r.sort((a: any, b: any) => {
            const vA = a[sortConfig.key!] || ""
            const vB = b[sortConfig.key!] || ""
            return sortConfig.direction === "asc"
               ? vA < vB ? -1 : vA > vB ? 1 : 0
               : vA > vB ? -1 : vA < vB ? 1 : 0
         })
      }
      return r
   }, [categories, search, typeFilter, startDate, endDate, sortConfig])

   const incomeCount = useMemo(() => categories.filter((c: ApiFinanceCategory) => c.type === "income").length, [categories])
   const expenseCount = useMemo(() => categories.filter((c: ApiFinanceCategory) => c.type === "expense").length, [categories])

   const columns = [
      {
         key: "no",
         header: isKh ? "ល.រ" : "No.",
         render: (_: any, i: number) => (
            <span className="text-[14px] text-gray-600 dark:text-white/25 font-mono tabular-nums">
               {String((currentPage - 1) * itemsPerPage + i + 1).padStart(2, "0")}
            </span>
         ),
      },
      {
         key: "name",
         header: isKh ? "ឈ្មោះប្រភេទ" : "Category Name",
         sortable: true,
         render: (item: ApiFinanceCategory) => (
            <div className="flex items-center gap-2.5">
               <span className="text-gray-800 dark:text-white text-[14px] tracking-wide">{item.name}</span>
            </div>
         ),
      },
      {
         key: "type",
         header: isKh ? "ប្រភេទនៃCategory" : "Type of Category",
         render: (item: ApiFinanceCategory) => (
            <Badge variant="outline" className={cn(
               "text-[12px] uppercase tracking-wider px-2.5 py-0.5 border shadow-none",
               item.type === "income"
                  ? "bg-[#03624C]/20 dark:bg-[#1857D8]/10 text-[#03624C] dark:text-[#1857D8] border-[#03624C] dark:border-[#1857D8]/25"
                  : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/25"
            )}>
               {item.type === "income" ? (isKh ? "ចំណូល" : "Income") : (isKh ? "ចំណាយ" : "Expense")}
            </Badge>
         ),
      },
      {
         key: "created_at",
         header: isKh ? "បង្កើតនៅ" : "Created At",
         sortable: true,
         render: (item: ApiFinanceCategory) => {
            const raw = item.created_at || item.date
            if (!raw) return <span className="text-gray-300 dark:text-white/20 text-[14px]">—</span>
            const d = new Date(raw)
            const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
            const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            return (
               <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] text-gray-700 dark:text-white/70">{date}</span>
                  <span className="text-[12px] text-gray-400 dark:text-white/30">{time}</span>
               </div>
            )
         },
      },
      {
         key: "updated_at",
         header: isKh ? "កែប្រែនៅ" : "Updated At",
         sortable: true,
         render: (item: ApiFinanceCategory) => {
            const raw = item.updated_at
            if (!raw) return <span className="text-gray-300 dark:text-white/20 text-[14px]">—</span>
            const d = new Date(raw)
            const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
            const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            return (
               <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] text-gray-700 dark:text-white/70">{date}</span>
                  <span className="text-[12px] text-gray-400 dark:text-white/30">{time}</span>
               </div>
            )
         },
      },
      {
         key: "record_count",
         header: isKh ? "ចំនួនកំណត់ត្រា​​" : "Records Count",
         render: (item: ApiFinanceCategory) => {
            const count = countForCategory(item.name)
            return (
               <span className={cn(
                  "inline-flex items-center gap-1 text-[14px] px-2.5 py-0.5 rounded-full border",
                  "text-[#03624C] dark:text-white",
                  "bg-[#03624C]/10 dark:bg-[#1857D8]",
                  "border-[#03624C]/20 dark:border-[#1857D8]",
               )}>
                  <Package className="w-3 h-3" />
                  {count} {isKh ? "កំណត់ត្រា" : "records"}
               </span>
            )
         },
      },
      {
         key: "actions",
         header: isKh ? "សកម្មភាព" : "Actions",
         className: "text-right",
         render: (item: ApiFinanceCategory) => (
            <div className="flex items-center justify-end gap-1.5">
               <button
                  onClick={() => { setCurrentCat(item); setIsViewMode(true); setIsDialogOpen(true) }}
                  className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                  text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300
                  dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-700/40
                  dark:hover:bg-blue-900/40 dark:hover:border-blue-500 transition-all duration-150"
                  title={isKh ? "មើលព័ត៌មាន" : "View Details"} >
                  <Eye className="w-3.5 h-3.5" />
               </button>
               {can("edit") && (
                  <button
                     onClick={() => handleOpenEdit(item)}
                     className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                     text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300
                     dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-700/40
                     dark:hover:bg-amber-900/40 dark:hover:border-amber-500 transition-all duration-150"
                     title={isKh ? "កែប្រែ" : "Edit"} >
                     <Edit2 className="w-3.5 h-3.5" />
                  </button>
               )}
               {can("delete") && (
                  <button
                     onClick={() => handleOpenDelete(item)}
                     className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                     text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300
                     dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-700/40
                     dark:hover:bg-rose-900/40 dark:hover:border-rose-500 transition-all duration-150"
                     title={isKh ? "លុបចោល" : "Delete"} >
                     <Trash2 className="w-3.5 h-3.5" />
                  </button>
               )}
            </div>
         ),
      },
   ]

   const showInitialLoading = loading && categories.length === 0

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
               title={isKh ? "ប្រភេទចំណូល និងចំណាយ" : "Finance Categories"}
               subtitle={isKh ? "គ្រប់គ្រងប្រភេទចំណូល និងចំណាយ" : "Manage income and expense categories"}
            />
            {showInitialLoading ? (
               <div className="flex-1 flex items-center justify-center flex-col gap-4">
                  <Loader2 className={cn("w-5 h-5 animate-spin", ACCENT_CLASS.text)} />
                  <span className={cn("text-[12px] uppercase tracking-[0.2em] animate-pulse", ACCENT_CLASS.text)}>
                     {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
                  </span>
               </div>
            ) : (
               <main className="flex-1 p-5 space-y-4 overflow-hidden flex flex-col">

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 shrink-0">
                     <KpiCard
                        label={isKh ? "ប្រភេទសរុប" : "Total Categories"}
                        value={categories.length}
                        style={KPI.total} icon={Tags} delay={0}
                        sub={isKh ? "ប្រភេទ" : "categories"}
                     />
                     <KpiCard
                        label={isKh ? "ប្រភេទចំណូល" : "Income Types"}
                        value={incomeCount}
                        style={KPI.income} icon={TrendingUp} delay={0.07}
                        sub={isKh ? "ប្រភេទ" : "categories"}
                     />
                     <KpiCard
                        label={isKh ? "ប្រភេទចំណាយ" : "Expense Types"}
                        value={expenseCount}
                        style={KPI.expense} icon={TrendingDown} delay={0.14}
                        sub={isKh ? "ប្រភេទ" : "categories"}
                     />
                  </div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.2 }}
                     className="flex flex-wrap gap-2 items-center justify-between shrink-0" >
                     <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white/25 pointer-events-none" />
                           <input
                              className={cn(INPUT_BASE, "w-56 pl-8")}
                              placeholder={isKh ? "ស្វែងរកប្រភេទ..." : "Search category..."}
                              value={search}
                              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                           />
                        </div>
                        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07] shrink-0" />
                        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setCurrentPage(1) }}>
                           <SelectTrigger className="h-9 text-[14px] font-medium rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] text-gray-700 dark:text-white/70 shadow-sm w-40">
                              <Filter className={cn("w-3.5 h-3.5 mr-1.5 shrink-0", ACCENT_CLASS.text)} />
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="all" className={SEL_I}>{isKh ? "ទាំងអស់" : "All Types"}</SelectItem>
                              <SelectItem value="income" className={SEL_I}>{isKh ? "ចំណូល" : "Income"}</SelectItem>
                              <SelectItem value="expense" className={SEL_I}>{isKh ? "ចំណាយ" : "Expense"}</SelectItem>
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
                                 onClick={reset}
                                 className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all" >
                                 <RotateCcw className="w-3.5 h-3.5" />
                              </motion.button>
                           )}
                        </AnimatePresence>
                        <button
                           onClick={() => refetchCats()}
                           className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] text-gray-400 dark:text-white/40 hover:text-[#03624C] dark:hover:text-[#1857D8] transition-all" >
                           <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
                        </button>
                     </div>
                     {can("create") && (
                        <button
                           onClick={handleOpenAdd}
                           className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] text-white transition-all active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                           <Plus className="w-3.5 h-3.5" /> {isKh ? "បន្ថែមប្រភេទ" : "Add Category"}
                        </button>
                     )}
                  </motion.div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.28 }}
                     className="flex-1 overflow-hidden" >
                     <Card className="h-full border-0 shadow-none bg-transparent flex flex-col">
                        <DataTableCustom
                           data={processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                           columns={columns}
                           sortConfig={sortConfig}
                           onSort={key => setSortConfig(prev => ({
                              key,
                              direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
                           }))}
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
         <Dialog open={isDialogOpen} onOpenChange={v => { if (!(create.isPending || update.isPending)) setIsDialogOpen(v) }}>
            <DialogContent
               className="max-w-sm p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden"
               style={SORA} >
               <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0 bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
                  <div className="flex items-center gap-2.5">
                     <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", ACCENT_CLASS.iconBg)}>
                        <Tags className="w-4 h-4 text-white" />
                     </div>
                     <div>
                        <DialogTitle className="text-[16px] text-gray-800 dark:text-white/90 leading-tight">
                           {isViewMode
                              ? (isKh ? "ព័ត៌មានលម្អិត" : "View Details")
                              : currentCat?.id
                                 ? (isKh ? "កែប្រែប្រភេទ" : "Edit Category")
                                 : (isKh ? "បន្ថែមប្រភេទថ្មី" : "Add New Category")}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Finance category form</DialogDescription>
                     </div>
                  </div>
               </DialogHeader>
               <div className="px-6 py-5 space-y-3">
                  <div className="space-y-1.5">
                     <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", nameError && "text-rose-500")}>
                        {isKh ? "ឈ្មោះប្រភេទ" : "Category Name"}
                        {!isViewMode && <span className="text-rose-500 ml-0.5">*</span>}
                     </Label>
                     <input
                        disabled={isViewMode}
                        autoFocus
                        className={cn(INPUT_BASE, nameError && "border-rose-400 dark:border-rose-500/50 focus:border-rose-400")}
                        value={currentCat?.name || ""}
                        onChange={e => { setCurrentCat({ ...currentCat, name: e.target.value }); setNameError(undefined) }}
                        onKeyDown={e => e.key === "Enter" && !isViewMode && handleSave()}
                        placeholder={isKh ? "បញ្ចូលឈ្មោះ..." : "Enter name..."}
                     />
                     {nameError && <ErrMsg msg={nameError} />}
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-[14px] text-gray-600 dark:text-white/30">
                        {isKh ? "ប្រើសម្រាប់" : "Type"}
                     </Label>
                     <Select
                        disabled={isViewMode}
                        value={currentCat?.type || "income"}
                        onValueChange={v => setCurrentCat({ ...currentCat, type: v })} >
                        <SelectTrigger className="h-9 text-[14px] font-medium rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] text-gray-700 dark:text-white/70 shadow-sm w-full">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={SEL_C} style={SORA}>
                           <SelectItem value="income" className={SEL_I}>{isKh ? "ចំណូល" : "Income"}</SelectItem>
                           <SelectItem value="expense" className={SEL_I}>{isKh ? "ចំណាយ" : "Expense"}</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  {isViewMode && currentCat?.name && (
                     <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                        <Package className={cn("w-3.5 h-3.5 shrink-0", ACCENT_CLASS.text)} />
                        <span className="text-[14px] text-gray-600 dark:text-white/30 w-24 shrink-0">
                           {isKh ? "កំណត់ត្រា" : "Records"}
                        </span>
                        <span className="text-[14px] text-gray-800 dark:text-white/85">
                           {countForCategory(currentCat.name)} {isKh ? "កំណត់ត្រា" : "records"}
                        </span>
                     </div>
                  )}
                  {currentCat?.created_at && (
                     <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                        <Calendar className={cn("w-3.5 h-3.5 shrink-0", ACCENT_CLASS.text)} />
                        <span className="text-[14px] text-gray-600 dark:text-white/30 w-24 shrink-0">
                           {isKh ? "បង្កើតនៅ" : "Created"}
                        </span>
                        <span className="text-[14px] text-gray-800 dark:text-white/85">
                           {formatDateTime(currentCat.created_at)}
                        </span>
                     </div>
                  )}
                  {currentCat?.updated_at && (
                     <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-amber-500 dark:text-amber-400" />
                        <span className="text-[14px] text-gray-600 dark:text-white/30 w-24 shrink-0">
                           {isKh ? "កែប្រែនៅ" : "Updated"}
                        </span>
                        <span className="text-[14px]  text-gray-800 dark:text-white/85">
                           {formatDateTime(currentCat.updated_at)}
                        </span>
                     </div>
                  )}
                  {!currentCat?.created_at && isViewMode && currentCat?.date && (
                     <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                        <Calendar className={cn("w-3.5 h-3.5 shrink-0", ACCENT_CLASS.text)} />
                        <span className="text-[14px] text-gray-600 dark:text-white/30 w-24 shrink-0">
                           {isKh ? "កាលបរិច្ឆេទ" : "Date"}
                        </span>
                        <span className="text-[14px]  text-gray-800 dark:text-white/85">
                           {currentCat.date}
                        </span>
                     </div>
                  )}
               </div>
               {!isViewMode && (
                  <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg">
                     <div className="flex justify-end gap-2 w-full">
                        <button
                           onClick={() => setIsDialogOpen(false)}
                           disabled={create.isPending || update.isPending}
                           className="h-9 px-5 rounded-lg text-[14px] transition-all border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50" >
                           {isKh ? "បោះបង់" : "Cancel"}
                        </button>
                        <button
                           onClick={handleSave}
                           disabled={create.isPending || update.isPending}
                           className="h-9 px-6 rounded-lg text-[14px] text-white flex items-center gap-2 transition-all disabled:opacity-60 active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                           {(create.isPending || update.isPending) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                           {(create.isPending || update.isPending) ? (isKh ? "កំពុងរក្សា..." : "Saving...") : (isKh ? "រក្សាទុក" : "Save")}
                        </button>
                     </div>
                  </DialogFooter>
               )}
               {isViewMode && (
                  <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg">
                     <div className="flex justify-end w-full">
                        <button
                           onClick={() => setIsDialogOpen(false)}
                           className="h-9 px-5 rounded-lg text-[14px] transition-all border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                        >
                           {isKh ? "បិទ" : "Close"}
                        </button>
                     </div>
                  </DialogFooter>
               )}
            </DialogContent>
         </Dialog>
         <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent
               className="rounded-2xl border-0 bg-white dark:bg-[#22263a] shadow-2xl p-0 max-w-[400px] overflow-hidden"
               style={SORA} >
               <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-rose-400" />
               <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                     <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                     </div>
                     <div className="pt-0.5">
                        <AlertDialogTitle className="text-[16px] text-gray-800 dark:text-white/90 mb-1">
                           {isKh ? "បញ្ជាក់ការលុប" : "Confirm Delete"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[14px] text-gray-500 dark:text-white/40 leading-relaxed">
                           {isKh ? "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។" : "This action cannot be undone."}
                        </AlertDialogDescription>
                     </div>
                  </div>
                  {itemToDelete?.name && (
                     <div className="mb-3 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/[0.08] border border-rose-100 dark:border-rose-500/20 flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="text-[14px] font-semibold text-rose-600 dark:text-rose-300 truncate">{itemToDelete.name}</span>
                     </div>
                  )}
                  {deleteItemCount > 0 && (
                     <div className="mb-5 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/[0.08] border border-amber-200 dark:border-amber-500/20 flex items-start gap-2.5">
                        <Package className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-[13px] font-medium text-amber-700 dark:text-amber-300 leading-relaxed">
                           {isKh
                              ? `ប្រភេទនេះមានកំណត់ត្រា ${deleteItemCount} ។ ប្រសិនបើបន្ត កំណត់ត្រាទាំងនោះនឹងត្រូវបានលុបជាមួយគ្នាផងដែរ។`
                              : `This category has ${deleteItemCount} record${deleteItemCount > 1 ? "s" : ""}. Deleting it will also permanently remove ${deleteItemCount > 1 ? "those records" : "that record"}.`}
                        </span>
                     </div>
                  )}
                  <AlertDialogFooter className="gap-2 flex-row justify-end">
                     <AlertDialogCancel
                        style={SORA}
                        onClick={() => { setIsDeleteAlertOpen(false); setItemToDelete(null); setDeleteItemCount(0) }}
                        className="h-9 px-5 rounded-xl text-[14px] border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all" >
                        {isKh ? "បោះបង់" : "Cancel"}
                     </AlertDialogCancel>
                     <AlertDialogAction
                        onClick={confirmDelete}
                        disabled={remove.isPending}
                        style={SORA}
                        className="h-9 px-5 rounded-xl text-[14px] flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border dark:border-rose-500/30 dark:shadow-none disabled:opacity-60 transition-all" >
                        {remove.isPending
                           ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{isKh ? "កំពុងលុប..." : "Deleting..."}</>
                           : <><Trash2 className="w-3.5 h-3.5" />{isKh ? "លុបចោល" : "Delete"}</>
                        }
                     </AlertDialogAction>
                  </AlertDialogFooter>
               </div>
            </AlertDialogContent>
         </AlertDialog>
      </div>
   )
}