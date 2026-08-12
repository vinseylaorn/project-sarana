"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion"
import type { Variants } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, Bar, Cell,
} from "recharts"
import { cn } from "@/lib/utils"
import type { RevenuePoint } from "@/types"
import { useTranslation } from "react-i18next"
import { useTheme } from "next-themes"

type PeriodType = "weekly" | "monthly" | "yearly"

interface RevenueOverviewProps {
  revenueByDay: RevenuePoint[]
  revenueByWeek: RevenuePoint[]
  revenueByMonth: RevenuePoint[]
  startDate?: string
  endDate?: string
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
}

function AnimatedValue({ value }: { value: number }) {
  const spring = useSpring(0, { mass: 1, stiffness: 50, damping: 14 })
  const display = useTransform(spring, (v) =>
    "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  )
  useEffect(() => { spring.set(value) }, [spring, value])
  return <motion.span>{display}</motion.span>
}

function AnimatedBar(props: any) {
  const { x, y, width, height, fill, index } = props
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), index * 55)
    return () => clearTimeout(t)
  }, [index])

  if (!height || height <= 0) return null

  return (
    <motion.rect
      x={x} width={width} rx={6} ry={6} fill={fill}
      initial={{ y: y + height, height: 0, opacity: 0 }}
      animate={ready ? { y, height, opacity: 1 } : { y: y + height, height: 0, opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.34, 1.26, 0.64, 1] }}
    />
  )
}

function SummaryStats({ data, isDark }: { data: RevenuePoint[]; isDark: boolean }) {
  const total = data.reduce((s, d) => s + d.revenue, 0)
  const max = Math.max(...data.map((d) => d.revenue), 0)
  const maxDay = data.find((d) => d.revenue === max)?.label ?? "—"

  return (
    <div className="flex items-center gap-4 px-1 mb-2">
      <div>
        <p className="text-[13px] font-bold uppercase tracking-widest text-gray-600 dark:text-white/25">Total</p>
        <p className="text-[15px] font-black text-gray-800 dark:text-white leading-none">
          <AnimatedValue value={total} />
        </p>
      </div>
      <div className="w-px h-6 bg-gray-100 dark:bg-white/[0.08]" />
      <div>
        <p className="text-[13px] font-bold uppercase tracking-widest text-gray-600 dark:text-white/25">Peak</p>
        <p className="text-[15px] font-black leading-none" style={{ color: isDark ? "#1857D8" : "#03624C" }}>
          <AnimatedValue value={max} />
          <span className="text-[13px] text-gray-600 dark:text-white/30 font-semibold ml-1">{maxDay}</span>
        </p>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label, isDark }: any) {
  if (!active || !payload?.length) return null
  const accent = isDark ? "#1857D8" : "#03624C"
  const hint = isDark ? "rgba(24,87,216,0.4)" : "rgba(3,98,76,0.35)"
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        fontFamily: "'Sora', sans-serif",
        background: isDark ? "#1a1d2e" : "#fff",
        border: isDark ? "1px solid rgba(255,255,255,0.09)" : "1px solid #e5e7eb",
        borderRadius: 14,
        padding: "12px 16px",
        boxShadow: `0 12px 32px ${isDark ? "rgba(24,87,216,0.15)" : "rgba(3,98,76,0.12)"}`,
        minWidth: 130,
        pointerEvents: "none",
      }} >
      <p style={{ fontSize: 10, fontWeight: 800, color: hint, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.12em" }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 900, color: accent, lineHeight: 1 }}>
        ${Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <p style={{ fontSize: 10, color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af", marginTop: 4, fontWeight: 600 }}>revenue</p>
    </motion.div>
  )
}

export function RevenueOverview({
  revenueByDay,
  revenueByWeek,
  revenueByMonth,
  startDate = "",
  endDate = "",
}: RevenueOverviewProps) {
  const { i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const barNormalTop = isDark ? "#1857D8" : "#03624C"
  const barNormalBottom = isDark ? "rgba(24,87,216,0.3)" : "rgba(3,98,76,0.3)"
  const barHoverTop = isDark ? "#1d4ed8" : "#065f46"
  const barHoverBottom = isDark ? "rgba(29,78,216,0.5)" : "rgba(6,95,70,0.5)"
  const cursorFill = isDark ? "rgba(24,87,216,0.04)" : "rgba(3,98,76,0.04)"

  const [period, setPeriod] = useState<PeriodType>("weekly")
  const [animKey, setAnimKey] = useState(0)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const PERIODS: { key: PeriodType; label: string; labelKh: string }[] = [
    { key: "weekly", label: "Weekly", labelKh: "សប្តាហ៍" },
    { key: "monthly", label: "Monthly", labelKh: "ខែ" },
    { key: "yearly", label: "Yearly", labelKh: "ឆ្នាំ" },
  ]

  const revenueChartData: RevenuePoint[] =
    period === "weekly" ? revenueByDay :
      period === "monthly" ? revenueByWeek :
        revenueByMonth

  const handlePeriod = (p: PeriodType) => {
    setPeriod(p); setAnimKey((k) => k + 1); setHoveredIdx(null)
  }

  const periodLabel = () => {
    if (period === "weekly")
      return startDate || endDate ? `${startDate || "..."} → ${endDate || "..."}` : isKh ? "ច័ន្ទ → អាទិត្យ" : "Mon → Sun"
    if (period === "monthly")
      return startDate || endDate ? `W1–W4 · ${(endDate || startDate || "").slice(0, 7)}` : isKh ? "W1 → W4 (ខែនេះ)" : "W1–W4 (this month)"
    return startDate || endDate ? `${(startDate || "").slice(0, 4)}` : isKh ? "មករា → ធ្នូ" : "Jan → Dec"
  }

  return (
    <motion.div variants={fadeUp}>
      <Card className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none rounded-lg overflow-hidden">
        <CardHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-[14px] font-bold text-gray-600 dark:text-white/40 uppercase tracking-[0.2em]">
                {isKh ? "ចំណូលតាមពេល" : "Revenue Overview"}
              </CardTitle>
              <p className="text-[13px] text-gray-600 dark:text-white/25 mt-0.5">{periodLabel()}</p>
            </div>
            <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-white/[0.04] p-0.5 rounded-lg border border-gray-200 dark:border-white/[0.06]">
              {PERIODS.map((p) => (
                <motion.button
                  key={p.key}
                  whileTap={{ scale: 0.91 }}
                  onClick={() => handlePeriod(p.key)}
                  className={cn(
                    "relative px-3 py-1 text-[12px] font-bold rounded-md uppercase tracking-widest transition-colors duration-150",
                    period === p.key
                      ? "text-[#03624C] dark:text-[#1857D8]"
                      : "text-gray-600 dark:text-white/35 hover:text-gray-600 dark:hover:text-white/60"
                  )} >
                  {period === p.key && (
                    <motion.span
                      layoutId="period-pill"
                      className="absolute inset-0 bg-white dark:bg-white/[0.08] rounded-md shadow-sm"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{isKh ? p.labelKh : p.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <SummaryStats data={revenueChartData} isDark={isDark} />
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${period}-wrapper`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="h-[220px]" >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  key={animKey}
                  data={revenueChartData}
                  barCategoryGap="38%"
                  onMouseLeave={() => setHoveredIdx(null)} >
                  <defs>
                    <linearGradient id="barGradNormal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={barNormalTop} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={barNormalBottom} stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={barHoverTop} stopOpacity={1} />
                      <stop offset="100%" stopColor={barHoverBottom} stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#ffffff" : "#000000"} strokeOpacity={isDark ? 0.04 : 0.05} />
                  <XAxis
                    dataKey="label"
                    axisLine={false} tickLine={false}
                    tick={{ fill: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)", fontSize: 11, fontWeight: 700, fontFamily: "'Sora', sans-serif" }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false} tickLine={false}
                    tick={{ fill: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)", fontSize: 11, fontFamily: "'Sora', sans-serif" }}
                    tickFormatter={(v) => `$${v}`}
                    width={52}
                  />
                  <Tooltip
                    content={(props) => <CustomTooltip {...props} isDark={isDark} />}
                    cursor={{ fill: cursorFill, radius: 8 }} />
                  <Bar
                    dataKey="revenue"
                    radius={[7, 7, 0, 0]}
                    barSize={28}
                    isAnimationActive={false}
                    shape={(props: any) => (
                      <AnimatedBar
                        {...props}
                        index={props.index}
                        fill={hoveredIdx === props.index ? "url(#barGradHover)" : "url(#barGradNormal)"}
                      />
                    )}
                    onMouseEnter={(_: any, index: number) => setHoveredIdx(index)} >
                    {revenueChartData.map((_: unknown, idx: number) => (
                      <Cell key={idx} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}