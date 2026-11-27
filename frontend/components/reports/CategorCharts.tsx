"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { LayoutGrid } from "lucide-react"
import { useTranslation } from "react-i18next"

// dark green, blue, sage, lavender, amber, violet, red, cyan
const CHART_COLORS = ["#265f4b", "#2b4fd1", "#7a9f8a", "#7b8de0", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"]

interface CategoryDataPoint {
  name: string
  value: number // percent
  revenue?: number
  count?: number
}

interface Props {
  categoryData: CategoryDataPoint[]
  total?: number // number in the middle; defaults to sum of counts
}

export function SalesByCategoryChart({ categoryData, total }: Props) {
  const { i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"
  const [active, setActive] = useState<number | null>(null)

  const colored = categoryData.map((c, i) => ({ ...c, color: CHART_COLORS[i % CHART_COLORS.length] }))
  const center = total ?? categoryData.reduce((s, c) => s + (c.count ?? 0), 0)
  const a = active !== null ? colored[active] : null

  return (
    <Card className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none rounded-lg overflow-hidden h-full min-h-[380px] flex flex-col">
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/[0.05] flex justify-between items-center">
        <h3 className="text-[14px] font-extrabold text-gray-800 dark:text-white/60 uppercase tracking-[0.25em]">
          {isKh ? "ការលក់តាមប្រភេទ" : "Sales by Category"}
        </h3>
        <LayoutGrid className="w-4 h-4 text-amber-500 fill-amber-500" />
      </div>

      <CardContent className="px-5 pt-6 pb-5 flex-1 flex flex-col justify-between gap-6">
        {colored.length > 0 ? (
          <>
            {/* donut */}
            <div
              className="relative h-[220px] [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none [&_.recharts-sector]:!outline-none [&_*]:focus:!outline-none"
              onMouseLeave={() => setActive(null)}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart accessibilityLayer={false} tabIndex={-1 as any}>
                  <Pie
                    data={colored}
                    dataKey="value"
                    cx="50%" cy="50%"
                    innerRadius={70} outerRadius={96}
                    paddingAngle={2}
                    cornerRadius={5}
                    stroke="none"
                    startAngle={90} endAngle={-270}
                    rootTabIndex={-1}
                    isAnimationActive animationDuration={700}
                    onMouseEnter={(_: any, i: number) => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                  >
                    {colored.map((c, i) => (
                      <Cell
                        key={i}
                        fill={c.color}
                        fillOpacity={active === null || active === i ? 1 : 0.3}
                        style={{ outline: "none", transition: "fill-opacity .2s" }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* centre: total, or hovered category */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-16 text-center">
                {a ? (
                  <>
                    <span className="text-[14px] font-bold truncate max-w-full" style={{ color: a.color }}>{a.name}</span>
                    <span className="font-serif text-[28px] font-black text-gray-900 dark:text-white leading-tight mt-0.5">
                      {a.revenue != null ? `$${Number(a.revenue).toFixed(2)}` : `${a.value}%`}
                    </span>
                    <span className="text-[14px] text-gray-500 dark:text-white/40">
                      {a.count != null ? `${a.count} ${isKh ? "កម្ម៉ង់" : "orders"} · ` : ""}{a.value}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-serif text-[44px] font-black text-gray-900 dark:text-white leading-none">{center}</span>
                    <span className="text-[14px] text-gray-500 dark:text-white/40 mt-1">{isKh ? "សរុប" : "total"}</span>
                  </>
                )}
              </div>
            </div>

            {/* legend chips: 2 rows visible, scroll for the rest */}
            <div
              className="grid grid-cols-2 auto-rows-[32px] content-start gap-1.5 max-h-[70px] overflow-y-auto pr-1
                [&::-webkit-scrollbar]:w-1
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-gray-300
                dark:[&::-webkit-scrollbar-thumb]:bg-white/20
                [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {colored.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: active === null || active === i ? 1 : 0.45, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[14px] font-semibold leading-none cursor-default min-w-0"
                  style={{ background: c.color + "18", color: c.color, border: `1px solid ${c.color}33` }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="shrink-0 opacity-70 tabular-nums">{c.value}%</span>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[14px] text-gray-500 dark:text-white/30">{isKh ? "មិនទាន់មានទិន្នន័យ" : "No data yet"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}