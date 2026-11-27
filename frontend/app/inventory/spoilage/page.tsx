"use client"

import { useState, useMemo, useRef } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { DataTableCustom } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
   Search, Plus, Eye, Edit2, Filter, Loader2,
   AlertTriangle, Calendar, Trash2, RotateCcw, RefreshCw, Package,
   Clock, TrendingDown, ShieldAlert, ListFilter, Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Spoilage } from "@/types"
import { usePermission } from "@/lib/role-context"
import { toastSuccess, toastError, toastWarn } from "@/lib/toast"
import { motion, AnimatePresence } from "framer-motion"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { SORA, INPUT, SEL_T, SEL_C, SEL_I, ACCENT, CARD_STYLES, UNIT_MAP, formatDateParts } from "./spoilage.config"

import { useInventory } from "@/hooks/inventory/use-inventory-data"
import { useSpoilage, useSpoilageMutations } from "@/hooks/inventory/use-spoilage-mutations"

const ErrorMsg = ({ msg }: { msg: string }) => (
   <p className="flex items-center gap-1 text-[14px] text-rose-500 dark:text-rose-400 mt-1">
      <AlertTriangle className="w-3 h-3 shrink-0" />{msg}
   </p>
)

const ViewField = ({ icon: Icon, label, children }: { icon: React.ElementType; label?: string; children: React.ReactNode }) => (
   <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
      <Icon className={cn("w-3.5 h-3.5 shrink-0", ACCENT.text)} />
      {label && <span className="text-[14px]  text-gray-600 dark:text-white/30 w-20 shrink-0">{label}</span>}
      <span className="text-[14px] font-semibold text-gray-800 dark:text-white/85">{children}</span>
   </div>
)

const todayStr = () => {
   const d = new Date()
   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function SpoilagePage() {
   const { i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"
   // key ផ្ទាល់ខ្លួន (ធ្លាក់ទៅ key មេស្វ័យប្រវត្តិបើ nav មិនមាន key នេះ)
   const { can } = usePermission("spoilage")

   const canView = can("view")
   const canCreate = can("create")
   const canEdit = can("edit")
   const canDelete = can("delete")

   const deny = () =>
      toastWarn(
         isKh ? "គ្មានសិទ្ធិ" : "Permission denied",
         isKh ? "អ្នកមិនមានសិទ្ធិធ្វើសកម្មភាពនេះទេ" : "You don't have permission to do this"
      )

   const { data: inventory = [], isLoading: loadingInventory, isFetching: fetchingInventory } = useInventory()
   const {
      data: spoilageList = [],
      isLoading: loadingSpoilage,
      isFetching: fetchingSpoilage,
      refetch: refetchSpoilage,
   } = useSpoilage()
   const { create, update, remove } = useSpoilageMutations()

   const loading = loadingInventory || loadingSpoilage
   const isFetching = fetchingInventory || fetchingSpoilage
   const saving = create.isPending || update.isPending
   const deleting = remove.isPending

   const [search, setSearch] = useState("")
   const [categoryFilter, setCategoryFilter] = useState("all")
   const [startDate, setStartDate] = useState("")
   const [endDate, setEndDate] = useState("")
   const [currentPage, setCurrentPage] = useState(1)
   const [isDialogOpen, setIsDialogOpen] = useState(false)
   const [isViewMode, setIsViewMode] = useState(false)
   const [currentItem, setCurrentItem] = useState<any>(null)
   const [itemToDelete, setItemToDelete] = useState<Spoilage | null>(null)
   const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
   const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" })
   const [fieldErrors, setFieldErrors] = useState<{ inventoryId?: string; qty?: string }>({})
   const [productSearch, setProductSearch] = useState("")
   const [productDropOpen, setProductDropOpen] = useState(false)
   const originalSnapshot = useRef("")
   const itemsPerPage = 10

   const displayUnit = (unit: string) => isKh ? unit : (UNIT_MAP[unit] ?? unit)

   const resetFilters = () => {
      setSearch("")
      setCategoryFilter("all")
      setStartDate("")
      setEndDate("")
      setSortConfig({ key: null, direction: "asc" })
      setCurrentPage(1)
   }

   const categories = useMemo(() => {
      const seen = new Map<number, string>()
      spoilageList.forEach(s => { if (s.category_id && s.category_name) seen.set(s.category_id, s.category_name) })
      return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
   }, [spoilageList])

   const handleOpenAdd = () => {
      if (!canCreate) return deny()
      setIsViewMode(false)
      setCurrentItem({
         inventoryId: "",
         productName: "",
         qty: 1,
         description: "",
         date: todayStr(),
      })
      setFieldErrors({})
      setProductSearch("")
      setProductDropOpen(false)
      originalSnapshot.current = ""
      setIsDialogOpen(true)
   }

   const handleOpenEdit = (item: Spoilage) => {
      if (!canEdit) return deny()
      setCurrentItem({
         id: item.id,
         inventoryId: item.inventory_id,
         productName: item.product_name,
         qty: item.qty,
         description: item.description || "",
         date: item.date,
         created_at: item.created_at,
      })
      setIsViewMode(false)
      setFieldErrors({})
      originalSnapshot.current = JSON.stringify({ qty: item.qty, description: item.description || "", date: item.date })
      setIsDialogOpen(true)
   }

   const handleOpenView = (item: Spoilage) => {
      if (!canView) return deny()
      setCurrentItem({
         id: item.id,
         inventoryId: item.inventory_id,
         productName: item.product_name,
         qty: item.qty,
         description: item.description || "",
         date: item.date,
         created_at: item.created_at,
      })
      setIsViewMode(true)
      setIsDialogOpen(true)
   }

   const handleOpenDelete = (item: Spoilage) => {
      if (!canDelete) return deny()
      setItemToDelete(item)
      setIsDeleteAlertOpen(true)
   }

   const handleSave = async () => {
      // ពិនិត្យសិទ្ធិតាមប្រភេទសកម្មភាព
      if (currentItem?.id ? !canEdit : !canCreate) return deny()

      const errs: typeof fieldErrors = {}
      if (!currentItem?.inventoryId) errs.inventoryId = isKh ? "សូមជ្រើសរើសទំនិញ" : "Please select a product"
      if (!currentItem?.qty || currentItem.qty <= 0) errs.qty = isKh ? "សូមបញ្ចូលចំនួនត្រឹមត្រូវ" : "Please enter a valid quantity"
      if (Object.keys(errs).length) { setFieldErrors(errs); return }

      if (currentItem?.id) {
         const snap = JSON.stringify({ qty: currentItem.qty, description: currentItem.description, date: currentItem.date })
         if (snap === originalSnapshot.current) {
            toastWarn(
               isKh ? "មិនមានការផ្លាស់ប្តូរ" : "No changes detected",
               isKh ? "សូមកែប្រែមុនពេលរក្សាទុក" : "Please make changes before saving"
            )
            return
         }
      }

      try {
         if (currentItem?.id) {
            await update.mutateAsync({
               id: currentItem.id,
               payload: {
                  qty: currentItem.qty,
                  date: currentItem.date,
                  description: currentItem.description,
               },
            })
            toastSuccess(
               isKh ? "កែប្រែបានជោគជ័យ" : "Updated successfully",
               isKh
                  ? `ទំនិញខូច "${currentItem.productName}" ត្រូវបានកែប្រែដោយជោគជ័យ`
                  : `Spoilage for "${currentItem.productName}" updated successfully`
            )
         } else {
            const name = inventory.find(p => p.id === Number(currentItem.inventoryId))?.name || ""
            await create.mutateAsync({
               inventory_id: Number(currentItem.inventoryId),
               qty: currentItem.qty,
               date: currentItem.date,
               description: currentItem.description,
            })
            toastSuccess(
               isKh ? "បន្ថែមបានជោគជ័យ" : "Added successfully",
               isKh
                  ? `ទំនិញខូច "${name}" ត្រូវបានកត់ត្រាដោយជោគជ័យ`
                  : `Spoilage for "${name}" recorded successfully`
            )
         }
         setIsDialogOpen(false)
      } catch (err: any) {
         toastError(err?.message ?? (isKh ? "មានបញ្ហា" : "Something went wrong"))
      }
   }

   const confirmDelete = async () => {
      if (!canDelete) return deny()
      if (!itemToDelete) return
      try {
         await remove.mutateAsync(itemToDelete.id)
         toastSuccess(
            isKh ? "លុបបានសម្រេច" : "Deleted successfully",
            isKh
               ? `ទំនិញខូច "${itemToDelete.product_name}" ត្រូវបានលុប`
               : `Spoilage for "${itemToDelete.product_name}" deleted — stock restored successfully`
         )
         setIsDeleteAlertOpen(false)
         setItemToDelete(null)
      } catch (err: any) {
         toastError(err?.message ?? (isKh ? "លុបមិនបាន" : "Failed to delete"))
      }
   }

   const processedData = useMemo(() => {
      let result = spoilageList.filter(s => {
         const matchSearch = (s.product_name || "").toLowerCase().includes(search.toLowerCase())
         const matchCat = categoryFilter === "all" || String(s.category_id) === categoryFilter
         const itemDate = new Date(s.date).setHours(0, 0, 0, 0)
         const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null
         const end = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : null
         let matchDate = true
         if (start && end) matchDate = itemDate >= start && itemDate <= end
         else if (start) matchDate = itemDate >= start
         else if (end) matchDate = itemDate <= end
         return matchSearch && matchCat && matchDate
      })
      if (sortConfig.key) {
         result = [...result].sort((a: any, b: any) => {
            if (a[sortConfig.key!] < b[sortConfig.key!]) return sortConfig.direction === "asc" ? -1 : 1
            if (a[sortConfig.key!] > b[sortConfig.key!]) return sortConfig.direction === "asc" ? 1 : -1
            return 0
         })
      }
      return result
   }, [spoilageList, search, categoryFilter, startDate, endDate, sortConfig])

   const kpi = useMemo(() => {
      const now = new Date()
      const today = spoilageList.filter(s => {
         const d = new Date(s.date)
         return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
      }).length
      return [
         { label: isKh ? "សរុបខូច" : "Total Spoilages", count: spoilageList.length, Icon: ShieldAlert, style: CARD_STYLES.total },
         { label: isKh ? "សរុបប្រភេទ" : "Total Categories", count: categories.length, Icon: Tag, style: CARD_STYLES.category },
         { label: isKh ? "ថ្ងៃនេះ" : "Today", count: today, Icon: TrendingDown, style: CARD_STYLES.today },
         { label: isKh ? "ត្រងបាន" : "Filtered", count: processedData.length, Icon: ListFilter, style: CARD_STYLES.filtered },
      ]
   }, [spoilageList, processedData, categories, isKh])

   const hasFilter = search || startDate || endDate || categoryFilter !== "all"

   // បង្ហាញជួរ Actions តែពេលមានសិទ្ធិយ៉ាងហោចណាស់មួយ
   const showActions = canView || canEdit || canDelete

   const baseColumns = [
      {
         key: "no", header: isKh ? "ល.រ" : "No.",
         render: (_: any, i: number) => (
            <span className="text-[14px] text-gray-600 dark:text-white/25 font-mono tabular-nums">
               {String((currentPage - 1) * itemsPerPage + i + 1).padStart(2, "0")}
            </span>
         ),
      },
      {
         key: "product_name", header: isKh ? "ឈ្មោះទំនិញ" : "Product", sortable: true,
         render: (item: Spoilage) => (
            <div className="flex items-center gap-2.5">
               <span className="text-[14px] text-gray-800 dark:text-white">{item.product_name}</span>
            </div>
         ),
      },
      {
         key: "qty", header: isKh ? "ចំនួន" : "Qty", sortable: true,
         render: (item: Spoilage) => (
            <span className="text-[14px] text-rose-600 dark:text-rose-400 tabular-nums">
               -{item.qty}
               <span className="text-[12px] opacity-50 ml-1 uppercase">{displayUnit(item.unit || "")}</span>
            </span>
         ),
      },
      {
         key: "category_name", header: isKh ? "ប្រភេទ" : "Category", sortable: true,
         render: (item: Spoilage) => (
            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] uppercase border", CARD_STYLES.today.bg, CARD_STYLES.today.border, CARD_STYLES.today.text)}>
               <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
               {item.category_name || "—"}
            </span>
         ),
      },
      {
         key: "date", header: isKh ? "កាលបរិច្ឆេទខូច" : "Spoilage Date", sortable: true,
         render: (item: Spoilage) => {
            const p = formatDateParts(item.date)
            if (!p) return <span className="text-gray-300 dark:text-white/20 text-[14px]">—</span>
            return (
               <div className="flex items-center gap-1.5">
                  <Calendar className={cn("w-3 h-3 shrink-0", ACCENT.text)} />
                  <span className="text-[14px] text-gray-700 dark:text-white/70">{p.date}</span>
               </div>
            )
         },
      },
      {
         key: "created_at", header: isKh ? "កាលបរិច្ឆេទបង្កើត" : "Create Date", sortable: true,
         render: (item: Spoilage) => {
            const p = formatDateParts(item.created_at)
            if (!p) return <span className="text-gray-300 dark:text-white/20 text-[14px]">—</span>
            return (
               <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] text-gray-700 dark:text-white/70 flex items-center gap-1">
                     <Clock className={cn("w-3 h-3 shrink-0 text-violet-400")} />{p.date}
                  </span>
                  <span className="text-[12px] text-gray-600 dark:text-white/30 pl-4">{p.time}</span>
               </div>
            )
         },
      },
      {
         key: "description", header: isKh ? "មូលហេតុ" : "Reason",
         render: (item: Spoilage) => (
            <span className="text-[12px] text-gray-600 dark:text-white/30 truncate max-w-[180px] block italic">
               {item.description || "—"}
            </span>
         ),
      },
   ]

   const actionsColumn = {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item: Spoilage) => (
         <div className="flex items-center justify-end gap-1.5">
            {canView && (
               <button
                  onClick={() => handleOpenView(item)}
                  className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                  text-blue-700 bg-blue-50 border border-blue-200
                  hover:bg-blue-100 hover:border-blue-300
                  dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-700/40
                  dark:hover:bg-blue-900/40 dark:hover:border-blue-500
                  transition-all duration-150"
                  title={isKh ? "មើលព័ត៌មាន" : "View Details"}
               >
                  <Eye className="w-3.5 h-3.5" />
               </button>
            )}

            {canEdit && (
               <button
                  onClick={() => handleOpenEdit(item)}
                  className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                  text-amber-700 bg-amber-50 border border-amber-200
                  hover:bg-amber-100 hover:border-amber-300
                  dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-700/40
                  dark:hover:bg-amber-900/40 dark:hover:border-amber-500
                  transition-all duration-150"
                  title={isKh ? "កែប្រែ" : "Edit"}
               >
                  <Edit2 className="w-3.5 h-3.5" />
               </button>
            )}

            {canDelete && (
               <button
                  onClick={() => handleOpenDelete(item)}
                  className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                  text-rose-700 bg-rose-50 border border-rose-200
                  hover:bg-rose-100 hover:border-rose-300
                  dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-700/40
                  dark:hover:bg-rose-900/40 dark:hover:border-rose-500
                  transition-all duration-150"
                  title={isKh ? "លុបចោល" : "Delete"}
               >
                  <Trash2 className="w-3.5 h-3.5" />
               </button>
            )}
         </div>
      ),
   }

   const columns = showActions ? [...baseColumns, actionsColumn] : baseColumns

   const showInitialLoading = loading && spoilageList.length === 0

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
               title={isKh ? "ការគ្រប់គ្រងទំនិញខូច" : "Spoilage Management"}
               subtitle={isKh ? "កត់ត្រា និងគ្រប់គ្រងទំនិញខូច" : "Track and manage spoiled inventory"}
            />
            {showInitialLoading ? (
               <div className="flex-1 flex items-center justify-center flex-col gap-4">
                  <Loader2 className={cn("w-5 h-5 animate-spin", ACCENT.text)} />
                  <span className={cn("text-[14px] font-bold uppercase tracking-[0.2em] animate-pulse", ACCENT.text)}>
                     {isKh ? "កំពុងផ្ទុក..." : "Loading…"}
                  </span>
               </div>
            ) : (
               <main className="flex-1 p-5 space-y-4 overflow-hidden flex flex-col">
                  <div className="grid grid-cols-4 gap-3 shrink-0">
                     {kpi.map(({ label, count, Icon, style }, i) => (
                        <motion.div
                           key={label}
                           initial={{ opacity: 0, y: 14 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ duration: 0.35, delay: i * 0.07 }}
                           whileHover={{ y: -3, transition: { duration: 0.18 } }} >
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
                                 <p className={cn("text-[22px] font-bold text-center leading-none tabular-nums mb-2.5", style.text)}>{count}</p>
                                 <div className="flex items-center gap-1.5">
                                    <TrendingDown className={cn("w-3 h-3 shrink-0", style.icon)} />
                                    <p className={cn("text-[14px]", style.label)}>{isKh ? "កំណត់ត្រា" : "Records"}</p>
                                 </div>
                              </CardContent>
                           </Card>
                        </motion.div>
                     ))}
                  </div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="flex flex-wrap gap-2 items-center justify-between shrink-0">
                     <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 dark:text-white/25 pointer-events-none" />
                           <input className={cn(INPUT, "w-56 pl-8")} placeholder={isKh ? "ស្វែងរក..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07] shrink-0" />
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                           <SelectTrigger className={cn(SEL_T, "w-44")}>
                              <Filter className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                              <SelectValue placeholder={isKh ? "ប្រភេទ" : "Category"} />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="all" className={SEL_I}>{isKh ? "គ្រប់ប្រភេទ" : "All Categories"}</SelectItem>
                              {categories.map(c => <SelectItem key={c.id} value={String(c.id)} className={SEL_I}>{c.name}</SelectItem>)}
                           </SelectContent>
                        </Select>
                        <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
                        <AnimatePresence>
                           {hasFilter && (
                              <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                 onClick={resetFilters}
                                 className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all" >
                                 <RotateCcw className="w-3.5 h-3.5" />
                              </motion.button>
                           )}
                        </AnimatePresence>
                        <button
                           onClick={() => refetchSpoilage()}
                           className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] text-gray-600 dark:text-white/40 hover:text-[#03624C] dark:hover:text-[#1857D8] transition-all" >
                           <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
                        </button>
                     </div>
                     {canCreate && (
                        <button onClick={handleOpenAdd} className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] text-white transition-all active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90">
                           <Plus className="w-3.5 h-3.5" />
                           {isKh ? "បន្ថែមទំនិញខូច" : "Add Spoilage"}
                        </button>
                     )}
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.28 }} className="flex-1 overflow-hidden">
                     <Card className="h-full border-0 shadow-none bg-transparent flex flex-col">
                        <DataTableCustom
                           data={processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                           columns={columns}
                           sortConfig={sortConfig}
                           onSort={key => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }))}
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
         <Dialog open={isDialogOpen} onOpenChange={v => { if (!saving) setIsDialogOpen(v) }}>
            <DialogContent className="max-w-sm p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden" style={SORA}>
               <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0 bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
                  <div className="flex items-center gap-2.5">
                     <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", ACCENT.iconBg)}>
                        <Package className="w-4 h-4 text-white" />
                     </div>
                     <div>
                        <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                           {isViewMode
                              ? (isKh ? "ព័ត៌មានលម្អិត" : "View Details")
                              : currentItem?.id
                                 ? (isKh ? "កែប្រែ" : "Edit Spoilage")
                                 : (isKh ? "បន្ថែមទំនិញខូច" : "Add Spoilage")}
                        </DialogTitle>
                        <DialogDescription className="text-[12px] text-gray-600 dark:text-white/30">
                           {isViewMode
                              ? (isKh ? "អានតែប៉ុណ្ណោះ" : "Read-only")
                              : (isKh ? "បំពេញព័ត៌មានខាងក្រោម" : "Fill in the details below")}
                        </DialogDescription>
                     </div>
                  </div>
               </DialogHeader>
               <div className="px-6 py-5 space-y-4">
                  <div className="space-y-1.5">
                     <Label className={cn("text-[14px]  text-gray-600 dark:text-white/30", fieldErrors.inventoryId && "text-rose-500")}>
                        {isKh ? "ជ្រើសរើសទំនិញ" : "Select Product"}
                        {!isViewMode && <span className="text-rose-500 ml-0.5">*</span>}
                     </Label>
                     {isViewMode ? (
                        <ViewField icon={Package}>{currentItem?.productName}</ViewField>
                     ) : currentItem?.id ? (
                        <div className={cn("flex items-center gap-2.5 px-3 h-9 rounded-lg border bg-gray-50 dark:bg-white/[0.03]", "border-gray-200 dark:border-white/[0.08]")}>
                           <Package className={cn("w-3.5 h-3.5 shrink-0", ACCENT.text)} />
                           <span className="text-[14px] font-semibold text-gray-700 dark:text-white/70 flex-1 truncate">{currentItem?.productName}</span>
                           <span className="text-[12px] text-gray-600 dark:text-white/25 italic">{isKh ? "មិនអាចដូរបាន" : "locked"}</span>
                        </div>
                     ) : (
                        <div className="relative">
                           <div className="relative">
                              <Package className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none shrink-0", currentItem?.inventoryId && !productDropOpen ? ACCENT.text : "text-gray-300 dark:text-white/20")} />
                              <input
                                 type="text"
                                 autoComplete="off"
                                 className={cn(
                                    "w-full pl-8 pr-8 h-9 rounded-lg border text-[14px] font-semibold outline-none transition-all",
                                    "bg-white dark:bg-white/[0.04]",
                                    "text-gray-800 dark:text-white/85 placeholder:text-gray-600 dark:placeholder:text-white/25",
                                    "focus:ring-1",
                                    fieldErrors.inventoryId
                                       ? "border-rose-400 dark:border-rose-500/50 focus:ring-rose-300 dark:focus:ring-rose-500/30"
                                       : "border-gray-200 dark:border-white/[0.08] focus:border-gray-300 dark:focus:border-white/20 focus:ring-gray-200 dark:focus:ring-white/10",
                                 )}
                                 placeholder={isKh ? "វាយឈ្មោះដើម្បីស្វែងរក..." : "Type to search product..."}
                                 value={productDropOpen ? productSearch : (currentItem?.productName || "")}
                                 onFocus={() => {
                                    setProductSearch("")
                                    setProductDropOpen(true)
                                 }}
                                 onChange={e => {
                                    setProductSearch(e.target.value)
                                    setProductDropOpen(true)
                                    if (currentItem?.inventoryId) {
                                       setCurrentItem((prev: any) => ({ ...prev, inventoryId: "", productName: "" }))
                                    }
                                 }}
                              />
                              {currentItem?.inventoryId && !productDropOpen ? (
                                 <button
                                    type="button"
                                    onClick={() => {
                                       setCurrentItem((prev: any) => ({ ...prev, inventoryId: "", productName: "" }))
                                       setProductSearch("")
                                       setProductDropOpen(true)
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full text-gray-600 hover:text-gray-800 dark:text-white/25 dark:hover:text-white/50 transition-colors" >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                 </button>
                              ) : (
                                 <svg className={cn("absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-600 dark:text-white/25 transition-transform", productDropOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                 </svg>
                              )}
                           </div>
                           <AnimatePresence>
                              {productDropOpen && (
                                 <motion.div
                                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                    transition={{ duration: 0.13 }}
                                    className="absolute z-50 top-full mt-1.5 left-0 right-0 rounded-xl border border-gray-100 dark:border-white/[0.10] bg-white dark:bg-[#22263a] shadow-xl overflow-hidden"
                                    style={SORA} >
                                    <div className="max-h-[200px] overflow-y-auto py-1">
                                       {inventory.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 ? (
                                          <div className="px-3 py-5 text-center text-[14px] text-gray-600 dark:text-white/25">
                                             {isKh ? "រកមិនឃើញ" : "No products found"}
                                          </div>
                                       ) : inventory
                                          .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                          .map(p => (
                                             <button
                                                key={p.id}
                                                type="button"
                                                onMouseDown={e => e.preventDefault()}
                                                onClick={() => {
                                                   setCurrentItem((prev: any) => ({ ...prev, inventoryId: p.id.toString(), productName: p.name }))
                                                   setFieldErrors(e => ({ ...e, inventoryId: undefined }))
                                                   setProductDropOpen(false)
                                                   setProductSearch("")
                                                }}
                                                className={cn(
                                                   "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                                                   "hover:bg-gray-50 dark:hover:bg-white/[0.05]",
                                                   currentItem?.inventoryId === p.id.toString() && "bg-gray-50 dark:bg-white/[0.05]"
                                                )} >
                                                <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", ACCENT.iconBg)}>
                                                   <Package className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                   <p className="text-[14px] font-semibold text-gray-800 dark:text-white/85 truncate">{p.name}</p>
                                                   <p className="text-[12px] text-gray-600 dark:text-white/30">
                                                      {isKh ? "នៅសល់:" : "Stock:"} {p.stock} {displayUnit(p.unit)}
                                                   </p>
                                                </div>
                                                {currentItem?.inventoryId === p.id.toString() && (
                                                   <svg className={cn("w-3.5 h-3.5 shrink-0", ACCENT.text)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                )}
                                             </button>
                                          ))}
                                    </div>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                           {productDropOpen && (
                              <div className="fixed inset-0 z-40" onClick={() => { setProductDropOpen(false); setProductSearch("") }} />
                           )}
                        </div>
                     )}
                     {fieldErrors.inventoryId && <ErrorMsg msg={fieldErrors.inventoryId} />}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <Label className={cn("text-[14px]  text-gray-600 dark:text-white/30", fieldErrors.qty && "text-rose-500")}>
                           {isKh ? "ចំនួន" : "Qty"}
                           {!isViewMode && <span className="text-rose-500 ml-0.5">*</span>}
                        </Label>
                        {isViewMode ? (
                           <ViewField icon={AlertTriangle}>
                              <span className="text-rose-600 dark:text-rose-400 font-bold">{currentItem?.qty}</span>
                           </ViewField>
                        ) : (
                           <input
                              type="number"
                              min={1}
                              className={cn(INPUT, "text-rose-600 dark:text-rose-400 font-bold", fieldErrors.qty && "border-rose-400 dark:border-rose-500/50")}
                              value={currentItem?.qty || ""}
                              onChange={e => {
                                 const val = e.target.value
                                 setCurrentItem((prev: any) => ({ ...prev, qty: Number(val) }))
                                 setFieldErrors(e2 => ({ ...e2, qty: undefined }))
                              }}
                           />
                        )}
                        {fieldErrors.qty && <ErrorMsg msg={fieldErrors.qty} />}
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[14px]  text-gray-600 dark:text-white/30">
                           {isKh ? "កាលបរិច្ឆេទខូច" : "Spoilage Date"}
                        </Label>
                        {isViewMode ? (
                           <ViewField icon={Calendar}>
                              {formatDateParts(currentItem?.date)?.date || "—"}
                           </ViewField>
                        ) : (
                           <div className="relative">
                              <Calendar className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none", ACCENT.text)} />
                              <input
                                 type="date"
                                 className={cn(INPUT, "pl-8 cursor-pointer")}
                                 value={currentItem?.date || ""}
                                 onChange={e => {
                                    const val = e.target.value
                                    setCurrentItem((prev: any) => ({ ...prev, date: val || todayStr() }))
                                 }}
                              />
                           </div>
                        )}
                     </div>
                  </div>
                  {(isViewMode || currentItem?.id) && currentItem?.created_at && (
                     <div className="space-y-1.5">
                        <Label className="text-[14px]  text-gray-600 dark:text-white/30">
                           {isKh ? "កាលបរិច្ឆេទបង្កើត" : "Create Date"}
                        </Label>
                        <ViewField icon={Clock}>
                           {(() => {
                              const p = formatDateParts(currentItem.created_at)
                              return p ? `${p.date}  •  ${p.time}` : "—"
                           })()}
                        </ViewField>
                     </div>
                  )}
                  <div className="space-y-1.5">
                     <Label className="text-[14px]  text-gray-600 dark:text-white/30">
                        {isKh ? "មូលហេតុ" : "Reason"}
                     </Label>
                     {isViewMode ? (
                        <div className="px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                           <p className="text-[14px] text-gray-600 dark:text-white/70 italic">{currentItem?.description || "—"}</p>
                        </div>
                     ) : (
                        <textarea
                           rows={3}
                           className={cn(INPUT, "resize-y min-h-[72px] py-2")}
                           value={currentItem?.description || ""}
                           onChange={e => {
                              const val = e.target.value
                              setCurrentItem((prev: any) => ({ ...prev, description: val }))
                           }}
                           placeholder={isKh ? "បញ្ចូលមូលហេតុ..." : "Enter reason..."}
                        />
                     )}
                  </div>
               </div>
               <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg">
                  <div className="flex justify-end gap-2 w-full">
                     <button
                        onClick={() => setIsDialogOpen(false)}
                        disabled={saving}
                        className="h-9 px-5 rounded-lg text-[14px] transition-all border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50" >
                        {isViewMode ? (isKh ? "បិទ" : "Close") : (isKh ? "បោះបង់" : "Cancel")}
                     </button>
                     {!isViewMode && (
                        <button
                           onClick={handleSave}
                           disabled={saving}
                           className="h-9 px-6 rounded-lg text-[14px] text-white flex items-center gap-2 transition-all disabled:opacity-60 active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                           {saving
                              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{isKh ? "កំពុងរក្សា..." : "Saving..."}</>
                              : (isKh ? "រក្សាទុក" : "Save")}
                        </button>
                     )}
                  </div>
               </DialogFooter>
            </DialogContent>
         </Dialog>
         <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent className="rounded-2xl border-0 bg-white dark:bg-[#22263a] shadow-2xl p-0 max-w-[400px] overflow-hidden" style={SORA}>
               <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-rose-400" />
               <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                     <div className="w-11 h-11 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                     </div>
                     <div className="pt-0.5">
                        <AlertDialogTitle className="text-[14px] font-bold text-gray-800 dark:text-white/90 mb-1">
                           {isKh ? "បញ្ជាក់ការលុប" : "Confirm Delete"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[12px] text-gray-500 dark:text-white/40 leading-relaxed">
                           {isKh ? "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។" : "This action cannot be undone."}
                        </AlertDialogDescription>
                     </div>
                  </div>
                  {itemToDelete?.product_name && (
                     <div className="mb-5 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-500/[0.08] border border-rose-100 dark:border-rose-500/20 flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="text-[14px] text-rose-600 dark:text-rose-300 truncate">{itemToDelete.product_name}</span>
                     </div>
                  )}
                  <AlertDialogFooter className="gap-2 flex-row justify-end">
                     <AlertDialogCancel
                        style={SORA}
                        onClick={() => setIsDeleteAlertOpen(false)}
                        className="h-9 px-5 rounded-lg text-[12px] font-bold border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all" >
                        {isKh ? "បោះបង់" : "Cancel"}
                     </AlertDialogCancel>
                     <AlertDialogAction
                        onClick={confirmDelete}
                        disabled={deleting}
                        style={SORA}
                        className="h-9 px-5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border dark:border-rose-500/30 dark:shadow-none disabled:opacity-60 transition-all" >
                        {deleting
                           ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{isKh ? "កំពុងលុប..." : "Deleting..."}</>
                           : <><Trash2 className="w-3.5 h-3.5" />{isKh ? "លុបចោល" : "Delete"}</>}
                     </AlertDialogAction>
                  </AlertDialogFooter>
               </div>
            </AlertDialogContent>
         </AlertDialog>
      </div>
   )
}