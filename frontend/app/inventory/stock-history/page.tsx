"use client"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { DataTableCustom } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
   Search, ArrowUpCircle, ArrowDownCircle, Loader2, RotateCcw, RefreshCw,
   Filter, Package, Eye, TrendingUp, TrendingDown, Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { motion, AnimatePresence } from "framer-motion"
import type { StockHistory } from "@/types"
import { SORA, INPUT, SEL_T, SEL_C, SEL_I, ACCENT, CARD_STYLES, formatDateParts } from "./stock-history.config"

import { useStockHistory } from "@/hooks/inventory/use-stock-history-data"

export default function StockHistoryPage() {
   const { i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"

   const [search, setSearch] = useState("")
   const [typeFilter, setTypeFilter] = useState("ALL")
   const [startDate, setStartDate] = useState("")
   const [endDate, setEndDate] = useState("")
   const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: null, direction: "desc" })
   const [currentPage, setCurrentPage] = useState(1)
   const [viewItem, setViewItem] = useState<StockHistory | null>(null)
   const itemsPerPage = 10

   const {
      data: historyList = [],
      isLoading: loading,
      isFetching,
      refetch: refetchHistory,
   } = useStockHistory({
      type: typeFilter !== "ALL" ? typeFilter : undefined,
      search: search || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
   })

   const displayUnit = (unit: string) => {
      if (!isKh) {
         const m: Record<string, string> = {
            "គីឡូក្រាម": "kg", "ក្រាម": "g", "លីត្រ": "l",
            "កំប៉ុង": "can", "ដប": "bottle", "កេស": "box", "កញ្ចប់": "pack",
         }
         return m[unit] || unit
      }
      return unit
   }

   const sortedData = useMemo(() => {
      let result = [...historyList]
      if (sortConfig.key) {
         result.sort((a: any, b: any) => {
            if (a[sortConfig.key!] < b[sortConfig.key!]) return sortConfig.direction === "asc" ? -1 : 1
            if (a[sortConfig.key!] > b[sortConfig.key!]) return sortConfig.direction === "asc" ? 1 : -1
            return 0
         })
      }
      return result
   }, [historyList, sortConfig])

   const paginatedData = useMemo(() =>
      sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
      [sortedData, currentPage]
   )

   const kpi = useMemo(() => {
      const inList = historyList.filter(h => h.type === "IN")
      const outList = historyList.filter(h => h.type === "OUT")
      return [
         { label: isKh ? "សរុបទាំងអស់" : "Total Movements", count: historyList.length, Icon: Activity, style: CARD_STYLES.total },
         { label: isKh ? "ស្តុកចូល" : "Stock IN", count: inList.length, Icon: TrendingUp, style: CARD_STYLES.in },
         { label: isKh ? "ស្តុកចេញ" : "Stock OUT", count: outList.length, Icon: TrendingDown, style: CARD_STYLES.out },
      ]
   }, [historyList, isKh])

   const hasFilter = search || typeFilter !== "ALL" || startDate || endDate

   const resetFilters = () => {
      setSearch(""); setTypeFilter("ALL")
      setStartDate(""); setEndDate(""); setCurrentPage(1)
   }

   const columns = [
      {
         key: "no", header: isKh ? "ល.រ" : "No.",
         render: (_: any, i: number) => (
            <span className="text-[14px] text-gray-600 dark:text-white/25 font-mono tabular-nums">
               {String((currentPage - 1) * itemsPerPage + i + 1).padStart(2, "0")}
            </span>
         ),
      },
      {
         key: "productName", header: isKh ? "ឈ្មោះទំនិញ" : "Product Name", sortable: true,
         render: (item: StockHistory) => (
            <div className="flex items-center gap-2.5">
               <span className="text-[14px] text-gray-800 dark:text-white">{item.productName}</span>
            </div>
         ),
      },
      {
         key: "qty", header: isKh ? "ចំនួន" : "Qty", sortable: true,
         render: (item: StockHistory) => (
            <span className={cn("text-[14px] tabular-nums",
               item.type === "IN" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
               {item.type === "IN" ? "+" : "−"}{Math.abs(item.qty)}
               <span className="text-[12px]  opacity-50 ml-1 uppercase">{displayUnit(item.unit)}</span>
            </span>
         ),
      },
      {
         key: "type", header: isKh ? "ប្រភេទ" : "Type",
         render: (item: StockHistory) => (
            <span className={cn(
               "inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-[12px]  uppercase border",
               item.type === "IN"
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25"
                  : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/25"
            )}>
               <span className={cn("w-1 h-1 rounded-full shrink-0",
                  item.type === "IN" ? "bg-emerald-400" : "bg-rose-400"
               )} />
               {item.type === "IN" ? <ArrowUpCircle className="w-3 h-3" /> : <ArrowDownCircle className="w-3 h-3" />}
               {item.type === "IN" ? (isKh ? "ចូល" : "IN") : (isKh ? "ចេញ" : "OUT")}
            </span>
         ),
      },
      {
         key: "timestamp", header: isKh ? "កាលបរិច្ឆេទ" : "Date & Time",
         render: (item: StockHistory) => {
            const p = formatDateParts(item.timestamp)
            if (!p) return <span className="text-gray-300 dark:text-white/20 text-[14px]">—</span>
            return (
               <div className="flex flex-col gap-0.5">
                  <span className="text-[14px]  text-gray-700 dark:text-white/70">{p.date}</span>
                  <span className="text-[12px] text-gray-600 dark:text-white/30">{p.time}</span>
               </div>
            )
         },
      },
      {
         key: "reason", header: isKh ? "សម្គាល់" : "Note",
         render: (item: StockHistory) => (
            <span className="text-[12px] text-gray-600 dark:text-white/30 truncate max-w-[180px] block italic">
               {item.reason || "—"}
            </span>
         ),
      },
      {
         key: "actions", header: isKh ? "សកម្មភាព" : "Actions", className: "text-right",
         render: (item: StockHistory) => (
            <div className="flex justify-end">
               <button
                  onClick={() => setViewItem(item)}
                  className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-[14px] font-semibold transition-all text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10"
               >
                  <Eye className="w-3.5 h-3.5" /> {isKh ? "មើល" : "View"}
               </button>
            </div>
         ),
      },
   ]

   const showInitialLoading = loading && historyList.length === 0

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
               title={isKh ? "ប្រវត្តិស្តុកចេញ-ចូល" : "Stock Movements"}
               subtitle={isKh ? "ប្រវត្តិការបន្ថែម និងកាត់ស្តុក" : "Track all stock in/out history"}
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
                  <div className="grid grid-cols-3 gap-3 shrink-0">
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
                                    <Activity className={cn("w-3 h-3 shrink-0", style.icon)} />
                                    <p className={cn("text-[14px]", style.label)}>
                                       {isKh ? "ករណី" : "records"}
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
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 dark:text-white/25 pointer-events-none" />
                           <input
                              className={cn(INPUT, "w-56 pl-8")}
                              placeholder={isKh ? "ស្វែងរក..." : "Search product..."}
                              value={search}
                              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                           />
                        </div>
                        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07] shrink-0" />
                        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setCurrentPage(1) }}>
                           <SelectTrigger className={cn(SEL_T, "w-44")}>
                              <Filter className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                              <SelectValue placeholder={isKh ? "ប្រភេទ" : "Type"} />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="ALL" className={SEL_I}>{isKh ? "គ្រប់ប្រភេទ" : "All Types"}</SelectItem>
                              <SelectItem value="IN" className="text-[14px] text-emerald-600 dark:text-emerald-400 rounded-lg focus:bg-emerald-50 dark:focus:bg-emerald-500/10">
                                 {isKh ? "ចូល (IN)" : "Stock IN"}
                              </SelectItem>
                              <SelectItem value="OUT" className="text-[14px] text-rose-600 dark:text-rose-400 rounded-lg focus:bg-rose-50 dark:focus:bg-rose-500/10">
                                 {isKh ? "ចេញ (OUT)" : "Stock OUT"}
                              </SelectItem>
                           </SelectContent>
                        </Select>
                        <DateRangePicker
                           startDate={startDate}
                           endDate={endDate}
                           onStartChange={v => { setStartDate(v); setCurrentPage(1) }}
                           onEndChange={v => { setEndDate(v); setCurrentPage(1) }}
                        />
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
                           onClick={() => refetchHistory()}
                           className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] text-gray-600 dark:text-white/40 hover:text-[#03624C] dark:hover:text-[#1857D8] transition-all" >
                           <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
                        </button>
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
                           totalPages={Math.ceil(sortedData.length / itemsPerPage) || 1}
                           onPageChange={setCurrentPage}
                           itemsPerPage={itemsPerPage}
                           totalItems={sortedData.length}
                           language={i18n.language as any}
                        />
                     </Card>
                  </motion.div>
               </main>
            )}
         </div>
         <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
            <DialogContent
               className="max-w-sm p-0 border border-gray-200 dark:border-white/[0.13] shadow-lg rounded-lg bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden"
               style={SORA} >
               <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0 bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
                  <div className="flex items-center gap-2.5">
                     <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", ACCENT.iconBg)}>
                        <Package className="w-4 h-4 text-white" />
                     </div>
                     <div>
                        <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                           {isKh ? "ព័ត៌មានលម្អិត" : "Movement Details"}
                        </DialogTitle>
                        <p className="text-[14px] font-semibold text-[#03624C] dark:text-[#1857D8] leading-tight">
                           {viewItem?.productName}
                        </p>
                     </div>
                     <DialogDescription className="sr-only">Stock history detail</DialogDescription>
                  </div>
               </DialogHeader>
               <div className="px-6 py-5 space-y-1.5">
                  {[
                     {
                        label: isKh ? "ឈ្មោះទំនិញ" : "Product",
                        value: viewItem?.productName
                     },
                     {
                        label: isKh ? "ប្រភេទ" : "Type",
                        value: viewItem ? (
                           <span className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] border",
                              viewItem.type === "IN"
                                 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25"
                                 : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/25"
                           )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", viewItem.type === "IN" ? "bg-emerald-400" : "bg-rose-400")} />
                              {viewItem.type === "IN" ? <ArrowUpCircle className="w-3 h-3" /> : <ArrowDownCircle className="w-3 h-3" />}
                              {viewItem.type === "IN" ? (isKh ? "ចូល" : "IN") : (isKh ? "ចេញ" : "OUT")}
                           </span>
                        ) : null
                     },
                     {
                        label: isKh ? "ចំនួន" : "Quantity",
                        value: viewItem
                           ? <span className={cn("text-[14px] font-black tabular-nums",
                              viewItem.type === "IN" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                           )}>
                              {viewItem.type === "IN" ? "+" : "−"}{Math.abs(viewItem.qty)}{" "}
                              <span className="text-[12px] font-medium opacity-60 uppercase">{displayUnit(viewItem.unit)}</span>
                           </span>
                           : null
                     },
                     {
                        label: isKh ? "សម្គាល់" : "Note",
                        value: viewItem?.reason || "—"
                     },
                     {
                        label: isKh ? "កាលបរិច្ឆេទ" : "Date & Time",
                        value: (() => {
                           const p = viewItem ? formatDateParts(viewItem.timestamp) : null
                           return p ? `${p.date}  •  ${p.time}` : "—"
                        })()
                     },
                  ].map((row, i) => (
                     <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-[#2] last:border-0" >
                        <Label className="text-[14px] text-gray-600 dark:text-white/30">
                           {row.label}
                        </Label>
                        {typeof row.value === "string"
                           ? <span className="text-[14px] text-gray-800 dark:text-white/85 text-right max-w-[200px]">{row.value}</span>
                           : row.value}
                     </motion.div>
                  ))}
               </div>
               <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg flex justify-end">
                  <button
                     onClick={() => setViewItem(null)}
                     className="h-9 px-5 rounded-lg text-[14px] font-bold transition-all border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06]" >
                     {isKh ? "បិទ" : "Close"}
                  </button>
               </div>
            </DialogContent>
         </Dialog>
      </div>
   )
}