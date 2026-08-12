"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts"
import { useDashboard } from "@/hooks/useDashboard"

const AnimatedBar = (props: any) => {
  const { x, y, width, height, fill, index, animate } = props
  const [currentHeight, setCurrentHeight] = useState(0)
  const [currentY, setCurrentY] = useState(y + height)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!animate) {
      setCurrentHeight(height)
      setCurrentY(y)
      return
    }
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

  return (
    <rect x={x} y={currentY} width={width} height={currentHeight} fill={fill} rx={5} ry={5} />
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-150 bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.09] rounded-xl px-4 py-3 shadow-xl">
        <p className="text-[14px] text-gray-400 dark:text-white/40 mb-1">{label}</p>
        <p className="text-[14px] font-semibold text-[#03624C] dark:text-[#1857D8]">
          ${Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    )
  }
  return null
}

export function RevenueChart() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("week")
  const [animate, setAnimate] = useState(false)
  const [visible, setVisible] = useState(true)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const { revenue, loading } = useDashboard()

  const data = revenue[period] ?? []

  const tickColor  = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)"
  const gridColor  = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"
  const barColorTop    = isDark ? "#1857D8" : "#03624C"
  const barColorBottom = isDark ? "rgba(24,87,216,0.3)" : "rgba(3,98,76,0.3)"

  const handlePeriod = (p: typeof period) => {
    if (p === period) return
    setVisible(false)
    setTimeout(() => {
      setPeriod(p)
      setAnimate(true)
      setVisible(true)
    }, 180)
  }

  useEffect(() => {
    if (!loading) {
      setAnimate(true)
      const t = setTimeout(() => setAnimate(false), 800)
      return () => clearTimeout(t)
    }
  }, [loading])

  return (
    <Card className="bg-white dark:bg-[#1a1d2e] border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none h-full"
      style={{ fontFamily: "var(--font-kantumruy), sans-serif" }}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-5 pt-5">
        <CardTitle className="text-[14px] font-semibold text-gray-700 dark:text-white/80 capitalize">
          {period} Revenue
        </CardTitle>
        <div className="flex gap-1 bg-gray-100 dark:bg-white/[0.04] p-1 rounded-lg border border-gray-200 dark:border-white/[0.06]">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriod(p)}
              className={`relative h-6 px-3 rounded-md text-[14px] font-medium transition-all duration-200 capitalize overflow-hidden ${
                period === p
                  ? "bg-[#03624C]/15 dark:bg-[#1857D8]/20 text-[#03624C] dark:text-[#1857D8] border border-[#03624C]/25 dark:border-[#1857D8]/30 scale-[1.03]"
                  : "text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/55 hover:scale-[1.03]"
              }`}>
              {period === p && (
                <span className="absolute inset-0 rounded-md bg-[#03624C]/5 dark:bg-[#1857D8]/10 animate-in fade-in duration-200" />
              )}
              <span className="relative">
                {p}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="h-[200px] transition-opacity duration-150" style={{ opacity: visible ? 1 : 0 }}>
          {loading ? (
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
              <BarChart data={data} barCategoryGap="35%">
                <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: tickColor, fontSize: 14, fontFamily: "var(--font-kantumruy), sans-serif" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: tickColor, fontSize: 14, fontFamily: "var(--font-kantumruy), sans-serif" }}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  width={40}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", radius: 4 }}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={barColorTop}    stopOpacity={0.85} />
                    <stop offset="100%" stopColor={barColorBottom} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <Bar
                  dataKey="revenue"
                  fill="url(#barGradient)"
                  radius={[5, 5, 0, 0]}
                  shape={(props: any) => <AnimatedBar {...props} animate={animate} />}>
                  {data.map((_, i) => (
                    <Cell key={i} fill="url(#barGradient)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}