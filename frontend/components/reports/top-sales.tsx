"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { useTranslation } from "react-i18next"

const EASE_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface TopItem {
  name: string
  orders: number
  revenue: number
}

interface TopSellingItemsProps {
  items: TopItem[]
}

export function TopSellingItems({ items }: TopSellingItemsProps) {
  const { i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"
  const maxOrders = Math.max(...items.map((i) => i.orders), 1)

  const rankStyle = (idx: number) =>
    idx === 0
      ? "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
      : "bg-[#03624C]/10 text-[#03624C] dark:bg-[#1857D8]/15 dark:text-[#1857D8]"

  return (
    <div className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none rounded-lg overflow-hidden h-full min-h-[380px] flex flex-col">
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/[0.05] flex justify-between items-center">
        <h3 className="text-[14px] font-extrabold text-gray-800 dark:text-white/60 uppercase tracking-[0.25em]">
          {isKh ? "មុខម្ហូបលក់ដាច់" : "Top Selling Items"}
        </h3>
        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
      </div>

      <div className="flex-1 p-4 flex flex-col justify-evenly gap-3">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.3, ease: EASE_EXPO }}
              whileHover={{ x: 3 }}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-transparent hover:border-gray-200 dark:hover:border-white/[0.08] transition-colors"
            >
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-[14px] font-black shrink-0 ${rankStyle(idx)}`}>
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-gray-900 dark:text-white/85 truncate">{item.name}</p>
                <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/[0.07] mt-2 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#03624C] to-[#3f9a80] dark:from-[#1857D8] dark:to-[#5b8bf0]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.orders / maxOrders) * 100}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: idx * 0.06 + 0.1 }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[14px] font-black text-[#03624C] dark:text-[#1857D8]">${item.revenue.toFixed(2)}</p>
                <p className="text-[14px] text-gray-500 dark:text-white/40">×{item.orders}</p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[14px] text-gray-500 dark:text-white/30">{isKh ? "មិនទាន់មានទិន្នន័យ" : "No sales data yet"}</p>
          </div>
        )}
      </div>
    </div>
  )
}