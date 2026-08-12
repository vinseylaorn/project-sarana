"use client"

import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { LayoutGrid } from "lucide-react"
import { useTranslation } from "react-i18next"

const CHART_COLORS = ["#1857D8", "#03624C", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899"]
const BOX_MIN_H = "min-h-[380px]"

const LEGEND_MAX_H = "max-h-[110px]"

interface CategoryDataPoint {
  name:     string
  value:    number
  revenue?: number
  count?:   number
}

interface SalesByCategoryChartProps {
  categoryData: CategoryDataPoint[]
}

const staggerContainer = (stagger = 0.05): Variants => ({
  hidden: {},
  show:   { transition: { staggerChildren: stagger } },
})

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      style={{
        fontFamily:    "'Sora', sans-serif",
        background:    "#fff",
        border:        "1px solid #e5e7eb",
        borderRadius:  12,
        padding:       "10px 14px",
        boxShadow:     "0 8px 24px rgba(0,0,0,0.12)",
        minWidth:      140,
        pointerEvents: "none",
      }} >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.payload?.color || d.fill, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{d.name}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color: "#4f46e5", lineHeight: 1 }}>
        {d.payload?.revenue != null ? `$${Number(d.payload.revenue).toFixed(2)}` : `${d.value}%`}
      </div>
      {d.payload?.count != null && (
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3, fontWeight: 600 }}>
          {d.payload.count} orders
        </div>
      )}
    </motion.div>
  )
}

export function SalesByCategoryChart({ categoryData }: SalesByCategoryChartProps) {
   const { i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"

  const colored = categoryData.map((c, i) => ({
    ...c,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  return (
    <Card className={`bg-white dark:bg-[#1a1d2d] border border-gray-100 dark:border-white/[0.08] shadow-sm rounded-lg overflow-hidden ${BOX_MIN_H}`}>
      <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex justify-between items-center">
          <h3 className="text-[14px] font-bold text-gray-600 dark:text-white/40 uppercase tracking-[0.2em]">
            {isKh ? "ការលក់តាមប្រភេទ" : "Sales by Category"}
          </h3>
          <LayoutGrid className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
        </div>
      </div>
      <CardContent className="px-4 pb-5">
        {colored.length > 0 ? (
          <>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={colored}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={75}
                    paddingAngle={6} dataKey="value"
                    stroke="none"
                    isAnimationActive
                    animationBegin={100}
                    animationDuration={700}
                    animationEasing="ease-out" >
                    {colored.map((_: unknown, idx: number) => (
                      <Cell key={idx} fill={colored[idx].color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <motion.div
              variants={staggerContainer(0.05)}
              initial="hidden"
              animate="show"
              className={`flex flex-wrap gap-1.5 mt-3 overflow-y-auto pr-0.5 ${LEGEND_MAX_H}
                [&::-webkit-scrollbar]:w-1
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-gray-300
                dark:[&::-webkit-scrollbar-thumb]:bg-white/10
                [&::-webkit-scrollbar-thumb]:rounded-full`} >
              {colored.map((cat) => (
                <motion.span
                  key={cat.name}
                  variants={fadeUp}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] font-bold shrink-0"
                  style={{
                    backgroundColor: cat.color + "18",
                    color:           cat.color,
                    border:          `1px solid ${cat.color}30`,
                  }} >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                  <span className="opacity-70">{cat.value}%</span>
                </motion.span>
              ))}
            </motion.div>
          </>
        ) : (
          <div className="h-[180px] flex items-center justify-center">
            <p className="text-[14px] text-gray-300 dark:text-white/20">
               {isKh ? "មិនទាន់មានទិន្នន័យ" : "No data yet"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}