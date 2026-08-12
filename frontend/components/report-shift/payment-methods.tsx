"use client"

import { useTheme } from "next-themes"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { SORA } from "./types"

interface PaymentPoint {
  name:  string
  value: number
  color?: string  
}

interface Props {
  payments: PaymentPoint[]
  isKh:     boolean
}

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

const LEGEND_MAX_H = "max-h-[84px]"

function getColor(name: string): string {
  const key = name.toLowerCase().trim()
  return COLOR_MAP[key] || COLOR_MAP["default"]
}

function PieTip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  return (
    <div style={{
      ...SORA,
      background:   isDark ? "#1a1d2d" : "#fff",
      border:       `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}`,
      borderRadius: 12,
      padding:      "8px 12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.payload?.color || d.fill || getColor(d.name) }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#fff" : "#1f2937" }}>{d.name}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color: "#6366f1" }}>
        {d.value} <span style={{ fontSize: 10, color: "#64748b" }}>orders</span>
      </div>
    </div>
  )
}

export function PaymentMethods({ payments, isKh }: Props) {
  const dataWithColor = payments.map(p => ({
    ...p,
    color: getColor(p.name),  
  }))

  return (
    <div className="bg-white dark:bg-[#1a1d2d] border border-gray-100 dark:border-white/[0.08] shadow-sm rounded-lg overflow-hidden h-full">
      <div className="px-5 pt-5 pb-3 border-b border-gray-50 dark:border-white/[0.05]">
        <h3 className="text-[14px] font-bold text-gray-600 dark:text-white/40 uppercase tracking-[0.2em]">
          {isKh ? "វិធីទូទាត់" : "Payment Methods"}
        </h3>
      </div>
      <div className="p-4">
        {dataWithColor.length > 0 ? (
          <>
            <div className="h-[175px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataWithColor}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none" >
                    {dataWithColor.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div
              className={`grid grid-cols-2 gap-x-2 gap-y-1 mt-2 pr-1 overflow-y-auto ${LEGEND_MAX_H}
                [&::-webkit-scrollbar]:w-1
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-gray-300
                dark:[&::-webkit-scrollbar-thumb]:bg-white/10
                [&::-webkit-scrollbar-thumb]:rounded-full`} >
              {dataWithColor.map(p => (
                <div
                  key={p.name}
                  className="flex items-center gap-2 px-2 py-0.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] shrink-0" >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-[14px] font-bold uppercase text-gray-600 dark:text-white/60 flex-1 truncate">
                    {p.name}
                  </span>
                  <span className="text-[14px] font-black text-gray-800 dark:text-white/80">
                    {p.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-28 flex items-center justify-center text-[14px] text-gray-600 dark:text-white/30">
            {isKh ? "គ្មានទិន្នន័យ" : "No data"}
          </div>
        )}
      </div>
    </div>
  )
}