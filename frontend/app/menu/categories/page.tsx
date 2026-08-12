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
   Search, Plus, Eye, Edit2, Trash2, Loader2, Tags, Calendar, RotateCcw,
   AlertTriangle, TrendingUp, Package, Grid3X3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { MenuCategory } from "@/types"
import { usePermission } from "@/lib/role-context"
import { useTranslation } from "react-i18next"
import { toastSuccess, toastError, toastWarn } from "@/lib/toast"

import { useMenuCategories, useMenuItems } from "@/hooks/discount/use-menu-data"
import { useMenuCategoryMutations } from "@/hooks/menus/use-menu-category-mutations"

const ITEMS_PER_PAGE = 10
const RANK_BADGE = ["🥇", "🥈", "🥉"]

const CARD_STYLES = {
   total: {
      bg: "bg-white dark:bg-[#22263a]", border: "border-white dark:border-[#22263a]",
      text: "!text-emerald-600 dark:!text-emerald-400", label: "text-gray-600 dark:text-gray-200",
      icon: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
   },
   gold: {
      bg: "bg-white dark:bg-[#22263a]", border: "border-white dark:border-[#22263a]",
      text: "!text-blue-600 dark:!text-blue-400", label: "text-gray-600 dark:text-gray-200",
      icon: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-50 dark:bg-blue-500/10",
   },
   silver: {
      bg: "bg-white dark:bg-[#22263a]", border: "border-white dark:border-[#22263a]",
      text: "!text-[#03624C] dark:!text-violet-400", label: "text-gray-600 dark:text-gray-200",
      icon: "text-[#03624C] dark:text-[#03624C]", iconBg: "bg-violet-50 dark:bg-violet-500/10",
   },
   bronze: {
      bg: "bg-white dark:bg-[#22263a]", border: "border-white dark:border-[#22263a]",
      text: "!text-amber-600 dark:!text-amber-400", label: "text-gray-600 dark:text-gray-200",
      icon: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-50 dark:bg-amber-500/10",
   },
}
const ACCENT_CLASS = {
   text: "text-[#03624C] dark:text-[#1857D8]",
   bg: "bg-[#03624C] dark:bg-[#1857D8]",
   border: "border-[#03624C]/30 dark:border-[#1857D8]/30",
   iconBg: "bg-[#03624C] dark:bg-[#1857D8]",
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

export default function MenuCategoriesPage() {
   const { i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"
   const { can } = usePermission("menu")

   const { data: categories = [], isLoading: loadingCategories, isFetching: fetchingCategories } = useMenuCategories()
   const { data: menuItems = [], isLoading: loadingItems, isFetching: fetchingItems } = useMenuItems()
   const { create, update, remove } = useMenuCategoryMutations()

   const loading = loadingCategories || loadingItems
   const isFetching = fetchingCategories || fetchingItems

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
   const [deleteItemCount, setDeleteItemCount] = useState(0)
   const originalSnapshot = useRef("")
   const tableEntranceRef = useRef<HTMLDivElement>(null)
   const hasFilter = search || startDate || endDate

   const INPUT_BASE =
      "w-full h-9 px-3 text-[14px] rounded-lg outline-none transition-all " +
      "bg-white dark:bg-[#22263a] border border-gray-200/80 dark:border-white/[0.08] " +
      "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/30 shadow-sm dark:shadow-none " +
      "focus:border-[#03624C] dark:focus:border-[#1857D8] focus:ring-2 focus:ring-[#03624C]/10 dark:focus:ring-[#1857D8]/10"

   const openAdd = () => { setCurrentCat({ name: "" }); setIsViewMode(false); setNameError(undefined); originalSnapshot.current = ""; setIsDialogOpen(true) }
   const openEdit = (item: MenuCategory) => { setCurrentCat({ ...item }); setIsViewMode(false); setNameError(undefined); originalSnapshot.current = JSON.stringify({ name: item.name }); setIsDialogOpen(true) }
   const openView = (item: MenuCategory) => { setCurrentCat(item); setIsViewMode(true); setIsDialogOpen(true) }
   const openDelete = (item: MenuCategory) => { setCurrentCat(item); setDeleteItemCount(menuItems.filter(i => i.category_id === item.id).length); setIsDeleteAlertOpen(true) }

   const handleSave = async () => {
      if (!currentCat?.name?.trim()) { setNameError(isKh ? "សូមបញ្ចូលឈ្មោះប្រភេទ" : "Category name is required"); return }
      if (currentCat.id && JSON.stringify({ name: currentCat.name }) === originalSnapshot.current) {
         toastWarn(isKh ? "មិនមានការផ្លាស់ប្តូរ" : "No changes detected", isKh ? "សូមកែប្រែមុនពេលរក្សាទុក" : "Please make changes before saving"); return
      }
      try {
         if (currentCat.id) {
            await update.mutateAsync({ id: currentCat.id, name: currentCat.name.trim() })
            toastSuccess(isKh ? "កែប្រែបានជោគជ័យ" : "Updated successfully", isKh ? `ប្រភេទ: ${currentCat.name} ត្រូវបានកែប្រែ` : `Menu category: ${currentCat.name} updated`)
         } else {
            const created = await create.mutateAsync(currentCat.name.trim())
            toastSuccess(isKh ? "បន្ថែមបានជោគជ័យ" : "Created successfully", isKh ? `ប្រភេទ: ${created.name} ត្រូវបានបន្ថែម` : `Menu category: ${created.name} created`)
         }
         setIsDialogOpen(false)
      } catch (err: any) {
         toastError(isKh ? "មានបញ្ហា" : "Something went wrong", err?.message)
      }
   }

   const handleDelete = async () => {
      if (!currentCat) return
      try {
         const itemsToRemove = menuItems.filter(i => i.category_id === currentCat.id)
         await remove.mutateAsync({ id: currentCat.id, itemsToRemove })
         toastSuccess(
            isKh ? "លុបបានជោគជ័យ" : "Deleted successfully",
            isKh
               ? itemsToRemove.length > 0 ? `ប្រភេទ "${currentCat.name}" និងមុខម្ហូប ${itemsToRemove.length} ត្រូវបានលុប` : `ប្រភេទ "${currentCat.name}" ត្រូវបានលុប`
               : itemsToRemove.length > 0 ? `Category "${currentCat.name}" and ${itemsToRemove.length} item(s) deleted` : `Category "${currentCat.name}" deleted`
         )
         setIsDeleteAlertOpen(false); setCurrentCat(null); setDeleteItemCount(0)
      } catch (err: any) {
         toastError(isKh ? "លុបមិនបាន" : "Failed to delete", err?.message)
      }
   }

   const itemCountMap = useMemo(() => {
      const map: Record<number, number> = {}
      menuItems.forEach(item => { map[item.category_id] = (map[item.category_id] ?? 0) + 1 })
      return map
   }, [menuItems])

   const processedData = useMemo(() => {
      let result = categories.filter(c => {
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
         result.sort((a: any, b: any) => {
            const dir = sortConfig.direction === "asc" ? 1 : -1
            if (sortConfig.key === "item_count") {
               const av = itemCountMap[a.id] ?? 0
               const bv = itemCountMap[b.id] ?? 0
               return av < bv ? -dir : av > bv ? dir : 0
            }
            return a[sortConfig.key!] < b[sortConfig.key!] ? -dir : a[sortConfig.key!] > b[sortConfig.key!] ? dir : 0
         })
      }
      return result
   }, [categories, search, startDate, endDate, sortConfig, itemCountMap])

   const top3 = useMemo(() => {
      return [...categories].sort((a, b) => (itemCountMap[b.id] ?? 0) - (itemCountMap[a.id] ?? 0)).slice(0, 3).map(c => ({ ...c, productCount: itemCountMap[c.id] ?? 0 }))
   }, [categories, itemCountMap])

   const stats = [
      { key: "total" as const, label: isKh ? "ប្រភេទសរុប" : "Total Categories", rankIcon: null as string | null, value: categories.length, sub: isKh ? "ប្រភេទ" : "categories", icon: <Grid3X3 className="w-4 h-4" /> },
      ...top3.map((cat, i) => ({ key: (["gold", "silver", "bronze"] as const)[i], label: cat.name, rankIcon: RANK_BADGE[i] as string | null, value: cat.productCount, sub: isKh ? "មុខម្ហូប" : "items", icon: <Tags className="w-4 h-4" /> })),
   ]

   const columns = [
      {
         key: "no", header: isKh ? "ល.រ" : "No.",
         render: (_: any, i: number) => (
            <span className="text-[14px] text-gray-600 dark:text-white/25 font-mono tabular-nums">
               {String((currentPage - 1) * ITEMS_PER_PAGE + i + 1).padStart(2, "0")}
            </span>
         ),
      },
      {
         key: "name", header: isKh ? "ឈ្មោះប្រភេទ" : "Category Name", sortable: true,
         render: (item: MenuCategory) => (
            <span className=" text-gray-800 dark:text-white text-[14px]">
               {item.name}
            </span>
         ),
      },
      {
         key: "created_at", header: isKh ? "កាលបរិច្ឆេទ" : "Created Date", sortable: true,
         render: (item: MenuCategory) => {
            const p = formatDateParts(item.created_at)
            if (!p) return <span className="text-gray-300 dark:text-white/20 text-[14px]">—</span>
            return (
               <div className="flex flex-col gap-0.5">
                  <span className="text-[14px]  text-gray-700 dark:text-white/70">{p.date}</span>
                  <span className="text-[12px] text-gray-400 dark:text-white/30">{p.time}</span>
               </div>
            )
         },
      },
      {
         key: "updated_at", header: isKh ? "កែប្រែចុងក្រោយ" : "Last Updated", sortable: true,
         render: (item: MenuCategory) => {
            const p = formatDateParts(item.updated_at)
            if (!p) return <span className="text-gray-300 dark:text-white/20 text-[14px]">—</span>
            return (
               <div className="flex flex-col gap-0.5">
                  <span className="text-[14px]  text-gray-700 dark:text-white/70">{p.date}</span>
                  <span className="text-[12px] text-gray-400 dark:text-white/30">{p.time}</span>
               </div>
            )
         },
      },
      {
         key: "item_count", header: isKh ? "ចំនួនមុខម្ហូប" : "Item Count", sortable: true,
         render: (item: MenuCategory) => {
            const count = itemCountMap[item.id] ?? 0
            return (
               <span className={cn("inline-flex items-center gap-1 text-[14px] px-2.5 py-0.5 rounded-full border", "text-[#03624C] dark:text-white", "bg-[#03624C]/10 dark:bg-[#1857D8]", "border-[#03624C]/20 dark:border-[#1857D8]")}>
                  <Package className="w-3 h-3" />
                  {count} {isKh ? "មុខ" : "items"}
               </span>
            )
         },
      },
      {
         key: "actions", header: isKh ? "សកម្មភាព" : "Actions", className: "text-right",
         render: (item: MenuCategory) => (
            <div className="flex items-center justify-end gap-1">
               <button onClick={() => openView(item)} className="w-[30px] h-[30px] flex items-center justify-center rounded-lg text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-700/40 dark:hover:bg-blue-900/40 dark:hover:border-blue-500 transition-all duration-150" title={isKh ? "មើលព័ត៌មាន" : "View Details"}>
                  <Eye className="w-3.5 h-3.5" />
               </button>
               {can("edit") &&
                  <button onClick={() => openEdit(item)} className="w-[30px] h-[30px] flex items-center justify-center rounded-lg text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-700/40 dark:hover:bg-amber-900/40 dark:hover:border-amber-500 transition-all duration-150" title={isKh ? "កែប្រែ" : "Edit"}>
                     <Edit2 className="w-3.5 h-3.5" />
                  </button>}
               {can("delete") &&
                  <button onClick={() => openDelete(item)} className="w-[30px] h-[30px] flex items-center justify-center rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-700/40 dark:hover:bg-rose-900/40 dark:hover:border-rose-500 transition-all duration-150" title={isKh ? "លុបចោល" : "Delete"}>
                     <Trash2 className="w-3.5 h-3.5" />
                  </button>}
            </div>
         ),
      },
   ]

   const showInitialLoading = loading && categories.length === 0 && menuItems.length === 0

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
            <Header title={isKh ? "គ្រប់គ្រងប្រភេទ" : "Menu Categories"} subtitle={isKh ? "កំណត់ប្រភេទមុខម្ហូប" : "Manage your menu categories"} />
            {showInitialLoading ? (
               <div className="flex-1 flex items-center justify-center flex-col gap-4">
                  <Loader2 className={cn("w-5 h-5 animate-spin", ACCENT_CLASS.text)} />
                  <span className={cn("text-[12px] font-bold uppercase tracking-[0.2em] animate-pulse", ACCENT_CLASS.text)}>{isKh ? "កំពុងផ្ទុក..." : "Loading..."}</span>
               </div>
            ) : (
               <main className="flex-1 p-5 space-y-4 overflow-hidden flex flex-col">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                     {stats.map((s, i) => {
                        const st = CARD_STYLES[s.key]
                        return (
                           <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.07 }} whileHover={{ y: -3, transition: { duration: 0.18 } }}>
                              <Card className={cn("border rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40", st.bg, st.border)}>
                                 <CardContent className="p-2">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                       <p className={cn("flex items-center gap-1.5 min-w-0 text-[14px] font-bold uppercase", st.label)}>
                                          {s.rankIcon && <span className="text-[20px] leading-none not-italic shrink-0">{s.rankIcon}</span>}
                                          <span className="truncate">{s.label}</span>
                                       </p>
                                       <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", st.iconBg)}>
                                          <span className={st.icon}>{s.icon}</span>
                                       </div>
                                    </div>
                                    <p className={cn("text-[22px] font-bold text-center leading-none tabular-nums mb-2.5", st.text)}>{s.value}</p>
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
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="flex flex-wrap gap-2 items-center justify-between shrink-0">
                     <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white/25 pointer-events-none" />
                           <input className={cn(INPUT_BASE, "w-56 pl-8 rounded-lg")} placeholder={isKh ? "ស្វែងរកប្រភេទ..." : "Search category..."} value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07] shrink-0" />
                        <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
                        <AnimatePresence>
                           {hasFilter && (
                              <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => { setSearch(""); setStartDate(""); setEndDate("") }} className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all">
                                 <RotateCcw className="w-3.5 h-3.5" />
                              </motion.button>
                           )}
                        </AnimatePresence>
                     </div>
                     {can("create") && (
                        <button onClick={openAdd} className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] text-white transition-all active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90">
                           <Plus className="w-4 h-4" />{isKh ? "បន្ថែមថ្មី" : "Add New"}
                        </button>
                     )}
                  </motion.div>
                  <motion.div
                     ref={tableEntranceRef}
                     initial={{ opacity: 0, y: 14 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.35, delay: 0.25 }}
                     onAnimationComplete={() => {
                        if (tableEntranceRef.current) tableEntranceRef.current.style.transform = 'none'
                     }}
                     className="flex-1 overflow-hidden"
                  >
                     <Card className="h-full border-0 shadow-none bg-transparent flex flex-col">
                        <DataTableCustom data={processedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)} columns={columns} currentPage={currentPage} totalPages={Math.ceil(processedData.length / ITEMS_PER_PAGE) || 1} onPageChange={setCurrentPage} totalItems={processedData.length} sortConfig={sortConfig} onSort={key => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }))} itemsPerPage={ITEMS_PER_PAGE} language={i18n.language as any} />
                     </Card>
                  </motion.div>
               </main>
            )}
         </div>
         <Dialog open={isDialogOpen} onOpenChange={v => !update.isPending && !create.isPending && setIsDialogOpen(v)}>
            <DialogContent className="max-w-[480px] p-0 border border-gray-200 dark:border-white/[0.10] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] [&>button]:hidden">
               <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
                  <div className="flex items-center gap-2.5">
                     <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", CARD_STYLES.total.iconBg)}>
                        <Tags className={cn("w-4 h-4", CARD_STYLES.total.icon)} />
                     </div>
                     <div>
                        <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90">
                           {isViewMode ? (isKh ? "ព័ត៌មានលម្អិត" : "View Details") : currentCat?.id ? (isKh ? "កែប្រែប្រភេទ" : "Edit Category") : (isKh ? "បន្ថែមប្រភេទថ្មី" : "Add New Category")}
                        </DialogTitle>
                        <DialogDescription className="text-[12px] text-gray-600 dark:text-white/30">
                           {isViewMode ? (isKh ? "អានតែប៉ុណ្ណោះ" : "Read-only") : (isKh ? "បំពេញព័ត៌មានខាងក្រោម" : "Fill in the details below")}
                        </DialogDescription>
                     </div>
                  </div>
               </DialogHeader>
               <div className="px-6 py-5 space-y-4">
                  <div className="space-y-1.5">
                     <Label className={cn("text-[14px]  text-gray-600 dark:text-white/30",
                        nameError && "text-rose-500"
                     )}>
                     {!isViewMode && ( <>
                        {isKh ? "ឈ្មោះប្រភេទ" : "Category Name"}
                           <span className="text-rose-500 ml-0.5">*</span>
                        </>
                     )}
                     </Label>
                     {isViewMode ? (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-[#22263a]">
                        <Tags className={cn("w-3.5 h-3.5 shrink-0", ACCENT_CLASS.text)} />
                        <span className="text-[14px]  text-gray-800 dark:text-white/30 w-20 shrink-0">
                           {isKh ? "ប្រភេទ" : "Category"}
                        </span>
                        <span className="text-[14px]  text-gray-800 dark:text-white/85">
                              {currentCat?.name}
                           </span>
                     </div>
                     ) : (
                        <>
                           <input
                              autoFocus
                              className={cn(
                                 INPUT_BASE,
                                 nameError
                                    ? "border-rose-400 dark:border-rose-500/50 focus:border-rose-400 focus:ring-rose-400/10"
                                    : "focus:border-[#03624C] dark:focus:border-[#1857D8] focus:ring-[#03624C]/10 dark:focus:ring-[#1857D8]/10"
                              )}
                              value={currentCat?.name || ""}
                              onChange={e => { setCurrentCat({ ...currentCat, name: e.target.value }); setNameError(undefined) }}
                              onKeyDown={e => e.key === "Enter" && !isViewMode && handleSave()}
                              placeholder={isKh ? "ឧ. អាហារ, ភេសជ្ជៈ..." : "e.g. Appetizers, Drinks..."}
                           />
                           {nameError &&
                              <p className="flex items-center gap-1 text-[14px] text-rose-500 dark:text-rose-400 mt-1">
                                 <AlertTriangle className="w-3 h-3 shrink-0" />{nameError}
                              </p>}
                        </>
                     )}
                  </div>
                  {isViewMode && currentCat?.id && (
                     <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-[#22263a]">
                        <Package className={cn("w-3.5 h-3.5 shrink-0", ACCENT_CLASS.text)} />
                        <span className="text-[14px]   text-gray-800 dark:text-white/30 w-20 shrink-0">
                           {isKh ? "មុខម្ហូប" : "Items"}
                        </span>
                        <span className="text-[14px]  text-gray-800 dark:text-white/85">
                           {menuItems.filter(i => i.category_id === currentCat.id).length} {isKh ? "មុខ" : "items"}
                        </span>
                     </div>
                  )}
                  {currentCat?.created_at && (() => {
                     const p = formatDateParts(currentCat.created_at); return p ? (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-[#22263a]">
                           <Calendar className={cn("w-3.5 h-3.5 shrink-0", ACCENT_CLASS.text)} />
                           <span className="text-[14px] text-gray-800 dark:text-white/30 w-20 shrink-0">
                              {isKh ? "បានបង្កើត" : "Created"}
                           </span>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[14px]  text-gray-800 dark:text-white/85">{p.date}</span>
                              <span className="text-[14px] text-gray-400 dark:text-white/30">{p.time}</span>
                           </div>
                        </div>
                     ) : null
                  })()}
                  {currentCat?.updated_at && (() => {
                     const p = formatDateParts(currentCat.updated_at); return p ? (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-[#22263a]">
                           <RotateCcw className={cn("w-3.5 h-3.5 shrink-0", ACCENT_CLASS.text)} />
                           <span className="text-[14px] text-gray-800 dark:text-white/30 w-20 shrink-0">
                              {isKh ? "កែប្រែ" : "Updated"}
                           </span>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[14px]  text-gray-800 dark:text-white/85">{p.date}</span>
                              <span className="text-[14px] text-gray-400 dark:text-white/30">{p.time}</span>
                           </div>
                        </div>
                     ) : null
                  })()}
               </div>
               <DialogFooter className="px-6 py-4 border-t border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg">
                  <div className="flex justify-end gap-2 w-full">
                     <button onClick={() => setIsDialogOpen(false)} disabled={update.isPending || create.isPending}
                        className="h-9 px-5 rounded-lg text-[14px] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all disabled:opacity-50">
                        {isViewMode ? (isKh ? "បិទ" : "Close") : (isKh ? "បោះបង់" : "Cancel")}
                     </button>
                     {!isViewMode && (
                        <button onClick={handleSave} disabled={update.isPending || create.isPending} className="h-9 px-6 rounded-lg text-[14px] text-white flex items-center gap-2 transition-all disabled:opacity-60 active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90">
                           {(update.isPending || create.isPending) ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{isKh ? "កំពុងរក្សា..." : "Saving..."}</> : isKh ? "រក្សាទុក" : "Save"}
                        </button>
                     )}
                  </div>
               </DialogFooter>
            </DialogContent>
         </Dialog>
         <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent className="rounded-2xl border-0 bg-white dark:bg-[#22263a] shadow-2xl p-0 max-w-[400px] overflow-hidden">
               <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-rose-400" />
               <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                     <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                     </div>
                     <div className="pt-0.5">
                        <AlertDialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 mb-1">
                           {isKh ? "បញ្ជាក់ការលុប" : "Confirm Delete"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[13px] text-gray-500 dark:text-white/40 leading-relaxed">
                           {isKh ? "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។" : "This action cannot be undone."}
                        </AlertDialogDescription>
                     </div>
                  </div>
                  {currentCat?.name && (
                     <div className="mb-3 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/[0.08] border border-rose-100 dark:border-rose-500/20 flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="text-[14px]  text-rose-600 dark:text-rose-300 truncate">
                           {currentCat.name}
                        </span>
                     </div>
                  )}
                  {deleteItemCount > 0 && (
                     <div className="mb-5 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/[0.08] border border-amber-200 dark:border-amber-500/20 flex items-start gap-2.5">
                        <Package className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-[13px] text-amber-700 dark:text-amber-300 leading-relaxed">
                           {isKh ? `ប្រភេទនេះមានមុខម្ហូប ${deleteItemCount} មុខ។ ប្រសិនបើបន្ត មុខម្ហូបទាំងនោះនឹងត្រូវបានលុបជាមួយគ្នាផងដែរ។` : `This category contains ${deleteItemCount} menu item${deleteItemCount > 1 ? "s" : ""}. Deleting it will also permanently delete ${deleteItemCount > 1 ? "those items" : "that item"}.`}
                        </span>
                     </div>
                  )}
                  <AlertDialogFooter className="gap-2 flex-row justify-end">
                     <AlertDialogCancel
                        onClick={() => setIsDeleteAlertOpen(false)}
                        className="h-9 px-5 rounded-xl text-[14px] font-bold border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all">{isKh ? "បោះបង់" : "Cancel"}
                     </AlertDialogCancel>
                     <AlertDialogAction
                        onClick={handleDelete}
                        disabled={remove.isPending}
                        className="h-9 px-5 rounded-xl text-[14px] font-bold flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border dark:border-rose-500/30 dark:shadow-none disabled:opacity-60 transition-all" >
                        {remove.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{isKh ? "កំពុងលុប..." : "Deleting..."}</> : <><Trash2 className="w-3.5 h-3.5" />{isKh ? "លុបចោល" : "Delete"}</>}
                     </AlertDialogAction>
                  </AlertDialogFooter>
               </div>
            </AlertDialogContent>
         </AlertDialog>
      </div>
   )
}