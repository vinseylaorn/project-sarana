"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { AlertCircle, Loader2, Download, FileText, Printer, ChevronDown, FileSpreadsheet } from "lucide-react"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { useTranslation } from "react-i18next"
import { toastError, toastSuccess } from "@/lib/toast"
import { PIE_COLORS, SORA, fmt, computeShiftStats, exportToCSV } from "@/components/report-shift/types"
import { SummaryCards } from "@/components/report-shift/summary-cards"
import { RevenueChart } from "@/components/report-shift/revenue-chart"
import { TopItems } from "@/components/report-shift/top-items"
import { PaymentMethods } from "@/components/report-shift/payment-methods"
import { TransactionsTable } from "@/components/report-shift/transactions-table"
import { StaffFilter } from "@/components/report-shift/staff-filter"
import { StaffDetail } from "@/components/report-shift/staff-detail"
import { printReport } from "@/components/ui/print-report"
import { useShiftReportData } from "@/hooks/reports/use-shift-report"

const EASE_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1]

const fadeUp = (delay = 0, duration = 0.42) => ({
   initial: { opacity: 0, y: 16 },
   animate: { opacity: 1, y: 0 },
   transition: { delay, duration, ease: EASE_EXPO },
})

const springBounce = {
   type: "spring" as const,
   stiffness: 320,
   damping: 24,
}

const staggerContainer: Variants = {
   hidden: {},
   show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

const staggerChild: Variants = {
   hidden: { opacity: 0, y: 14 },
   show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_EXPO as any } },
}

const dropdownVariants: Variants = {
   hidden: { opacity: 0, scale: 0.95, y: -8 },
   show: {
      opacity: 1, scale: 1, y: 0,
      transition: { type: "spring" as const, stiffness: 400, damping: 28 },
   },
   exit: {
      opacity: 0, scale: 0.95, y: -6,
      transition: { duration: 0.15, ease: "easeIn" as const },
   },
}

const dropdownItemVariants: Variants = {
   hidden: { opacity: 0, x: -8 },
   show: (i: number) => ({
      opacity: 1, x: 0,
      transition: { delay: i * 0.05, duration: 0.22, ease: EASE_EXPO },
   }),
}

const LoadingState = ({ isKh }: { isKh: boolean }) => (
   <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center py-20" >
      <div className="flex flex-col items-center gap-3">
         <div className="relative flex items-center justify-center">
            <motion.div
               className="absolute w-10 h-10 rounded-full border-2 border-indigo-400/30 dark:border-indigo-500/20"
               animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
               transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
         </div>
         <motion.p
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/25"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} >
            {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
         </motion.p>
      </div>
   </motion.div>
)

const ErrorBanner = ({ error }: { error: string }) => (
   <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.3, ease: EASE_EXPO }}
      className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/20" >
      <motion.div
         initial={{ rotate: -15, scale: 0.7 }}
         animate={{ rotate: 0, scale: 1 }}
         transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }} >
         <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
      </motion.div>
      <p className="text-[13px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>
   </motion.div>
)

export default function AdminShiftReportPage() {
   const { i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"

   const [startDate, setStartDate] = useState("")
   const [endDate, setEndDate] = useState("")
   const [selectedStaffId, setSelectedStaffId] = useState<number | "all">("all")
   const [exportOpen, setExportOpen] = useState(false)

   // ✅ Data comes from React Query cache — no manual loadAll/useEffect, no loader flash on revisit
   const { shifts, allOrders, loading, error, isFetching, refetch } = useShiftReportData({
      start_date: startDate || undefined,
      end_date: endDate || undefined,
   })

   const staffList = useMemo(() => {
      const map = new Map<number, { name: string; position?: string | null }>()
      shifts.forEach(s => {
         if (s.staff_id && !map.has(s.staff_id))
            map.set(s.staff_id, { name: s.staff_name, position: s.staff_position })
      })
      return Array.from(map.entries()).map(([id, info]) => ({ id, ...info }))
   }, [shifts])

   const filteredShifts = useMemo(() =>
      selectedStaffId === "all" ? shifts : shifts.filter(s => s.staff_id === selectedStaffId),
      [shifts, selectedStaffId]
   )

   const filteredOrders = useMemo(() => {
      const allShiftIds = new Set(shifts.map(s => s.id))
      const withShift = allOrders.filter(o => o.working_shift_id != null && allShiftIds.has(o.working_shift_id))
      if (selectedStaffId === "all") return withShift
      const staffShiftIds = new Set(filteredShifts.map(s => s.id))
      return withShift.filter(o => staffShiftIds.has(o.working_shift_id!))
   }, [allOrders, shifts, filteredShifts, selectedStaffId])

   const orderTotals = useMemo(() => {
      const totalRevenue = filteredOrders.reduce((s, o) => s + (Number(o.total) || 0), 0)
      const totalOrders = filteredOrders.length
      return { totalRevenue, totalOrders, avgOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0 }
   }, [filteredOrders])

   const shiftStats = useMemo(() => computeShiftStats(filteredShifts), [filteredShifts])

   const revenueChartData = useMemo(() => {
      const weekMap = new Array(7).fill(0)
      const monthMap = new Array(4).fill(0)
      const yearMap = new Array(12).fill(0)
      filteredOrders.forEach(o => {
         if (!o.created_at) return
         const d = new Date(o.created_at)
         const r = Number(o.total) || 0
         let wd = d.getDay() - 1; if (wd < 0) wd = 6
         weekMap[wd] += r
         const wm = Math.min(Math.floor((d.getDate() - 1) / 7), 3)
         monthMap[wm] += r
         yearMap[d.getMonth()] += r
      })
      const weekDays = isKh
         ? ["ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍", "អាទិត្យ"]
         : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      const monthLbls = isKh
         ? ["សប្តាហ៍ទី1", "សប្តាហ៍ទី2", "សប្តាហ៍ទី3", "សប្តាហ៍ទី4"]
         : ["W1", "W2", "W3", "W4"]
      return {
         week: weekMap.map((revenue, i) => ({ label: weekDays[i], revenue })),
         month: monthMap.map((revenue, i) => ({ label: monthLbls[i], revenue })),
         year: yearMap.map((revenue, i) => ({ label: new Date(0, i).toLocaleString(undefined, { month: "short" }), revenue })),
      }
   }, [filteredOrders, isKh])

   const payments = useMemo(() => {
      const map: Record<string, number> = {}
      filteredOrders.forEach(o => { const m = o.payment_method ?? "Unknown"; map[m] = (map[m] ?? 0) + 1 })
      return Object.entries(map).map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }))
   }, [filteredOrders])

   const topItems = useMemo(() => {
      const m: Record<string, { orders: number; revenue: number }> = {}
      filteredOrders.forEach(o => {
         ; (o.items ?? []).forEach((item: any) => {
            if (!m[item.name]) m[item.name] = { orders: 0, revenue: 0 }
            m[item.name].orders += item.quantity ?? 1
            m[item.name].revenue += (item.price ?? 0) * (item.quantity ?? 1)
         })
      })
      return Object.entries(m)
         .map(([name, v]) => ({ name, ...v }))
         .sort((a, b) => b.orders - a.orders)
         .slice(0, 5)
   }, [filteredOrders])

   const staffDetail = useMemo(() => {
      if (selectedStaffId === "all") return null
      const staff = staffList.find(s => s.id === selectedStaffId)
      if (!staff) return null
      const shiftTypes = [...new Set(filteredShifts.map(s => s.shift_type))]
      const totalHours = filteredShifts.reduce((sum, s) => {
         const open = s.open_time_raw ?? s.open_time
         const close = s.close_time_raw ?? s.close_time
         if (!open) return sum
         const o = new Date(open.includes("T") ? open : open.replace(" ", "T"))
         const c = close
            ? new Date(close.includes("T") ? close : close.replace(" ", "T"))
            : new Date()
         return sum + (c.getTime() - o.getTime()) / 3_600_000
      }, 0)
      return { staff, shiftTypes, totalHours }
   }, [selectedStaffId, filteredShifts, staffList])

   const isSingleDay = useMemo(
      () => !!(startDate && endDate && startDate === endDate),
      [startDate, endDate]
   )

   // Reset staff filter whenever the date range changes (still local UI state, not query data)
   useEffect(() => { setSelectedStaffId("all") }, [startDate, endDate])

   // Surface load errors via toast, same as the original loadAll() catch block
   useEffect(() => {
      if (error) toastError(isKh ? "ទាញទិន្នន័យមិនបាន" : "Load failed", error)
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [error])

   useEffect(() => {
      if (!exportOpen) return
      const handler = (e: MouseEvent) => {
         const target = e.target as Element
         if (!target.closest("[data-export-dropdown]")) setExportOpen(false)
      }
      document.addEventListener("mousedown", handler)
      return () => document.removeEventListener("mousedown", handler)
   }, [exportOpen])

   const exportCSV = () => {
      if (!filteredOrders.length) { toastError(isKh ? "គ្មានទិន្នន័យ" : "No data"); return }
      exportToCSV(
         filteredOrders.map(o => ({
            "Order Ref": o.order_ref, Type: o.order_type, Table: o.table_name ?? "-",
            Amount: fmt(o.total), Method: o.payment_method ?? "-",
         })),
         `shift_report_${startDate || "all"}_to_${endDate || "all"}.csv`
      )
      toastSuccess(isKh ? "CSV ត្រូវបានទាញយក" : "CSV exported")
      setExportOpen(false)
   }

   const handlePrint = () => printReport({
      title: isKh ? "របាយការណ៍ Shift" : "Shift Report",
      orders: filteredOrders,
      totals: orderTotals,
      stats: [
         { label: "Total Revenue", value: fmt(orderTotals.totalRevenue) },
         { label: "Total Orders", value: orderTotals.totalOrders },
         { label: "Avg Order", value: fmt(orderTotals.avgOrder) },
         { label: "Open Shifts", value: shiftStats.openShifts },
      ],
      onDone: () => setExportOpen(false),
   })

   const exportItems = [
      { label: "Export PDF", icon: FileText, color: "text-rose-600 dark:text-rose-400", fn: handlePrint },
      { label: "Export CSV", icon: FileSpreadsheet, color: "text-emerald-600 dark:text-emerald-400", fn: exportCSV },
      { label: "Print Report", icon: Printer, color: "text-indigo-600 dark:text-indigo-400", fn: handlePrint },
   ]

   return (
      <div className="flex h-screen bg-gray-50 dark:bg-[#0d0f1a] overflow-hidden" style={SORA}>
         <Sidebar />
         <div className="flex-1 flex flex-col overflow-hidden">
            <Header
               title="Admin Shift Report"
               subtitle={isKh ? "របាយការណ៍ by Shift" : "Revenue & analytics per shift"}
            />
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
               <motion.div
                  className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/20 dark:bg-indigo-600/8 blur-3xl"
                  animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
               />
               <motion.div
                  className="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-violet-600/20 dark:bg-violet-600/6 blur-3xl"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
               />
            </div>
            <main className="relative z-10 flex-1 overflow-auto p-5">
               <motion.div
                  initial={{ opacity: 0, y: -14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springBounce}
                  className="flex items-center gap-3 w-full relative overflow-visible" >
                  <DateRangePicker
                     startDate={startDate} endDate={endDate}
                     onStartChange={setStartDate} onEndChange={setEndDate}
                  />
                  <StaffFilter
                     staffList={staffList}
                     selectedStaffId={selectedStaffId}
                     onSelect={setSelectedStaffId}
                     isKh={isKh}
                  />
                  <div className="relative ml-auto self-start" data-export-dropdown>
                     <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        onClick={() => setExportOpen(v => !v)}
                        className="h-9 px-4.5 flex items-center gap-3 rounded-lg bg-[#03624C] hover:bg-emerald-700 text-white text-[14px] font-bold uppercase tracking-widest transition-colors shadow-lg shadow-emerald-600/20" >
                        <Download className="w-3.5 h-3.5" />
                        Export
                        <motion.span
                           animate={{ rotate: exportOpen ? 180 : 0 }}
                           transition={{ type: "spring", stiffness: 300, damping: 22 }} >
                           <ChevronDown className="w-3 h-3" />
                        </motion.span>
                     </motion.button>
                     <AnimatePresence>
                        {exportOpen && (
                           <motion.div
                              variants={dropdownVariants}
                              initial="hidden"
                              animate="show"
                              exit="exit"
                              className="w-full absolute right-0 top-[calc(100%+6px)] bg-white dark:bg-[#22263a] border border-gray-100 dark:border-white/[0.12] rounded-lg shadow-2xl z-[100] overflow-hidden py-1"
                              style={{ ...SORA, pointerEvents: "auto" }} >
                              {exportItems.map((item, i) => (
                                 <motion.button
                                    key={item.label}
                                    custom={i}
                                    variants={dropdownItemVariants}
                                    initial="hidden"
                                    animate="show"
                                    whileHover={{ x: 4, transition: { type: "spring", stiffness: 400, damping: 20 } }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={item.fn}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-semibold ${item.color}transition-colors`} >
                                    <item.icon className="w-3.5 h-3.5" />
                                    {item.label}
                                 </motion.button>
                              ))}
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               </motion.div>
               <div className="mt-4">
                  <AnimatePresence mode="wait">

                     {loading && <LoadingState key="loading" isKh={isKh} />}

                     {!loading && error && <ErrorBanner key="error" error={error} />}

                     {!loading && !error && (
                        <motion.div
                           key="content"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           transition={{ duration: 0.25 }}
                           className="space-y-4" >
                           <motion.div {...fadeUp(0.05)}>
                              <SummaryCards
                                 orderTotals={orderTotals}
                                 shiftStats={shiftStats}
                                 isKh={isKh}
                              />
                           </motion.div>
                           <AnimatePresence>
                              {staffDetail && (
                                 <motion.div
                                    key={`staff-${selectedStaffId}`}
                                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.38, ease: EASE_EXPO }} >
                                    <StaffDetail
                                       staff={staffDetail.staff}
                                       filteredShifts={filteredShifts}
                                       shiftTypes={staffDetail.shiftTypes}
                                       totalHours={staffDetail.totalHours}
                                       isSingleDay={isSingleDay}
                                       isKh={isKh}
                                    />
                                 </motion.div>
                              )}
                           </AnimatePresence>
                           <motion.div
                              variants={staggerContainer}
                              initial="hidden"
                              animate="show"
                              className="grid grid-cols-1 lg:grid-cols-4 gap-4" >
                              <motion.div variants={staggerChild} className="lg:col-span-2">
                                 <RevenueChart data={revenueChartData} loading={loading} isKh={isKh} />
                              </motion.div>

                              <motion.div variants={staggerChild}>
                                 <TopItems items={topItems} isKh={isKh} />
                              </motion.div>

                              <motion.div variants={staggerChild}>
                                 <PaymentMethods payments={payments} isKh={isKh} />
                              </motion.div>
                           </motion.div>
                           <motion.div {...fadeUp(0.45)}>
                              <TransactionsTable orders={filteredOrders} isKh={isKh} />
                           </motion.div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </main>
         </div>
      </div>
   )
}