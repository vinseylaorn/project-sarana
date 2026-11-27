"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, Bar, Cell,
} from "recharts"
import { cn } from "@/lib/utils"
import { SORA } from "./types"

type Period = "week" | "month" | "year"

interface Props {
  data: Record<Period, { label: string; revenue: number }[]>
  loading: boolean
  isKh: boolean
}

const LABELS = {
  en: {
    week: "Weekly", month: "Monthly", year: "Yearly",
    btn: { week: "week", month: "month", year: "year" }
  },
  kh: {
    week: "ប្រចាំសប្តាហ៍", month: "ប្រចាំខែ", year: "ប្រចាំឆ្នាំ",
    btn: { week: "សប្តាហ៍", month: "ខែ", year: "ឆ្នាំ" }
  },
}

const AnimatedBar = (props: any) => {
  const { x, y, width, height, fill, index, animate } = props
  const [currentHeight, setCurrentHeight] = useState(0)
  const [currentY, setCurrentY] = useState(y + height)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!animate) { setCurrentHeight(height); setCurrentY(y); return }
    const delay = index * 60
    let start: number | null = null
    const duration = 520

    const step = (timestamp: number) => {
      if (!start) start = timestamp + delay
      if (timestamp < start) { rafRef.current = requestAnimationFrame(step); return }
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrentHeight(height * eased)
      setCurrentY(y + height * (1 - eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [height, y, index, animate])

  return <rect x={x} y={currentY} width={width} height={currentHeight} fill={fill} rx={5} ry={5} />
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="animate-in fade-in zoom-in-95 duration-150 bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.09] rounded-xl px-4 py-3 shadow-xl"
      style={SORA}
    >
      <p className="text-[11px] text-gray-400 dark:text-white/40 mb-1">{label}</p>
      <p className="text-[15px] font-semibold text-[#03624C] dark:text-[#1857D8]">
        ${Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  )
}

export function RevenueChart({ data, loading, isKh }: Props) {
  const [period, setPeriod] = useState<Period>("week")
  const [animate, setAnimate] = useState(false)
  const [visible, setVisible] = useState(true)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const t = isKh ? LABELS.kh : LABELS.en
  const chartData = data[period] ?? []

  const tickColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)"
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"
  const barColorTop = isDark ? "#1857D8" : "#03624C"
  const barColorBottom = isDark ? "rgba(24,87,216,0.3)" : "rgba(3,98,76,0.3)"

  const handlePeriod = (p: Period) => {
    if (p === period) return
    setVisible(false)
    setTimeout(() => { setPeriod(p); setAnimate(true); setVisible(true) }, 180)
  }

  useEffect(() => {
    if (!loading) {
      setAnimate(true)
      const timer = setTimeout(() => setAnimate(false), 800)
      return () => clearTimeout(timer)
    }
  }, [loading])

  return (
    <Card
      className="flex h-full flex-col gap-0 py-0 bg-white dark:bg-[#1a1d2e] border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none rounded-lg overflow-hidden"
      style={SORA} >
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-5 pt-5">
        <CardTitle className="text-[16px] font-semibold text-gray-700 dark:text-white/80 capitalize">
          {t[period]} {isKh ? "ចំណូល" : "Revenue"}
        </CardTitle>
        <div className="flex gap-1 bg-gray-100 dark:bg-white/[0.04] p-1 rounded-lg border border-gray-200 dark:border-white/[0.06]">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriod(p)}
              className={cn(
                "relative h-6 px-3 rounded-md text-[14px] font-medium transition-all duration-200 capitalize overflow-hidden",
                period === p
                  ? "bg-[#03624C]/15 dark:bg-[#1857D8]/20 text-[#03624C] dark:text-[#1857D8] border border-[#03624C]/25 dark:border-[#1857D8]/30 scale-[1.03]"
                  : "text-gray-600 dark:text-white/30 hover:text-gray-800 dark:hover:text-white/55 hover:scale-[1.03]"
              )} >
              {period === p && (
                <span className="absolute inset-0 rounded-md bg-[#03624C]/5 dark:bg-[#1857D8]/10 animate-in fade-in duration-200" />
              )}
              <span className="relative">{isKh ? t.btn[p] : p}</span>
            </button>
          ))}
        </div>
      </CardHeader>

      {/* Chart area grows to fill whatever height the card is given */}
      <CardContent className="flex flex-1 flex-col px-5 pb-5">
        <div
          className="relative min-h-[220px] flex-1 transition-opacity duration-150"
          style={{ opacity: visible ? 1 : 0 }}
        >
          <div className="absolute inset-0">
            {loading || !chartData.length ? (
              <div className="h-full flex items-end gap-2 px-2 pb-4 animate-pulse">
                {[60, 40, 80, 55, 90, 70, 50].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded bg-gray-100 dark:bg-white/[0.06]"
                    style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="35%">
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={barColorTop} stopOpacity={0.85} />
                      <stop offset="100%" stopColor={barColorBottom} stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: tickColor, fontSize: 11, fontFamily: "'Sora', sans-serif" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    tick={{ fill: tickColor, fontSize: 11, fontFamily: "'Sora', sans-serif" }}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", radius: 4 }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="url(#barGradient)"
                    radius={[5, 5, 0, 0]}
                    shape={(props: any) => <AnimatedBar {...props} animate={animate} />}
                  >
                    {chartData.map((_, i) => <Cell key={i} fill="url(#barGradient)" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}