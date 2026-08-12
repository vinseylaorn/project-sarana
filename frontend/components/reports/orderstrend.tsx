"use client"

import { useEffect } from "react"
import { motion, useSpring, useTransform } from "framer-motion"
import type { Variants } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, TrendingUp, ShoppingBag, ArrowUp, ArrowDown, Receipt } from "lucide-react"
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
  show: { transition: { staggerChildren: stagger } },
})

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.93 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
}

function AnimatedNumber({ value, isCurrency = false }: { value: number; isCurrency?: boolean }) {
  const spring = useSpring(0, { mass: 1, stiffness: 60, damping: 15 })
  const display = useTransform(spring, (v) =>
    isCurrency
      ? "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : Math.floor(v).toLocaleString()
  )
  useEffect(() => { spring.set(value) }, [spring, value])
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
      color: "text-[#03624C] dark:text-[#1857D8]",
      bg: "bg-[#03624C]/10 dark:bg-[#1857D8]/10",
      isCur: true,
    },
    {
      label: isKh ? "ការកម្ម៉ង់សរុប" : "Total Orders",
      val: kpi.totalOrders,
      change: 0,
      icon: ShoppingBag,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
      isCur: false,
    },
    {
      label: isKh ? "មធ្យម/ការកម្ម៉ង់" : "Avg Order",
      val: kpi.avgOrder,
      change: 0,
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      isCur: true,
    },
    {
      label: isKh ? "ចំណាយសរុប" : "Total Expense",
      val: kpi.totalExpense,
      change: 0,
      icon: Receipt,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
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
        <motion.div key={i} variants={scaleIn} whileHover={{ y: -3, transition: { duration: 0.2 } }}>
          <Card className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none rounded-lg overflow-hidden h-full">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[14px] text-gray-600 dark:text-white/30 font-bold uppercase tracking-[0.15em]">
                    {s.label}
                  </p>
                  <p className="text-2xl font-black text-gray-800 dark:text-white leading-none">
                    <AnimatedNumber value={s.val} isCurrency={s.isCur} />
                  </p>
                  {s.change !== 0 && (
                    <div className={cn(
                      "flex items-center gap-1 font-bold text-[14px] mt-1.5",
                      s.change > 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {s.change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      <span>{Math.abs(s.change).toFixed(1)}%</span>
                      <span className="text-gray-600 dark:text-white/20 font-medium ml-1 text-[12px]">
                        vs prev
                      </span>
                    </div>
                  )}
                </div>
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className={cn("w-11 h-11 rounded-xl flex items-center justify-center shadow-sm", s.bg)} >
                  <s.icon className={cn("w-5 h-5", s.color)} />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

import { useRef, useState } from "react"
import { Card as TrendCard, CardContent as TrendCardContent, CardHeader as TrendCardHeader, CardTitle as TrendCardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useTheme } from "next-themes"
import type { RevenueTrendPoint } from "@/types"

interface OrdersTrendProps {
  data: RevenueTrendPoint[]
}

function LineTooltip({ active, payload, label, isDark }: any) {
  if (!active || !payload?.length) return null
  const accent = isDark ? "#1857D8" : "#03624C"
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        fontFamily: "'Sora', sans-serif",
        background: isDark ? "#1a1d2e" : "#fff",
        border: isDark ? "1px solid rgba(255,255,255,0.09)" : "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        minWidth: 120,
        pointerEvents: "none",
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.4)" : "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </p>
      <p style={{ fontSize: 20, fontWeight: 900, color: accent, lineHeight: 1 }}>
        {Number(payload[0].value).toLocaleString()} orders
      </p>
    </motion.div>
  )
}

function AnimatedLineChart({ data, isDark }: { data: RevenueTrendPoint[]; isDark: boolean }) {
  const pathRef = useRef<SVGPathElement | null>(null)
  const [length, setLength] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => { setReady(false) }, [data])

  useEffect(() => {
    if (ready) return
    const timer = setTimeout(() => {
      const el = document.querySelector<SVGPathElement>(".recharts-line-curve")
      if (!el) return
      pathRef.current = el
      const total = el.getTotalLength()
      setLength(total)
      el.style.transition = "none"
      el.style.strokeDasharray = `${total}`
      el.style.strokeDashoffset = `${total}`
      setReady(true)
    }, 80)
    return () => clearTimeout(timer)
  }, [data, ready])

  useEffect(() => {
    if (!ready || !pathRef.current) return
    pathRef.current.getBoundingClientRect()
    pathRef.current.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)"
    pathRef.current.style.strokeDashoffset = "0"
  }, [ready, length])

  const accent = isDark ? "#1857D8" : "#03624C"
  const tickFill = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)"

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#ffffff" : "#000000"} strokeOpacity={isDark ? 0.04 : 0.05} />
        <XAxis
          dataKey="label"
          axisLine={false} tickLine={false}
          tick={{ fill: tickFill, fontSize: 11, fontWeight: 700, fontFamily: "'Sora', sans-serif" }}
          dy={8}
        />
        <YAxis
          axisLine={false} tickLine={false}
          tick={{ fill: tickFill, fontSize: 11, fontFamily: "'Sora', sans-serif" }}
          tickFormatter={(v) => `${v}`}
          allowDecimals={false}
        />
        <Tooltip content={(props) => <LineTooltip {...props} isDark={isDark} />} />
        <Line
          type="monotone"
          dataKey="orders"
          stroke={accent}
          strokeWidth={2.5}
          isAnimationActive={false}
          dot={{ fill: isDark ? "#1a1d2e" : "#fff", r: 4, strokeWidth: 2.5, stroke: accent }}
          activeDot={{ r: 6, fill: accent, stroke: isDark ? "#1a1d2e" : "#fff", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function OrdersTrend({ data }: OrdersTrendProps) {
  const { i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const rangeLabel = data.length > 0
    ? `${data[0]?.label} → ${data[data.length - 1]?.label}`
    : "—"

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } }}>
      <TrendCard className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none rounded-lg">
        <TrendCardHeader className="px-5 pt-5 ">
          <TrendCardTitle className="text-[14px] font-bold text-gray-600 dark:text-white/40 uppercase tracking-[0.2em]">
            {isKh ? "ចំនួន Order ៧ ថ្ងៃចុងក្រោយ" : "Orders — Last 7 Days"}
          </TrendCardTitle>
          <p className="text-[13px] text-gray-600 dark:text-white/25 ">{rangeLabel}</p>
        </TrendCardHeader>
        <TrendCardContent className="px-2 pb-4">
          <div className="h-[292px]">
            <AnimatedLineChart data={data} isDark={isDark} />
          </div>
        </TrendCardContent>
      </TrendCard>
    </motion.div>
  )
}