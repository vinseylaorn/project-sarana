"use client"

import { useEffect } from "react"
import { motion, useSpring, useTransform } from "framer-motion"
import type { Variants } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  ArrowUp,
  ArrowDown,
  Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

interface KpiData {
  totalRevenue: number
  totalOrders: number
  avgOrder: number
  totalExpense: number
  revenueChange: number
}

interface KpiCardsProps {
  kpi: KpiData
}

const staggerContainer = (stagger = 0.08): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
    },
  },
})

const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.93,
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
}

function AnimatedNumber({
  value,
  isCurrency = false,
}: {
  value: number
  isCurrency?: boolean
}) {
  const spring = useSpring(0, {
    mass: 1,
    stiffness: 60,
    damping: 15,
  })

  const display = useTransform(spring, (v) =>
    isCurrency
      ? "$" +
      v.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      : Math.floor(v).toLocaleString()
  )

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span>{display}</motion.span>
}

export function KpiCards({ kpi }: KpiCardsProps) {
  const { i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"

  const cards = [
    {
      label: isKh ? "ចំណូលសរុប" : "Total Revenue",
      val: kpi.totalRevenue,
      change: kpi.revenueChange,
      icon: DollarSign,
      color: "#03624C",
      bg: "rgba(3, 98, 76, 0.10)",
      isCur: true,
    },
    {
      label: isKh ? "ការកម្ម៉ង់សរុប" : "Total Orders",
      val: kpi.totalOrders,
      change: 0,
      icon: ShoppingBag,
      color: "#1857D8",
      bg: "rgba(24, 87, 216, 0.10)",
      isCur: false,
    },
    {
      label: isKh ? "មធ្យម/ការកម្ម៉ង់" : "Avg Order",
      val: kpi.avgOrder,
      change: 0,
      icon: TrendingUp,
      color: "#F59E0B",
      bg: "rgba(245, 158, 11, 0.10)",
      isCur: true,
    },
    {
      label: isKh ? "ចំណាយសរុប" : "Total Expense",
      val: kpi.totalExpense,
      change: 0,
      icon: Receipt,
      color: "#F43F5E",
      bg: "rgba(244, 63, 94, 0.10)",
      isCur: true,
    },
  ]

  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4" >
      {cards.map((s, i) => (
        <motion.div
          key={i}
          variants={scaleIn}
          whileHover={{
            y: -3,
            transition: {
              duration: 0.2,
            },
          }} >
          <Card className="bg-white dark:bg-[#1a1d2d] border border-gray-100 dark:border-white/[0.08] shadow-sm rounded-lg overflow-hidden h-full">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[14px] text-gray-600 dark:text-white/30 font-bold uppercase tracking-[0.15em]">
                    {s.label}
                  </p>

                  <p className="text-2xl font-black text-gray-800 dark:text-white leading-none">
                    <AnimatedNumber
                      value={s.val}
                      isCurrency={s.isCur}
                    />
                  </p>
                  {s.change !== 0 && (
                    <div
                      className={cn(
                        "flex items-center gap-1 font-bold text-[12px] mt-1.5",
                        s.change > 0
                          ? "text-emerald-500"
                          : "text-rose-500"
                      )} >
                      {s.change > 0 ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )}
                      <span>
                        {Math.abs(s.change).toFixed(1)}%
                      </span>
                      <span className="text-gray-500 dark:text-white/20 font-medium ml-1 text-[10px]">
                        vs prev
                      </span>
                    </div>
                  )}
                </div>
                <motion.div
                  whileHover={{
                    scale: 1.15,
                    rotate: 8,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                  }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
                  style={{
                    backgroundColor: s.bg,
                  }} >
                  <s.icon
                    className="w-5 h-5"
                    style={{
                      color: s.color,
                    }}
                  />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}