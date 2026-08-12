// components/vip-card/summary.tsx

"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import {
  CreditCard, CheckCircle2, Calendar,
  AlertTriangle, TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

const STAT_STYLES = {
  total: {
    bg: "bg-white dark:bg-[#22263a]",
    border: "border-white dark:border-[#22263a]",
    text: "text-[#03624C] dark:text-emerald-300",
    label: "text-gray-600 dark:text-gray-200",
    icon: "text-[#03624C] dark:text-emerald-300",
    iconBg: "bg-[#03624C]/10 dark:bg-emerald-400/20",
  },
  active: {
    bg: "bg-white dark:bg-[#22263a]",
    border: "border-white dark:border-[#22263a]",
    text: "text-[#1857D8] dark:text-blue-300",
    label: "text-gray-600 dark:text-gray-200",
    icon: "text-[#1857D8] dark:text-blue-300",
    iconBg: "bg-[#1857D8]/10 dark:bg-blue-400/20",
  },
  expired: {
    bg: "bg-white dark:bg-[#22263a]",
    border: "border-white dark:border-[#22263a]",
    text: "text-amber-600 dark:text-amber-300",
    label: "text-gray-600 dark:text-gray-200",
    icon: "text-amber-500 dark:text-amber-300",
    iconBg: "bg-amber-100 dark:bg-amber-400/20",
  },
  paused: {
    bg: "bg-white dark:bg-[#22263a]",
    border: "border-white dark:border-[#22263a]",
    text: "text-rose-600 dark:text-rose-300",
    label: "text-gray-600 dark:text-gray-200",
    icon: "text-rose-500 dark:text-rose-300",
    iconBg: "bg-rose-100 dark:bg-rose-400/20",
  },
} as const

interface SummaryProps {
  total:   number
  active:  number
  expired: number
  paused:  number
  isKh:    boolean
}

export function VipCardSummary({ total, active, expired, paused, isKh }: SummaryProps) {
  const stats = { total, active, expired, paused }

  const icons = {
    total:   <CreditCard    className="w-4 h-4" />,
    active:  <CheckCircle2  className="w-4 h-4" />,
    expired: <Calendar      className="w-4 h-4" />,
    paused:  <AlertTriangle className="w-4 h-4" />,
  }

  const labels = {
    total:   isKh ? "កាតសរុប"    : "Total Cards",
    active:  isKh ? "កាត Active" : "Active Cards",
    expired: isKh ? "ផុតកំណត់"  : "Expired",
    paused:  isKh ? "កាតផ្អាក"   : "Paused",
  }

  const sublabels = {
    total:   isKh ? "កាត VIP សរុប"     : "All VIP cards",
    active:  isKh ? "កំពុងប្រើ"         : "Currently in use",
    expired: isKh ? "ត្រូវការបន្ត"      : "Need renewal",
    paused:  isKh ? "ផ្អាកបណ្តោះអាសន្ន" : "Temporarily paused",
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
      {(["total", "active", "expired", "paused"] as const).map((key, i) => {
        const s = STAT_STYLES[key]
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            whileHover={{ y: -3, transition: { duration: 0.18 } }} >
            <Card className={cn("border rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40", s.bg, s.border)}>
              <CardContent className="p-2">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className={cn("flex items-center gap-1.5 min-w-0 text-[14px] font-bold uppercase", s.label)}>
                    <span className="truncate">{labels[key]}</span>
                  </p>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", s.iconBg)}>
                    <span className={s.icon}>{icons[key]}</span>
                  </div>
                </div>
                <p className={cn("text-[22px] font-bold text-center leading-none tabular-nums mb-2.5", s.text)}>
                  {stats[key]}
                </p>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className={cn("w-3 h-3 shrink-0", s.icon)} />
                  <p className={cn("text-[14px]", s.label)}>{sublabels[key]}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}