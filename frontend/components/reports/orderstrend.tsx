"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceDot,
} from "recharts"
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next"
import type { RevenueTrendPoint } from "@/types"

interface OrdersTrendProps {
  data: RevenueTrendPoint[]
}

function TrendTooltip({ active, payload, label, isDark, accent }: any) {
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
        minWidth: 120,
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.55)" : "#4b5563", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 900, color: accent, lineHeight: 1 }}>
        {Number(payload[0].value).toLocaleString()} <span style={{ fontSize: 14, fontWeight: 600 }}>orders</span>
      </p>
    </div>
  )
}

export function OrdersTrend({ data }: OrdersTrendProps) {
  const { i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const accent = isDark ? "#1857D8" : "#03624C"
  const tick = isDark ? "rgba(255,255,255,0.55)" : "#4b5563"
  const surface = isDark ? "#1a1d2e" : "#ffffff"

  const rangeLabel = data.length > 0 ? `${data[0]?.label} → ${data[data.length - 1]?.label}` : "—"

  // Still needed by the chart: marks the peak point
  const { peak, peakIndex } = useMemo(() => {
    const peak = Math.max(...data.map((d) => d.orders), 0)
    return { peak, peakIndex: data.findIndex((d) => d.orders === peak) }
  }, [data])

  return (
    <Card className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none rounded-lg overflow-hidden h-full">
      <CardHeader className="px-6 pt-6 pb-2">
        <CardTitle className="text-[14px] font-extrabold text-gray-800 dark:text-white/60 uppercase tracking-[0.25em]">
          {isKh ? "ចំនួន Order ៧ ថ្ងៃចុងក្រោយ" : "Orders — Last 7 Days"}
        </CardTitle>
        <p className="text-[14px] text-gray-600 dark:text-white/40 mt-1.5">{rangeLabel}</p>
      </CardHeader>

      <CardContent className="px-3 pb-5 pt-2">
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ordersArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? "#ffffff" : "#000000"} strokeOpacity={0.07} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: tick, fontSize: 14, fontWeight: 600 }} dy={8} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: tick, fontSize: 14 }} width={36} />
              <Tooltip
                cursor={{ stroke: accent, strokeOpacity: 0.3, strokeDasharray: "4 4" }}
                content={(p) => <TrendTooltip {...p} isDark={isDark} accent={accent} />}
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke={accent}
                strokeWidth={3}
                fill="url(#ordersArea)"
                dot={{ r: 4, fill: surface, stroke: accent, strokeWidth: 2.5 }}
                activeDot={{ r: 7, fill: accent, stroke: surface, strokeWidth: 3 }}
                animationDuration={900}
              />
              {peak > 0 && peakIndex >= 0 && (
                <ReferenceDot
                  x={data[peakIndex].label}
                  y={peak}
                  r={8}
                  fill={accent}
                  stroke={surface}
                  strokeWidth={3}
                  label={{ value: String(peak), position: "top", fill: accent, fontSize: 14, fontWeight: 800 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}