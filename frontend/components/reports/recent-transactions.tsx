"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Receipt, Inbox } from "lucide-react"
import { formatCambodiaTime } from "@/lib/utils/time"
import { useTranslation } from "react-i18next"
import type { Order } from "@/types"

interface RecentTransactionsProps {
  recent: Order[]
  totalOrders: number
}

const LIMIT = 5

const BRAND = "text-[#03624C] dark:text-[#1857D8]"
const BRAND_SOFT = "bg-[#03624C]/10 dark:bg-[#1857D8]/15"

type OrderTypeKey = "dinein" | "takeaway" | "app"

const TYPE_STYLE: Record<OrderTypeKey, string> = {
  dinein: `${BRAND_SOFT} ${BRAND}`,
  takeaway: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  app: "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
}

function resolveType(raw: string): OrderTypeKey {
  const v = raw?.toLowerCase().replace(/[\s_-]/g, "")
  if (v === "takeaway") return "takeaway"
  if (v === "app") return "app"
  return "dinein"
}

export function RecentTransactions({ recent, totalOrders }: RecentTransactionsProps) {
  const { i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"

  const typeLabel: Record<OrderTypeKey, string> = {
    dinein: isKh ? "ញាំនៅហាង" : "Dine-in",
    takeaway: isKh ? "ខ្ចប់" : "Takeaway",
    app: "App",
  }

  const headers: { label: string; right?: boolean; hideOnMobile?: boolean }[] = [
    { label: isKh ? "ការកម្ម៉ង់" : "Order" },
    { label: isKh ? "ពេលវេលា" : "Date", hideOnMobile: true },
    { label: isKh ? "ប្រភេទ" : "Type" },
    { label: isKh ? "តុ" : "Table", hideOnMobile: true },
    { label: isKh ? "ទូទាត់" : "Payment", hideOnMobile: true },
    { label: isKh ? "សរុប" : "Amount", right: true },
  ]

  const rows = recent.slice(0, LIMIT)

  return (
    <Card className="gap-0 overflow-hidden rounded-lg py-0 border border-gray-200 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#1a1d2e] dark:shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${BRAND_SOFT}`}>
            <Receipt className={`h-5 w-5 ${BRAND}`} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold leading-tight text-gray-900 dark:text-white">
              {isKh ? "ប្រតិបត្តិការថ្មីៗ" : "Recent transactions"}
            </h3>
            <p className="mt-0.5 text-[14px] text-gray-500 dark:text-white/40">
              {isKh ? `ការកម្ម៉ង់ចុងក្រោយ ${LIMIT}` : `Latest ${LIMIT} orders`}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-3.5 py-1.5 text-[14px] font-semibold ${BRAND_SOFT} ${BRAND}`}>
          {totalOrders.toLocaleString()} {isKh ? "សរុប" : "total"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/[0.05]">
              {headers.map((h) => (
                <th
                  key={h.label}
                  className={[
                    "px-6 py-3.5 text-[14px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-white/40",
                    h.right ? "text-right" : "",
                    h.hideOnMobile ? "hidden sm:table-cell" : "",
                  ].join(" ")}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
            {rows.map((o, i) => {
              const { date, time } = formatCambodiaTime(o.created_at ?? "")
              const type = resolveType(o.order_type)

              return (
                <motion.tr
                  key={o.order_ref}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-6 py-4">
                    <p className={`text-[14px] font-bold ${BRAND}`}>#{o.order_ref}</p>
                    <p className="mt-0.5 text-[13px] text-gray-500 dark:text-white/40 sm:hidden">
                      {date} · {time}
                    </p>
                  </td>

                  {/* Date · time */}
                  <td className="hidden whitespace-nowrap px-6 py-4 text-[14px] text-gray-700 dark:text-white/70 sm:table-cell">
                    {date} <span className="text-gray-400 dark:text-white/30">·</span> {time}
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-md px-2.5 py-1 text-[14px] font-semibold ${TYPE_STYLE[type]}`}
                    >
                      {typeLabel[type]}
                    </span>
                  </td>

                  {/* Table */}
                  <td className="hidden px-6 py-4 text-[14px] text-gray-700 dark:text-white/70 sm:table-cell">
                    {o.table_name ?? <span className="text-gray-300 dark:text-white/20">—</span>}
                  </td>

                  {/* Payment method */}
                  <td className="hidden px-6 py-4 sm:table-cell">
                    {o.payment_method ? (
                      <span className="inline-flex items-center gap-2 text-[14px] font-medium capitalize text-gray-700 dark:text-white/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-white/30" />
                        {o.payment_method}
                      </span>
                    ) : (
                      <span className="text-gray-300 dark:text-white/20">—</span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className={`px-6 py-4 text-right text-[18px] font-bold tabular-nums ${BRAND}`}>
                    ${Number(o.total).toFixed(2)}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 dark:bg-white/[0.05]">
              <Inbox className="h-5 w-5 text-gray-400 dark:text-white/30" />
            </div>
            <p className="text-[15px] font-medium text-gray-700 dark:text-white/70">
              {isKh ? "មិនទាន់មានប្រតិបត្តិការ" : "No transactions yet"}
            </p>
            <p className="text-[14px] text-gray-500 dark:text-white/40">
              {isKh ? "ការកម្ម៉ង់ថ្មីនឹងបង្ហាញនៅទីនេះ" : "New orders will appear here."}
            </p>
          </div>
        )}
      </div>
      <div className="border-t border-gray-100 px-6 py-4 text-[14px] text-gray-500 dark:border-white/[0.05] dark:text-white/40">
        {isKh ? "បង្ហាញ" : "Showing"}{" "}
        <b className="font-semibold text-gray-800 dark:text-white/80">{rows.length}</b>{" "}
        {isKh ? "ក្នុងចំណោម" : "of"}{" "}
        <b className="font-semibold text-gray-800 dark:text-white/80">{totalOrders.toLocaleString()}</b>
      </div>
    </Card>
  )
}