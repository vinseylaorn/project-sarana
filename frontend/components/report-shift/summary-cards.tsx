"use client"

import { useEffect } from "react"
import { motion, useSpring, useTransform } from "framer-motion"
import { useTheme } from "next-themes"
import { DollarSign, ShoppingBag, TrendingUp, LogIn, LogOut, Star } from "lucide-react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { cn } from "@/lib/utils"
import { fmt, fmtKhr, fmtKhrR, SORA } from "./types"


function Num({ value, currency = false }: { value: number; currency?: boolean }) {
  const sp = useSpring(0, { stiffness: 50, damping: 14 })
  const d  = useTransform(sp, v =>
    currency
      ? "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : Math.floor(v).toLocaleString()
  )
  useEffect(() => { sp.set(value) }, [sp, value])
  return <motion.span>{d}</motion.span>
}

function Card({ label, value, sub, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    accent:  "bg-white dark:bg-[#22263a] dark:border-[#22263a] text-emerald-700 dark:text-emerald-400",
    emerald: "bg-white dark:bg-[#22263a] dark:border-[#22263a] text-[#03624C] dark:text-[#4d80e8]",
    amber:   "bg-white dark:bg-[#22263a] dark:border-[#22263a] text-amber-700 dark:text-amber-400",
    teal:    "bg-white dark:bg-[#22263a] dark:border-[#22263a] text-teal-700 dark:text-teal-400",
    violet:  "bg-white dark:bg-[#22263a] dark:border-[#22263a] text-violet-700 dark:text-violet-400",
  }
  return (
    <motion.div whileHover={{ y: -2 }} className={cn("rounded-lg border p-3", colorMap[color])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[14px] font-black uppercase tracking-wider text-gray-500 dark:text-white/30">{label}</p>
          <p className="text-xl font-black leading-tight mt-1">{value}</p>
          <p className="text-[12px] text-gray-600 dark:text-white/25 mt-0.5">{sub}</p>
        </div>
        <Icon className="w-4 h-4 opacity-60" />
      </div>
    </motion.div>
  )
}
interface SummaryProps {
  orderTotals: { totalRevenue: number; totalOrders: number; avgOrder: number }
  shiftStats:  {
    openingCashUSD: number; openingCashKHR: number
    closingCashUSD: number; closingCashKHR: number
  }
  isKh: boolean
}

export function SummaryCards({ orderTotals, shiftStats, isKh }: SummaryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <Card
        label={isKh ? "ចំណូលសរុប" : "Total Revenue"}
        value={<Num value={orderTotals.totalRevenue} currency />}
        icon={DollarSign}
        color="emerald"
      />
      <Card
        label={isKh ? "Orders សរុប" : "Total Orders"}
        value={orderTotals.totalOrders}
        sub={isKh ? "ការបញ្ជាទិញ" : "orders"}
        icon={ShoppingBag}
        color="accent"
      />
      <Card
        label={isKh ? "មធ្យម/Order" : "Avg / Order"}
        value={<Num value={orderTotals.avgOrder} currency />}
        sub={isKh ? "ក្នុង order" : "per order"}
        icon={TrendingUp}
        color="amber"
      />
      <Card
        label={isKh ? "សាច់ប្រាក់បើកវេន" : "Opening Cash"}
        value={<Num value={shiftStats.openingCashUSD} currency />}
        sub={fmtKhrR(shiftStats.openingCashKHR)}
        icon={LogIn}
        color="teal"
      />
      <Card
        label={isKh ? "សាច់ប្រាក់បិទវេន" : "Closing Cash"}
        value={<Num value={shiftStats.closingCashUSD} currency />}
        sub={fmtKhrR(shiftStats.closingCashKHR)}
        icon={LogOut}
        color="violet"
      />
    </div>
  )
}

interface PaymentPoint { name: string; value: number; color: string }
interface PaymentProps  { payments: PaymentPoint[]; isKh: boolean }

function PieTip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  return (
    <div style={{
      ...SORA,
      background:   isDark ? "#1a1d2e" : "#fff",
      border:       `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "#e5e7eb"}`,
      borderRadius: 12, padding: "8px 12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.payload?.color || d.fill }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#fff" : "#1f2937" }}>{d.name}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color: isDark ? "#1857D8" : "#03624C" }}>
        {d.value} <span style={{ fontSize: 10, color: "#64748b" }}>orders</span>
      </div>
    </div>
  )
}

export function PaymentMethods({ payments, isKh }: PaymentProps) {
  return (
    <div className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark/[0.07] shadow-sm dark:shadow-none rounded-lg overflow-hidden" style={SORA}>
      <div className="px-5 pt-5 pb-3 border-b border-gray-50 dark/[0.05]">
        <h3 className="text-[14px] font-bold text-gray-600 dark:text-white/40 uppercase tracking-[0.2em]">
          {isKh ? "វិធីទូទាត់" : "Payment Methods"}
        </h3>
      </div>
      <div className="p-4">
        {payments.length > 0 ? (
          <>
            <div className="h-[175px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={payments} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                    {payments.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-2">
              {payments.map(p => (
                <div key={p.name} className="flex items-center gap-2 px-2 py-0.5 rounded-lg bg-gray-50 dark:bg-white/[0.03]">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-[14px] font-bold uppercase text-gray-600 dark:text-white/60 flex-1">{p.name}</span>
                  <span className="text-[12px] font-black text-gray-800 dark:text-white/80">{p.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-28 flex items-center justify-center text-sm text-gray-400 dark:text-white/30">
            {isKh ? "គ្មានទិន្នន័យ" : "No data"}
          </div>
        )}
      </div>
    </div>
  )
}

interface TopItem       { name: string; orders: number; revenue: number }
interface TopItemsProps { items: TopItem[]; isKh: boolean }

export function TopItems({ items, isKh }: TopItemsProps) {
  const { resolvedTheme } = useTheme()
  const isDark   = resolvedTheme === "dark"
  const barColor = isDark
    ? "linear-gradient(90deg, #1857D8, rgba(24,87,216,0.5))"
    : "linear-gradient(90deg, #03624C, rgba(3,98,76,0.5))"
  return (
    <div className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark/[0.07] shadow-sm dark:shadow-none rounded-lg overflow-hidden" style={SORA}>
      <div className="px-5 pt-5 pb-3 border-b border-gray-50 dark/[0.05]">
        <div className="flex justify-between items-center">
          <h3 className="text-[14px] font-bold text-gray-600 dark:text-white/40 uppercase tracking-[0.2em]">
            {isKh ? "មុខម្ហូបលក់ដាច់" : "Top Items"}
          </h3>
          <Star className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
        </div>
      </div>
      <div className="p-4">
        {items.length > 0 ? (
          <div className="space-y-1.5">
            {items.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
                <span className="text-[14px] font-black text-[#03624C] dark:text-[#4d80e8] w-5 shrink-0">#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-gray-800 dark:text-white/80 truncate">{item.name}</p>
                  <div className="h-1 rounded-full bg-gray-200 dark:bg-white/[0.06] mt-0.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(item.orders / items[0].orders) * 100}%`, background: barColor }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-black text-gray-900 dark:text-white/90">{fmt(item.revenue)}</p>
                  <p className="text-[14px] text-gray-400 dark:text-white/40">×{item.orders}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-sm text-gray-400 dark:text-white/30">
            {isKh ? "គ្មានទិន្នន័យ" : "No items"}
          </div>
        )}
      </div>
    </div>
  )
}