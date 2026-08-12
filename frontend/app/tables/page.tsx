"use client"

import { useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
   Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"
import {
   Plus, Users, Edit2, Receipt, Trash2, Loader2, Check,
   LayoutGrid, Clock, AlertCircle, AlertTriangle, TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
   AlertDialog, AlertDialogAction, AlertDialogContent,
   AlertDialogDescription, AlertDialogFooter, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Table } from "@/types"
import { usePermission } from "@/lib/role-context"
import { toastSuccess, toastError, toastWarn } from "@/lib/toast"

import { useTables, useTableMutations } from "@/hooks/tables/use-tables"

const INPUT =
   "w-full h-9 px-3 text-[14px] rounded-lg outline-none transition-all " +
   "bg-white dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] " +
   "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/20 " +
   "focus:border-[#03624C] dark:focus:border-[#1857D8] " +
   "shadow-sm dark:shadow-none"

const CARD_STYLES = {
   available: {
      bg: "bg-white dark:bg-[#22263a]", border: "border-white dark:border-[#22263a]",
      text: "!text-emerald-600 dark:!text-emerald-400", label: "text-gray-600 dark:text-gray-200",
      icon: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
   },
   occupied: {
      bg: "bg-white dark:bg-[#22263a]", border: "border-white dark:border-[#22263a]",
      text: "!text-blue-600 dark:!text-blue-400", label: "text-gray-600 dark:text-gray-200",
      icon: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-50 dark:bg-blue-500/10",
   },
   reserved: {
      bg: "bg-white dark:bg-[#22263a]", border: "border-white dark:border-[#22263a]",
      text: "!text-[#03624C] dark:!text-violet-400", label: "text-gray-600 dark:text-gray-200",
      icon: "text-[#03624C] dark:text-[#03624C]", iconBg: "bg-violet-50 dark:bg-violet-500/10",
   },
   capacity: {
      bg: "bg-white dark:bg-[#22263a]", border: "border-white dark:border-[#22263a]",
      text: "!text-amber-600 dark:!text-amber-400", label: "text-gray-600 dark:text-gray-200",
      icon: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-50 dark:bg-amber-500/10",
   },
}

const STATUS_STYLES = {
   available: {
      card: "border-[#1857D8]/20 dark:border-[#1857D8]/25 hover:border-[#1857D8]/50",
      box: "border-[#1857D8]/20 dark:border-[#1857D8]/35 bg-[#1857D8]/8 dark:bg-[#1857D8]/[0.09] text-[#1857D8] dark:text-[#6b9fff]",
      badge: "bg-[#1857D8]/10 dark:bg-[#1857D8]/12 border-[#1857D8]/20 dark:border-[#1857D8]/25 text-[#1857D8] dark:text-[#6b9fff]",
   },
   occupied: {
      card: "border-red-500/20 dark:border-red-500/25 hover:border-red-500/50",
      box: "border-red-500/20 dark:border-red-500/35 bg-red-50 dark:bg-red-500/[0.09] text-red-600 dark:text-red-300",
      badge: "bg-red-100 dark:bg-red-500/12 border-red-200 dark:border-red-500/25 text-red-700 dark:text-red-400",
   },
   reserved: {
      card: "border-amber-500/20 dark:border-amber-500/25 hover:border-amber-500/50",
      box: "border-amber-500/20 dark:border-amber-500/35 bg-amber-50 dark:bg-amber-500/[0.09] text-amber-600 dark:text-amber-300",
      badge: "bg-amber-100 dark:bg-amber-500/12 border-amber-200 dark:border-amber-500/25 text-amber-700 dark:text-amber-400",
   },
}

const formatArrival = (dt?: string | null) => {
   if (!dt) return ""
   try {
      const d = new Date(dt)
      if (isNaN(d.getTime())) {
         const [h, m] = dt.split(":").map(Number)
         return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
      }
      const date = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
      const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
      return `${date} · ${time}`
   } catch { return dt }
}

const sortTables = (list: Table[]) =>
   [...list].sort((a, b) => {
      const aL = a.name.replace(/\d+/g, "").trim()
      const bL = b.name.replace(/\d+/g, "").trim()
      if (aL !== bL) return aL.localeCompare(bL)
      return (parseInt(a.name.replace(/\D/g, "")) || 0) - (parseInt(b.name.replace(/\D/g, "")) || 0)
   })

function StatCard({ count, label, sublabel, styleKey, icon: Icon, delay = 0 }: {
   count: number | string; label: string; sublabel: string
   styleKey: keyof typeof CARD_STYLES; icon: React.ElementType; delay?: number
}) {
   const st = CARD_STYLES[styleKey]
   return (
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay }} whileHover={{ y: -3, transition: { duration: 0.18 } }}>
         <Card className={cn("border rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40", st.bg, st.border)}>
            <CardContent className="p-2">
               <div className="flex items-center justify-between gap-3 mb-4">
                  <p className={cn("flex items-center gap-1.5 min-w-0 text-[14px] font-bold uppercase", st.label)}>
                     <span className="truncate">{label}</span>
                  </p>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", st.iconBg)}>
                     <Icon className={cn("w-4 h-4", st.icon)} />
                  </div>
               </div>
               <p className={cn("text-[22px] font-bold text-center leading-none tabular-nums mb-2.5", st.text)}>{count}</p>
               <div className="flex items-center gap-1.5">
                  <TrendingUp className={cn("w-3 h-3 shrink-0", st.icon)} />
                  <p className={cn("text-[14px]", st.label)}>{sublabel}</p>
               </div>
            </CardContent>
         </Card>
      </motion.div>
   )
}

function LegendItem({ color, label }: { color: string; label: string }) {
   return (
      <div className="flex items-center gap-1.5">
         <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
         <span className="text-[14px] text-gray-600 dark:text-white/50 uppercase tracking-wide whitespace-nowrap">{label}</span>
      </div>
   )
}

function ErrorMsg({ msg }: { msg: string }) {
   return (
      <p className="flex items-center gap-1 text-[14px] text-red-600 dark:text-red-400 mt-1">
         <AlertTriangle className="w-3 h-3 shrink-0" />{msg}
      </p>
   )
}

export default function TablesPage() {
   const { i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"
   const { can } = usePermission("tables")

   const { data: tables = [], isLoading: loading, isFetching } = useTables()
   const { create, update, remove } = useTableMutations()

   const [activeFloor, setActiveFloor] = useState("all")
   const [addDialogOpen, setAddDialogOpen] = useState(false)
   const [orderDialogOpen, setOrderDialogOpen] = useState(false)
   const [selectedTable, setSelectedTable] = useState<Table | null>(null)
   const [tableToDelete, setTableToDelete] = useState<Table | null>(null)
   const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
   const [isEditing, setIsEditing] = useState(false)
   const [nameError, setNameError] = useState<string | undefined>()
   const [floorError, setFloorError] = useState<string | undefined>()
   const [duplicateError, setDuplicateError] = useState<string | undefined>()
   const [statusAlertOpen, setStatusAlertOpen] = useState(false)
   const [statusAlertMsg, setStatusAlertMsg] = useState("")
   const [showFloorSugg, setShowFloorSugg] = useState(false)
   const [formData, setFormData] = useState({ name: "", seats: 4, floor: "" })
   const originalSnapshot = useRef("")

   const dynamicFloors = useMemo(() =>
      Array.from(new Set(["main", ...tables.map(t => t.floor)])), [tables])

   const floorSuggestions = useMemo(() =>
      formData.floor
         ? dynamicFloors.filter(f => f.toLowerCase().includes(formData.floor.toLowerCase()))
         : dynamicFloors,
      [formData.floor, dynamicFloors])

   const visibleTables = useMemo(() =>
      sortTables(activeFloor === "all" ? tables : tables.filter(t => t.floor === activeFloor)),
      [tables, activeFloor])

   const stats = useMemo(() => ({
      available: tables.filter(t => t.status === "available").length,
      occupied: tables.filter(t => t.status === "occupied").length,
      reserved: tables.filter(t => t.status === "reserved").length,
      totalSeats: tables.reduce((s, t) => s + t.seats, 0),
   }), [tables])

   const clearFormErrors = () => {
      setNameError(undefined)
      setFloorError(undefined)
      setDuplicateError(undefined)
   }

   const handleOpenAdd = () => {
      setIsEditing(false)
      clearFormErrors()
      originalSnapshot.current = ""
      setFormData({ name: "", seats: 4, floor: "" })
      setAddDialogOpen(true)
   }

   const handleOpenEdit = (table: Table) => {
      if (table.status !== "available") {
         setStatusAlertMsg(isKh ? "តុនេះមិនទំនេរទេ មិនអាចកែប្រែបានឡើយ!" : "Table is not available for editing!")
         setStatusAlertOpen(true); return
      }
      setSelectedTable(table); setIsEditing(true); clearFormErrors()
      setFormData({ name: table.name, seats: table.seats, floor: table.floor })
      originalSnapshot.current = JSON.stringify({ name: table.name, seats: table.seats, floor: table.floor })
      setAddDialogOpen(true)
   }

   const handleSave = async () => {
      if (!formData.name.trim()) {
         setNameError(isKh ? "សូមបញ្ចូលឈ្មោះតុ" : "Table name is required")
         return
      }
      if (!formData.floor.trim()) {
         setFloorError(isKh ? "សូមបញ្ចូលជាន់/តំបន់" : "Floor is required")
         return
      }
      const isDuplicate = tables.some(t =>
         t.name.toLowerCase().trim() === formData.name.toLowerCase().trim() &&
         (isEditing ? t.id !== selectedTable?.id : true)
      )
      if (isDuplicate) {
         setDuplicateError(isKh ? `ឈ្មោះតុ "${formData.name}" មានរួចហើយ` : `Table "${formData.name}" already exists`)
         return
      }
      if (isEditing && selectedTable) {
         const snap = JSON.stringify({ name: formData.name, seats: formData.seats, floor: formData.floor })
         if (snap === originalSnapshot.current) {
            toastWarn(isKh ? "មិនមានការផ្លាស់ប្តូរ" : "No changes detected",
               isKh ? `តុ "${selectedTable.name}" មិនមានការផ្លាស់ប្តូរទេ` : `No changes made to "${selectedTable.name}"`)
            return
         }
      }
      try {
         if (isEditing && selectedTable) {
            await update.mutateAsync({ id: selectedTable.id, payload: formData })
            toastSuccess(isKh ? "កែប្រែបានជោគជ័យ" : "Updated successfully",
               isKh ? `តុ "${selectedTable.name}" ត្រូវបានកែប្រែទៅ "${formData.name}" ដោយជោគជ័យ`
                  : `Table "${selectedTable.name}" updated to "${formData.name}" successfully`)
         } else {
            await create.mutateAsync(formData)
            toastSuccess(isKh ? "បន្ថែមបានជោគជ័យ" : "Added successfully",
               isKh ? `តុ "${formData.name}" ត្រូវបានបន្ថែមដោយជោគជ័យ`
                  : `Table "${formData.name}" added successfully`)
         }
         setAddDialogOpen(false); clearFormErrors()
      } catch (err: any) {
         toastError(err?.message ?? (isKh ? "មានបញ្ហា" : "Something went wrong"))
      }
   }

   const handleDeleteTable = (table: Table) => {
      if (table.status !== "available") {
         setStatusAlertMsg(isKh ? `តុ "${table.name}" កំពុងមានភ្ញៀវ មិនអាចលុបបានទេ!`
            : `Table "${table.name}" is occupied, cannot delete!`)
         setStatusAlertOpen(true); return
      }
      setTableToDelete(table); setIsDeleteAlertOpen(true)
   }

   const confirmDelete = async () => {
      if (!tableToDelete) return
      try {
         await remove.mutateAsync(tableToDelete.id)
         toastSuccess(isKh ? "លុបបានសម្រេច" : "Deleted successfully",
            isKh ? `តុ "${tableToDelete.name}" ត្រូវបានលុបដោយជោគជ័យ`
               : `Table "${tableToDelete.name}" deleted successfully`)
         setIsDeleteAlertOpen(false); setTableToDelete(null)
      } catch (err: any) {
         toastError(err?.message ?? (isKh ? "លុបមិនបាន" : "Failed to delete"))
      }
   }

   const showInitialLoading = loading && tables.length === 0

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
               title={isKh ? "ការគ្រប់គ្រងតុ" : "Table Management"}
               subtitle={isKh ? "គ្រប់គ្រងប្លង់តុភោជនីយដ្ឋាន" : "Manage restaurant floor layout"} />
               {showInitialLoading ? (
               <div className="flex-1 flex items-center justify-center flex-col gap-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[#03624C] dark:text-[#1857D8]" />
                  <span className="text-[14px] font-bold uppercase tracking-[0.2em] text-[#03624C] dark:text-[#1857D8] animate-pulse">
                     {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
                  </span>
               </div>
            ) : (
               <>
                  <div className="sticky top-0 z-20 bg-gray-50/95 dark:bg-[#13151f]/95 backdrop-blur px-6 pt-6 pb-2 border-b border-gray-200 dark:border-white/[0.10]">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <StatCard
                           count={stats.available}
                           label={isKh ? "ទំនេរ" : "Available"}
                           sublabel={isKh ? "តុទំនេរ" : "Tables Free"}
                           styleKey="available" icon={LayoutGrid} delay={0} />
                        <StatCard
                           count={stats.occupied}
                           label={isKh ? "មានភ្ញៀវ" : "Occupied"}
                           sublabel={isKh ? "កំពុងប្រើ" : "In Use"}
                           styleKey="occupied" icon={Users} delay={0.07} />
                        <StatCard
                           count={stats.reserved}
                           label={isKh ? "កក់ទុក" : "Reserved"}
                           sublabel={isKh ? "ជិតមកដល់" : "Upcoming"}
                           styleKey="reserved" icon={Clock} delay={0.14} />
                        <StatCard
                           count={stats.totalSeats}
                           label={isKh ? "ចំណុះ" : "Capacity"}
                           sublabel={isKh ? "កៅអីសរុប" : "Total Seats"}
                           styleKey="capacity" icon={Users} delay={0.21} />
                     </div>
                     <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                           <Tabs value={activeFloor} onValueChange={setActiveFloor} className="w-full sm:w-auto">
                              <TabsList className="h-8 bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.10] p-1 gap-0.5 rounded-lg">
                                 <TabsTrigger value="all"
                                    className="h-6 px-3 text-[14px] rounded-lg text-gray-500 dark:text-white/50 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1857D8]/20 data-[state=active]:text-[#03624C] dark:data-[state=active]:text-[#6b9fff] flex items-center gap-1.5">
                                    <LayoutGrid className="w-3.5 h-3.5" />{isKh ? "ទាំងអស់" : "All Tables"}
                                 </TabsTrigger>
                                 {dynamicFloors.map(floor => (
                                    <TabsTrigger key={floor} value={floor}
                                       className="h-6 px-3 text-[14px] rounded-lg capitalize text-gray-500 dark:text-white/50 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1857D8]/20 data-[state=active]:text-[#03624C] dark:data-[state=active]:text-[#6b9fff]">
                                       {floor} ({tables.filter(t => t.floor === floor).length})
                                    </TabsTrigger>
                                 ))}
                              </TabsList>
                           </Tabs>
                           <div className="flex items-center gap-3 px-1">
                              <LegendItem color="bg-[#1857D8]" label={isKh ? "ទំនេរ" : "Available"} />
                              <LegendItem color="bg-red-600" label={isKh ? "មានភ្ញៀវ" : "Occupied"} />
                              <LegendItem color="bg-amber-500" label={isKh ? "កក់ទុក" : "Reserved"} />
                           </div>
                        </div>
                        {can("create") && (
                           <button onClick={handleOpenAdd}
                              className="w-full sm:w-auto h-9 px-4 flex items-center justify-center gap-1.5 rounded-lg text-[14px] transition-all bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90 text-white shadow-md shadow-[#03624C]/20 dark:shadow-[#1857D8]/20">
                              <Plus className="w-3.5 h-3.5" />{isKh ? "បន្ថែមតុ" : "Add Table"}
                           </button>
                        )}
                     </div>
                  </div>
                  <main className="flex-1 overflow-auto p-6 scrollbar-hide">
                     <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 pb-10">
                        {visibleTables.map((table, i) => {
                           const s = STATUS_STYLES[table.status]
                           const num = table.name.replace(/\D/g, "") || table.name
                           const arrivalDisplay = (table as any).arrival_datetime ?? table.reserve_time
                           return (
                              <motion.div key={table.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                                 transition={{ duration: 0.35, delay: i * 0.04 }}>
                                 <Card
                                    className={cn("relative cursor-pointer transition-all bg-white dark:bg-[#1e2235] border shadow-sm dark:shadow-none rounded-lg overflow-hidden", s.card)}
                                    onClick={() => { setSelectedTable(table); if (table.status === "occupied") setOrderDialogOpen(true) }} >
                                    <CardHeader className="p-2 relative z-10">
                                       <div className="flex items-center justify-between">
                                          <CardTitle className="text-[14px] text-gray-600 dark:text-white/55 uppercase tracking-wide">
                                             {table.name}
                                          </CardTitle>
                                          {(can("edit") || can("delete")) && (
                                             <div className="flex gap-1.5 items-center" onClick={e => e.stopPropagation()}>
                                                {can("edit") && (
                                                   <button
                                                      onClick={e => { e.stopPropagation(); handleOpenEdit(table) }}
                                                      className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                                                      text-amber-700 bg-amber-50 border border-amber-200
                                                      hover:bg-amber-100 hover:border-amber-300
                                                      dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-700/40
                                                      dark:hover:bg-amber-900/40 dark:hover:border-amber-500
                                                      transition-all duration-150"
                                                      title="Edit"
                                                   >
                                                      <Edit2 className="w-3.5 h-3.5" />
                                                   </button>
                                                )}
                                                {can("delete") && (
                                                   <button
                                                      onClick={e => { e.stopPropagation(); handleDeleteTable(table) }}
                                                      className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                                                      text-rose-700 bg-rose-50 border border-rose-200
                                                      hover:bg-rose-100 hover:border-rose-300
                                                      dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-700/40
                                                      dark:hover:bg-rose-900/40 dark:hover:border-rose-500
                                                      transition-all duration-150"
                                                      title="Delete"
                                                   >
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                   </button>
                                                )}
                                             </div>
                                          )}
                                       </div>
                                    </CardHeader>
                                    <CardContent className="pt-0 text-center pb-4 relative z-10">
                                       <div className={cn("aspect-square rounded-lg border-2 flex flex-col items-center justify-center mb-3 transition-colors", s.box)}>
                                          <span className="text-4xl font-bold leading-none">{num}</span>
                                          <div className="flex items-center gap-1 mt-1.5 opacity-70">
                                             <Users className="w-3.5 h-3.5" />
                                             <span className="text-[14px] ">{table.seats}</span>
                                          </div>
                                       </div>
                                       <div className={cn("w-full py-2 rounded-lg text-[14px]  flex items-center justify-center min-h-[28px] border", s.badge)}>
                                          {table.status === "reserved" ? (
                                             <div className="flex flex-col items-center leading-tight gap-0.5">
                                                <span>{isKh ? "កក់ទុក" : "Reserved"}</span>
                                                {arrivalDisplay && (
                                                   <span className="text-[8px] flex items-center gap-0.5 lowercase normal-case">
                                                      <Clock className="w-2 h-2" />
                                                      {formatArrival(arrivalDisplay)}
                                                   </span>
                                                )}
                                             </div>
                                          ) : table.status === "occupied"
                                             ? (isKh ? "មានភ្ញៀវ" : "Occupied")
                                             : (isKh ? "ទំនេរ" : "Available")}
                                       </div>
                                    </CardContent>
                                 </Card>
                              </motion.div>
                           )
                        })}
                     </div>
                  </main>
               </>
            )}
         </div>
         <Dialog open={addDialogOpen} onOpenChange={v => !(create.isPending || update.isPending) && setAddDialogOpen(v)}>
            <DialogContent
               className="max-w-sm p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden" >
               <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0 bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
                  <div className="flex items-center gap-2.5">
                     <div className="w-8 h-8 rounded-lg bg-[#03624C]/10 dark:bg-[#1857D8]/15 flex items-center justify-center">
                        <LayoutGrid className="w-4 h-4 text-[#03624C] dark:text-[#6b9fff]" />
                     </div>
                     <div>
                        <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                           {isEditing ? (isKh ? "កែប្រែតុ" : "Edit Table") : (isKh ? "បន្ថែមតុថ្មី" : "Add New Table")}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Table form</DialogDescription>
                     </div>
                  </div>
               </DialogHeader>
               <div className="px-6 py-5 space-y-4">
                  <div className="space-y-1.5">
                     <Label className={cn(
                        "text-[14px] text-gray-600 dark:text-white/30",
                        (nameError || duplicateError) && "text-rose-500"
                     )}>
                        {isKh ? "ឈ្មោះតុ" : "Table Name"} <span className="text-rose-500">*</span>
                     </Label>
                     <input
                        autoFocus
                        placeholder={isKh ? "ឧ. Table 1, VIP..." : "e.g. Table 1, VIP..."}
                        value={formData.name}
                        className={cn(INPUT, (nameError || duplicateError) && "border-rose-400 dark:border-rose-500/50")}
                        onChange={e => {
                           setFormData(f => ({ ...f, name: e.target.value }))
                           setNameError(undefined)
                           setDuplicateError(undefined)
                        }}
                        onKeyDown={e => e.key === "Enter" && handleSave()}
                     />
                     {nameError && <ErrorMsg msg={nameError} />}
                     {duplicateError && <ErrorMsg msg={duplicateError} />}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <Label className="text-[14px]  text-gray-600 dark:text-white/30">
                           {isKh ? "កៅអី" : "Seats"}
                        </Label>
                        <input
                           type="number"
                           min={1}
                           className={INPUT}
                           value={formData.seats === 0 ? "" : formData.seats}
                           onChange={e => {
                              const raw = e.target.value
                              if (raw === "") {
                                 setFormData(f => ({ ...f, seats: 0 }))
                                 return
                              }
                              const num = parseInt(raw)
                              if (!isNaN(num) && num >= 1) {
                                 setFormData(f => ({ ...f, seats: num }))
                              }
                           }}
                           onBlur={e => {
                              if (!e.target.value || formData.seats === 0) {
                                 setFormData(f => ({ ...f, seats: 1 }))
                              }
                           }}
                           placeholder="០"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <Label className={cn(
                           "text-[14px]  text-gray-600 dark:text-white/30",
                           floorError && "text-rose-500"
                        )}>
                           {isKh ? "ជាន់/តំបន់" : "Floor"} <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative">
                           <input
                              className={cn(
                                 INPUT, "pr-8 capitalize",
                                 floorError && "border-rose-400 dark:border-rose-500/50"
                              )}
                              autoComplete="off"
                              value={formData.floor}
                              placeholder={isKh ? "វាយ ឬជ្រើស..." : "Type or select..."}
                              onFocus={() => setShowFloorSugg(true)}
                              onBlur={() => setTimeout(() => setShowFloorSugg(false), 150)}
                              onChange={e => {
                                 setFormData(f => ({ ...f, floor: e.target.value }))
                                 setFloorError(undefined)
                                 setShowFloorSugg(true)
                              }}
                           />
                           <motion.svg
                              animate={{ rotate: showFloorSugg ? 180 : 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-600 dark:text-white/25"
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                           </motion.svg>
                           <AnimatePresence>
                              {showFloorSugg && (
                                 <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                                    className="absolute z-[200] top-[calc(100%+4px)] left-0 right-0
                                    rounded-xl border border-gray-100 dark:border-white/[0.10]
                                    bg-white dark:bg-[#22263a] shadow-2xl overflow-hidden" >
                                    <div className="max-h-[180px] overflow-y-auto py-1">
                                       {formData.floor &&
                                          !dynamicFloors.some(f => f.toLowerCase() === formData.floor.toLowerCase()) && (
                                             <button
                                                type="button"
                                                onMouseDown={e => e.preventDefault()}
                                                onClick={() => {
                                                   setShowFloorSugg(false)
                                                   setFloorError(undefined)
                                                }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left
                                                hover:bg-[#03624C]/[0.06] dark:hover:bg-[#1857D8]/[0.08]
                                                transition-colors border-b border-gray-100 dark:border-white/[0.06]" >
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#03624C] dark:bg-[#1857D8]">
                                                   <Plus className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <div>
                                                   <p className="text-[12px] text-[#03624C] dark:text-[#6b9fff] capitalize">
                                                      {isKh ? `បង្កើត "${formData.floor}"` : `Create "${formData.floor}"`}
                                                   </p>
                                                   <p className="text-[10px] text-gray-600 dark:text-white/30">
                                                      {isKh ? "តំបន់ថ្មី" : "New floor area"}
                                                   </p>
                                                </div>
                                             </button>
                                          )}

                                       {floorSuggestions.length === 0 && !formData.floor ? (
                                          <div className="px-3 py-5 text-center text-[11px] text-gray-600 dark:text-white/25">
                                             {isKh ? "រកមិនឃើញ" : "No floors found"}
                                          </div>
                                       ) : (
                                          floorSuggestions.map(f => (
                                             <button
                                                key={f}
                                                type="button"
                                                onMouseDown={e => e.preventDefault()}
                                                onClick={() => {
                                                   setFormData(fd => ({ ...fd, floor: f }))
                                                   setShowFloorSugg(false)
                                                   setFloorError(undefined)
                                                }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-left
                                                hover:bg-[#03624C]/[0.06] dark:hover:bg-[#1857D8]/[0.08]
                                                transition-colors" >
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                                                bg-[#03624C]/10 dark:bg-[#1857D8]/15 border border-[#03624C]/20 dark:border-[#1857D8]/25">
                                                   <LayoutGrid className="w-3.5 h-3.5 text-[#03624C] dark:text-[#6b9fff]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                   <p className="text-[12px] text-gray-800 dark:text-white/85 capitalize">{f}</p>
                                                   <p className="text-[10px] text-gray-600 dark:text-white/30">
                                                      {tables.filter(t => t.floor === f).length} {isKh ? "តុ" : "tables"}
                                                   </p>
                                                </div>
                                                {formData.floor.toLowerCase() === f.toLowerCase() && (
                                                   <Check className="w-3.5 h-3.5 text-[#03624C] dark:text-[#6b9fff] shrink-0" />
                                                )}
                                             </button>
                                          ))
                                       )}
                                    </div>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </div>
                        {floorError && <ErrorMsg msg={floorError} />}
                     </div>
                  </div>
               </div>
               <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg">
                  <div className="flex justify-end gap-2 w-full">
                     <button
                        onClick={() => { setAddDialogOpen(false); clearFormErrors() }}
                        disabled={create.isPending || update.isPending}
                        className="h-9 px-5 rounded-lg text-[14px] transition-all
                        border border-gray-200 dark:border-white/[0.10]
                        text-gray-600 dark:text-white/50
                        hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50" >
                                 {isKh ? "បោះបង់" : "Cancel"}
                     </button>
                     <button
                        onClick={handleSave} disabled={create.isPending || update.isPending}
                        className="h-9 px-6 rounded-lg text-[14px] transition-all
                        bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90
                        text-white shadow-sm disabled:opacity-50
                        flex items-center gap-2 active:scale-[0.97]" >
                        {(create.isPending || update.isPending) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {(create.isPending || update.isPending)
                           ? (isKh ? "កំពុងរក្សា..." : "Saving...")
                           : (isKh ? "រក្សាទុក" : "Save")
                        }
                     </button>
                  </div>
               </DialogFooter>
            </DialogContent>
         </Dialog>
         <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
            <DialogContent className="max-w-[450px] p-0 overflow-hidden border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] [&>button]:hidden">
               <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
                  <div className="flex items-center gap-2.5">
                     <div className="w-8 h-8 rounded-lg bg-[#03624C]/10 dark:bg-[#1857D8]/15 flex items-center justify-center">
                        <Receipt className="w-4 h-4 text-[#03624C] dark:text-[#6b9fff]" />
                     </div>
                     <div>
                        <DialogTitle className="text-[14px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                           {isKh ? "ព័ត៌មានការកម្ម៉ង់" : "Order Details"}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Order details</DialogDescription>
                     </div>
                  </div>
               </DialogHeader>
               <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                     <div className={cn("w-3 h-3 rounded-full", selectedTable?.status === "occupied" ? "bg-red-500" : "bg-amber-500")} />
                     <span className="text-[14px] text-gray-600 dark:text-white/60 uppercase">
                        {selectedTable?.status === "occupied" ? (isKh ? "មានភ្ញៀវ" : "Occupied") : (isKh ? "កក់ទុក" : "Reserved")}
                     </span>
                     {((selectedTable as any)?.arrival_datetime ?? selectedTable?.reserve_time) && (
                        <span className="ml-auto text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                           <Clock className="w-3 h-3" />
                           {formatArrival((selectedTable as any)?.arrival_datetime ?? selectedTable?.reserve_time)}
                        </span>
                     )}
                  </div>
                  <p className="text-[14px] text-gray-600 dark:text-white/30 text-center py-4">
                     {isKh ? "ទិន្នន័យ order គ្រប់គ្រងតាម POS" : "Order data is managed via POS system"}
                  </p>
                  <button onClick={() => setOrderDialogOpen(false)}
                     className="w-full h-10 rounded-lg text-[13px]  transition-all border border-gray-200 dark:border-white/[0.12] text-gray-600 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06]">
                     {isKh ? "បិទ" : "Close"}
                  </button>
               </div>
            </DialogContent>
         </Dialog>
         <AlertDialog open={statusAlertOpen} onOpenChange={setStatusAlertOpen}>
            <AlertDialogContent className="rounded-lg border-0 bg-white dark:bg-[#22263a] shadow-2xl p-0 max-w-[380px] overflow-hidden">
               <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500" />
               <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                     <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                     </div>
                     <div className="pt-0.5">
                        <AlertDialogTitle className="text-[14px] text-gray-800 dark:text-white/90 mb-1">
                           {isKh ? "មិនអាចធ្វើបានទេ" : "Action Not Allowed"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[12px] text-gray-500 dark:text-white/40 leading-relaxed">
                           {statusAlertMsg}
                        </AlertDialogDescription>
                     </div>
                  </div>
                  <AlertDialogFooter className="flex-row justify-end">
                     <AlertDialogAction onClick={() => setStatusAlertOpen(false)}
                        className="h-9 px-6 rounded-lg text-[12px]  bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90 text-white shadow-md shadow-[#03624C]/20 dark:shadow-[#1857D8]/20">
                        OK
                     </AlertDialogAction>
                  </AlertDialogFooter>
               </div>
            </AlertDialogContent>
         </AlertDialog>
         <ConfirmDialog
            open={isDeleteAlertOpen}
            onOpenChange={setIsDeleteAlertOpen}
            onConfirm={confirmDelete}
            loading={remove.isPending}
            variant="danger"
            icon={Trash2}
            title={isKh ? "បញ្ជាក់ការលុប" : "Confirm Delete"}
            description={isKh ? "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។" : "This action cannot be undone."}
            highlight={tableToDelete?.name}
            confirmLabel={isKh ? "លុបចោល" : "Delete"}
            cancelLabel={isKh ? "បោះបង់" : "Cancel"}
         />
      </div>
   )
}