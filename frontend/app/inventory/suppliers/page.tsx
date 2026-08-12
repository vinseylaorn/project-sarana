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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
   Search, Plus, Eye, Edit2, Trash2, Loader2,
   RotateCcw, RefreshCw, AlertTriangle, Phone, Mail, MapPin, User,
   Truck, Filter, Building2, FileText, CheckCircle2,
   XCircle, Package, TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Supplier } from "@/types"
import { usePermission } from "@/lib/role-context"
import { toastSuccess, toastError, toastWarn } from "@/lib/toast"
import { useTranslation } from "react-i18next"
import i18next from "i18next"
import {
   SORA, INPUT, SEL_T, SEL_C, SEL_I, ACCENT, CARD_STYLES,
   formatKhmerPhone, validateKhmerPhone,
} from "./supplier.config"

import { useSuppliers, useStockCategories } from "@/hooks/inventory/use-inventory-data"
import { useSupplierMutations } from "@/hooks/inventory/use-supplier-mutations"

const ErrorMsg = ({ msg }: { msg: string }) => (
   <p className="flex items-center gap-1 text-[14px] text-rose-500 dark:text-rose-400 mt-1 font-medium">
      <AlertTriangle className="w-3 h-3 shrink-0" />
      {msg}
   </p>
)

export default function SuppliersPage() {
   const { t, i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"
   const { can } = usePermission("suppliers")
   const originalSnapshot = useRef<string>("")

   const {
      data: suppliers = [],
      isLoading: loadingSuppliers,
      isFetching: fetchingSuppliers,
      refetch: refetchSuppliers,
   } = useSuppliers()
   const { data: categories = [], isLoading: loadingCategories, isFetching: fetchingCategories } = useStockCategories()
   const { create, update, remove } = useSupplierMutations()

   const loading = loadingSuppliers || loadingCategories
   const isFetching = fetchingSuppliers || fetchingCategories
   const saving = create.isPending || update.isPending
   const deleting = remove.isPending

   const [search, setSearch] = useState("")
   const [isDialogOpen, setIsDialogOpen] = useState(false)
   const [isViewMode, setIsViewMode] = useState(false)
   const [current, setCurrent] = useState<any>(null)
   const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
   const [itemToDelete, setItemToDelete] = useState<any>(null)
   const [errors, setErrors] = useState<Record<string, string>>({})
   const [currentPage, setCurrentPage] = useState(1)
   const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All")
   const [categoryFilter, setCategoryFilter] = useState("All")
   const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" })

   const [catSearch, setCatSearch] = useState("")
   const [catDropOpen, setCatDropOpen] = useState(false)

   const itemsPerPage = 10

   const stats = useMemo(() => {
      const activeCount = suppliers.filter(s => s.status === "Active").length
      const inactiveCount = suppliers.filter(s => s.status === "Inactive").length
      const categoryCount = new Set(suppliers.map(s => s.category_id).filter(Boolean)).size
      return [
         {
            key: "total" as const,
            label: isKh ? "អ្នកផ្គត់ផ្គង់សរុប" : "Total Suppliers",
            value: suppliers.length,
            sub: isKh ? "ក្រុមហ៊ុន" : "companies",
            icon: <Truck className="w-4 h-4" />,
         },
         {
            key: "active" as const,
            label: isKh ? "កំពុងសកម្ម" : "Active",
            value: activeCount,
            sub: isKh ? "អ្នកផ្គត់ផ្គង់សកម្ម" : "active suppliers",
            icon: <CheckCircle2 className="w-4 h-4" />,
         },
         {
            key: "inactive" as const,
            label: isKh ? "មិនសកម្ម" : "Inactive",
            value: inactiveCount,
            sub: isKh ? "អ្នកផ្គត់ផ្គង់អសកម្ម" : "inactive suppliers",
            icon: <XCircle className="w-4 h-4" />,
         },
         {
            key: "category" as const,
            label: isKh ? "ប្រភេទ" : "Categories",
            value: categoryCount,
            sub: isKh ? "ប្រភេទទំនិញ" : "supply types",
            icon: <Package className="w-4 h-4" />,
         },
      ]
   }, [suppliers, isKh])

   const handleOpenAdd = () => {
      setIsViewMode(false)
      setCurrent({ name: "", contact_name: "", phone: "", email: "", address: "", category_id: null, status: "Active", note: "" })
      setErrors({})
      setCatSearch("")
      setCatDropOpen(false)
      originalSnapshot.current = ""
      setIsDialogOpen(true)
   }

   const handleOpenEdit = (item: Supplier) => {
      setIsViewMode(false)
      setCurrent({ ...item })
      setErrors({})
      setCatSearch("")
      setCatDropOpen(false)
      originalSnapshot.current = JSON.stringify({
         name: item.name, contact_name: item.contact_name, phone: item.phone,
         email: item.email, address: item.address, category_id: item.category_id,
         status: item.status, note: item.note,
      })
      setIsDialogOpen(true)
   }

   const handlePhoneChange = (raw: string) => {
      const formatted = formatKhmerPhone(raw)
      setCurrent((prev: any) => ({ ...prev, phone: formatted }))
      setErrors((prev) => ({ ...prev, phone: "" }))
   }

   const handleSave = async () => {
      const newErrors: Record<string, string> = {}

      if (!current?.name?.trim())
         newErrors.name = isKh ? "សូមបញ្ចូលឈ្មោះក្រុមហ៊ុន" : "Company name required"

      if (!current?.phone?.trim()) {
         newErrors.phone = isKh ? "សូមបញ្ចូលលេខទូរស័ព្ទ" : "Phone required"
      } else {
         const phoneErr = validateKhmerPhone(current.phone, isKh)
         if (phoneErr) newErrors.phone = phoneErr
      }

      if (current?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(current.email))
         newErrors.email = isKh ? "អ៊ីមែលមិនត្រឹមត្រូវ" : "Invalid email format"

      if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

      if (current.id) {
         const snap = JSON.stringify({
            name: current.name, contact_name: current.contact_name, phone: current.phone,
            email: current.email, address: current.address, category_id: current.category_id,
            status: current.status, note: current.note,
         })
         if (snap === originalSnapshot.current) {
            toastWarn(
               isKh ? "មិនមានការផ្លាស់ប្តូរ" : "No changes detected",
               isKh ? "សូមកែប្រែមុនរក្សាទុក" : "Please make changes before saving",
            )
            return
         }
      }

      const payload = {
         name: current.name,
         contact_name: current.contact_name || null,
         phone: current.phone,
         email: current.email || null,
         address: current.address || null,
         category_id: current.category_id || null,
         status: current.status,
         note: current.note || null,
      }

      try {
         if (current.id) {
            const updated = await update.mutateAsync({ id: current.id, payload })
            toastSuccess(
               isKh ? "កែប្រែបានជោគជ័យ" : "Updated successfully",
               isKh ? `ព័ត៌មានអ្នកផ្គត់ផ្គង់ "${updated.name}" ត្រូវបានកែប្រែដោយជោគជ័យ`
                  : `Supplier "${updated.name}" has been updated successfully`,
            )
         } else {
            const created = await create.mutateAsync(payload)
            toastSuccess(
               isKh ? "បន្ថែមបានជោគជ័យ" : "Added successfully",
               isKh ? `អ្នកផ្គត់ផ្គង់ "${created.name}" ត្រូវបានបន្ថែមដោយជោគជ័យ`
                  : `Supplier "${created.name}" has been added successfully`,
            )
         }
         setIsDialogOpen(false)
      } catch (err: any) {
         toastError(isKh ? "រក្សាទុកមិនបាន" : "Save failed", err?.message)
      }
   }

   const confirmDelete = async () => {
      if (!itemToDelete) return
      try {
         await remove.mutateAsync(itemToDelete.id)
         toastSuccess(
            isKh ? "លុបបានជោគជ័យ" : "Deleted successfully",
            isKh ? `អ្នកផ្គត់ផ្គង់ "${itemToDelete.name}" ត្រូវបានដកចេញដោយជោគជ័យ`
               : `Supplier "${itemToDelete.name}" has been removed successfully`,
         )
         setIsDeleteAlertOpen(false)
         setItemToDelete(null)
      } catch (err: any) {
         toastError(isKh ? "លុបមិនបាន" : "Delete failed", err?.message)
      }
   }

   const processedData = useMemo(() => {
      let result = suppliers.filter(s => {
         const q = search.toLowerCase()
         const matchSearch =
            s.name.toLowerCase().includes(q) ||
            (s.contact_name || "").toLowerCase().includes(q) ||
            (s.phone || "").includes(q) ||
            (s.email || "").toLowerCase().includes(q)
         const matchStatus = statusFilter === "All" || s.status === statusFilter
         const matchCat = categoryFilter === "All" || String(s.category_id) === categoryFilter
         return matchSearch && matchStatus && matchCat
      })
      if (sortConfig.key) {
         result.sort((a: any, b: any) => {
            if (a[sortConfig.key!] < b[sortConfig.key!]) return sortConfig.direction === "asc" ? -1 : 1
            if (a[sortConfig.key!] > b[sortConfig.key!]) return sortConfig.direction === "asc" ? 1 : -1
            return 0
         })
      }
      return result
   }, [suppliers, search, statusFilter, categoryFilter, sortConfig])

   const hasFilter = search || statusFilter !== "All" || categoryFilter !== "All"

   const resetFilters = () => {
      setSearch("")
      setStatusFilter("All")
      setCategoryFilter("All")
      setCurrentPage(1)
   }

   const selectedCatName = useMemo(
      () => categories.find(c => c.id === current?.category_id)?.name ?? "",
      [categories, current?.category_id],
   )

   const filteredCats = useMemo(
      () => categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())),
      [categories, catSearch],
   )

   const columns = [
      {
         key: "no",
         header: isKh ? "ល.រ" : "No.",
         render: (_: any, idx: number) => (
            <span className="text-[14px] text-gray-600 dark:text-white/25 font-mono tabular-nums">
               {String((currentPage - 1) * itemsPerPage + idx + 1).padStart(2, "0")}
            </span>
         ),
      },
      {
         key: "name",
         header: isKh ? "អ្នកផ្គត់ផ្គង់" : "Supplier",
         sortable: true,
         render: (item: Supplier) => (
            <div className="flex items-center gap-2.5 py-1">
               <div>
                  <p className="text-gray-800 dark:text-white text-[14px]">{item.name}</p>
                  <p className="text-[12px] text-gray-600 ">{item.contact_name || "—"}</p>
               </div>
            </div>
         ),
      },
      {
         key: "category",
         header: isKh ? "ប្រភេទ" : "Category",
         render: (item: Supplier) => (
            <span className={cn(
               "inline-flex items-center gap-1 text-[14px]  px-2.5 py-0.5 rounded-full border",
               CARD_STYLES.total.text, CARD_STYLES.total.bg, CARD_STYLES.total.border,
            )}>
               <Package className="w-3 h-3" />
               {item.category?.name || "—"}
            </span>
         ),
      },
      {
         key: "phone",
         header: isKh ? "ទំនាក់ទំនង" : "Contact",
         sortable: true,
         render: (item: Supplier) => (
            <div className="space-y-0.5">
               <div className="flex items-center gap-1.5 text-[14px] text-gray-600 dark:text-white/60">
                  <Phone className={cn("w-3 h-3", ACCENT.text)} />{item.phone || "—"}
               </div>
               {item.email && (
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-600 dark:text-white/30">
                     <Mail className="w-3 h-3 text-gray-300" />{item.email}
                  </div>
               )}
            </div>
         ),
      },
      {
         key: "address",
         header: isKh ? "អាសយដ្ឋាន" : "Address",
         sortable: true,
         render: (item: Supplier) => (
            <span className="text-[12px] text-gray-600 dark:text-white/40 max-w-[160px] truncate block">
               {item.address || "—"}
            </span>
         ),
      },
      {
         key: "status",
         header: isKh ? "ស្ថានភាព" : "Status",
         sortable: true,
         render: (item: Supplier) => (
            <div className={cn(
               "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[14px] border",
               item.status === "Active"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                  : "bg-gray-50 text-gray-400 border-gray-100 dark:bg-white/5 dark:text-white/20 dark:border-white/10"
            )}>
               <div className={cn("w-1 h-1 rounded-full", item.status === "Active" ? "bg-emerald-500" : "bg-gray-400")} />
               {item.status}
            </div>
         ),
      },
      {
         key: "actions",
         header: isKh ? "សកម្មភាព" : "Actions",
         className: "text-right",
         render: (item: Supplier) => (
            <div className="flex items-center justify-end gap-1.5">
               <button
                  onClick={() => { setCurrent(item); setIsViewMode(true); setIsDialogOpen(true) }}
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
               {can("delete") && (
                  <button
                     onClick={() => { setItemToDelete(item); setIsDeleteAlertOpen(true) }}
                     className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                     text-rose-700 bg-rose-50 border border-rose-200
                     hover:bg-rose-100 hover:border-rose-300
                     dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-700/40
                     dark:hover:bg-rose-900/40 dark:hover:border-rose-500
                     transition-all duration-150" >
                     <Trash2 className="w-3.5 h-3.5" />
                  </button>
               )}
            </div>
         ),
      },
   ]

   const showInitialLoading = loading && suppliers.length === 0

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
               title={isKh ? "គ្រប់គ្រងអ្នកផ្គត់ផ្គង់" : "Supplier Management"}
               subtitle={isKh ? "បញ្ជីអ្នកផ្គត់ផ្គង់ទំនិញ" : "Manage your supply partners"}
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
                     {stats.map((s, i) => {
                        const st = CARD_STYLES[s.key]
                        return (
                           <motion.div
                              key={s.key}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: i * 0.07, ease: "easeOut" }}
                              whileHover={{ y: -3, transition: { duration: 0.18 } }} >
                              <Card className={cn("border rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40", st.bg, st.border)}>
                                 <CardContent className="p-2">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                       <p className={cn("flex items-center gap-1.5 min-w-0 text-[14px] font-bold uppercase", st.label)}>
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
                                       <p className={cn("text-[14px] ", st.label)}>{s.sub}</p>
                                    </div>
                                 </CardContent>
                              </Card>
                           </motion.div>
                        )
                     })}
                  </div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.2 }}
                     className="flex flex-wrap gap-2 items-center justify-between shrink-0" >
                     <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 dark:text-white/25 pointer-events-none" />
                           <input
                              className={cn(INPUT, "w-56 pl-8")}
                              placeholder={isKh ? "ស្វែងរក..." : "Search by name, phone..."}
                              value={search}
                              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                           />
                        </div>
                        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07] shrink-0" />
                        <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setCurrentPage(1) }}>
                           <SelectTrigger className={cn(SEL_T, "w-44")}>
                              <Filter className="w-3.5 h-3.5 mr-1.5 text-[#03624C] dark:text-[#1857D8] shrink-0" />
                              <SelectValue placeholder={isKh ? "ប្រភេទ" : "Category"} />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="All" className={SEL_I}>{isKh ? "គ្រប់ប្រភេទ" : "All Categories"}</SelectItem>
                              {categories.map(c => (
                                 <SelectItem key={c.id} value={String(c.id)} className={SEL_I}>{c.name}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v as any); setCurrentPage(1) }}>
                           <SelectTrigger className={cn(SEL_T, "w-36")}>
                              <Filter className="w-3.5 h-3.5 mr-1.5 text-[#03624C] dark:text-[#1857D8] shrink-0" />
                              <SelectValue placeholder="Status" />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="All" className={SEL_I}>{isKh ? "ស្ថានភាពទាំងអស់" : "All Status"}</SelectItem>
                              <SelectItem value="Active" className={SEL_I}>{isKh ? "កំពុងសកម្ម" : "Active"}</SelectItem>
                              <SelectItem value="Inactive" className={SEL_I}>{isKh ? "មិនសកម្ម" : "Inactive"}</SelectItem>
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
                           onClick={() => refetchSuppliers()}
                           className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] text-gray-600 dark:text-white/40 hover:text-[#03624C] dark:hover:text-[#1857D8] transition-all" >
                           <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
                        </button>
                     </div>
                     {can("create") && (
                        <button
                           onClick={handleOpenAdd}
                           className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] text-white transition-all active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                           <Plus className="w-3.5 h-3.5" />
                           {isKh ? "បន្ថែមអ្នកផ្គត់ផ្គង់" : "Add Supplier"}
                        </button>
                     )}
                  </motion.div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.28 }}
                     className="flex-1 overflow-hidden" >
                     <Card className="h-full border-0 shadow-none bg-transparent flex flex-col">
                        <DataTableCustom
                           data={processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                           columns={columns}
                           currentPage={currentPage}
                           totalPages={Math.ceil(processedData.length / itemsPerPage) || 1}
                           onPageChange={setCurrentPage}
                           itemsPerPage={itemsPerPage}
                           totalItems={processedData.length}
                           language={i18next.language as any}
                           sortConfig={sortConfig}
                           onSort={key => setSortConfig(prev => ({
                              key,
                              direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
                           }))}
                        />
                     </Card>
                  </motion.div>
               </main>
            )}
         </div>
         <Dialog open={isDialogOpen} onOpenChange={v => !saving && setIsDialogOpen(v)}>
            <DialogContent
               className="max-w-lg p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden"
               style={SORA} >
               <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0 bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
                  <div className="flex items-center gap-2.5">
                     <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", CARD_STYLES.total.iconBg)}>
                        <Truck className={cn("w-4 h-4", CARD_STYLES.total.text)} />
                     </div>
                     <div>
                        <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                           {isViewMode
                              ? isKh ? "ព័ត៌មានលម្អិត" : "Supplier Details"
                              : current?.id
                                 ? isKh ? "កែប្រែអ្នកផ្គត់ផ្គង់" : "Edit Supplier"
                                 : isKh ? "បន្ថែមអ្នកផ្គត់ផ្គង់ថ្មី" : "Add New Supplier"}
                        </DialogTitle>
                        <DialogDescription className="text-[12px] text-gray-600 dark:text-white/30">
                           {isViewMode
                              ? isKh ? "អានតែប៉ុណ្ណោះ" : "Read-only"
                              : isKh ? "បំពេញព័ត៌មានខាងក្រោម" : "Fill in the details below"}
                        </DialogDescription>
                     </div>
                  </div>
               </DialogHeader>

               <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto text-left">
                  {isViewMode ? (
                     <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-lg bg-[#03624C]/[0.06] dark:bg-[#1857D8]/[0.12] border border-[#03624C]/20 dark:border-[#1857D8]/25">
                           <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0", CARD_STYLES.total.iconBg)}>
                              <Building2 className={cn("w-6 h-6", CARD_STYLES.total.text)} />
                           </div>
                           <div>
                              <p className="text-[15px] font-bold text-gray-800 dark:text-white/90">{current?.name}</p>
                              <div className={cn(
                                 "inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[12px] font-bold border",
                                 current?.status === "Active"
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                    : "bg-gray-100 text-gray-400 border-gray-200 dark:bg-white/5 dark:text-white/30 dark:border-white/10"
                              )}>
                                 <div className={cn("w-1 h-1 rounded-full", current?.status === "Active" ? "bg-emerald-500" : "bg-gray-400")} />
                                 {current?.status}
                              </div>
                           </div>
                        </div>
                        {[
                           {
                              icon: <User className="w-3.5 h-3.5" />,
                              label: isKh ? "អ្នកទំនាក់ទំនង" : "Contact Person",
                              value: current?.contact_name
                           },
                           {
                              icon: <Package className="w-3.5 h-3.5" />,
                              label: isKh ? "ប្រភេទ" : "Category",
                              value: current?.category?.name
                           },
                           {
                              icon: <Phone className="w-3.5 h-3.5" />,
                              label: isKh ? "ទូរស័ព្ទ" : "Phone",
                              value: current?.phone
                           },
                           {
                              icon: <Mail className="w-3.5 h-3.5" />,
                              label: isKh ? "អ៊ីមែល" : "Email",
                              value: current?.email
                           },
                        ].map(({ icon, label, value }) => (
                           <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                              <span className={ACCENT.text}>{icon}</span>
                              <span className="text-[14px] text-gray-600 dark:text-white/30 w-28 shrink-0">{label}</span>
                              <span className="text-[14px] font-semibold text-gray-800 dark:text-white/85">{value || "—"}</span>
                           </div>
                        ))}
                        {current?.address && (
                           <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                              <MapPin className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", ACCENT.text)} />
                              <span className="text-[14px] text-gray-600 dark:text-white/30 w-28 shrink-0">{isKh ? "អាសយដ្ឋាន" : "Address"}</span>
                              <span className="text-[14px] font-semibold text-gray-800 dark:text-white/85">{current.address}</span>
                           </div>
                        )}
                        {current?.note && (
                           <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                              <FileText className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", ACCENT.text)} />
                              <span className="text-[14px] text-gray-600 dark:text-white/30 w-28 shrink-0">{isKh ? "កំណត់ចំណាំ" : "Note"}</span>
                              <span className="text-[14px] font-semibold text-gray-800 dark:text-white/85">{current.note}</span>
                           </div>
                        )}
                     </div>
                  ) : (
                     <>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", errors.name && "text-rose-500")}>
                                 {isKh ? "ឈ្មោះក្រុមហ៊ុន" : "Company Name"} <span className="text-rose-500">*</span>
                              </Label>
                              <input
                                 autoFocus
                                 placeholder="Ex: Fresh Farm Co."
                                 className={cn(INPUT, errors.name && "border-rose-400 dark:border-rose-500/50 focus:border-rose-400")}
                                 value={current?.name || ""}
                                 onChange={e => { setCurrent({ ...current, name: e.target.value }); setErrors({ ...errors, name: "" }) }}
                              />
                              {errors.name && <ErrorMsg msg={errors.name} />}
                           </div>
                           <div className="space-y-1.5">
                              <Label className="text-[14px] text-gray-600 dark:text-white/30">
                                 {isKh ? "អ្នកទំនាក់ទំនង" : "Contact Person"}
                              </Label>
                              <div className="relative">
                                 <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 dark:text-white/25 pointer-events-none" />
                                 <input
                                    placeholder="Ex: Dara Sok"
                                    className={cn(INPUT, "pl-8")}
                                    value={current?.contact_name || ""}
                                    onChange={e => setCurrent({ ...current, contact_name: e.target.value })}
                                 />
                              </div>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", errors.phone && "text-rose-500")}>
                                 {isKh ? "លេខទូរស័ព្ទ" : "Phone"} <span className="text-rose-500">*</span>
                              </Label>
                              <div className="relative">
                                 <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 dark:text-white/25 pointer-events-none" />
                                 <input
                                    type="tel"
                                    inputMode="numeric"
                                    placeholder="012 345 678"
                                    maxLength={13}
                                    className={cn(
                                       INPUT, "pl-8",
                                       errors.phone && "border-rose-400 dark:border-rose-500/50 focus:border-rose-400",
                                    )}
                                    value={current?.phone || ""}
                                    onChange={e => handlePhoneChange(e.target.value)}
                                 />
                              </div>
                              {errors.phone
                                 ? <ErrorMsg msg={errors.phone} />
                                 : <p className="text-[12px] text-gray-600 dark:text-white/25 mt-0.5">
                                    {isKh ? "ទម្រង់: 0XX XXX XXX" : "Format: 0XX XXX XXX"}
                                 </p>
                              }
                           </div>
                           <div className="space-y-1.5">
                              <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", errors.email && "text-rose-500")}>
                                 {isKh ? "អ៊ីមែល" : "Email"}
                              </Label>
                              <div className="relative">
                                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 dark:text-white/25 pointer-events-none" />
                                 <input
                                    type="email"
                                    placeholder="email@example.com"
                                    className={cn(INPUT, "pl-8", errors.email && "border-rose-400 dark:border-rose-500/50 focus:border-rose-400")}
                                    value={current?.email || ""}
                                    onChange={e => { setCurrent({ ...current, email: e.target.value }); setErrors({ ...errors, email: "" }) }}
                                 />
                              </div>
                              {errors.email && <ErrorMsg msg={errors.email} />}
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <Label className="text-[14px] text-gray-600 dark:text-white/30">
                                 {isKh ? "ប្រភេទទំនិញ" : "Supply Category"}
                              </Label>
                              <div className="relative">
                                 <div className="relative">
                                    <Package className={cn(
                                       "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none shrink-0",
                                       current?.category_id && !catDropOpen ? ACCENT.text : "text-gray-300 dark:text-white/20",
                                    )} />
                                    <input
                                       type="text"
                                       autoComplete="off"
                                       className={cn(
                                          "w-full pl-8 pr-8 h-9 rounded-lg border text-[14px] font-semibold outline-none transition-all",
                                          "bg-white dark:bg-white/[0.04]",
                                          "text-gray-800 dark:text-white/85 placeholder:text-gray-600 dark:placeholder:text-white/25",
                                          "focus:ring-1 border-gray-200 dark:border-white/[0.08] focus:border-gray-300 dark:focus:border-white/20 focus:ring-gray-200 dark:focus:ring-white/10",
                                       )}
                                       placeholder={isKh ? "វាយដើម្បីស្វែងរក..." : "Type to search..."}
                                       value={catDropOpen ? catSearch : (selectedCatName || "")}
                                       onFocus={() => { setCatSearch(""); setCatDropOpen(true) }}
                                       onChange={e => {
                                          setCatSearch(e.target.value)
                                          setCatDropOpen(true)
                                          if (current?.category_id) {
                                             setCurrent((prev: any) => ({ ...prev, category_id: null }))
                                          }
                                       }}
                                    />
                                    {current?.category_id && !catDropOpen ? (
                                       <button
                                          type="button"
                                          onClick={() => { setCurrent((prev: any) => ({ ...prev, category_id: null })); setCatSearch(""); setCatDropOpen(true) }}
                                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full text-gray-600 hover:text-gray-800 dark:text-white/25 dark:hover:text-white/50 transition-colors" >
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                       </button>
                                    ) : (
                                       <svg className={cn("absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-600 dark:text-white/25 transition-transform", catDropOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                    )}
                                 </div>
                                 <AnimatePresence>
                                    {catDropOpen && (
                                       <motion.div
                                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                          animate={{ opacity: 1, y: 0, scale: 1 }}
                                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                          transition={{ duration: 0.13 }}
                                          className="absolute z-50 top-full mt-1.5 left-0 right-0 rounded-xl border border-gray-100 dark:border-white/[0.10] bg-white dark:bg-[#22263a] shadow-xl overflow-hidden"
                                          style={SORA} >
                                          <div className="max-h-[180px] overflow-y-auto py-1">
                                             {filteredCats.length === 0 ? (
                                                <div className="px-3 py-5 text-center text-[14px] text-gray-600 dark:text-white/25">
                                                   {isKh ? "រកមិនឃើញ" : "No categories found"}
                                                </div>
                                             ) : filteredCats.map(cat => (
                                                <button
                                                   key={cat.id}
                                                   type="button"
                                                   onMouseDown={e => e.preventDefault()}
                                                   onClick={() => {
                                                      setCurrent((prev: any) => ({ ...prev, category_id: cat.id }))
                                                      setCatDropOpen(false)
                                                      setCatSearch("")
                                                   }}
                                                   className={cn(
                                                      "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                                                      "hover:bg-gray-50 dark:hover:bg-white/[0.05]",
                                                      current?.category_id === cat.id && "bg-gray-50 dark:bg-white/[0.05]",
                                                   )} >
                                                   <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", ACCENT.iconBg)}>
                                                      <Package className="w-3.5 h-3.5 text-white" />
                                                   </div>
                                                   <p className="text-[14px] font-semibold text-gray-800 dark:text-white/85 truncate flex-1">{cat.name}</p>
                                                   {current?.category_id === cat.id && (
                                                      <svg className={cn("w-3.5 h-3.5 shrink-0", ACCENT.text)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                      </svg>
                                                   )}
                                                </button>
                                             ))}
                                          </div>
                                       </motion.div>
                                    )}
                                 </AnimatePresence>
                                 {catDropOpen && (
                                    <div className="fixed inset-0 z-40" onClick={() => { setCatDropOpen(false); setCatSearch("") }} />
                                 )}
                              </div>
                           </div>
                           <div className="space-y-1.5">
                              <Label className="text-[14px] text-gray-600 dark:text-white/30">
                                 {isKh ? "ស្ថានភាព" : "Status"}
                              </Label>
                              <Select value={current?.status || "Active"} onValueChange={v => setCurrent({ ...current, status: v })}>
                                 <SelectTrigger className={cn(SEL_T, "w-full")}>
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent className={SEL_C} style={SORA}>
                                    <SelectItem value="Active" className={SEL_I}><span className="text-emerald-600 font-bold">Active</span></SelectItem>
                                    <SelectItem value="Inactive" className={SEL_I}><span className="text-rose-500 font-bold">Inactive</span></SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <Label className="text-[14px] text-gray-600 dark:text-white/30">
                              {isKh ? "អាសយដ្ឋាន" : "Address"}
                           </Label>
                           <div className="relative">
                              <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-300" />
                              <textarea
                                 rows={2}
                                 placeholder={isKh ? "អាសយដ្ឋានលម្អិត..." : "Full address..."}
                                 className={cn(INPUT, "pl-8 py-2 h-auto resize-none")}
                                 value={current?.address || ""}
                                 onChange={e => setCurrent({ ...current, address: e.target.value })}
                              />
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <Label className="text-[14px] text-gray-600 dark:text-white/30">
                              {isKh ? "កំណត់ចំណាំ" : "Note"}
                           </Label>
                           <div className="relative">
                              <FileText className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-300" />
                              <textarea
                                 rows={2}
                                 placeholder={isKh ? "កំណត់ចំណាំបន្ថែម..." : "Additional notes..."}
                                 className={cn(INPUT, "pl-8 py-2 h-auto resize-none")}
                                 value={current?.note || ""}
                                 onChange={e => setCurrent({ ...current, note: e.target.value })}
                              />
                           </div>
                        </div>
                     </>
                  )}
               </div>
               <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg">
                  <div className="flex justify-end gap-2 w-full">
                     <button
                        onClick={() => setIsDialogOpen(false)}
                        disabled={saving}
                        className="h-9 px-5 rounded-lg text-[14px]  transition-all border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50" >
                        {isViewMode ? (isKh ? "បិទ" : "Close") : (isKh ? "បោះបង់" : "Cancel")}
                     </button>
                     {!isViewMode && (
                        <button
                           onClick={handleSave}
                           disabled={saving}
                           className="h-9 px-6 rounded-lg text-[14px] text-white flex items-center gap-2 transition-all disabled:opacity-60 active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                           {saving
                              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{isKh ? "កំពុងរក្សា..." : "Saving..."}</>
                              : isKh ? "រក្សាទុក" : "Save"
                           }
                        </button>
                     )}
                  </div>
               </DialogFooter>
            </DialogContent>
         </Dialog>
         <AlertDialog open={isDeleteAlertOpen} onOpenChange={v => { if (!deleting) setIsDeleteAlertOpen(v) }}>
            <AlertDialogContent
               className="rounded-2xl border-0 bg-white dark:bg-[#22263a] shadow-2xl p-0 max-w-[400px] overflow-hidden"
               style={SORA} >
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
                  {itemToDelete?.name && (
                     <div className="mb-5 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-500/[0.08] border border-rose-100 dark:border-rose-500/20 flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="text-[12px] font-semibold text-rose-600 dark:text-rose-300 truncate">{itemToDelete.name}</span>
                     </div>
                  )}
                  <AlertDialogFooter className="gap-2 flex-row justify-end">
                     <AlertDialogCancel
                        disabled={deleting}
                        style={SORA}
                        onClick={() => setItemToDelete(null)}
                        className="h-9 px-5 rounded-lg text-[12px] font-bold border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all disabled:opacity-50" >
                        {isKh ? "បោះបង់" : "Cancel"}
                     </AlertDialogCancel>
                     <AlertDialogAction
                        onClick={confirmDelete}
                        disabled={deleting}
                        style={SORA}
                        className="h-9 px-5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border dark:border-rose-500/30 dark:shadow-none disabled:opacity-60 transition-all" >
                        {deleting
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