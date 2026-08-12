"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { BadgePercent, CheckCircle2, Grid3X3, Package, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface Stats {
  total:    number
  active:   number
  category: number
  product:  number
}
const CARD_STYLES = {
  total: {
    bg: "bg-white dark:bg-[#22263a]", border: "border-white dark:border-[#22263a]",
    text: "!text-emerald-600 dark:!text-emerald-400", label: "text-gray-600 dark:text-gray-200",
    icon: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
  },
  active: {
    bg: "bg-white dark:bg-[#22263a]", border: "border-white dark:border-[#22263a]",
    text: "!text-blue-600 dark:!text-blue-400", label: "text-gray-600 dark:text-gray-200",
    icon: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-50 dark:bg-blue-500/10",
  },
  category: {
    bg: "bg-white dark:bg-[#22263a]", border: "border-white dark:border-[#22263a]",
    text: "!text-amber-600 dark:!text-amber-400", label: "text-gray-600 dark:text-gray-200",
    icon: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-50 dark:bg-amber-500/10",
  },
  product: {
    bg: "bg-white dark:bg-[#22263a]", border: "border-white dark:border-[#22263a]",
    text: "!text-violet-600 dark:!text-violet-400", label: "text-gray-600 dark:text-gray-200",
    icon: "text-violet-600 dark:text-violet-400", iconBg: "bg-violet-50 dark:bg-violet-500/10",
  },
} as const

export function DiscountStatsCards({ stats, isKh }: { stats: Stats; isKh: boolean }) {
  const cards = [
    { key: "total"    as const, label: isKh ? "ការបញ្ចុះសរុប" : "Total Discounts", value: stats.total,    icon: <BadgePercent className="w-4 h-4" /> },
    { key: "active"   as const, label: isKh ? "សកម្ម"          : "Active",          value: stats.active,   icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: "category" as const, label: isKh ? "Category"       : "Category",        value: stats.category, icon: <Grid3X3 className="w-4 h-4" /> },
    { key: "product"  as const, label: isKh ? "Product"        : "Product",         value: stats.product,  icon: <Package className="w-4 h-4" /> },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
      {cards.map((card, i) => {
        const st = CARD_STYLES[card.key]
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            whileHover={{ y: -3, transition: { duration: 0.18 } }} >
            <Card className={cn("border rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40", st.bg, st.border)}>
              <CardContent className="p-2">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className={cn("flex items-center gap-1.5 min-w-0 text-[14px] font-bold uppercase", st.label)}>
                    <span className="truncate">{card.label}</span>
                  </p>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", st.iconBg)}>
                    <span className={st.icon}>{card.icon}</span>
                  </div>
                </div>
                <p className={cn("text-[22px] font-bold text-center leading-none tabular-nums mb-2.5", st.text)}>
                  {card.value}
                </p>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className={cn("w-3 h-3 shrink-0", st.icon)} />
                  <p className={cn("text-[14px]", st.label)}>
                    {isKh ? "ការបញ្ចុះ" : "discounts"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}