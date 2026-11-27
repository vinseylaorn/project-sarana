"use client"

import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { fmt, formatCambodiaTime } from "./types"
import type { Order } from "@/types"

interface Props { orders: Order[]; isKh: boolean }

const LIMIT = 5

export function TransactionsTable({ orders, isKh }: Props) {
   const { resolvedTheme } = useTheme()
   const isDark = resolvedTheme === "dark"
   const rows = orders.slice(0, LIMIT)

   const accentText = isDark ? "text-[#4d80e8]" : "text-[#03624C]"
   const accentBadge = isDark ? "bg-[#1857D8]/10 text-[#4d80e8]" : "bg-[#03624C]/[0.08] text-[#03624C]"
   const accentBadge2 = isDark ? "bg-[#1857D8]/10 text-[#4d80e8]" : "bg-[#03624C]/10 text-[#03624C]"

   return (
      <div className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none rounded-lg overflow-hidden"
         style={{ fontFamily: "'Sora', sans-serif" }}>
         <div className="px-5 pt-5 pb-3 border-b border-gray-50 dark:border-white/[0.05]">
            <div className="flex items-center justify-between">
               <h3 className="text-[14px] text-gray-600 dark:text-white/40 uppercase tracking-[0.2em]">
                  {isKh ? "ប្រតិបត្តិការថ្មីៗ" : "Recent Transactions"}
               </h3>
               <span className={`text-[14px] px-2 py-0.5 rounded-sm ${accentBadge2}`}>
                  {orders.length} {isKh ? "ទំហំ" : "total"}
               </span>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-gray-50 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.02]">
                     {[isKh ? "ល.រ" : "#", isKh ? "លេខកូដ" : "Order Ref", isKh ? "ប្រភេទ" : "Type", isKh ? "តុ" : "Table", isKh ? "ពេលវេលា" : "Date", isKh ? "ទូទាត់" : "Method", isKh ? "សរុប" : "Amount"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-[14px] uppercase tracking-[0.15em] text-gray-600 dark:text-white/25">{h}</th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {rows.map((o, i) => {
                     const { date, time } = formatCambodiaTime(o.created_at ?? "")
                     return (
                        <motion.tr key={o.order_ref}
                           initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: i * 0.04 }}
                           className="border-b border-gray-50 dark:border-white/[0.04] hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                           <td className="px-4 py-3 text-[14px] text-gray-400 dark:text-white/25 font-medium">{i + 1}</td>
                           <td className={`px-4 py-3 font-mono text-[14px] font-semibold ${accentText}`}>#{o.order_ref}</td>
                           <td className="px-4 py-3">
                              <span className={`text-[12px] px-2 py-0.5 rounded-md uppercase ${accentBadge}`}>
                                 {o.order_type === "takeaway" ? (isKh ? "ខ្ចប់" : "Takeaway") : o.order_type === "app" ? "App" : (isKh ? "តុ" : "Dine-in")}
                              </span>
                           </td>
                           <td className="px-4 py-3 text-[14px] font-medium text-gray-600 dark:text-white/60">{o.table_name ?? "-"}</td>
                           <td className="px-4 py-3 text-[14px] text-gray-500 dark:text-white/40">
                              <div className="flex flex-col gap-0.5">
                                 <span className="text-[14px] text-gray-700 dark:text-white/70">{date}</span>
                                 <span className="text-[12px] text-gray-400 dark:text-white/30">{time}</span>
                              </div>
                           </td>
                           <td className="px-4 py-3">
                              <span className="text-[12px] uppercase px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-white/40">
                                 {o.payment_method ?? "-"}
                              </span>
                           </td>
                           <td className={`px-4 py-3 text-[14px] ${accentText}`}>${Number(o.total).toFixed(2)}</td>
                        </motion.tr>
                     )
                  })}
                  {rows.length === 0 && (
                     <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-[14px] text-gray-300 dark:text-white/20">
                           {isKh ? "មិនទាន់មានទិន្នន័យ" : "No transactions found"}
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
   )
}