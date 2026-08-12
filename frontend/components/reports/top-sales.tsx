"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

interface OrderTypeCardsProps {
  dineIn:      number
  takeaway:    number
  app:         number
  totalOrders: number
}

const EASE_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1]

const staggerContainer = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

const staggerChild = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_EXPO as any } },
}

export function OrderTypeCards({ dineIn, takeaway, app, totalOrders }: OrderTypeCardsProps) {
  const { i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"

  const items = [
    {
      label: isKh ? "ញាំនៅហាង" : "Dine-in",
      val:   dineIn,
      icon:  "🍽️",
      bar:   "bg-[#03624C] dark:bg-[#1857D8]",
      text:  "text-[#03624C] dark:text-[#1857D8]",
    },
    {
      label: isKh ? "ខ្ចប់ទៅផ្ទះ" : "Takeaway",
      val:   takeaway,
      icon:  "🛍️",
      bar:   "bg-amber-500",
      text:  "text-amber-600 dark:text-amber-400",
    },
    {
      label: "App/Delivery",
      val:   app,
      icon:  "📱",
      bar:   "bg-sky-500",
      text:  "text-sky-600 dark:text-sky-400",
    },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-3 gap-4" >
      {items.map((item) => {
        const pct = totalOrders > 0 ? Math.round((item.val / totalOrders) * 100) : 0
        return (
          <motion.div
            key={item.label}
            variants={staggerChild}
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none rounded-lg p-4 flex flex-col gap-3" >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{item.icon}</span>
                <p className="text-[14px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                  {item.label}
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-[22px] font-black text-gray-800 dark:text-white leading-none">
                  {item.val.toLocaleString()}
                </p>
                <span className="text-[10px] font-bold text-gray-400 dark:text-white/30">
                  {isKh ? "កម្ម៉ង់" : "orders"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", item.bar)}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                />
              </div>
              <span className={cn("text-[11px] font-black shrink-0", item.text)}>
                {pct}%
              </span>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-white/25 font-medium -mt-1">
              {isKh
                ? `នៃការកម្ម៉ង់សរុប ${totalOrders}`
                : `of ${totalOrders} total orders`}
            </p>
          </motion.div>
        )
      })}
    </motion.div>
  )
}


const BOX_MIN_H = "min-h-[380px]"

interface TopItem {
  name:    string
  orders:  number
  revenue: number
}

interface TopSellingItemsProps {
  items: TopItem[]
}

export function TopSellingItems({ items }: TopSellingItemsProps) {
  const { i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"

  return (
    <div className={`bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none rounded-lg overflow-hidden ${BOX_MIN_H}`}>
      <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex justify-between items-center">
          <h3 className="text-[14px] font-bold text-gray-600 dark:text-white/40 uppercase tracking-[0.2em]">
            {isKh ? "មុខម្ហូបលក់ដាច់" : "Top Selling Items"}
          </h3>
          <Star className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
        </div>
      </div>
      <div className="p-4">
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.3, ease: EASE_EXPO }}
                className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-white/[0.03]" >
                <span className="text-[14px] font-black text-[#03624C] dark:text-[#1857D8] w-5 shrink-0">
                  #{idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-gray-800 dark:text-white/80 truncate">
                    {item.name}
                  </p>
                  <div className="h-1 rounded-full bg-gray-200 dark:bg-white/[0.06] mt-0.5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[#03624C] dark:bg-[#1857D8]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.orders / items[0].orders) * 100}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: idx * 0.06 + 0.1 }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-[#03624C] dark:text-[#1857D8]">
                    ${item.revenue.toFixed(2)}
                  </p>
                  <p className="text-[12px] text-gray-400 dark:text-white/40">
                    ×{item.orders}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-[180px] flex items-center justify-center">
            <p className="text-[12px] text-gray-300 dark:text-white/20">
              {isKh ? "មិនទាន់មានទិន្នន័យ" : "No sales data yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}