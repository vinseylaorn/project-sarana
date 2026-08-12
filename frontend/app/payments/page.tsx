"use client"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTableCustom } from "@/components/ui/table"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettings } from "@/lib/settings-context"
import {
   Search, Eye, Printer, Clock, Filter, RotateCcw,
   Loader2, ShoppingBag, Utensils, Banknote, ReceiptText, CreditCard, Smartphone,
   TrendingUp, CheckCircle2, User, BriefcaseBusiness, Crown, Tag, Percent, Package,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCambodiaTime, extractCambodiaDate } from "@/lib/utils/time"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { motion, AnimatePresence } from "framer-motion"
import type { Order } from "@/types"
import { useTranslation } from "react-i18next"
import { printBill } from "@/components/pos/print-bill"

import { useOrders, useWorkingShifts } from "@/hooks/orders/payment-mutations"

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }

const INPUT =
   "w-full h-9 px-3 text-[14px] rounded-lg outline-none transition-all " +
   "bg-white dark:bg-[#22263a] border border-gray-200/80 dark:border-white/[0.08] " +
   "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/30 " +
   "focus:border-[#03624C] dark:focus:border-[#1857D8] focus:ring-2 focus:ring-[#03624C]/10 " +
   "dark:focus:ring-[#1857D8]/10 shadow-sm dark:shadow-none"

const SEL_T =
   "h-9 text-[14px] rounded-lg border border-gray-200/80 dark:border-white/[0.08] " +
   "bg-white dark:bg-[#22263a] text-gray-700 dark:text-white/70 shadow-sm dark:shadow-none"

const SEL_C =
   "bg-white dark:bg-[#1e2235] border border-gray-100 dark:border-white/[0.10] rounded-lg shadow-xl"

const SEL_I =
   "text-[14px] text-gray-800 dark:text-white/80 rounded-lg " +
   "focus:bg-violet-50 dark:focus:bg-violet-500/10 dark:focus:text-violet-300"

const ACCENT = {
   text: "!text-[#03624C] dark:!text-[#1857D8]",
   iconBg: "bg-[#03624C] dark:bg-[#1857D8]",
   border: "border-[#03624C]/30 dark:border-[#1857D8]/30",
}

const PAYMENT_STYLE: Record<string, { text: string; label: string; iconColor: string; iconBg: string }> = {
   cash: {
      text: "!text-emerald-600 dark:!text-emerald-400", label: "text-gray-600 dark:text-gray-200",
      iconColor: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
   },
   card: {
      text: "!text-blue-600 dark:!text-blue-400", label: "text-gray-600 dark:text-gray-200",
      iconColor: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-50 dark:bg-blue-500/10",
   },
   mobile: {
      text: "!text-[#03624C] dark:!text-violet-400", label: "text-gray-600 dark:text-gray-200",
      iconColor: "text-[#03624C] dark:text-[#03624C]", iconBg: "bg-violet-50 dark:bg-violet-500/10",
   },
}
const DEFAULT_STYLE = {
   text: "!text-amber-600 dark:!text-amber-400", label: "text-gray-600 dark:text-gray-200",
   iconColor: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-50 dark:bg-amber-500/10",
}

const getOrderBadge = (o: Order, isKh: boolean) => {
   const type = o.order_type?.toLowerCase() || ""
   if (type === "app" || type.includes("app"))
      return { 
         icon: <Smartphone className="w-3 h-3" />, 
         color: " text-sky-600 dark:text-sky-400 ", label: "App Order", dot: "bg-sky-400" }
   if (type === "takeaway" || type.includes("take"))
      return { 
         icon: <ShoppingBag className="w-3 h-3" />, 
         color: "text-amber-600 dark:text-amber-400 ", label: isKh ? "ខ្ចប់ទៅ" : "Takeaway", dot: "bg-amber-400" }
   return { 
      icon: <Utensils className="w-3 h-3" />, 
      color: " text-violet-600 dark:text-violet-400", label: o.table_name || (isKh ? "បរិភោគក្នុង" : "Dine In"), dot: "bg-violet-400" }
}

const getPaymentIcon = (method: string, colorClass: string) => {
   const m = method.toLowerCase()
   if (m === "cash") return <Banknote className={`w-4 h-4 ${colorClass}`} />
   return <CreditCard className={`w-4 h-4 ${colorClass}`} />
}

export default function PaymentsPage() {
   const { systemName, systemLogo } = useSettings()
   const { t, i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"

   const { data: orders = [], isLoading: loadingOrders, isFetching: fetchingOrders } = useOrders()
   const { data: shifts = [], isLoading: loadingShifts, isFetching: fetchingShifts } = useWorkingShifts()
   const loading = loadingOrders || loadingShifts
   const isFetching = fetchingOrders || fetchingShifts

   const [search, setSearch] = useState("")
   const [typeFilter, setTypeFilter] = useState("ALL")
   const [paymentFilter, setPaymentFilter] = useState("ALL")
   const [startDate, setStartDate] = useState("")
   const [endDate, setEndDate] = useState("")
   const [currentPage, setCurrentPage] = useState(1)
   const itemsPerPage = 10
   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
   const [showReceiptDialog, setShowReceiptDialog] = useState(false)
   const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: null, direction: "desc" })

   const shiftMap = useMemo(() => {
      const map: Record<number, any> = {}
      shifts.forEach(s => { map[s.id] = s })
      return map
   }, [shifts])

   const paymentMethods = useMemo(() => {
      const methods = orders.map(o => (o.payment_method || "").toLowerCase()).filter(Boolean)
      return [...new Set(methods)].sort()
   }, [orders])

   const handlePrint = (order: Order) => {
      const { date, time } = formatCambodiaTime(order.created_at || "")
      const shift = order.working_shift_id ? shiftMap[order.working_shift_id] : null
      const itemDiscountTotal = order.items.reduce((s, it) => {
         if (it.original_price && it.original_price > it.price)
            return s + (it.original_price - it.price) * it.quantity
         return s
      }, 0)
      printBill({
         items: order.items,
         orderType: order.order_type,
         orderRef: order.order_ref,
         tableName: order.table_name,
         staffName: shift?.staff_name,
         shiftType: shift?.shift_type,
         date,
         time,
         subtotal: order.items.reduce((s, it) => s + it.price * it.quantity, 0),
         discountAmount: Number(order.discount_amount ?? 0),
         discountMode: "%",
         discountPct: 0,
         taxEnabled: (order.tax_amount ?? 0) > 0,
         taxPct: 0,
         taxAmount: Number(order.tax_amount ?? 0),
         finalTotal: Number(order.total),
         itemDiscountTotal,
         vipDiscountAmount: Number(order.vip_discount_amount ?? 0),
         selectedMethod: order.payment_method,
         systemLogo,
         systemName,
      })
   }

   const resetFilters = () => {
      setSearch(""); setTypeFilter("ALL"); setPaymentFilter("ALL")
      setStartDate(""); setEndDate(""); setCurrentPage(1)
   }

   const filteredData = useMemo(() => {
      let result = orders.filter(o => {
         const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "")
         const q = normalize(search)
         const shift = o.working_shift_id ? shiftMap[o.working_shift_id] : null
         const matchSearch =
            normalize(o.order_ref || "").includes(q) ||
            normalize(o.table_name || "").includes(q) ||
            normalize(shift?.staff_name || "").includes(q)
         const matchType = typeFilter === "ALL" || o.order_type === typeFilter
         const matchPayment = paymentFilter === "ALL" || (o.payment_method || "").toLowerCase() === paymentFilter
         const orderDate = extractCambodiaDate(o.created_at || "")
         const matchDate = (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate)
         return matchSearch && matchType && matchPayment && matchDate
      })
      if (sortConfig.key) {
         result.sort((a: any, b: any) => {
            if (a[sortConfig.key!] < b[sortConfig.key!]) return sortConfig.direction === "asc" ? -1 : 1
            if (a[sortConfig.key!] > b[sortConfig.key!]) return sortConfig.direction === "asc" ? 1 : -1
            return 0
         })
      }
      return result
   }, [orders, search, typeFilter, paymentFilter, startDate, endDate, sortConfig, shiftMap])

   const totalKpi = useMemo(() => ({
      count: filteredData.length,
      amount: filteredData.reduce((s, o) => s + Number(o.total), 0),
   }), [filteredData])

   const desiredMethods = ['cash', 'card', 'mobile'];
   const paymentKpi = useMemo(() => {
      return desiredMethods.map(method => {
         const items = filteredData.filter(o => (o.payment_method || "").toLowerCase() === method);
         const count = items.length;
         const amount = items.reduce((s, o) => s + Number(o.total), 0);
         return {
            method,
            count,
            amount,
            style: PAYMENT_STYLE[method] ?? DEFAULT_STYLE,
         };
      });
   }, [filteredData]);

   const pageData = useMemo(() =>
      filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
      [filteredData, currentPage]
   )

   const hasFilter = search || typeFilter !== "ALL" || paymentFilter !== "ALL" || startDate || endDate

   const ShiftCell = ({ order }: { order: Order }) => {
      const shift = order.working_shift_id ? shiftMap[order.working_shift_id] : null
      if (!shift) return <span className="text-[14px] text-gray-300 dark:text-white/20 italic">{isKh ? "មិនមាន" : "—"}</span>
      return (
         <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-[14px] text-gray-700 dark:text-white/80">
               <User className="w-3 h-3 text-[#03624C] dark:text-[#1857D8] shrink-0" />{shift.staff_name}
            </span>
            <span className="flex items-center gap-1 text-[12px] text-gray-600 dark:text-white/30">
               <BriefcaseBusiness className="w-3 h-3 text-[#03624C] dark:text-[#1857D8] shrink-0" />{shift.shift_type}
            </span>
         </div>
      )
   }

   function toDDMMYYYY(dateStr: string): string {
      if (!dateStr) return "—"
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const dd = String(d.getDate()).padStart(2, "0")
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const yyyy = d.getFullYear()
      return `${dd}/${mm}/${yyyy}`
   }
   const columns = [
      {
         key: "no", header: isKh ? "ល.រ" : "No.",
         render: (_: any, i: number) => (
            <span className="text-[14px] text-gray-600 dark:text-white/25 tabular-nums">
               {String((currentPage - 1) * itemsPerPage + i + 1).padStart(2, "0")}
            </span>
         ),
      },
      {
         key: "order_ref", header: isKh ? "លេខកូដ" : "Order Ref", sortable: true,
         render: (o: Order) => <span className={cn(" text-[14px] tracking-tight", ACCENT.text)}>{o.order_ref}</span>,
      },
      {
         key: "order_type", header: isKh ? "ប្រភេទ" : "Type", sortable: true,
         render: (o: Order) => {
            const b = getOrderBadge(o, isKh)
            return (
               <Badge variant="outline" className={cn("flex items-center gap-1.5 py-0.5 shadow-none uppercase text-[12px] rounded-lg", b.color)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", b.dot)} />{b.icon}{b.label}
               </Badge>
            )
         },
      },
      {
         key: "created_at", header: isKh ? "ថ្ងៃខែ & ម៉ោង" : "Date & Time", sortable: true,
         render: (o: Order) => {
            const { date, time } = formatCambodiaTime(o.created_at || "")
            return (
               <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] text-gray-700 dark:text-white/70">{toDDMMYYYY(date)}</span>
                  <span className="text-[12px] text-gray-600 dark:text-white/30">{time}</span>
               </div>
            )
         },
      },
      {
         key: "working_shift_id", header: isKh ? "បុគ្គលិក & វេន" : "Staff & Shift",
         render: (o: Order) => <ShiftCell order={o} />,
      },
      {
         key: "total", header: isKh ? "សរុប" : "Total", sortable: true,
         render: (o: Order) => (
            <div className="flex flex-col gap-0.5">
               <span className={cn(" text-[14px] tabular-nums", ACCENT.text)}>${Number(o.total).toFixed(2)}</span>
               {((o.discount_amount ?? 0) > 0 || (o.vip_discount_amount ?? 0) > 0) && (
                  <span className="text-[12px] text-emerald-500 flex items-center gap-0.5">
                     <Tag className="w-2.5 h-2.5" />{isKh ? "មានបញ្ចុះ" : "Discounted"}
                  </span>
               )}
            </div>
         ),
      },
      {
         key: "status", header: isKh ? "ស្ថានភាព" : "Status",
         render: (o: Order) => (
            <Badge variant="outline" className="bg-[#03624C]/10 dark:bg-[#1857D8]/25 text-[#03624C] dark:text-white border-[#03624C]/25 dark:border-[#1857D8]/25 text-[12px] uppercase rounded-lg gap-1">
               <CheckCircle2 className="w-3 h-3" />{o.status}
            </Badge>
         ),
      },
      {
         key: "payment_method", header: isKh ? "វិធីសាស្រ្ត" : "Payment",
         render: (o: any) => {
            const method = (o.payment_method || o.payment_type || "").toLowerCase()
            const s = PAYMENT_STYLE[method] ?? DEFAULT_STYLE
            return (
               <span className={`inline-flex items-center gap-1.5 text-[14px] capitalize ${s.label}`}>
                  {getPaymentIcon(method || "card", s.iconColor)}
                  {o.payment_method || o.payment_type || (isKh ? "មិនបានកំណត់" : "Not specified")}
               </span>
            )
         },
      },
      {
         key: "actions", header: isKh ? "សកម្មភាព" : "Action", className: "text-right",
         render: (o: Order) => (
            <div className="flex items-center justify-end gap-1.5">
               <button
                  onClick={() => { setSelectedOrder(o); setShowReceiptDialog(true) }}
                  className="w-[30px] h-[30px] flex items-center justify-center rounded-lg text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-700/40 dark:hover:bg-blue-900/40 dark:hover:border-blue-500 transition-all duration-150"
                  title={isKh ? "មើលវិក្កយបត្រ" : "View Receipt"} >
                  <Eye className="w-3.5 h-3.5" />
               </button>
               <button
                  onClick={() => handlePrint(o)}
                  className="w-[30px] h-[30px] flex items-center justify-center rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700/40 dark:hover:bg-emerald-900/40 dark:hover:border-emerald-500 transition-all duration-150"
                  title={isKh ? "បោះពុម្ព" : "Print"} >
                  <Printer className="w-3.5 h-3.5" />
               </button>
            </div>
         ),
      },
   ]

   const showInitialLoading = loading && orders.length === 0 && shifts.length === 0

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
               title={isKh ? "ប្រវត្តិការទូទាត់" : "Payments History"}
               subtitle={isKh ? "ពិនិត្យរាល់ប្រតិបត្តិការ" : "Review all completed transactions"}
            />
            {showInitialLoading ? (
               <div className="flex-1 flex items-center justify-center flex-col gap-4">
                  <Loader2 className={cn("w-5 h-5 animate-spin", ACCENT.text)} />
                  <span className={cn("text-[12px] font-bold uppercase tracking-[0.2em] animate-pulse", ACCENT.text)}>Loading Payments…</span>
               </div>
            ) : (
               <main className="flex-1 overflow-auto p-5 space-y-4 flex flex-col">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                     <motion.div
                        key="total"
                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        whileHover={{ y: -3, transition: { duration: 0.18 } }} >
                        <Card className="border rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40 bg-white dark:bg-[#22263a] border-white dark:border-[#22263a]">
                           <CardContent className="p-2">
                              <div className="flex items-center justify-between gap-3 mb-4">
                                 <p className={cn("flex items-center gap-1.5 min-w-0 text-[14px] font-bold uppercase", ACCENT.text, "opacity-70")}>
                                    <span className="truncate">{isKh ? "សរុបប្រតិបត្តិការ" : "Total Revenue"}</span>
                                 </p>
                                 <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#03624C]/10 dark:bg-[#1857D8]/20">
                                    <ReceiptText className={cn("w-4 h-4", ACCENT.text)} />
                                 </div>
                              </div>
                              <p className={cn("text-[22px] font-bold text-center leading-none tabular-nums mb-2.5", ACCENT.text)}>
                                 ${totalKpi.amount.toFixed(2)}
                              </p>
                              <div className="flex items-center gap-1.5">
                                 <TrendingUp className={cn("w-3 h-3 shrink-0", ACCENT.text)} />
                                 <p className={cn("text-[14px]", ACCENT.text, "opacity-70")}>{totalKpi.count} {isKh ? "ការបញ្ជា" : "orders"}</p>
                              </div>
                           </CardContent>
                        </Card>
                     </motion.div>
                     {paymentKpi.map(({ method, count, amount, style }, i) => (
                        <motion.div
                           key={method}
                           initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                           transition={{ duration: 0.35, delay: (i + 1) * 0.07 }}
                           whileHover={{ y: -3, transition: { duration: 0.18 } }} >
                           <Card className="border rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40 bg-white dark:bg-[#22263a] border-white dark:border-[#22263a]">
                              <CardContent className="p-2">
                                 <div className="flex items-center justify-between gap-3 mb-4">
                                    <p className={cn("flex items-center gap-1.5 min-w-0 text-[14px] font-bold uppercase", style.label)}>
                                       <span className="truncate">
                                          {method === 'cash' ? (isKh ? 'សាច់ប្រាក់' : 'Cash') :
                                             method === 'card' ? (isKh ? 'កាត' : 'Card') :
                                                (isKh ? 'ទូរស័ព្ទ' : 'Mobile')}
                                       </span>
                                    </p>
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", style.iconBg)}>
                                       {getPaymentIcon(method, style.iconColor)}
                                    </div>
                                 </div>
                                 <p className={cn("text-[22px] font-bold text-center leading-none tabular-nums mb-2.5", style.text)}>
                                    ${amount.toFixed(2)}
                                 </p>
                                 <div className="flex items-center gap-1.5">
                                    <TrendingUp className={cn("w-3 h-3 shrink-0", style.iconColor)} />
                                    <p className={cn("text-[12px] font-medium", style.label)}>{count} {isKh ? "ការបញ្ជា" : "orders"}</p>
                                 </div>
                              </CardContent>
                           </Card>
                        </motion.div>
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
                              placeholder={isKh ? "ស្វែងរក..." : "Search ..."}
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
                              <SelectItem value="dine_in" className={SEL_I}>{isKh ? "បរិភោគក្នុង" : "Dine In"}</SelectItem>
                              <SelectItem value="takeaway" className={SEL_I}>{isKh ? "ខ្ចប់ទៅ" : "Takeaway"}</SelectItem>
                              <SelectItem value="app" className={SEL_I}>App Order</SelectItem>
                           </SelectContent>
                        </Select>
                        <Select value={paymentFilter} onValueChange={v => { setPaymentFilter(v); setCurrentPage(1) }}>
                           <SelectTrigger className={cn(SEL_T, "w-44")}>
                              <CreditCard className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                              <SelectValue placeholder={isKh ? "វិធីទូទាត់" : "Payment"} />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="ALL" className={SEL_I}>{isKh ? "គ្រប់វិធី" : "All Methods"}</SelectItem>
                              {paymentMethods.map(m => (
                                 <SelectItem key={m} value={m} className={SEL_I}><span className="capitalize">{m}</span></SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <DateRangePicker
                           startDate={startDate} endDate={endDate}
                           onStartChange={v => { setStartDate(v); setCurrentPage(1) }}
                           onEndChange={v => { setEndDate(v); setCurrentPage(1) }}
                        />
                        <AnimatePresence>
                           {hasFilter && (
                              <motion.button
                                 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                 onClick={resetFilters}
                                 className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
                              >
                                 <RotateCcw className="w-3.5 h-3.5" />
                              </motion.button>
                           )}
                        </AnimatePresence>
                     </div>
                  </motion.div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.28 }}
                     className="flex-1 overflow-hidden" >
                     <Card className="h-full border-0 shadow-none bg-transparent flex flex-col">
                        <DataTableCustom
                           data={pageData}
                           columns={columns}
                           sortConfig={sortConfig}
                           onSort={k => setSortConfig(prev => ({
                              key: k,
                              direction: prev.key === k && prev.direction === "asc" ? "desc" : "asc",
                           }))}
                           currentPage={currentPage}
                           totalPages={Math.ceil(filteredData.length / itemsPerPage) || 1}
                           onPageChange={setCurrentPage}
                           itemsPerPage={itemsPerPage}
                           totalItems={filteredData.length}
                           language={i18n.language as any}
                        />
                     </Card>
                  </motion.div>
               </main>
            )}
         </div>
         <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
            <DialogContent
               className="max-w-[480px] p-0 border-0 shadow-lg rounded-lg bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden overflow-hidden"
               style={SORA} >
               <DialogTitle className="sr-only">Receipt</DialogTitle>
               <DialogDescription className="sr-only">Receipt detail</DialogDescription>
               <div className="h-1 w-full bg-gradient-to-r from-[#03624C] via-emerald-400 to-[#03624C] dark:from-[#1857D8] dark:via-blue-400 dark:to-[#1857D8]" />
               <div className="px-6 pt-5 pb-4 bg-gray-50 dark:bg-[#22263a] border-b border-gray-100 dark:border-white/[0.07]">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", ACCENT.iconBg)}>
                           <ReceiptText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                           <p className="text-[16px] font-black text-gray-800 dark:text-white/90 leading-tight">
                              {isKh ? "វិក្កយបត្រ" : "Receipt"}
                           </p>
                           <p className={cn("text-[14px] font-mono font-bold leading-tight", ACCENT.text)}>
                              {selectedOrder?.order_ref}
                           </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <button
                           onClick={() => selectedOrder && handlePrint(selectedOrder)}
                           className="h-9 px-4 flex items-center gap-1.5 rounded-xl text-[14px] font-bold text-white transition-all active:scale-[0.97] shadow-md bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                           <Printer className="w-3.5 h-3.5" />
                           {isKh ? "បោះពុម្ព" : "Print"}
                        </button>
                        <button
                           onClick={() => setShowReceiptDialog(false)}
                           className="w-9 h-9 rounded-xl border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/30 hover:bg-gray-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-all text-[14px] font-bold" >
                           ✕
                        </button>
                     </div>
                  </div>
               </div>
               {selectedOrder && (() => {
                  const { date, time } = formatCambodiaTime(selectedOrder.created_at || "")
                  const b = getOrderBadge(selectedOrder, isKh)
                  const shift = selectedOrder.working_shift_id ? shiftMap[selectedOrder.working_shift_id] : null
                  const discountAmt = selectedOrder.discount_amount ?? 0
                  const taxAmt = selectedOrder.tax_amount ?? 0
                  const vipAmt = selectedOrder.vip_discount_amount ?? 0
                  const itemsSubtotal = selectedOrder.items.reduce((s, it) => s + it.price * it.quantity, 0)
                  const itemDiscTotal = selectedOrder.items.reduce((s, it) => {
                     if (it.original_price && it.original_price > it.price)
                        return s + (it.original_price - it.price) * it.quantity
                     return s
                  }, 0)
                  const totalSaved = itemDiscTotal + discountAmt + vipAmt
                  const grossSub = selectedOrder.items.reduce((s, it) => s + (it.original_price ?? it.price) * it.quantity, 0)

                  return (
                     <div className="overflow-auto max-h-[74vh]">
                        <div className="px-6 py-5 space-y-5">
                           <div className="grid grid-cols-3 gap-3">
                              <div className="col-span-2 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-lg p-3">
                                 <p className="text-[12px]  text-gray-600 dark:text-white/25 mb-2">
                                    {isKh ? "ប្រភេទ" : "Order Type"}
                                 </p>
                                 <Badge variant="outline" className={cn("flex items-center gap-1.5 font-semibold py-1 shadow-none uppercase text-[10px] w-fit rounded-lg", b.color)}>
                                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", b.dot)} />{b.icon}{b.label}
                                 </Badge>
                                 {selectedOrder.table_name && (
                                    <p className="text-[14px] text-gray-600 dark:text-white/30 mt-1.5 flex items-center gap-1">
                                       <Package className="w-3 h-3" />{selectedOrder.table_name}
                                    </p>
                                 )}
                              </div>
                              <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-lg p-3 flex flex-col justify-between">
                                 <p className="text-[12px]  text-gray-600 dark:text-white/25 mb-1">
                                    {isKh ? "ថ្ងៃ & ម៉ោង" : "Date & Time"}
                                 </p>
                                 <div>
                                    <p className={cn("text-[14px] font-bold leading-tight", ACCENT.text)}>{date}</p>
                                    <p className="text-[12px] text-gray-600 dark:text-white/30 mt-0.5 flex items-center gap-1">
                                       <Clock className="w-3 h-3" />{time}
                                    </p>
                                 </div>
                              </div>
                           </div>
                           {shift && (
                              <div className={cn("rounded-lg border p-4", ACCENT.border, "bg-[#03624C]/[0.04] dark:bg-[#1857D8]/[0.06]")}>
                                 <p className={cn("text-[12px]  mb-3", ACCENT.text)}>
                                    {isKh ? "បុគ្គលិក / វេនការងារ" : "Staff / Working Shift"}
                                 </p>
                                 <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2.5">
                                       <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", "bg-[#03624C]/10 dark:bg-[#1857D8]/20")}>
                                          {shift.staff_image
                                             ? <img src={shift.staff_image} alt={shift.staff_name} className="w-9 h-9 rounded-xl object-cover" />
                                             : <User className={cn("w-4 h-4", ACCENT.text)} />
                                          }
                                       </div>
                                       <div>
                                          <p className="text-[14px] font-bold text-gray-800 dark:text-white/80 leading-tight">{shift.staff_name}</p>
                                          {shift.staff_position && (
                                             <p className="text-[12px] text-gray-600 dark:text-white/30 leading-tight">{shift.staff_position}</p>
                                          )}
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                       <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", "bg-[#03624C]/10 dark:bg-[#1857D8]/20")}>
                                          <BriefcaseBusiness className={cn("w-4 h-4", ACCENT.text)} />
                                       </div>
                                       <div>
                                          <p className="text-[14px] font-bold text-gray-800 dark:text-white/80 leading-tight">{shift.shift_type}</p>
                                          <p className="text-[12px] text-gray-600 dark:text-white/30 leading-tight">{shift.start_time} – {shift.end_time}</p>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           )}
                           <div>
                              <div className="flex items-center justify-between mb-3">
                                 <p className="text-[12px]  text-gray-600 dark:text-white/25 flex items-center gap-1.5">
                                    <Utensils className="w-3 h-3" />{isKh ? "បញ្ជីម្ហូប" : "Items"} ({selectedOrder.items.length})
                                 </p>
                                 <p className="text-[14px] font-bold text-gray-600 dark:text-white/30">${grossSub.toFixed(2)}</p>
                              </div>
                              <div className="space-y-1.5 max-h-[180px] overflow-auto pr-1">
                                 {selectedOrder.items.map((item, i) => {
                                    const hasDisc = item.original_price && item.original_price > item.price
                                    const discAmt = hasDisc ? (item.original_price! - item.price) * item.quantity : 0
                                    return (
                                       <motion.div
                                          key={i}
                                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: i * 0.04 }}
                                          className="flex items-start justify-between p-3 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-[#22263a] gap-2" >
                                          <div className="flex-1 min-w-0">
                                             <p className="text-[14px] font-semibold text-gray-700 dark:text-white/80 truncate">
                                                {item.name}
                                                <span className={cn("ml-1 font-black", ACCENT.text)}>×{item.quantity}</span>
                                             </p>
                                             {item.discount && (
                                                <p className="text-[12px] text-emerald-500 mt-0.5">
                                                   ↳ {item.discount.name} {item.discount.value_type === "percentage" ? `-${item.discount.value}%` : `-$${item.discount.value}`}
                                                </p>
                                             )}
                                             {hasDisc && (
                                                <p className="text-[12px] text-emerald-500 mt-0.5">↳ saved ${discAmt.toFixed(2)}</p>
                                             )}
                                          </div>
                                          <div className="text-right shrink-0">
                                             {hasDisc && (
                                                <p className="text-[12px] line-through text-gray-600">
                                                   ${((item.original_price ?? item.price) * item.quantity).toFixed(2)}
                                                </p>
                                             )}
                                             <p className={cn("text-[14px] font-black", hasDisc ? "text-emerald-600" : "text-gray-800 dark:text-white/90")}>
                                                ${(item.price * item.quantity).toFixed(2)}
                                             </p>
                                          </div>
                                       </motion.div>
                                    )
                                 })}
                              </div>
                           </div>
                           <div className="bg-gray-50 dark:bg-white/[0.02] rounded-lg border border-gray-100 dark:border-white/[0.06] overflow-hidden">
                              <div className="px-4 py-3 border-b border-gray-100 dark:border-[#22263a]">
                                 <p className="text-[12px]  text-gray-600 dark:text-white/25">
                                    {isKh ? "ការគណនា" : "Pricing Breakdown"}
                                 </p>
                              </div>
                              <div className="px-4 py-3 space-y-2">
                                 <div className="flex justify-between text-[14px]">
                                    <span className="text-gray-500 dark:text-white/40">{isKh ? "តម្លៃម្ហូប" : "Items subtotal"}</span>
                                    <span className="font-semibold text-gray-700 dark:text-white/70">${itemsSubtotal.toFixed(2)}</span>
                                 </div>
                                 {itemDiscTotal > 0 && (
                                    <div className="flex justify-between text-[14px]">
                                       <span className="text-emerald-500 flex items-center gap-1">
                                          <Tag className="w-3 h-3" />{isKh ? "បញ្ចុះតម្លៃទំនិញ" : "Item discounts"}
                                       </span>
                                       <span className="font-semibold text-emerald-500">-${itemDiscTotal.toFixed(2)}</span>
                                    </div>
                                 )}
                                 {discountAmt > 0 && (
                                    <div className="flex justify-between text-[14px]">
                                       <span className="text-amber-500 flex items-center gap-1">
                                          <Percent className="w-3 h-3" />{isKh ? "បញ្ចុះ Checkout" : "Checkout discount"}
                                       </span>
                                       <span className="font-semibold text-amber-500">-${discountAmt.toFixed(2)}</span>
                                    </div>
                                 )}
                                 {taxAmt > 0 && (
                                    <div className="flex justify-between text-[14px]">
                                       <span className="text-blue-500">{isKh ? "ពន្ធ (Tax)" : "Tax"}</span>
                                       <span className="font-semibold text-blue-500">+${taxAmt.toFixed(2)}</span>
                                    </div>
                                 )}
                                 {vipAmt > 0 && (
                                    <div className="flex justify-between text-[14px]">
                                       <span className="text-purple-500 flex items-center gap-1">
                                          <Crown className="w-3 h-3" /> VIP
                                       </span>
                                       <span className="font-semibold text-purple-500">-${vipAmt.toFixed(2)}</span>
                                    </div>
                                 )}
                              </div>
                              <div className={cn("px-4 py-3 flex justify-between items-center border-t border-gray-200 dark:border-white/[0.06]", "bg-[#03624C]/[0.05] dark:bg-[#1857D8]/[0.08]")}>
                                 <span className="text-[14px] font-black text-gray-700 dark:text-white/70">
                                    {isKh ? "សរុបចុងក្រោយ" : "Final Total"}
                                 </span>
                                 <span className={cn("text-[22px] font-black tabular-nums", ACCENT.text)}>
                                    ${Number(selectedOrder.total).toFixed(2)}
                                 </span>
                              </div>
                              {totalSaved > 0 && (
                                 <div className="px-4 py-2 flex justify-between items-center bg-emerald-50 dark:bg-emerald-500/[0.08]">
                                    <span className="text-[14px] font-bold text-emerald-600 flex items-center gap-1">
                                       💰 {isKh ? "សន្សំបាន" : "You saved"}
                                    </span>
                                    <span className="text-[14px] font-black text-emerald-600">${totalSaved.toFixed(2)}</span>
                                 </div>
                              )}
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-lg p-3">
                                 <p className="text-[12px]  text-gray-600 dark:text-white/25 mb-2">
                                    {isKh ? "ស្ថានភាព" : "Status"}
                                 </p>
                                 <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25 text-[10px] font-bold uppercase rounded-lg gap-1">
                                    <CheckCircle2 className="w-3 h-3" />{selectedOrder.status}
                                 </Badge>
                              </div>
                              <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-lg p-3">
                                 <p className="text-[12px]  text-gray-600 dark:text-white/25 mb-2">
                                    {isKh ? "វិធីសាស្រ្ត" : "Payment Method"}
                                 </p>
                                 {(() => {
                                    const method = (selectedOrder.payment_method || "").toLowerCase()
                                    const s = PAYMENT_STYLE[method] ?? DEFAULT_STYLE
                                    return (
                                       <span className={`inline-flex items-center gap-1.5 text-[14px] font-bold capitalize ${s.label}`}>
                                          {getPaymentIcon(method || "card", s.iconColor)}
                                          {selectedOrder.payment_method || (isKh ? "មិនបានកំណត់" : "Not specified")}
                                       </span>
                                    )
                                 })()}
                              </div>
                           </div>
                        </div>
                     </div>
                  )
               })()}
            </DialogContent>
         </Dialog>
      </div>
   )
}