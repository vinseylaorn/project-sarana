"use client"

import { useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import {
   Search, Plus, Eye, Edit2, Trash2, Loader2,
   Layers, RotateCcw, AlertTriangle, TrendingUp,
   Package, Truck
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { StockCategory } from "@/types"
import { usePermission } from "@/lib/role-context"
import { useTranslation } from "react-i18next"
import { toastSuccess, toastError, toastWarn } from "@/lib/toast"

import { useInventory, useStockCategories, useSuppliers } from "@/hooks/inventory/use-inventory-data"
import { useStockCategoryMutations } from "@/hooks/inventory/use-category-mutations"

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }

const INPUT =
   "w-full h-9 px-3 text-[14px] font-medium rounded-lg outline-none transition-all " +
   "bg-white dark:bg-[#22263a] border border-gray-200/80 dark:border-white/[0.08] " +
   "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/20 " +
   "focus:border-[#03624C] dark:focus:border-[#1857D8] focus:ring-2 focus:ring-[#03624C]/10 " +
   "dark:focus:ring-[#1857D8]/10 shadow-sm dark:shadow-none"

const RANK_BADGE = ["🥇", "🥈", "🥉"]

const ACCENT = {
   text: "text-[#03624C] dark:text-[#1857D8]",
   iconBg: "bg-[#03624C] dark:bg-[#1857D8]",
   border: "border-[#03624C]/30 dark:border-[#1857D8]/30",
}

const CARD_STYLES = {
   total: {
      bg: "bg-white dark:bg-[#22263a]",
      border: "border-white dark:border-[#22263a]",
      text: "text-[#03624C] dark:text-emerald-300",
      label: "text-gray-600 dark:text-gray-200",
      icon: "text-[#03624C] dark:text-emerald-300",
      iconBg: "bg-[#03624C]/10 dark:bg-emerald-400/20",
   },
   rank: [
      {
         bg: "bg-white dark:bg-[#22263a]", border: "border-white dark:border-[#22263a]",
         text: "text-[#1857D8] dark:text-[#6b9fff]", label: "text-gray-600 dark:text-gray-200",
         icon: "text-[#1857D8] dark:text-[#6b9fff]", iconBg: "bg-[#1857D8]/10 dark:bg-[#1857D8]/20",
         badge: "bg-[#1857D8]/10 text-[#1857D8] dark:bg-[#1857D8]/20 dark:text-[#6b9fff]",
      },
      {
         bg: "bg-white dark:bg-[#22263a]", border: "border-white dark:border-[#22263a]",
         text: "text-slate-600 dark:text-slate-200", label: "text-gray-600 dark:text-gray-200",
         icon: "text-slate-500 dark:text-slate-300", iconBg: "bg-slate-100 dark:bg-slate-500/20",
         badge: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-200",
      },
      {
         bg: "bg-white dark:bg-[#22263a]", border: "border-white dark:border-[#22263a]",
         text: "text-orange-700 dark:text-orange-200", label: "text-gray-600 dark:text-gray-200",
         icon: "text-orange-500 dark:text-orange-300", iconBg: "bg-orange-100 dark:bg-orange-500/20",
         badge: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
      },
   ],
}

function formatDateParts(dateStr: string | null | undefined): { date: string; time: string } | null {
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

export default function StockCategoriesPage() {
   const { i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"
   // FIX: key ផ្ទាល់ខ្លួន (ធ្លាក់ទៅ "inventory" ស្វ័យប្រវត្តិបើ nav មិនមាន key នេះ)
   const { can } = usePermission("inventory-categories")

   const { data: categories = [], isLoading: loadingCategories } = useStockCategories()
   const { data: inventoryItems = [], isLoading: loadingItems } = useInventory()
   const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers()
   const { create, update, remove } = useStockCategoryMutations()

   const loading = loadingCategories || loadingItems || loadingSuppliers

   const [search, setSearch] = useState("")
   const [startDate, setStartDate] = useState("")
   const [endDate, setEndDate] = useState("")
   const [currentPage, setCurrentPage] = useState(1)
   const [nameError, setNameError] = useState<string | undefined>()
   const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" })
   const [isDialogOpen, setIsDialogOpen] = useState(false)
   const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
   const [isViewMode, setIsViewMode] = useState(false)
   const [currentCat, setCurrentCat] = useState<any>(null)
   const [deleteCounts, setDeleteCounts] = useState({ items: 0, suppliers: 0 })
   const originalSnapshot = useRef("")
   const ITEMS_PER_PAGE = 12

   const openAdd = () => {
      setCurrentCat({ name: "" })
      setIsViewMode(false)
      setNameError(undefined)
      originalSnapshot.current = ""
      setIsDialogOpen(true)
   }

   const openEdit = (item: StockCategory) => {
      setCurrentCat({ ...item })
      setIsViewMode(false)
      setNameError(undefined)
      originalSnapshot.current = JSON.stringify({ name: item.name })
      setIsDialogOpen(true)
   }

   const openView = (item: StockCategory) => {
      setCurrentCat(item)
      setIsViewMode(true)
      setIsDialogOpen(true)
   }

   const openDelete = (item: StockCategory) => {
      setCurrentCat(item)
      const itemCount = inventoryItems.filter((i) => i.category_id === item.id).length
      const supplierCount = suppliers.filter((s) => s.category_id === item.id).length
      setDeleteCounts({ items: itemCount, suppliers: supplierCount })
      setIsDeleteAlertOpen(true)
   }

   const handleSave = async () => {
      if (!currentCat?.name?.trim()) {
         setNameError(isKh ? "សូមបញ្ចូលឈ្មោះប្រភេទ" : "Category name is required")
         return
      }
      if (currentCat.id && JSON.stringify({ name: currentCat.name }) === originalSnapshot.current) {
         toastWarn(
            isKh ? "មិនមានការផ្លាស់ប្តូរ" : "No changes detected",
            isKh ? "សូមកែប្រែមុនពេលរក្សាទុក" : "Please make changes before saving",
         )
         setIsDialogOpen(false)
         return
      }
      try {
         if (currentCat.id) {
            await update.mutateAsync({ id: currentCat.id, name: currentCat.name.trim() })
            toastSuccess(
               isKh ? "កែប្រែបានជោគជ័យ" : "Updated successfully",
               isKh ? `ប្រភេទ "${currentCat.name}" ត្រូវបានកែប្រែ` : `Category "${currentCat.name}" updated successfully`,
            )
         } else {
            const created = await create.mutateAsync(currentCat.name.trim())
            toastSuccess(
               isKh ? "បន្ថែមបានជោគជ័យ" : "Created successfully",
               isKh ? `ប្រភេទ "${created.name}" ត្រូវបានបន្ថែម` : `Category "${created.name}" created successfully`,
            )
         }
         setIsDialogOpen(false)
      } catch (err: any) {
         toastError(err?.response?.data?.message ?? err?.message ?? (isKh ? "មានបញ្ហា" : "Something went wrong"))
      }
   }

   const handleDelete = async () => {
      if (!currentCat) return
      try {
         const itemsToRemove = inventoryItems.filter((i) => i.category_id === currentCat.id)
         const suppliersToRemove = suppliers.filter((s) => s.category_id === currentCat.id)
         await remove.mutateAsync({ id: currentCat.id, itemsToRemove, suppliersToRemove })
         setIsDeleteAlertOpen(false)
         const parts: string[] = []
         if (itemsToRemove.length > 0) parts.push(isKh ? `ទំនិញ ${itemsToRemove.length}` : `${itemsToRemove.length} item(s)`)
         if (suppliersToRemove.length > 0) parts.push(isKh ? `អ្នកផ្គត់ផ្គង់ ${suppliersToRemove.length}` : `${suppliersToRemove.length} supplier(s)`)
         toastSuccess(
            isKh ? "លុបបានជោគជ័យ" : "Deleted successfully",
            parts.length > 0
               ? isKh
                  ? `ប្រភេទ "${currentCat.name}" និង ${parts.join(" និង ")} ត្រូវបានលុបជាមួយគ្នា`
                  : `Category "${currentCat.name}" and ${parts.join(" and ")} deleted successfully`
               : isKh
                  ? `ប្រភេទ "${currentCat.name}" ត្រូវបានលុប`
                  : `Category "${currentCat.name}" deleted successfully`,
         )
         setCurrentCat(null)
         setDeleteCounts({ items: 0, suppliers: 0 })
      } catch (err: any) {
         toastError(err?.response?.data?.message ?? err?.message ?? (isKh ? "លុបមិនបាន" : "Failed to delete"))
      }
   }

   const hasFilter = search || startDate || endDate

   const processedData = useMemo(() => {
      let result = categories.filter((c) => {
         if (!c.name.toLowerCase().includes(search.toLowerCase())) return false
         if (startDate || endDate) {
            const d = c.created_at?.slice(0, 10) ?? null
            if (!d) return false
            if (startDate && d < startDate) return false
            if (endDate && d > endDate) return false
         }
         return true
      })
      if (sortConfig.key) {
         result = [...result].sort((a: any, b: any) => {
            const dir = sortConfig.direction === "asc" ? 1 : -1
            return a[sortConfig.key!] < b[sortConfig.key!] ? -dir : a[sortConfig.key!] > b[sortConfig.key!] ? dir : 0
         })
      }
      return result
   }, [categories, search, startDate, endDate, sortConfig])

   const top3 = useMemo(() => {
      const countMap: Record<number, number> = {}
      inventoryItems.forEach((item) => {
         countMap[item.category_id] = (countMap[item.category_id] ?? 0) + 1
      })
      return [...categories]
         .sort((a, b) => (countMap[b.id] ?? 0) - (countMap[a.id] ?? 0))
         .slice(0, 3)
         .map((c) => ({ ...c, itemCount: countMap[c.id] ?? 0 }))
   }, [categories, inventoryItems])

   const stats = [
      {
         key: "total" as const,
         label: isKh ? "ប្រភេទស្តុកសរុប" : "Total Categories",
         rankIcon: null as string | null,
         value: categories.length,
         sub: isKh ? "ប្រភេទ" : "categories",
         icon: <Layers className="w-4 h-4" />,
         style: CARD_STYLES.total,
      },
      ...top3.map((cat, i) => ({
         key: `rank-${i}`,
         label: cat.name,
         rankIcon: RANK_BADGE[i] as string | null,
         value: cat.itemCount,
         sub: isKh ? "ធាតុស្តុក" : "items",
         icon: <Layers className="w-4 h-4" />,
         style: CARD_STYLES.rank[i],
      })),
   ]

   const dateCell = (raw?: string | null) => {
      const p = formatDateParts(raw)
      if (!p) return <span className="text-gray-300 dark:text-white/20 text-[14px]">—</span>
      return (
         <div className="flex flex-col gap-0.5">
            <span className="text-[14px] text-gray-700 dark:text-white/70">{p.date}</span>
            <span className="text-[12px] text-gray-600 dark:text-white/30">{p.time}</span>
         </div>
      )
   }

   const columns = [
      {
         key: "no",
         header: isKh ? "ល.រ" : "No.",
         render: (_: any, i: number) => (
            <span className="text-[14px] text-gray-600 dark:text-white/25 font-mono tabular-nums">
               {String((currentPage - 1) * ITEMS_PER_PAGE + i + 1).padStart(2, "0")}
            </span>
         ),
      },
      {
         key: "name",
         header: isKh ? "ឈ្មោះប្រភេទ" : "Category Name",
         sortable: true,
         render: (item: StockCategory) => (
            <span className=" text-gray-800 dark:text-white text-[14px]">{item.name}</span>
         ),
      },
      {
         key: "created_at", header: isKh ? "កាលបរិច្ឆេទ" : "Created Date", sortable: true,
         render: (item: StockCategory) => dateCell(item.created_at),
      },
      {
         key: "updated_at", header: isKh ? "កែប្រែចុងក្រោយ" : "Last Updated", sortable: true,
         render: (item: StockCategory) => dateCell(item.updated_at),
      },
      {
         key: "item_count",
         header: isKh ? "ចំនួនទំនិញ" : "Item Count",
         render: (item: StockCategory) => {
            const count = inventoryItems.filter((i) => i.category_id === item.id).length
            return (
               <span className={cn("inline-flex items-center gap-1 text-[14px] px-2.5 py-0.5 rounded-full border", "text-[#03624C] dark:text-white", "bg-[#03624C]/10 dark:bg-[#1857D8]", "border-[#03624C]/20 dark:border-[#1857D8]")}>
                  <Layers className="w-3 h-3" />
                  {count} {isKh ? "ធាតុ" : "items"}
               </span>
            )
         },
      },
      {
         key: "actions",
         header: isKh ? "សកម្មភាព" : "Actions",
         className: "text-right",
         render: (item: StockCategory) => (
            <div className="flex items-center justify-end gap-1.5">
               <button
                  onClick={() => openView(item)}
                  className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
            text-blue-700 bg-blue-50 border border-blue-200
            hover:bg-blue-100 hover:border-blue-300
            dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-700/40
            dark:hover:bg-blue-900/40 dark:hover:border-blue-500
            transition-all duration-150"
                  title={isKh ? "មើលព័ត៌មាន" : "View Details"} >
                  <Eye className="w-3.5 h-3.5" />
               </button>
               {can("edit") && (
                  <button
                     onClick={() => openEdit(item)}
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
               {can("delete") && (
                  <button
                     onClick={() => openDelete(item)}
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

   if (loading) return (
      <div className="h-screen bg-gray-50 dark:bg-[#13151f] flex items-center justify-center flex-col gap-4" style={SORA}>
         <Loader2 className={cn("w-5 h-5 animate-spin", ACCENT.text)} />
         <span className={cn("text-[14px] font-bold uppercase tracking-[0.2em] animate-pulse", ACCENT.text)}>
            {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
         </span>
      </div>
   )

   const pending = update.isPending || create.isPending

   return (
      <div className="flex h-screen bg-gray-50 dark:bg-[#13151f] overflow-hidden transition-colors duration-300" style={SORA}>
         <Sidebar />
         <div className="flex-1 flex flex-col overflow-hidden">
            <Header
               title={isKh ? "គ្រប់គ្រងប្រភេទស្តុក" : "Stock Categories"}
               subtitle={isKh ? "កំណត់ប្រភេទស្តុកទំនិញ" : "Manage your stock categories"}
            />
            <main className="flex-1 p-5 space-y-4 overflow-hidden flex flex-col">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                  {stats.map((s, i) => {
                     const st = s.style
                     return (
                        <motion.div
                           key={s.key}
                           initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                           transition={{ duration: 0.35, delay: i * 0.07 }}
                           whileHover={{ y: -3, transition: { duration: 0.18 } }} >
                           <Card className={cn("border rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40", st.bg, st.border)}>
                              <CardContent className="p-2">
                                 <div className="flex items-center justify-between gap-3 mb-4">
                                    <p className={cn("flex items-center gap-1.5 min-w-0 text-[14px] font-bold uppercase", st.label)}>
                                       {s.rankIcon && <span className="text-[18px] leading-none not-italic shrink-0">{s.rankIcon}</span>}
                                       <span className="truncate">{s.label}</span>
                                    </p>
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", st.iconBg)}>
                                       <span className={st.icon}>{s.icon}</span>
                                    </div>
                                 </div>
                                 <p className={cn("text-[22px] font-bold text-center leading-none tabular-nums mb-2.5", st.text)}>
                                    {s.value}
                                 </p>
                                 <div className="flex items-center gap-1.5">
                                    <TrendingUp className={cn("w-3 h-3 shrink-0", st.icon)} />
                                    <p className={cn("text-[14px]", st.label)}>{s.sub}</p>
                                 </div>
                              </CardContent>
                           </Card>
                        </motion.div>
                     )
                  })}
                  {Array.from({ length: Math.max(0, 4 - stats.length) }).map((_, i) => (
                     <div key={`empty-${i}`} className="rounded-2xl border border-dashed border-gray-200 dark:border-[#22263a]" />
                  ))}
               </div>
               <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="flex flex-wrap gap-2 items-center justify-between shrink-0" >
                  <div className="flex flex-wrap gap-2 items-center">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white/25 pointer-events-none" />
                        <input
                           className={cn(INPUT, "w-56 pl-8")}
                           placeholder={isKh ? "ស្វែងរកប្រភេទ..." : "Search category..."}
                           value={search}
                           onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                        />
                     </div>
                     <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07] shrink-0" />
                     <DateRangePicker
                        startDate={startDate} endDate={endDate}
                        onStartChange={setStartDate} onEndChange={setEndDate}
                     />
                     <AnimatePresence>
                        {hasFilter && (
                           <motion.button
                              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                              onClick={() => { setSearch(""); setStartDate(""); setEndDate(""); setCurrentPage(1) }}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
                           >
                              <RotateCcw className="w-3.5 h-3.5" />
                           </motion.button>
                        )}
                     </AnimatePresence>
                  </div>
                  {can("create") && (
                     <button
                        onClick={openAdd}
                        className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] text-white transition-all active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                        <Plus className="w-3.5 h-3.5" />
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
                        onSort={(key) => setSortConfig((prev) => ({
                           key,
                           direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
                        }))}
                        itemsPerPage={ITEMS_PER_PAGE}
                        language={i18n.language as any}
                     />
                  </Card>
               </motion.div>
            </main>
         </div>
         <Dialog open={isDialogOpen} onOpenChange={(v) => !pending && setIsDialogOpen(v)}>
            <DialogContent
               className="max-w-sm p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden"
               style={SORA} >
               <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0 bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
                  <div className="flex items-center gap-2.5">
                     <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", CARD_STYLES.total.iconBg)}>
                        <Layers className={cn("w-4 h-4", CARD_STYLES.total.text)} />
                     </div>
                     <div>
                        <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                           {isViewMode
                              ? (isKh ? "ព័ត៌មានលម្អិត" : "View Details")
                              : currentCat?.id
                                 ? (isKh ? "កែប្រែប្រភេទស្តុក" : "Edit Stock Category")
                                 : (isKh ? "បន្ថែមប្រភេទស្តុកថ្មី" : "Add New Stock Category")}
                        </DialogTitle>
                        <DialogDescription className="text-[12px] text-gray-600 dark:text-white/30">
                           {isViewMode
                              ? (isKh ? "អានតែប៉ុណ្ណោះ" : "Read-only")
                              : (isKh ? "បំពេញព័ត៌មានខាងក្រោម" : "Fill in the details below")}
                        </DialogDescription>
                     </div>
                  </div>
               </DialogHeader>
               <div className="px-6 py-5 space-y-3">
                  <div className="space-y-1.5">
                     <Label className={cn(
                        "text-[14px]  text-gray-600 dark:text-white/30",
                        nameError && "text-rose-500",
                     )}>
                        {isKh ? "ឈ្មោះប្រភេទ" : "Category Name"}
                        {!isViewMode && <span className="text-rose-500 ml-0.5">*</span>}
                     </Label>
                     {isViewMode ? (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                           <Layers className={cn("w-3.5 h-3.5 shrink-0", ACCENT.text)} />
                           <span className="text-[14px] font-semibold text-gray-800 dark:text-white/85">{currentCat?.name}</span>
                        </div>
                     ) : (
                        <>
                           <input
                              autoFocus
                              className={cn(INPUT, nameError && "border-rose-400 dark:border-rose-500/50 focus:border-rose-400")}
                              value={currentCat?.name || ""}
                              onChange={(e) => { setCurrentCat({ ...currentCat, name: e.target.value }); setNameError(undefined) }}
                              onKeyDown={(e) => e.key === "Enter" && !isViewMode && handleSave()}
                              placeholder={isKh ? "ឧ. គ្រាប់ធញ្ញជាតិ, ប្រូតេអ៊ីន..." : "e.g. Grains, Proteins..."}
                           />
                           {nameError && (
                              <p className="flex items-center gap-1 text-[14px] text-rose-500 dark:text-rose-400 mt-1">
                                 <AlertTriangle className="w-3 h-3 shrink-0" />{nameError}
                              </p>
                           )}
                        </>
                     )}
                  </div>
                  {isViewMode && currentCat?.id && (
                     <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                        <Layers className={cn("w-3.5 h-3.5 shrink-0", ACCENT.text)} />
                        <span className="text-[14px] text-gray-600 dark:text-white/30 w-24 shrink-0">
                           {isKh ? "ចំនួនធាតុ" : "Items"}
                        </span>
                        <span className="text-[14px] font-semibold text-gray-800 dark:text-white/85">
                           {inventoryItems.filter((i) => i.category_id === currentCat.id).length} {isKh ? "ធាតុ" : "items"}
                        </span>
                     </div>
                  )}
                  {currentCat?.created_at && (() => {
                     const p = formatDateParts(currentCat.created_at); return p ? (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                           <span className="text-[14px]  text-gray-600 dark:text-white/30 w-20 shrink-0">{isKh ? "បានបង្កើត" : "Created"}</span>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[14px] text-gray-800 dark:text-white/85">{p.date}</span>
                              <span className="text-[14px] text-gray-600 dark:text-white/30">{p.time}</span>
                           </div>
                        </div>
                     ) : null
                  })()}
                  {currentCat?.updated_at && (() => {
                     const p = formatDateParts(currentCat.updated_at); return p ? (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                           <span className="text-[14px] text-gray-600 dark:text-white/30 w-20 shrink-0">{isKh ? "កែប្រែ" : "Updated"}</span>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[14px]  text-gray-800 dark:text-white/85">{p.date}</span>
                              <span className="text-[14px] text-gray-600 dark:text-white/30">{p.time}</span>
                           </div>
                        </div>
                     ) : null
                  })()}
               </div>
               <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg">
                  <div className="flex justify-end gap-2 w-full">
                     <button
                        onClick={() => setIsDialogOpen(false)}
                        disabled={pending}
                        className="h-9 px-5 rounded-lg text-[14px] transition-all border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50" >
                        {isViewMode ? (isKh ? "បិទ" : "Close") : (isKh ? "បោះបង់" : "Cancel")}
                     </button>
                     {!isViewMode && (
                        <button
                           onClick={handleSave}
                           disabled={pending}
                           className="h-9 px-6 rounded-lg text-[14px] text-white flex items-center gap-2 transition-all disabled:opacity-60 active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                           {pending
                              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{isKh ? "កំពុងរក្សា..." : "Saving..."}</>
                              : isKh ? "រក្សាទុក" : "Save"
                           }
                        </button>
                     )}
                  </div>
               </DialogFooter>
            </DialogContent>
         </Dialog>
         <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent
               className="rounded-2xl border-0 bg-white dark:bg-[#22263a] shadow-2xl p-0 max-w-[400px] overflow-hidden"
               style={SORA} >
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
                  {currentCat?.name && (
                     <div className="mb-3 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-500/[0.08] border border-rose-100 dark:border-rose-500/20 flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="text-[12px] font-semibold text-rose-600 dark:text-rose-300 truncate">{currentCat.name}</span>
                     </div>
                  )}
                  {(deleteCounts.items > 0 || deleteCounts.suppliers > 0) && (
                     <div className="mb-5 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/[0.08] border border-amber-200 dark:border-amber-500/20 flex items-start gap-2.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-[11.5px] font-medium text-amber-700 dark:text-amber-300 leading-relaxed">
                           <p>
                              {isKh
                                 ? "ប្រភេទនេះមានទិន្នន័យជាប់ទាក់ទង។ ប្រសិនបើបន្ត ទិន្នន័យខាងក្រោមនឹងត្រូវបានលុបជាមួយគ្នាផងដែរ៖"
                                 : "This category has related data. Deleting it will also permanently delete:"}
                           </p>
                           <ul className="mt-1.5 space-y-1">
                              {deleteCounts.items > 0 && (
                                 <li className="flex items-center gap-1.5">
                                    <Package className="w-3 h-3 shrink-0" />
                                    {isKh
                                       ? `ទំនិញស្តុក ${deleteCounts.items} ធាតុ`
                                       : `${deleteCounts.items} inventory item${deleteCounts.items > 1 ? "s" : ""}`}
                                 </li>
                              )}
                              {deleteCounts.suppliers > 0 && (
                                 <li className="flex items-center gap-1.5">
                                    <Truck className="w-3 h-3 shrink-0" />
                                    {isKh
                                       ? `អ្នកផ្គត់ផ្គង់ ${deleteCounts.suppliers} ក្រុមហ៊ុន`
                                       : `${deleteCounts.suppliers} supplier${deleteCounts.suppliers > 1 ? "s" : ""}`}
                                 </li>
                              )}
                           </ul>
                        </div>
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
                        onClick={handleDelete}
                        disabled={remove.isPending}
                        style={SORA}
                        className="h-9 px-5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border dark:border-rose-500/30 dark:shadow-none disabled:opacity-60 transition-all" >
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