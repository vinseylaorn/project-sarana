"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useTranslation } from "react-i18next"
import { useNotifications } from "@/lib/notification-context"
import { DataTableCustom } from "@/components/ui/table"
import {
   Dialog, DialogContent, DialogHeader, DialogTitle,
   DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
   AlertDialog, AlertDialogAction, AlertDialogCancel,
   AlertDialogContent, AlertDialogDescription,
   AlertDialogFooter, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import {
   Search, Plus, Eye, Edit2, Trash2,
   Filter, Loader2, Package, AlertTriangle, RefreshCw, Truck, XCircle, CheckCircle2, RotateCcw,
   TrendingUp, Layers, Calendar, Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toastSuccess, toastError, toastWarn } from "@/lib/toast"
import type { InventoryItem } from "@/types"
import { usePermission } from "@/lib/role-context"
import {
   SORA, INPUT, SEL_T, SEL_C, SEL_I, ACCENT, CARD_STYLES,
   UNIT_OPTIONS, SIZE_OPTIONS,
   getDisplayUnit, getDisplaySize, formatDate,
} from "./inventory.config"

import { useInventory, useStockCategories, useSuppliers } from "@/hooks/inventory/use-inventory-data"
import { useInventoryMutations } from "@/hooks/inventory/use-inventory-mutation"

const ErrorMsg = ({ msg }: { msg: string }) => (
   <p className="flex items-center gap-1 text-[14px] text-rose-500 dark:text-rose-400 mt-1">
      <AlertTriangle className="w-3 h-3 shrink-0" />{msg}
   </p>
)

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

export default function InventoryPage() {
   const { t, i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"

   const { addNotification, hasNotification } = useNotifications()
   const { can } = usePermission("inventory")

   const {
      data: inventory = [],
      isLoading: loadingInventory,
      isFetching: fetchingInventory,
      refetch: refetchInventory,
   } = useInventory()
   const {
      data: stockCategories = [],
      isLoading: loadingCategories,
      isFetching: fetchingCategories,
   } = useStockCategories()
   const {
      data: suppliers = [],
      isLoading: loadingSuppliers,
      isFetching: fetchingSuppliers,
   } = useSuppliers()
   const { create, update, remove } = useInventoryMutations()

   const loading = loadingInventory || loadingCategories || loadingSuppliers
   const isFetching = fetchingInventory || fetchingCategories || fetchingSuppliers

   const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
   const [search, setSearch] = useState("")
   const [categoryFilter, setCategoryFilter] = useState("All")
   const [supplierFilter, setSupplierFilter] = useState("All")
   const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" })
   const [currentPage, setCurrentPage] = useState(1)
   const itemsPerPage = 10
   const [isDialogOpen, setIsDialogOpen] = useState(false)
   const [isViewMode, setIsViewMode] = useState(false)
   const [currentItem, setCurrentItem] = useState<any>(null)
   const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
   const [fieldErrors, setFieldErrors] = useState<{ name?: string; category_id?: string; unit?: string }>({})
   const [restockMode, setRestockMode] = useState(false)
   const [restockItem, setRestockItem] = useState<InventoryItem | null>(null)
   const [nameSearch, setNameSearch] = useState("")
   const [nameDropOpen, setNameDropOpen] = useState(false)
   const originalSnapshot = useRef<string>("")
   const checkedLowStock = useRef<Set<string>>(new Set())

   const saving = create.isPending || update.isPending

   useEffect(() => {
      if (loading) return
      inventory.forEach(item => {
         if (item.stock <= item.min_stock) {
            const notifId = `low_stock_${item.id}`
            if (!checkedLowStock.current.has(notifId) && !hasNotification(notifId)) {
               checkedLowStock.current.add(notifId)
               addNotification({
                  id: notifId,
                  type: "warning",
                  title: isKh ? "ស្តុកទាប" : "Low Stock Alert",
                  message: isKh
                     ? `${item.name} នៅសល់ ${item.stock} ${item.unit} — ត្រូវបញ្ចូលបន្ថែម`
                     : `${item.name} has only ${item.stock} ${item.unit} left — please restock`,
               })
            }
         }
      })
   }, [inventory, loading, isKh, addNotification, hasNotification])

   const displayUnit = (unit: string) => getDisplayUnit(unit, isKh)
   const displaySize = (size: string) => getDisplaySize(size, isKh)

   const getSupplierName = (supplierId: number | null | undefined) => {
      if (!supplierId) return "—"
      return suppliers.find(s => s.id === supplierId)?.name || "—"
   }

   const resetDialog = () => {
      setRestockMode(false)
      setRestockItem(null)
      setFieldErrors({})
      setNameSearch("")
      setNameDropOpen(false)
   }

   const handleSelectRestock = (item: InventoryItem) => {
      setRestockMode(true)
      setRestockItem(item)
      setCurrentItem({ ...item, stock: 0 })
      setNameDropOpen(false)
      setNameSearch("")
      setFieldErrors({})
   }

   const handleOpenAdd = () => {
      resetDialog()
      setIsViewMode(false)
      setCurrentItem({
         name: "", category_id: stockCategories[0]?.id ?? "",
         stock: 0, min_stock: 5, unit: "គីឡូក្រាម", size: "Normal",
         supplier_id: null,
      })
      originalSnapshot.current = ""
      setIsDialogOpen(true)
   }

   const handleOpenRestock = () => {
      resetDialog()
      setRestockMode(true)
      setRestockItem(null)
      setCurrentItem({ stock: 0 })
      setNameSearch("")
      setNameDropOpen(false)
      setIsViewMode(false)
      setIsDialogOpen(true)
   }

   const handleOpenEdit = (item: InventoryItem) => {
      resetDialog()
      setIsViewMode(false)
      setCurrentItem({ ...item })
      originalSnapshot.current = JSON.stringify({
         name: item.name, category_id: item.category_id,
         unit: item.unit, size: item.size,
         stock: item.stock, min_stock: item.min_stock,
         supplier_id: (item as any).supplier_id ?? null,
      })
      setIsDialogOpen(true)
   }

   const handleSave = async () => {
      const errs: typeof fieldErrors = {}
      if (!restockMode) {
         if (!currentItem?.name) errs.name = isKh ? "សូមបញ្ចូលឈ្មោះផលិតផល" : "Product name is required"
         if (!currentItem?.category_id) errs.category_id = isKh ? "សូមជ្រើសរើសប្រភេទ" : "Category is required"
         if (!currentItem?.unit) errs.unit = isKh ? "សូមជ្រើសរើសខ្នាត" : "Unit is required"
      } else {
         if (!restockItem) {
            toastWarn(
               isKh ? "សូមជ្រើសរើសផលិតផល" : "Please select a product",
               isKh ? "ត្រូវជ្រើសរើសផលិតផលដើម្បីបន្ថែមស្តុក" : "You need to select a product to restock"
            )
            return
         }
         if (Number(currentItem?.stock || 0) <= 0) {
            toastWarn(
               isKh ? "សូមបញ្ចូលចំនួន" : "Please enter quantity",
               isKh ? "ចំនួនត្រូវតែធំជាង 0" : "Quantity must be greater than 0"
            )
            return
         }
      }
      if (Object.keys(errs).length) { setFieldErrors(errs); return }

      try {
         if (restockMode && restockItem) {
            const addQty = Number(currentItem.stock || 0)
            const newStock = Number(restockItem.stock) + addQty
            await update.mutateAsync({
               id: restockItem.id,
               payload: {
                  category_id: restockItem.category_id, name: restockItem.name,
                  unit: restockItem.unit, size: restockItem.size,
                  stock: newStock, min_stock: restockItem.min_stock,
                  supplier_id: (restockItem as any).supplier_id ?? null,
               },
            })
            checkedLowStock.current.delete(`low_stock_${restockItem.id}`)
            toastSuccess(
               isKh ? "បន្ថែមស្តុកបានជោគជ័យ" : "Stock restocked successfully",
               `${restockItem.name}: ${restockItem.stock} + ${addQty} = ${newStock} ${displayUnit(restockItem.unit)}`,
            )
         } else if (currentItem?.id) {
            const snap = JSON.stringify({
               name: currentItem.name, category_id: currentItem.category_id,
               unit: currentItem.unit, size: currentItem.size,
               stock: Number(currentItem.stock), min_stock: Number(currentItem.min_stock),
               supplier_id: currentItem.supplier_id ?? null,
            })
            if (snap === originalSnapshot.current) {
               toastWarn(
                  isKh ? "មិនមានការផ្លាស់ប្តូរអ្វីទេ" : "No changes detected",
                  isKh ? "សូមកែប្រែមុនពេលរក្សាទុក" : "Please make changes before saving"
               )
               return
            }
            await update.mutateAsync({
               id: currentItem.id,
               payload: {
                  category_id: Number(currentItem.category_id),
                  name: currentItem.name, unit: currentItem.unit, size: currentItem.size,
                  stock: Number(currentItem.stock), min_stock: Number(currentItem.min_stock),
                  supplier_id: currentItem.supplier_id ?? null,
               },
            })
            checkedLowStock.current.delete(`low_stock_${currentItem.id}`)
            toastSuccess(
               isKh ? "កែប្រែបានជោគជ័យ" : "Updated successfully",
               isKh ? `ផលិតផល "${currentItem.name}" ត្រូវបានកែប្រែដោយជោគជ័យ` : `Product "${currentItem.name}" has been updated successfully`,
            )
         } else {
            await create.mutateAsync({
               category_id: Number(currentItem.category_id),
               name: currentItem.name, unit: currentItem.unit, size: currentItem.size,
               stock: Number(currentItem.stock), min_stock: Number(currentItem.min_stock),
               supplier_id: currentItem.supplier_id ?? null,
            })
            toastSuccess(
               isKh ? "បន្ថែមបានជោគជ័យ" : "Added successfully",
               isKh ? `ផលិតផល "${currentItem.name}" ត្រូវបានបន្ថែមដោយជោគជ័យ` : `Product "${currentItem.name}" has been added successfully`,
            )
         }
         setIsDialogOpen(false)
         resetDialog()
      } catch (err: any) {
         toastError(err?.response?.data?.message ?? err?.message ?? (isKh ? "មានបញ្ហា" : "Something went wrong"))
      }
   }

   const confirmDelete = async () => {
      if (!itemToDelete) return
      try {
         await remove.mutateAsync(itemToDelete.id)
         toastSuccess(
            isKh ? "លុបបានសម្រេច" : "Deleted successfully",
            isKh ? `ផលិតផល "${itemToDelete.name}" ត្រូវបានដកចេញដោយជោគជ័យ` : `Product "${itemToDelete.name}" has been removed successfully`,
         )
         setIsDeleteAlertOpen(false)
         setItemToDelete(null)
      } catch (err: any) {
         toastError(err?.response?.data?.message ?? err?.message ?? (isKh ? "មិនអាចលុបបាន" : "Failed to delete"))
      }
   }

   const processedData = useMemo(() => {
      let result = [...inventory].filter(i => {
         const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
         const matchCat = categoryFilter === "All" || i.category === categoryFilter
         const matchSupplier = supplierFilter === "All" || String((i as any).supplier_id) === supplierFilter
         return matchSearch && matchCat && matchSupplier
      })
      if (sortConfig.key) {
         result.sort((a: any, b: any) => {
            if (a[sortConfig.key!] < b[sortConfig.key!]) return sortConfig.direction === "asc" ? -1 : 1
            if (a[sortConfig.key!] > b[sortConfig.key!]) return sortConfig.direction === "asc" ? 1 : -1
            return 0
         })
      }
      return result
   }, [inventory, search, categoryFilter, supplierFilter, sortConfig])

   const paginatedData = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage
      return processedData.slice(start, start + itemsPerPage)
   }, [processedData, currentPage])

   const statsData = useMemo(() => {
      const total = inventory.length
      const goodStock = inventory.filter(item => item.stock > item.min_stock).length
      const lowStock = inventory.filter(item => item.stock > 0 && item.stock <= item.min_stock).length
      const outStock = inventory.filter(item => item.stock === 0).length
      return { total, goodStock, lowStock, outStock }
   }, [inventory])

   const stats = [
      { label: isKh ? "ផលិតផលសរុប" : "Total Products", value: statsData.total, icon: Layers, style: CARD_STYLES.total },
      { label: isKh ? "ស្តុកល្អ" : "Good Stock", value: statsData.goodStock, icon: CheckCircle2, style: CARD_STYLES.good },
      { label: isKh ? "ស្តុកជិតអស់" : "Low Stock", value: statsData.lowStock, icon: AlertTriangle, style: CARD_STYLES.low },
      { label: isKh ? "អស់ស្តុក" : "Out of Stock", value: statsData.outStock, icon: XCircle, style: CARD_STYLES.out },
   ]

   const hasFilter = search || categoryFilter !== "All" || supplierFilter !== "All"

   const resetFilters = () => {
      setSearch("")
      setCategoryFilter("All")
      setSupplierFilter("All")
      setCurrentPage(1)
   }

   const nameSuggestions = useMemo(() => {
      if (!nameSearch) return inventory
      return inventory.filter(i => i.name.toLowerCase().includes(nameSearch.toLowerCase()))
   }, [inventory, nameSearch])

   const dateCell = (raw?: string | null) => {
      const p = formatDateParts(raw)
      if (!p) return <span className="text-gray-300 dark:text-white/20 text-[14px]">—</span>
      return (
         <div className="flex flex-col gap-0.5">
            <span className="text-[14px] text-gray-700 dark:text-white/70">{p.date}</span>
            <span className="text-[14px] text-gray-600 dark:text-white/30">{p.time}</span>
         </div>
      )
   }

   const columns = [
      {
         key: "no",
         header: isKh ? "ល.រ" : "No.",
         render: (_: any, index: number) => (
            <span className="text-[14px] text-gray-600 dark:text-white/25 font-mono tabular-nums">
               {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, "0")}
            </span>
         ),
      },
      {
         key: "name",
         header: isKh ? "ឈ្មោះផលិតផល" : "Product Name",
         sortable: true,
         render: (item: InventoryItem) => (
            <div className="flex items-center gap-2.5">
               <div>
                  <span className="text-gray-800 dark:text-white text-[14px]">{item.name}</span>
                  {item.stock <= item.min_stock && (
                     <span className="ml-2 text-[14px] px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 uppercase tracking-wide">
                        {isKh ? "ស្តុកទាប" : "Low"}
                     </span>
                  )}
               </div>
            </div>
         ),
      },
      {
         key: "category",
         header: isKh ? "ប្រភេទ" : "Category",
         sortable: true,
         render: (item: InventoryItem) => (
            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-lg text-[14px] uppercase tracking-wide", CARD_STYLES.total.bg, CARD_STYLES.total.border, CARD_STYLES.total.text)}>
               {item.category}
            </span>
         ),
      },
      {
         key: "supplier",
         header: isKh ? "អ្នកផ្គត់ផ្គង់" : "Supplier",
         render: (item: InventoryItem) => {
            const name = getSupplierName((item as any).supplier_id)
            return name !== "—" ? (
               <div className="flex items-center gap-1.5">
                  <Truck className="w-3 h-3 text-[#03624C] dark:text-[#1857D8] shrink-0" />
                  <span className="text-[14px] text-gray-600 dark:text-white/60 truncate max-w-[110px]">{name}</span>
               </div>
            ) : (
               <span className="text-[14px] text-gray-300 dark:text-white/20">—</span>
            )
         },
      },
      {
         key: "size",
         header: isKh ? "ទំហំ" : "Size",
         sortable: true,
         render: (item: InventoryItem) => (
            <span className="text-[14px] text-gray-600 dark:text-white/40 italic">{displaySize(item.size)}</span>
         ),
      },
      {
         key: "stock",
         header: isKh ? "កម្រិតស្តុក" : "Stock Level",
         sortable: true,
         render: (item: InventoryItem) => {
            const progress = Math.min((item.stock / (item.min_stock * 2)) * 100, 100)
            const isLow = item.stock <= item.min_stock
            return (
               <div className="w-full max-w-[130px] space-y-1.5">
                  <span className={cn("text-[14px] ", isLow ? "text-rose-500" : ACCENT.text)}>
                     {item.stock} {displayUnit(item.unit)}
                  </span>
                  <Progress
                     value={progress}
                     className="h-1.5 bg-gray-100 dark:bg-white/[0.06]"
                     indicatorClassName={isLow ? "bg-rose-500" : "bg-[#03624C] dark:bg-[#1857D8]"}
                  />
               </div>
            )
         },
      },
      {
         key: "created_at",
         header: isKh ? "ថ្ងៃបង្កើត" : "Created At",
         sortable: true,
         render: (item: InventoryItem) => dateCell(item.created_at),
      },
      {
         key: "updated_at",
         header: isKh ? "បន្ថែមស្តុកចុងក្រោយ" : "Restock At",
         sortable: true,
         render: (item: InventoryItem) => dateCell(item.updated_at),
      },
      {
         key: "actions",
         header: isKh ? "សកម្មភាព" : "Action",
         className: "text-right",
         render: (item: InventoryItem) => (
            <div className="flex items-center justify-end gap-1.5">
               <button
                  onClick={() => { setCurrentItem(item); setIsViewMode(true); setIsDialogOpen(true) }}
                  className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                  text-blue-700 bg-blue-50 border border-blue-200
                  hover:bg-blue-100 hover:border-blue-300
                  dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-700/40
                  dark:hover:bg-blue-900/40 dark:hover:border-blue-500
                  transition-all duration-150"
                  title={isKh ? "មើល" : "View"} >
                  <Eye className="w-3.5 h-3.5" />
               </button>
               {can("edit") && (
                  <button
                     onClick={() => handleOpenEdit(item)}
                     className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                     text-amber-700 bg-amber-50 border border-amber-200
                     hover:bg-amber-100 hover:border-amber-300
                     dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-700/40
                     dark:hover:bg-amber-900/40 dark:hover:border-amber-500
                     transition-all duration-150"
                     title={t("edit")} >
                     <Edit2 className="w-3.5 h-3.5" />
                  </button>
               )}
               {can("delete") && (
                  <button
                     onClick={() => { setItemToDelete(item); setIsDeleteAlertOpen(true) }}
                     className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                     text-rose-700 bg-rose-50 border border-rose-200
                     hover:bg-rose-100 hover:border-rose-300
                     dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-700/40
                     dark:hover:bg-rose-900/40 dark:hover:border-rose-500
                     transition-all duration-150"
                     title={t("delete")} >
                     <Trash2 className="w-3.5 h-3.5" />
                  </button>
               )}
            </div>
         ),
      },
   ]

   const showInitialLoading = loading && inventory.length === 0

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
               title={isKh ? "ការគ្រប់គ្រងស្តុក" : "Stocks Management"}
               subtitle={isKh ? "តាមដានស្តុកទំនិញ" : "Track and manage inventory"}
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
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                     {stats.map(({ label, value, icon: Icon, style }, i) => (
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
                                 <p className={cn("text-[22px] font-bold text-center leading-none tabular-nums mb-2.5", style.text)}>
                                    {value}
                                 </p>
                                 <div className="flex items-center gap-1.5">
                                    <TrendingUp className={cn("w-3 h-3 shrink-0", style.icon)} />
                                    <p className={cn("text-[14px]", style.label)}>
                                       {isKh ? "ផលិតផល" : "products"}
                                    </p>
                                 </div>
                              </CardContent>
                           </Card>
                        </motion.div>
                     ))}
                  </div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.2 }}
                     className="flex flex-wrap gap-2 items-center justify-between shrink-0" >
                     <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white/25 pointer-events-none" />
                           <input
                              className={cn(INPUT, "w-56 pl-8")}
                              placeholder={isKh ? "ស្វែងរក..." : "Search by name..."}
                              value={search}
                              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                           />
                        </div>
                        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07] shrink-0" />
                        <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setCurrentPage(1) }}>
                           <SelectTrigger className={cn(SEL_T, "w-44")}>
                              <Filter className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                              <SelectValue placeholder={isKh ? "ប្រភេទ" : "Category"} />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="All" className={SEL_I}>{isKh ? "គ្រប់ប្រភេទ" : "All Categories"}</SelectItem>
                              {stockCategories.map(c => (
                                 <SelectItem key={c.id} value={c.name} className={SEL_I}>{c.name}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <Select value={supplierFilter} onValueChange={v => { setSupplierFilter(v); setCurrentPage(1) }}>
                           <SelectTrigger className={cn(SEL_T, "w-44")}>
                              <Truck className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                              <SelectValue placeholder={isKh ? "អ្នកផ្គត់ផ្គង់" : "Supplier"} />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="All" className={SEL_I}>{isKh ? "គ្រប់អ្នកផ្គត់ផ្គង់" : "All Suppliers"}</SelectItem>
                              {suppliers.filter(s => s.status === "Active").map(s => (
                                 <SelectItem key={s.id} value={String(s.id)} className={SEL_I}>{s.name}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <AnimatePresence>
                           {hasFilter && (
                              <motion.button
                                 initial={{ opacity: 0, scale: 0.8 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 exit={{ opacity: 0, scale: 0.8 }}
                                 onClick={resetFilters}
                                 className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all" >
                                 <RotateCcw className="w-3.5 h-3.5" />
                              </motion.button>
                           )}
                        </AnimatePresence>
                        <button
                           onClick={() => refetchInventory()}
                           className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] text-gray-600 dark:text-white/40 hover:text-[#03624C] dark:hover:text-[#1857D8] transition-all" >
                           <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
                        </button>
                     </div>
                     {/* FIX: Add ត្រូវការ create, Re Stock ត្រូវការ edit (ព្រោះវាហៅ PUT) */}
                     <div className="flex gap-2">
                        {can("create") && (
                           <button
                              onClick={handleOpenAdd}
                              className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px]  text-white transition-all active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                              <Plus className="w-3.5 h-3.5" /> {t("add")}
                           </button>
                        )}
                        {can("edit") && (
                           <button
                              onClick={handleOpenRestock}
                              className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] text-white transition-all active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                              <RefreshCw className="w-3.5 h-3.5" /> {isKh ? "បន្ថែមស្តុក" : "Re Stock"}
                           </button>
                        )}
                     </div>
                  </motion.div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.28 }}
                     className="flex-1 overflow-hidden" >
                     <Card className="h-full border-0 shadow-none bg-transparent flex flex-col">
                        <DataTableCustom
                           data={paginatedData}
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
         <Dialog open={isDialogOpen} onOpenChange={v => { if (!v) resetDialog(); setIsDialogOpen(v) }}>
            <DialogContent className="max-w-[480px] p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden" style={SORA}>
               <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0 bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
                  <div className="flex items-center gap-2.5">
                     <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", ACCENT.iconBg)}>
                        <Package className="w-4 h-4 text-white" />
                     </div>
                     <div>
                        <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                           {isViewMode
                              ? (isKh ? "ព័ត៌មានលម្អិត" : "View Details")
                              : restockMode
                                 ? (isKh ? "បន្ថែមស្តុក" : "Restock Item")
                                 : currentItem?.id
                                    ? (isKh ? "កែប្រែទំនិញ" : "Edit Item")
                                    : (isKh ? "បន្ថែមទំនិញថ្មី" : "Add New Item")}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Inventory item form</DialogDescription>
                     </div>
                  </div>
               </DialogHeader>
               <div className="px-6 py-5 space-y-4 max-h-[78vh] overflow-y-auto">
                  <div className="space-y-1.5">
                     <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", fieldErrors.name && "text-rose-500")}>
                        {isKh ? "ឈ្មោះផលិតផល" : "Product Name"}
                        {!isViewMode && !restockMode && <span className="text-rose-500 ml-0.5">*</span>}
                     </Label>
                     {isViewMode ? (
                        <input
                           disabled
                           className={cn(INPUT, "opacity-60 cursor-not-allowed")}
                           value={currentItem?.name || ""}
                        />
                     ) : restockMode ? (
                        restockItem ? (
                           <div className={cn("flex items-center gap-2.5 px-3 h-9 rounded-lg border", "border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03]")}>
                              <Package className={cn("w-3.5 h-3.5 shrink-0", ACCENT.text)} />
                              <span className="text-[14px] font-semibold text-gray-700 dark:text-white/70 flex-1 truncate">{restockItem.name}</span>
                              <button
                                 type="button"
                                 onClick={() => { setRestockItem(null); setNameSearch(""); setNameDropOpen(true) }}
                                 className="text-gray-600 hover:text-gray-600 dark:hover:text-white/70 text-lg leading-none" >
                                 ×
                              </button>
                           </div>
                        ) : (
                           <div className="relative">
                              <div className="relative">
                                 <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none shrink-0 text-gray-300 dark:text-white/20" />
                                 <input
                                    type="text"
                                    autoComplete="off"
                                    className={cn(INPUT, "pl-8 pr-8")}
                                    placeholder={isKh ? "ស្វែងរកផលិតផល..." : "Search product..."}
                                    value={nameSearch}
                                    onFocus={() => setNameDropOpen(true)}
                                    onChange={e => { setNameSearch(e.target.value); setNameDropOpen(true) }}
                                    onBlur={() => setTimeout(() => setNameDropOpen(false), 150)}
                                 />
                                 {nameSearch && (
                                    <button
                                       type="button"
                                       onClick={() => { setNameSearch(""); setNameDropOpen(true) }}
                                       className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full text-gray-600 hover:text-gray-600 dark:text-white/25 dark:hover:text-white/50" >
                                       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                       </svg>
                                    </button>
                                 )}
                                 <svg
                                    className={cn("absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-600 dark:text-white/25 transition-transform", nameDropOpen && "rotate-180")}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                 </svg>
                              </div>
                              <AnimatePresence>
                                 {nameDropOpen && (
                                    <motion.div
                                       initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                       animate={{ opacity: 1, y: 0, scale: 1 }}
                                       exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                       transition={{ duration: 0.13 }}
                                       className="absolute z-50 top-full mt-1.5 left-0 right-0 rounded-xl border border-gray-100 dark:border-white/[0.10] bg-white dark:bg-[#22263a] shadow-xl overflow-hidden"
                                       style={SORA} >
                                       <div className="max-h-[200px] overflow-y-auto py-1">
                                          {nameSuggestions.length === 0 ? (
                                             <div className="px-3 py-5 text-center text-[14px] text-gray-600 dark:text-white/25">
                                                {isKh ? "រកមិនឃើញ" : "No products found"}
                                             </div>
                                          ) : nameSuggestions.map(item => (
                                             <button
                                                key={item.id}
                                                type="button"
                                                onMouseDown={e => e.preventDefault()}
                                                onClick={() => handleSelectRestock(item)}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors" >
                                                <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", ACCENT.iconBg)}>
                                                   <Package className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                   <p className="text-[14px] font-semibold text-gray-800 dark:text-white/85 truncate">{item.name}</p>
                                                   <p className="text-[10px] text-gray-600 dark:text-white/30">
                                                      {item.category} · {isKh ? "ស្តុក:" : "Stock:"} {item.stock} {displayUnit(item.unit)}
                                                   </p>
                                                </div>
                                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                                                   {isKh ? "ជ្រើស" : "Select"}
                                                </span>
                                             </button>
                                          ))}
                                       </div>
                                    </motion.div>
                                 )}
                              </AnimatePresence>
                              {nameDropOpen && <div className="fixed inset-0 z-40" onClick={() => setNameDropOpen(false)} />}
                           </div>
                        )
                     ) : (
                        <input
                           type="text"
                           className={cn(INPUT, fieldErrors.name && "border-rose-400 dark:border-rose-500/50")}
                           placeholder={isKh ? "បញ្ចូលឈ្មោះផលិតផល..." : "Enter product name..."}
                           value={currentItem?.name || ""}
                           onChange={e => {
                              setCurrentItem((prev: any) => ({ ...prev, name: e.target.value }))
                              setFieldErrors(e2 => ({ ...e2, name: undefined }))
                           }}
                        />
                     )}
                     {fieldErrors.name && <ErrorMsg msg={fieldErrors.name} />}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <Label className="text-[14px] text-gray-600 dark:text-white/30 flex items-center gap-1.5">
                           <Truck className="w-4 h-4 text-[#03624C] dark:text-[#1857D8]" />
                           {isKh ? "អ្នកផ្គត់ផ្គង់" : "Supplier"}
                        </Label>
                        <Select
                           disabled={isViewMode || restockMode}
                           value={currentItem?.supplier_id ? String(currentItem.supplier_id) : "none"}
                           onValueChange={v => setCurrentItem((p: any) => ({ ...p, supplier_id: v === "none" ? null : Number(v) }))} >
                           <SelectTrigger className={cn("w-full", SEL_T, (isViewMode || restockMode) && "opacity-50")}>
                              <SelectValue placeholder={isKh ? "ជ្រើសរើសអ្នកផ្គត់ផ្គង់..." : "Select supplier..."} />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="none" className={SEL_I}>{isKh ? "គ្មាន" : "None"}</SelectItem>
                              {suppliers.filter(s => s.status === "Active").map(s => (
                                 <SelectItem key={s.id} value={String(s.id)} className={SEL_I}>
                                    {s.name}
                                    {s.category && <span className="ml-1.5 text-[10px] text-gray-600">· {s.category?.name || "—"}</span>}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        {isViewMode && currentItem?.supplier_id && (() => {
                           const sup = suppliers.find(s => s.id === currentItem.supplier_id)
                           if (!sup) return null
                           return (
                              <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#03624C]/5 dark:bg-[#1857D8]/5 border border-[#03624C]/10 dark:border-[#1857D8]/10">
                                 <Truck className="w-3.5 h-3.5 text-[#03624C] dark:text-[#1857D8] shrink-0" />
                                 <div>
                                    <p className="text-[14px] font-bold text-[#03624C] dark:text-[#1857D8]">{sup.name}</p>
                                    {sup.phone && <p className="text-[10px] text-[#03624C]/70 dark:text-[#1857D8]/70">{sup.phone}</p>}
                                 </div>
                              </div>
                           )
                        })()}
                     </div>
                     <div className="space-y-1.5">
                        <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", fieldErrors.category_id && "text-rose-500")}>
                           {isKh ? "ប្រភេទ" : "Category"}
                           {!isViewMode && !restockMode && <span className="text-rose-500 ml-0.5">*</span>}
                        </Label>
                        <Select
                           disabled={isViewMode || restockMode}
                           value={String(currentItem?.category_id ?? "")}
                           onValueChange={v => { setCurrentItem((p: any) => ({ ...p, category_id: Number(v) })); setFieldErrors(e => ({ ...e, category_id: undefined })) }} >
                           <SelectTrigger className={cn("w-full", SEL_T, fieldErrors.category_id && "border-rose-400", (isViewMode || restockMode) && "opacity-50")}>
                              <SelectValue placeholder={isKh ? "ជ្រើស" : "Select"} />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              {stockCategories.map(c => (
                                 <SelectItem key={c.id} value={String(c.id)} className={SEL_I}>{c.name}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        {fieldErrors.category_id && <ErrorMsg msg={fieldErrors.category_id} />}
                     </div>
                     <div className="space-y-1.5">
                        <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", fieldErrors.unit && "text-rose-500")}>
                           {isKh ? "ខ្នាត" : "Unit"}
                           {!isViewMode && !restockMode && <span className="text-rose-500 ml-0.5">*</span>}
                        </Label>
                        <Select
                           disabled={isViewMode || restockMode}
                           value={currentItem?.unit}
                           onValueChange={v => { setCurrentItem((p: any) => ({ ...p, unit: v })); setFieldErrors(e => ({ ...e, unit: undefined })) }} >
                           <SelectTrigger className={cn("w-full", SEL_T, fieldErrors.unit && "border-rose-400", (isViewMode || restockMode) && "opacity-50")}>
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              {UNIT_OPTIONS.map(o => (
                                 <SelectItem key={o} value={o} className={SEL_I}>{displayUnit(o)}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        {fieldErrors.unit && <ErrorMsg msg={fieldErrors.unit} />}
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[14px] text-gray-600 dark:text-white/30">
                           {isKh ? "ទំហំ" : "Size"}
                        </Label>
                        <Select
                           disabled={isViewMode || restockMode}
                           value={currentItem?.size}
                           onValueChange={v => setCurrentItem((p: any) => ({ ...p, size: v }))} >
                           <SelectTrigger className={cn("w-full", SEL_T, (isViewMode || restockMode) && "opacity-50")}>
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              {SIZE_OPTIONS.map(o => (
                                 <SelectItem key={o} value={o} className={SEL_I}>{displaySize(o)}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
                  {restockMode && restockItem ? (
                     <div className="p-4 rounded-lg border bg-emerald-50/50 dark:bg-emerald-500/[0.06] border-emerald-100 dark:border-emerald-500/[0.12]">
                        <div className="space-y-1.5">
                           <Label className="text-[14px] text-emerald-600 dark:text-emerald-400">
                              {isKh ? "ចំនួនដែលបន្ថែម" : "Quantity to Add"}
                           </Label>
                           <input
                              type="number"
                              className={cn(INPUT, "border-emerald-200 dark:border-emerald-500/30 focus:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold")}
                              value={currentItem?.stock ?? 0}
                              onChange={e => setCurrentItem((p: any) => ({ ...p, stock: Number(e.target.value) }))}
                           />
                           {Number(currentItem?.stock) > 0 && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                 → {restockItem.stock} + {currentItem.stock} ={" "}
                                 <span className="font-bold">{Number(restockItem.stock) + Number(currentItem.stock)} {displayUnit(restockItem.unit)}</span>
                              </p>
                           )}
                        </div>
                     </div>
                  ) : !restockMode ? (
                     <div className={cn(
                        "grid grid-cols-2 gap-3 p-4 rounded-lg border",
                        "bg-[#03624C]/5 dark:bg-[#1857D8]/5 border-[#03624C]/10 dark:border-[#1857D8]/10"
                     )}>
                        <div className="space-y-1.5">
                           <Label className={cn("text-[14px] ", ACCENT.text)}>
                              {currentItem?.id ? (isKh ? "ស្តុកបច្ចុប្បន្ន" : "Current Stock") : (isKh ? "ចំនួនដំបូង" : "Initial Qty")}
                           </Label>
                           <input
                              type="number"
                              disabled={isViewMode}
                              className={cn(INPUT, "border-[#03624C]/20 dark:border-[#1857D8]/30 focus:border-[#03624C] dark:focus:border-[#1857D8] text-[#03624C] dark:text-[#1857D8] font-semibold")}
                              value={currentItem?.stock ?? 0}
                              onChange={e => setCurrentItem((p: any) => ({ ...p, stock: Number(e.target.value) }))}
                           />
                        </div>
                        <div className="space-y-1.5">
                           <Label className="text-[14px] text-rose-500 dark:text-rose-400">
                              {isKh ? "កម្រិតផ្តល់ដំណឹង" : "Alert Level"}
                           </Label>
                           <input
                              type="number"
                              disabled={isViewMode}
                              className={cn(INPUT, "border-rose-200 dark:border-rose-500/30 focus:border-rose-400 text-rose-500 dark:text-rose-400 font-semibold")}
                              value={currentItem?.min_stock ?? 0}
                              onChange={e => setCurrentItem((p: any) => ({ ...p, min_stock: Number(e.target.value) }))}
                           />
                        </div>
                     </div>
                  ) : null}

                  {isViewMode && (
                     <div className="grid grid-cols-2 gap-3 p-4 rounded-lg border bg-gray-50 dark:bg-white/[0.03] border-gray-100 dark:border-white/[0.07]">
                        <div className="space-y-1">
                           <Label className="text-[14px] text-gray-600 dark:text-white/30 flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              {isKh ? "ថ្ងៃបង្កើត" : "Created At"}
                           </Label>
                           <p className="text-[14px]  text-gray-700 dark:text-white/70">
                              {formatDate(currentItem?.created_at, isKh)}
                           </p>
                        </div>
                        <div className="space-y-1">
                           <Label className="text-[14px] text-emerald-500 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {isKh ? "បន្ថែមស្តុកចុងក្រោយ" : "Restock At"}
                           </Label>
                           <p className="text-[14px] font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatDate(currentItem?.updated_at, isKh)}
                           </p>
                        </div>
                     </div>
                  )}
               </div>
               {!isViewMode && (
                  <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg">
                     <div className="flex justify-end gap-2 w-full">
                        <button
                           onClick={() => { resetDialog(); setIsDialogOpen(false) }}
                           disabled={saving}
                           className="h-9 px-5 rounded-lg text-[14px] transition-all border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50" >
                           {t("cancel")}
                        </button>
                        <button
                           onClick={handleSave}
                           disabled={saving}
                           className={cn(
                              "h-9 px-6 rounded-lg text-[14px] text-white flex items-center gap-2 transition-all disabled:opacity-60 active:scale-[0.97]",
                              restockMode && restockItem
                                 ? "bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-300 dark:border dark:border-emerald-500/30"
                                 : "bg-[#03624C] hover:bg-[#03624C]/90 dark:bg-[#1857D8] dark:hover:bg-[#1857D8]/90"
                           )} >
                           {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                           {restockMode && restockItem ? (isKh ? "បន្ថែមស្តុក" : "Restock") : t("save")}
                        </button>
                     </div>
                  </DialogFooter>
               )}
               {isViewMode && (
                  <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg">
                     <div className="flex justify-end w-full">
                        <button
                           onClick={() => setIsDialogOpen(false)}
                           className="h-9 px-5 rounded-lg text-[14px] transition-all border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06]" >
                           {isKh ? "បិទ" : "Close"}
                        </button>
                     </div>
                  </DialogFooter>
               )}
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
                        <AlertDialogDescription className="text-[14px] text-gray-500 dark:text-white/40 leading-relaxed">
                           {isKh ? "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។" : "This action cannot be undone."}
                        </AlertDialogDescription>
                     </div>
                  </div>
                  {itemToDelete?.name && (
                     <div className="mb-5 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-500/[0.08] border border-rose-100 dark:border-rose-500/20 flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="text-[14px]  text-rose-600 dark:text-rose-300 truncate">{itemToDelete.name}</span>
                     </div>
                  )}
                  <AlertDialogFooter className="gap-2 flex-row justify-end">
                     <AlertDialogCancel
                        style={SORA}
                        onClick={() => setItemToDelete(null)}
                        className="h-9 px-5 rounded-lg text-[14px] font-bold border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all" >
                        {t("cancel")}
                     </AlertDialogCancel>
                     <AlertDialogAction
                        onClick={confirmDelete}
                        disabled={remove.isPending}
                        style={SORA}
                        className="h-9 px-5 rounded-lg text-[14px] font-bold flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border dark:border-rose-500/30 dark:shadow-none disabled:opacity-60 transition-all" >
                        {remove.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{isKh ? "កំពុងលុប..." : "Deleting..."}</> : <><Trash2 className="w-3.5 h-3.5" /> {t("delete")}</>}
                     </AlertDialogAction>
                  </AlertDialogFooter>
               </div>
            </AlertDialogContent>
         </AlertDialog>
      </div>
   )
}