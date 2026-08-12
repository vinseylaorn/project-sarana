"use client"

import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { Card, CardContent } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useTranslation } from "react-i18next"
import { Wallet } from "lucide-react"

const COLOR_MAP: Record<string, string> = {
  "cash+card":      "#f59e0b",
  "cash+mobile":    "#14b8a6", 
  "mobile+card":    "#ec4899", 
  "cash + card":    "#f59e0b",
  "cash + mobile":  "#14b8a6",
  "mobile + card":  "#ec4899",
  "cash":           "#03624C", 
  "card":           "#1857D8", 
  "mobile":         "#906c2dff", 
  "default":        "#94a3b8",
}

function getColor(name: string): string {
  const key = name.toLowerCase().trim()
  return COLOR_MAP[key] || COLOR_MAP["default"]
}

const SECONDARY_COLORS = [
  "#f59e0b", 
  "#8b5cf6", 
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#6366f1",
  "#10b981",
  "#f97316",
]

const BOX_MIN_H = "min-h-[380px]"
const LEGEND_MAX_H = "max-h-[112px]"

interface PaymentDataPoint {
  name: string
  value: number
}

interface PaymentMethodsChartProps {
  paymentData: PaymentDataPoint[]
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <div
      style={{
        fontFamily: "'Sora', sans-serif",
        background: isDark ? "#1a1d2d" : "#fff",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}`,
        borderRadius: 12,
        padding: "8px 12px",
        pointerEvents: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: d.payload?.color || d.fill || getColor(d.name),
          }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: isDark ? "#fff" : "#1f2937",
            textTransform: "capitalize",
          }} >
          {d.name}
        </span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color: d.payload?.color || d.fill || getColor(d.name) }}>
        {d.value}
        <span style={{ fontSize: 10, color: "#64748b", marginLeft: 4 }}>orders</span>
      </div>
    </div>
  )
}

export function PaymentMethodsChart({ paymentData }: PaymentMethodsChartProps) {
  const { i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  let secondaryIdx = 0
  const colored = paymentData.map((p) => {
    let color = getColor(p.name)
    if (color === COLOR_MAP["default"]) {
      const nameLower = p.name.toLowerCase()
      if (nameLower.includes("cash")) {
        color = isDark ? "#3b82f6" : "#2563eb" 
      } else if (nameLower.includes("card")) {
        color = isDark ? "#22c55e" : "#16a34a" 
      } else if (nameLower.includes("mobile")) {
        color = isDark ? "#6b7280" : "#6b7280" 
      } else {
        color = SECONDARY_COLORS[secondaryIdx % SECONDARY_COLORS.length]
        secondaryIdx++
      }
    }
    return { ...p, color }
  })

  return (
    <Card
      className={`bg-white dark:bg-[#1a1d2d] border border-gray-100 dark:border-white/[0.08] shadow-sm rounded-lg overflow-hidden ${BOX_MIN_H}`} >
      <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex justify-between items-center">
          <h3 className="text-[14px] font-bold text-gray-600 dark:text-white/40 uppercase tracking-[0.2em]">
            {isKh ? "ប្រភេទ​នៃការទូទាត់" : "PAYMENT METHODS"}
          </h3>
          <Wallet className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
        </div>
      </div>
      <CardContent className="">
        {colored.length > 0 ? (
          <>
            <div className="h-[165px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={colored}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive
                    animationBegin={150}
                    animationDuration={700}
                    animationEasing="ease-out" >
                    {colored.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div
              className={`grid grid-cols-2 gap-2 mt-3 pr-1 overflow-y-auto ${LEGEND_MAX_H}
                [&::-webkit-scrollbar]:w-1
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-gray-300
                dark:[&::-webkit-scrollbar-thumb]:bg-white/10
                [&::-webkit-scrollbar-thumb]:rounded-full`} >
              {colored.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] shrink-0" >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }} />
                  <span
                    className="text-[12px] font-bold uppercase flex-1 truncate"
                    style={{ color: p.color }} >
                    {p.name}
                  </span>
                  <span className="text-[12px] font-black text-gray-800 dark:text-white/80">
                    {p.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-28 flex items-center justify-center">
            <p className="text-[12px] text-gray-300 dark:text-white/20">
              {isKh ? "មិនទាន់មានទិន្នន័យ" : "No data"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}