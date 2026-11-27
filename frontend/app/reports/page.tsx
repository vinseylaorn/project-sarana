"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Variants } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { KpiCards } from "@/components/reports/summary-cards"
import { RevenueOverview } from "@/components/reports/revenueoverview"
import { SalesByCategoryChart } from "@/components/reports/CategorCharts"
import { PaymentMethodsChart } from "@/components/reports/Paymentchart"
import { OrdersTrend } from "@/components/reports/orderstrend"
import { RecentTransactions } from "@/components/reports/recent-transactions"
import { TopSellingItems } from "@/components/reports/top-sales"
import {
  Download, ChevronDown, BarChart3, RefreshCw,
  FileText, Printer, FileSpreadsheet, AlertCircle, Loader2,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { useReports } from "@/hooks/reports/use-overview-report"
import { reportsApi } from "@/lib/api"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { printReport } from "@/components/ui/print-report"

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }
const EASE_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1]

const springBounce = { type: "spring" as const, stiffness: 320, damping: 24 }

const fadeUp = (delay = 0, duration = 0.42) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration, ease: EASE_EXPO },
})

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
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 28 } },
  exit: { opacity: 0, scale: 0.95, y: -6, transition: { duration: 0.15, ease: "easeIn" as const } },
}

const dropdownItemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.05, duration: 0.22, ease: EASE_EXPO },
  }),
}

const LoadingState = ({ isKhmer }: { isKhmer: boolean }) => (
  <motion.div
    key="loading"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.2 } }}
    transition={{ duration: 0.3 }}
    className="flex items-center justify-center py-20"
  >
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        <motion.div
          className="absolute w-10 h-10 rounded-full border-2 border-[#03624C]/30 dark:border-[#1857D8]/20"
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <Loader2 className="w-6 h-6 text-[#03624C] dark:text-[#1857D8] animate-spin" />
      </div>
      <motion.p
        className="text-[14px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-white/40"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {isKhmer ? "កំពុងផ្ទុក..." : "Loading..."}
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
    className="flex items-center gap-3 px-5 py-4 rounded-lg bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/20"
  >
    <motion.div
      initial={{ rotate: -15, scale: 0.7 }}
      animate={{ rotate: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
    >
      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
    </motion.div>
    <p className="text-[14px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>
  </motion.div>
)

export default function ReportsPage() {
  const { i18n } = useTranslation("common")
  const isKhmer = i18n.language === "kh"

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [exportOpen, setExportOpen] = useState(false)
  const apiEndDate = endDate

  const { loading, error, kpi, charts, recent, inventory, refetch } = useReports(startDate, apiEndDate)

  const fetchExportData = () =>
    reportsApi.export({ start_date: startDate || undefined, end_date: apiEndDate || undefined })

  const exportCSV = async () => {
    try {
      const data = await fetchExportData()
      const rows = [
        ["Order Ref", "Type", "Table", "Amount", "Payment Method", "Date"],
        ...data.map((o: any) => [o.order_ref, o.order_type, o.table_name, o.total, o.payment_method, o.created_at]),
      ]
      const csv = rows.map((r) => r.map((c: any) => `"${c}"`).join(",")).join("\n")
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `report-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch { alert("Export CSV failed") }
    setExportOpen(false)
  }

  const handlePrint = async () => {
    try {
      const data = await fetchExportData()
      printReport({
        title: "Sales Report",
        orders: data,
        totals: { totalRevenue: kpi.totalRevenue, totalOrders: data.length, avgOrder: kpi.avgOrder },
        stats: [
          { label: "Total Revenue", value: `$${kpi.totalRevenue.toFixed(2)}` },
          { label: "Total Orders", value: data.length },
          { label: "Avg Order", value: `$${kpi.avgOrder.toFixed(2)}` },
          { label: "Total Expense", value: `$${(kpi.totalExpense ?? 0).toFixed(2)}` },
        ],
        onDone: () => setExportOpen(false),
      })
    } catch {
      alert("Print failed")
      setExportOpen(false)
    }
  }

  const exportMenuItems = [
    { label: "Export PDF", icon: FileText, color: "text-rose-600 dark:text-rose-400", hover: "hover:bg-rose-50 dark:hover:bg-rose-500/10", fn: handlePrint },
    { label: "Export CSV", icon: FileSpreadsheet, color: "text-emerald-600 dark:text-emerald-400", hover: "hover:bg-emerald-50 dark:hover:bg-emerald-500/10", fn: exportCSV },
    { label: "Print Report", icon: Printer, color: "text-[#1857D8] dark:text-[#1857D8]", hover: "hover:bg-blue-50 dark:hover:bg-[#1857D8]/10", fn: handlePrint },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#13151f] overflow-hidden text-gray-900 dark:text-slate-100" style={SORA}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={isKhmer ? "របាយការណ៍ និងការវិភាគ" : "Reports & Analytics"}
          subtitle={isKhmer ? "ទិន្នន័យអាជីវកម្មពិតប្រាកដ" : "Live business data"}
        />
        <main className="flex-1 overflow-auto p-5">
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springBounce}
            className="flex items-center gap-3 w-full relative overflow-visible mb-4"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <DateRangePicker
                startDate={startDate} endDate={endDate}
                onStartChange={setStartDate} onEndChange={setEndDate}
              />
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                onClick={refetch}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.06] text-gray-500 dark:text-white/40 hover:text-[#03624C] hover:border-[#03624C]/40 transition-all"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              </motion.button>
            </div>

            <div className="relative ml-auto self-start">
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                onClick={() => setExportOpen((v) => !v)}
                className="h-9 px-4 flex items-center gap-4 rounded-lg bg-[#03624C] hover:bg-emerald-700 text-white text-[14px] font-bold uppercase tracking-widest transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                Export
                <motion.span
                  animate={{ rotate: exportOpen ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                >
                  <ChevronDown className="w-3 h-3" />
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {exportOpen && (
                  <motion.div
                    variants={dropdownVariants} initial="hidden" animate="show" exit="exit"
                    className="w-full absolute right-0 top-[calc(100%+6px)] bg-white dark:bg-[#22263a] border border-gray-100 dark:border-white/[0.12] rounded-lg shadow-lg z-50 overflow-hidden py-1"
                    style={{ ...SORA, pointerEvents: "auto" }}
                  >
                    {exportMenuItems.map((item, i) => (
                      <motion.button
                        key={item.label}
                        custom={i} variants={dropdownItemVariants} initial="hidden" animate="show"
                        whileHover={{ x: 4, transition: { type: "spring", stiffness: 400, damping: 20 } }}
                        whileTap={{ scale: 0.97 }}
                        onClick={item.fn}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-semibold ${item.color} ${item.hover} transition-colors`}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                        {item.label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {loading && <LoadingState key="loading" isKhmer={isKhmer} />}
            {!loading && error && <ErrorBanner key="error" error={error} />}
            {!loading && !error && (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <AnimatePresence>
                  {kpi.totalOrders === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.3, ease: EASE_EXPO }}
                      className="flex items-center gap-3 px-5 py-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"
                    >
                      <BarChart3 className="w-5 h-5 text-amber-500 shrink-0" />
                      <p className="text-[14px] font-semibold text-amber-700 dark:text-amber-400">
                        {isKhmer ? "មិនទាន់មានទិន្នន័យ" : "No transaction data found for this period"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div {...fadeUp(0.05)}>
                  <KpiCards
                    kpi={kpi}
                    inventory={inventory}
                    dineIn={kpi.dineIn}
                    takeaway={kpi.takeaway}
                    app={kpi.app}
                    revenueTrend={charts.revenueByDay.map((d: any) => d.revenue)}
                  />
                </motion.div>
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-5">
                  <motion.div variants={staggerChild} className="h-full">
                    <RevenueOverview
                      revenueByDay={charts.revenueByDay}
                      revenueByWeek={charts.revenueByWeek}
                      revenueByMonth={charts.revenueByMonth}
                      startDate={startDate} endDate={endDate}
                    />
                  </motion.div>
                  <motion.div variants={staggerChild} className="h-full">
                    <OrdersTrend data={charts.revenueTrend} />
                  </motion.div>
                </motion.div>

                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid lg:grid-cols-3 gap-5">
                  <motion.div variants={staggerChild} className="h-full">
                    <SalesByCategoryChart categoryData={charts.categoryData} />
                  </motion.div>
                  <motion.div variants={staggerChild} className="h-full">
                    <TopSellingItems items={charts.topItems} />
                  </motion.div>
                  <motion.div variants={staggerChild} className="h-full">
                    <PaymentMethodsChart paymentData={charts.paymentData} />
                  </motion.div>
                </motion.div>

                <motion.div {...fadeUp(0.35)}>
                  <RecentTransactions recent={recent} totalOrders={kpi.totalOrders} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}