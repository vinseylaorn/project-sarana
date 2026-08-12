"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { DataTableCustom } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Eye, Edit2, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import type { Discount } from "@/types"
import { useTranslation } from "react-i18next"
import { toastSuccess, toastError } from "@/lib/toast"
import { usePermission } from "@/lib/role-context"
import { DiscountStatsCards } from "@/components/discounts/Discountstatscards"
import { DiscountToolbar } from "@/components/discounts/Discounttoolbar"
import { DiscountDialog } from "@/components/discounts/Discountdialog"
import { DiscountDeleteDialog } from "@/components/discounts/Discountdeletedialog"
import { DiscountViewDialog } from "@/components/discounts/Discountviewdialog"
import {
   SORA, ITEMS_PER_PAGE, SCOPE_CONFIG, VALUE_CONFIG, STATUS_CONFIG, getAccent,
} from "@/components/discounts/Discount.config"

import { useDiscounts, useDiscountMutations } from "@/hooks/discount/use-discounts"
import { useMenuCategories, useMenuItems } from "@/hooks/discount/use-menu-data"

export default function DiscountsPage() {
   const { i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"
   const { can } = usePermission("discount")
   const { resolvedTheme } = useTheme()
   const [mounted, setMounted] = useState(false)
   useEffect(() => setMounted(true), [])
   const isDark = !mounted || resolvedTheme === "dark"
   const accent = getAccent(isDark)

   const { data: discounts = [], isLoading: loadingDiscounts, isFetching: fetchingDiscounts } = useDiscounts()
   const { data: categories = [], isLoading: loadingCategories, isFetching: fetchingCategories } = useMenuCategories()
   const { data: menuItems = [], isLoading: loadingMenuItems, isFetching: fetchingMenuItems } = useMenuItems()
   const { toggleStatus, remove, invalidate } = useDiscountMutations()

   const loading = loadingDiscounts || loadingCategories || loadingMenuItems
   const isFetching = fetchingDiscounts || fetchingCategories || fetchingMenuItems
   const showInitialLoading = loading && discounts.length === 0

   const [search, setSearch] = useState("")
   const [filterScope, setFilterScope] = useState("all")
   const [filterStatus, setFilterStatus] = useState("all")
   const [currentPage, setCurrentPage] = useState(1)
   const [dialogOpen, setDialogOpen] = useState(false)
   const [editItem, setEditItem] = useState<Discount | null>(null)
   const [deleteOpen, setDeleteOpen] = useState(false)
   const [deleteItem, setDeleteItem] = useState<Discount | null>(null)
   const [viewOpen, setViewOpen] = useState(false)
   const [viewItem, setViewItem] = useState<Discount | null>(null)

   const isActuallyExpired = (item: Discount) =>
      item.status === "expired" ||
      (!!item.end_date && new Date(item.end_date).getTime() < Date.now())

   const handleToggle = async (item: Discount) => {
      if (isActuallyExpired(item)) {
         toastError(
            isKh ? "មិនអាចផ្លាស់ប្ដូរ" : "Cannot toggle",
            isKh ? "ការបញ្ចុះផុតកំណត់ហើយ" : "This discount has expired"
         )
         return
      }
      const newStatus: Discount["status"] = item.status === "active" ? "inactive" : "active"
      try {
         await toggleStatus.mutateAsync({ id: item.id, status: newStatus })
         toastSuccess(
            isKh ? "ផ្លាស់ប្ដូរស្ថានភាព" : "Status updated",
            isKh
               ? `ការបញ្ចុះ: ${item.name} ត្រូវបានផ្លាស់ប្ដូរដោយជោគជ័យ`
               : `Discount: ${item.name} status updated successfully`
         )
      } catch {
         toastError(
            isKh ? "មិនអាចផ្លាស់ប្ដូរ" : "Failed to update",
            isKh ? "សូមព្យាយាមម្តងទៀត" : "Please try again"
         )
      }
   }

   const handleDelete = async () => {
      if (!deleteItem) return
      try {
         await remove.mutateAsync(deleteItem.id)
         toastSuccess(
            isKh ? "លុបបានជោគជ័យ" : "Deleted successfully",
            isKh
               ? `ការបញ្ចុះ: ${deleteItem.name} ត្រូវបានលុបដោយជោគជ័យ`
               : `Discount: ${deleteItem.name} deleted successfully`
         )
         setDeleteOpen(false)
         setDeleteItem(null)
      } catch (err: any) {
         toastError(
            isKh ? "លុបមិនបាន" : "Failed to delete",
            err?.message ?? (isKh ? "សូមព្យាយាមម្តងទៀត" : "Please try again")
         )
      }
   }

   const stats = useMemo(() => ({
      total: discounts.length,
      active: discounts.filter(d => d.status === "active").length,
      category: discounts.filter(d => d.scope === "category").length,
      product: discounts.filter(d => d.scope === "product").length,
   }), [discounts])

   const filtered = useMemo(() => discounts.filter(d => {
      const matchSearch = d.name?.toLowerCase().includes(search.toLowerCase())
      const matchScope = filterScope === "all" || d.scope === filterScope
      const matchStatus = filterStatus === "all" || d.status === filterStatus
      return matchSearch && matchScope && matchStatus
   }), [discounts, search, filterScope, filterStatus])

   const getTargetName = (d: Discount) => {
      const ids: number[] = Array.isArray(d.target_ids)
         ? d.target_ids
         : d.target_id ? [d.target_id] : []
      if (ids.length === 0) return "—"
      const source = d.scope === "category" ? categories : menuItems
      const names = ids.map(id => source.find((x: any) => x.id === id)?.name).filter(Boolean)
      return names.length > 2
         ? `${names.slice(0, 2).join(", ")} +${names.length - 2}`
         : names.join(", ") || "—"
   }

   const formatValue = (d: Discount) =>
      d.value_type === "percentage" ? `${d.value}%` : `$${Number(d.value).toFixed(2)}`

   function toDDMMYYYY(dateInput: string | Date): string {
      if (!dateInput) return "—"
      const d = dateInput instanceof Date ? dateInput : new Date(dateInput)
      if (isNaN(d.getTime())) return typeof dateInput === "string" ? dateInput : "—"
      const dd = String(d.getDate()).padStart(2, "0")
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const yyyy = d.getFullYear()
      return `${dd}/${mm}/${yyyy}`
   }

   const renderDateTimeCell = (dateStr: string | null | undefined) => {
      if (!dateStr) {
         return (
            <span className="text-[14px] text-gray-400 dark:text-white/30">
               {isKh ? "គ្មានកំណត់" : "No limit"}
            </span>
         )
      }
      const date = new Date(dateStr)
      const time = date.toLocaleTimeString(isKh ? "km-KH" : "en-US", {
         hour: "2-digit",
         minute: "2-digit",
         hour12: true,
         timeZone: "Asia/Phnom_Penh",
      })
      return (
         <div className="flex flex-col gap-0.5">
            <span className="text-[14px]  text-gray-700 dark:text-white/70">
               {toDDMMYYYY(date)}
            </span>
            <span className="text-[12px] text-gray-400 dark:text-white/30">{time}</span>
         </div>
      )
   }

   const columns = [
      {
         key: "no", header: isKh ? "ល.រ" : "No.",
         render: (_: any, i: number) => (
            <span className="text-[14px]  dark:text-white font-mono tabular-nums">
               {String((currentPage - 1) * ITEMS_PER_PAGE + i + 1).padStart(2, "0")}
            </span>
         ),
      },
      {
         key: "name", header: isKh ? "ឈ្មោះ" : "Discount Name", sortable: true,
         render: (item: Discount) => (
            <div className="flex items-center gap-2.5">
               <div>
                  <p className=" text-gray-800 dark:text-white tracking-wide"
                     style={{ fontSize: isKh ? "14px" : "14px" }}>
                     {item.name}
                  </p>
                  {item.min_order_amount && (
                     <p className="text-[12px] text-gray-400 dark:text-white/25">
                        Min ${Number(item.min_order_amount).toFixed(2)}
                     </p>
                  )}
               </div>
            </div>
         ),
      },
      {
         key: "scope", header: isKh ? "ប្រភេទ" : "Scope",
         render: (item: Discount) => {
            const sc = SCOPE_CONFIG[item.scope as keyof typeof SCOPE_CONFIG] ?? SCOPE_CONFIG.category
            return (
               <span className={cn(
                  "inline-flex items-center gap-1.5 text-[12px] px-2.5 py-0.5 rounded-full border",
                  sc.bg, sc.border, sc.text
               )}>
                  {sc.icon}{item.scope === "category" ? "Category" : "Product"}
               </span>
            )
         },
      },
      {
         key: "target", header: isKh ? "គោលដៅ" : "Target",
         render: (item: Discount) => (
            <span className="text-gray-600 dark:text-white/60 truncate max-w-[140px] block"
               style={{ fontSize: isKh ? "14px" : "14px" }}>
               {getTargetName(item)}
            </span>
         ),
      },
      {
         key: "value_type", header: isKh ? "ប្រភេទតម្លៃ" : "Type",
         render: (item: Discount) => {
            const vt = VALUE_CONFIG[item.value_type as keyof typeof VALUE_CONFIG] ?? VALUE_CONFIG.percentage
            return (
               <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border",
                  vt.bg, vt.border, vt.text
               )}
                  style={{ fontSize: isKh ? "12px" : "12px" }}>
                  {vt.icon}
                  {item.value_type === "percentage" ? (isKh ? "ភាគរយ" : "Percent") : (isKh ? "តម្លៃពិត" : "Amount")}
               </span>
            )
         },
      },
      {
         key: "value", header: isKh ? "ការបញ្ចុះ" : "Value",
         render: (item: Discount) => (
            <span className="text-[14px]" style={{ color: accent }}>
               {formatValue(item)}
            </span>
         ),
      },
      {
         key: "start_date", header: isKh ? "ចាប់ផ្តើម" : "Starts",
         sortable: true,
         render: (item: Discount) => renderDateTimeCell(item.start_date),
      },
      {
         key: "end_date", header: isKh ? "ផុតកំណត់" : "Expires",
         sortable: true,
         render: (item: Discount) => renderDateTimeCell(item.end_date),
      },
      {
         key: "status", header: isKh ? "ស្ថានភាព" : "Status",
         render: (item: Discount) => {
            const effectiveStatus = isActuallyExpired(item) ? "expired" : item.status
            const st = STATUS_CONFIG[effectiveStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.inactive
            return (
               <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border",
                  st.bg, st.border, st.text
               )}
                  style={{ fontSize: "12px" }}>
                  <span className={cn("w-1 h-1 rounded-full", st.dot)} />
                  {st.label[isKh ? "kh" : "en"]}
               </span>
            )
         },
      },
      {
         key: "toggle", header: isKh ? "បើ/បិទ" : "Toggle",
         render: (item: Discount) => {
            if (isActuallyExpired(item)) return <span className="text-[101x] text-gray-300 dark:text-white/20">—</span>
            return (
               <Switch
                  checked={item.status === "active"}
                  onCheckedChange={() => handleToggle(item)}
                  style={item.status === "active" ? { "--switch-bg": "#03624C" } as React.CSSProperties : {}}
               />
            )
         },
      },
      {
         key: "actions", header: isKh ? "សកម្មភាព" : "Actions", className: "text-right",
         render: (item: Discount) => (
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
               {can("edit") && (
                  <button
                     onClick={() => { setEditItem(item); setDialogOpen(true) }}
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

   return (
      <div
         className={cn(
            "flex h-screen bg-gray-50 dark:bg-[#13151f] overflow-hidden",
            mounted && "transition-colors duration-300"
         )}
         style={{ ...SORA, fontSize: isKh ? "16px" : undefined }} >
         <AnimatePresence>
            {isFetching && !loading && (
               <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left"
                  style={{ backgroundColor: accent }}
               />
            )}
         </AnimatePresence>
         <Sidebar />
         <div className="flex-1 flex flex-col overflow-hidden">
            <Header
               title={isKh ? "គ្រប់គ្រងការបញ្ចុះ" : "Discounts"}
               subtitle={isKh ? "គ្រប់គ្រងការបញ្ចុះ category និង product" : "Manage category & product discounts"}
            />
            {showInitialLoading ? (
               <div className="flex-1 flex items-center justify-center flex-col gap-4">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: accent }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] animate-pulse"
                     style={{ color: accent }}>
                     {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
                  </span>
               </div>
            ) : (
               <main className="flex-1 p-5 space-y-4 overflow-hidden flex flex-col">
                  <DiscountStatsCards stats={stats} isKh={isKh} />
                  <DiscountToolbar
                     search={search}
                     filterScope={filterScope}
                     filterStatus={filterStatus}
                     canCreate={can("create")}
                     isKh={isKh}
                     accent={accent}
                     onSearch={setSearch}
                     onScope={setFilterScope}
                     onStatus={setFilterStatus}
                     onReset={() => { setSearch(""); setFilterScope("all"); setFilterStatus("all") }}
                     onAdd={() => { setEditItem(null); setDialogOpen(true) }}
                  />
                  <motion.div
                     initial={{ opacity: 0, y: 8 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.28 }}
                     className="flex-1 overflow-hidden" >
                     <Card className="h-full border-0 shadow-none bg-transparent flex flex-col">
                        <DataTableCustom
                           data={filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)}
                           columns={columns}
                           currentPage={currentPage}
                           totalPages={Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1}
                           onPageChange={setCurrentPage}
                           totalItems={filtered.length}
                           sortConfig={{ key: null, direction: "asc" }}
                           onSort={() => { }}
                           itemsPerPage={ITEMS_PER_PAGE}
                           language={i18n.language as any}
                        />
                     </Card>
                  </motion.div>
               </main>
            )}
         </div>
         <DiscountDialog
            open={dialogOpen}
            onClose={() => { setDialogOpen(false); setEditItem(null) }}
            editData={editItem}
            categories={categories}
            menuItems={menuItems}
            isKh={isKh}
            onSuccess={invalidate}
         />
         <DiscountDeleteDialog
            open={deleteOpen}
            onClose={() => { setDeleteOpen(false); setDeleteItem(null) }}
            item={deleteItem}
            isKh={isKh}
            onConfirm={handleDelete}
            deleting={remove.isPending}
         />
         <DiscountViewDialog
            open={viewOpen}
            onClose={() => { setViewOpen(false); setViewItem(null) }}
            item={viewItem}
            categories={categories}
            menuItems={menuItems}
            isKh={isKh}
         />
      </div>
   )
}