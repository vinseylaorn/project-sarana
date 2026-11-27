"use client"

import { useEffect } from "react"
import { motion, useSpring, useTransform } from "framer-motion"
import type { Variants } from "framer-motion"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

interface KpiData {
  totalRevenue: number
  totalOrders: number
  avgOrder: number
  totalExpense: number
  revenueChange: number
  dineIn?: number
  takeaway?: number
  app?: number
}

interface KpiCardsProps {
  kpi: KpiData
  dineIn?: number
  takeaway?: number
  app?: number
  inventory?: Record<string, any> | null   // for the Total Products card
  revenueTrend?: number[]   // sparkline (e.g. revenue per day)
  avgTrend?: number[]       // last 3 values
  expenseTrend?: number[]   // last 6 values
}

const GREEN = "#03624C"
const AMBER = "#d4a72c"
const PURPLE = "#7c6cf0"
const RED = "#d63a3a"

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
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

const pick = (obj: Record<string, any> | null | undefined, keys: string[]) => {
  if (!obj) return 0
  for (const k of keys) if (typeof obj[k] === "number") return obj[k]
  return 0
}

function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null
  const pts = data.map((v, i) => ({ i, v }))
  return (
    <div className="w-[150px] h-[64px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={pts} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="kpiSpark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity={0.28} />
              <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={GREEN} strokeWidth={1.8} fill="url(#kpiSpark)" dot={false} isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function Ring({ parts }: { parts: { v: number; color: string }[] }) {
  const total = parts.reduce((sum, p) => sum + p.v, 0)
  const r = 40
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width="72" height="72" viewBox="0 0 100 100" className="-rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="13" />
      {total > 0 && parts.map((p, i) => {
        if (p.v <= 0) return null
        const len = (p.v / total) * c
        const el = (
          <circle
            key={i} cx="50" cy="50" r={r} fill="none"
            stroke={p.color} strokeWidth="13"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
          />
        )
        offset += len
        return el
      })}
    </svg>
  )
}

function AvgBars({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1.5 h-[64px]">
      {data.map((v, i) => (
        <div key={i} className="relative w-[26px] h-full flex items-end rounded-sm border border-dashed border-gray-300">
          <div className="w-full rounded-sm" style={{ height: `${Math.max((v / max) * 100, 8)}%`, background: GREEN }} />
        </div>
      ))}
    </div>
  )
}

function ExpenseBars({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1.5 h-[64px]">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-[7px] rounded-full"
          style={{
            height: `${Math.max((v / max) * 100, 14)}%`,
            background: i === data.length - 1 ? "#d63a3a" : "#f4c4c4",
          }}
        />
      ))}
    </div>
  )
}

function KpiShell({ label, value, isCur, footer, visual, className }: {
  label: string; value: number; isCur: boolean; footer: React.ReactNode; visual: React.ReactNode; className?: string
}) {
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -2 }}
      className={cn(
        "min-w-0 bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none rounded-lg p-5 flex flex-col justify-between gap-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-extrabold text-gray-800 dark:text-white/60 uppercase tracking-wide whitespace-nowrap">{label}</p>
          <p className="mt-3 text-[30px] font-black text-gray-900 dark:text-white leading-none whitespace-nowrap">
            <AnimatedNumber value={value} isCurrency={isCur} />
          </p>
        </div>
        <div className="shrink-0 min-w-0 overflow-hidden">{visual}</div>
      </div>
      <div className="text-[14px] leading-snug text-gray-500 dark:text-white/40">{footer}</div>
    </motion.div>
  )
}

export function KpiCards({
  kpi, dineIn: dineInProp, takeaway: takeawayProp, app: appProp,
  inventory, revenueTrend = [], avgTrend, expenseTrend,
}: KpiCardsProps) {
  // counts come from the kpi object itself unless passed explicitly
  const dineIn = dineInProp ?? kpi.dineIn
  const takeaway = takeawayProp ?? kpi.takeaway
  const app = appProp ?? kpi.app
  const { i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"
  const up = kpi.revenueChange >= 0

  const avgData = avgTrend && avgTrend.length ? avgTrend : [kpi.avgOrder * 0.45, kpi.avgOrder * 0.7, kpi.avgOrder]
  const expData = expenseTrend && expenseTrend.length ? expenseTrend : [0.4, 0.6, 0.8, 0.55, 0.75, 1].map((x) => x * (kpi.totalExpense || 1))

  const total = pick(inventory, ["totalProducts", "total_products", "total", "totalItems", "total_items"])
  const good = pick(inventory, ["goodStock", "good_stock", "good", "inStock", "in_stock"])
  const low = pick(inventory, ["lowStock", "low_stock", "low"])
  const out = pick(inventory, ["outOfStock", "out_of_stock", "out"])

  const dot = (c: string) => <span className="inline-block w-2.5 h-2.5 rounded-full mr-1" style={{ background: c }} />

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-6 min-[1800px]:grid-cols-5 gap-4">
      <KpiShell
        className="lg:col-span-2 min-[1800px]:col-span-1"
        label={isKh ? "ចំណូលសរុប" : "Total Revenue"}
        value={kpi.totalRevenue}
        isCur
        visual={<Sparkline data={revenueTrend} />}
        footer={
          <span className="flex flex-wrap items-center gap-x-1.5">
            {kpi.revenueChange !== 0 && (
              <span className={cn("flex items-center font-bold", up ? "text-[#03624C]" : "text-rose-500")}>
                {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {Math.abs(kpi.revenueChange).toFixed(1)}%
              </span>
            )}
            {isKh ? "ធៀបនឹងរយៈពេលមុន" : "vs previous period"}
          </span>
        }
      />
      <KpiShell
        className="lg:col-span-2 min-[1800px]:col-span-1"
        label={isKh ? "ការកម្ម៉ង់សរុប" : "Total Orders"}
        value={kpi.totalOrders}
        isCur={false}
        visual={<Ring parts={[{ v: dineIn ?? 0, color: GREEN }, { v: takeaway ?? 0, color: AMBER }, { v: app ?? 0, color: PURPLE }]} />}
        footer={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center">{dot(GREEN)}{isKh ? "ញាំនៅហាង" : "Dine-in"} <b className="ml-1 text-gray-900 dark:text-white">{dineIn ?? "–"}</b></span>
            <span className="flex items-center">{dot(AMBER)}{isKh ? "ខ្ចប់" : "Takeaway"} <b className="ml-1 text-gray-900 dark:text-white">{takeaway ?? "–"}</b></span>
            <span className="flex items-center">{dot(PURPLE)}App <b className="ml-1 text-gray-900 dark:text-white">{app ?? "–"}</b></span>
          </span>
        }
      />
      <KpiShell
        className="lg:col-span-2 min-[1800px]:col-span-1"
        label={isKh ? "មធ្យម/ការកម្ម៉ង់" : "Avg Order"}
        value={kpi.avgOrder}
        isCur
        visual={<AvgBars data={avgData} />}
        footer={isKh ? "ក្នុងមួយការកម្ម៉ង់" : "Per order"}
      />
      <KpiShell
        className="col-span-2 lg:col-span-3 min-[1800px]:col-span-1"
        label={isKh ? "ចំណាយសរុប" : "Total Expense"}
        value={kpi.totalExpense}
        isCur
        visual={<ExpenseBars data={expData} />}
        footer={isKh ? "ចំណាយក្នុងអំឡុងពេលនេះ" : "Spent this period"}
      />
      <KpiShell
        className="col-span-2 lg:col-span-3 min-[1800px]:col-span-1"
        label={isKh ? "ផលិតផលសរុប" : "Total Products"}
        value={total}
        isCur={false}
        visual={<Ring parts={[{ v: good, color: GREEN }, { v: low, color: AMBER }, { v: out, color: RED }]} />}
        footer={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center">{dot(GREEN)}{isKh ? "ល្អ" : "Good"} <b className="ml-1 text-gray-900 dark:text-white">{good}</b></span>
            <span className="flex items-center">{dot(AMBER)}{isKh ? "ទាប" : "Low"} <b className="ml-1 text-gray-900 dark:text-white">{low}</b></span>
            <span className="flex items-center">{dot(RED)}{isKh ? "អស់" : "Out"} <b className="ml-1 text-gray-900 dark:text-white">{out}</b></span>
          </span>
        }
      />
    </motion.div>
  )
}