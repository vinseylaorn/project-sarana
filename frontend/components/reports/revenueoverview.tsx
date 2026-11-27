"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid,
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

const money = (v: number) =>
  "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const compact = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `$${v}`)

function ChartTooltip({ active, payload, label, isDark, accent }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: isDark ? "#0f1220" : "#ffffff",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb"}`,
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: "0 12px 28px rgba(0,0,0,0.14)",
        pointerEvents: "none",
        minWidth: 130,
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.55)" : "#4b5563", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 900, color: accent, lineHeight: 1 }}>{money(Number(payload[0].value))}</p>
    </div>
  )
}

export function RevenueOverview({
  revenueByDay, revenueByWeek, revenueByMonth, startDate = "", endDate = "",
}: RevenueOverviewProps) {
  const { i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const accent = isDark ? "#1857D8" : "#03624C"
  const tick = isDark ? "rgba(255,255,255,0.55)" : "#4b5563"

  const [period, setPeriod] = useState<PeriodType>("weekly")

  const PERIODS: { key: PeriodType; label: string; labelKh: string }[] = [
    { key: "weekly", label: "Weekly", labelKh: "សប្តាហ៍" },
    { key: "monthly", label: "Monthly", labelKh: "ខែ" },
    { key: "yearly", label: "Yearly", labelKh: "ឆ្នាំ" },
  ]

  const data: RevenuePoint[] =
    period === "weekly" ? revenueByDay : period === "monthly" ? revenueByWeek : revenueByMonth

  // Highest value, used to highlight the peak bar
  const max = useMemo(() => Math.max(...data.map((d) => d.revenue), 0), [data])

  const periodLabel = () => {
    if (period === "weekly")
      return startDate || endDate ? `${startDate || "..."} → ${endDate || "..."}` : isKh ? "ច័ន្ទ → អាទិត្យ" : "Mon → Sun"
    if (period === "monthly")
      return startDate || endDate ? `W1–W4 · ${(endDate || startDate || "").slice(0, 7)}` : isKh ? "W1 → W4 (ខែនេះ)" : "W1–W4 (this month)"
    return startDate || endDate ? `${(startDate || "").slice(0, 4)}` : isKh ? "មករា → ធ្នូ" : "Jan → Dec"
  }

  return (
    <Card className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none rounded-lg overflow-hidden h-full">
      <CardHeader className="px-6 pt-6 pb-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-[14px] font-extrabold text-gray-800 dark:text-white/60 uppercase tracking-[0.25em]">
              {isKh ? "ចំណូលតាមពេល" : "Revenue Overview"}
            </CardTitle>
            <p className="text-[14px] text-gray-600 dark:text-white/40 mt-1.5">{periodLabel()}</p>
          </div>
          <div className="inline-flex items-center rounded-lg bg-gray-100 p-0.5 dark:bg-white/[0.05]">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "relative rounded-md px-3 py-1 text-[14px] font-semibold transition-colors",
                  period === p.key
                    ? "text-[#03624C] dark:text-white"
                    : "text-gray-500 hover:text-gray-800 dark:text-white/50 dark:hover:text-white/80"
                )}
              >
                {period === p.key && (
                  <motion.span
                    layoutId="rev-period-pill"
                    className="absolute inset-0 rounded-md bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:bg-white/[0.1] dark:shadow-none"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{isKh ? p.labelKh : p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-5 pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="h-[250px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 16, right: 12, left: 0, bottom: 0 }}
                barCategoryGap="30%"
              >
                <defs>
                  <linearGradient id="revBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={1} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0.35} />
                  </linearGradient>
                  <linearGradient id="revBarSoft" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? "#ffffff" : "#000000"} strokeOpacity={0.07} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: tick, fontSize: 14, fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: tick, fontSize: 14 }} tickFormatter={(v) => compact(v)} width={56} />
                <Tooltip
                  cursor={false}
                  content={(p) => <ChartTooltip {...p} isDark={isDark} accent={accent} />}
                />
                <Bar
                  dataKey="revenue"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={44}
                  animationDuration={700}
                >
                  {data.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.revenue === max && max > 0 ? "url(#revBar)" : "url(#revBarSoft)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}