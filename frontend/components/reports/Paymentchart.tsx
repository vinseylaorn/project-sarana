"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { useTranslation } from "react-i18next"
import { Wallet } from "lucide-react"

const COLOR_MAP: Record<string, string> = {
  "cash": "#265f4b",
  "card": "#2b4fd1",
  "mobile": "#8a6a2f",
  "cash+card": "#8b5cf6", "cash + card": "#8b5cf6", "card+cash": "#8b5cf6", "card + cash": "#8b5cf6",
  "cash+mobile": "#14b8a6", "cash + mobile": "#14b8a6",
  "mobile+card": "#ec4899", "mobile + card": "#ec4899",
}
const FALLBACK = ["#f59e0b", "#ef4444", "#06b6d4", "#6366f1", "#10b981", "#f97316"]

interface PaymentDataPoint { name: string; value: number }
interface Props { paymentData: PaymentDataPoint[] }

export function PaymentMethodsChart({ paymentData }: Props) {
  const { i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"
  const [active, setActive] = useState<number | null>(null)

  let fb = 0
  const colored = paymentData.map((p) => ({
    ...p,
    color: COLOR_MAP[p.name.toLowerCase().trim()] ?? FALLBACK[fb++ % FALLBACK.length],
  }))
  const total = paymentData.reduce((s, p) => s + p.value, 0)
  const a = active !== null ? colored[active] : null
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0)

  return (
    <Card className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none rounded-lg overflow-hidden h-full min-h-[380px] flex flex-col">
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/[0.05] flex justify-between items-center">
        <h3 className="text-[14px] font-extrabold text-gray-800 dark:text-white/60 uppercase tracking-[0.25em]">
          {isKh ? "ប្រភេទ​នៃការទូទាត់" : "Payment Methods"}
        </h3>
        <Wallet className="w-4 h-4 text-amber-500" />
      </div>

      <CardContent className="px-5 pt-6 pb-5 flex-1 flex flex-col justify-between gap-6">
        {colored.length > 0 ? (
          <>
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

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-16 text-center">
                {a ? (
                  <>
                    <span className="text-[14px] font-extrabold uppercase truncate max-w-full" style={{ color: a.color }}>{a.name}</span>
                    <span className="font-serif text-[40px] font-black text-gray-900 dark:text-white leading-none mt-0.5">{a.value}</span>
                    <span className="text-[14px] text-gray-500 dark:text-white/40 mt-1">{pct(a.value)}% · {isKh ? "កម្ម៉ង់" : "orders"}</span>
                  </>
                ) : (
                  <>
                    <span className="font-serif text-[44px] font-black text-gray-900 dark:text-white leading-none">{total}</span>
                    <span className="text-[14px] text-gray-500 dark:text-white/40 mt-1">{isKh ? "សរុប" : "total"}</span>
                  </>
                )}
              </div>
            </div>

            <div
              className="grid grid-cols-2 auto-rows-[32px] content-start gap-1.5 max-h-[70px] overflow-y-auto pr-1
                [&::-webkit-scrollbar]:w-1
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-gray-300
                dark:[&::-webkit-scrollbar-thumb]:bg-white/20
                [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {colored.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: active === null || active === i ? 1 : 0.45, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[14px] font-semibold leading-none cursor-default min-w-0"
                  style={{ background: p.color + "18", color: p.color, border: `1px solid ${p.color}33` }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                  <span className="flex-1 truncate uppercase">{p.name}</span>
                  <span className="shrink-0 opacity-70 tabular-nums">{p.value}</span>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[14px] text-gray-500 dark:text-white/30">{isKh ? "មិនទាន់មានទិន្នន័យ" : "No data"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}