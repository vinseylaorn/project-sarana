"use client"

import { DollarSign, ShoppingBag, TrendingUp, Users, Clock, CheckCircle2 } from "lucide-react"
import { useDashboard } from "@/hooks/useDashboard"

export function StatsCards() {
  const { stats, loading } = useDashboard()

  const items = [
    {
      name: "Today's Revenue",
      value: loading ? "—" : `$${stats.todayRevenue.toLocaleString()}`,
      change: loading ? "" : `+${stats.revenueChangePercent}%`,
      changeType: stats.revenueChangePercent >= 0 ? "positive" : "negative",
      icon: DollarSign,
      iconColor: "text-[#03624C] dark:text-[#1857D8]",
      iconBg:    "bg-[#03624C]/10 dark:bg-[#1857D8]/15",
    },
    {
      name: "Orders Today",
      value: loading ? "—" : stats.ordersToday.toString(),
      change: loading ? "" : `+${stats.ordersChangePercent}%`,
      changeType: stats.ordersChangePercent >= 0 ? "positive" : "negative",
      icon: ShoppingBag,
      iconColor: "text-sky-500 dark:text-sky-400",
      iconBg:    "bg-sky-50 dark:bg-sky-500/10",
    },
    {
      name: "Avg Order Value",
      value: loading ? "—" : `$${stats.avgOrderValue.toFixed(2)}`,
      change: loading ? "" : `+${stats.avgOrderChangePercent}%`,
      changeType: stats.avgOrderChangePercent >= 0 ? "positive" : "negative",
      icon: TrendingUp,
      iconColor: "text-emerald-500 dark:text-emerald-400",
      iconBg:    "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      name: "Tables Occupied",
      value: loading ? "—" : `${stats.tablesOccupied}/${stats.totalTables}`,
      change: stats.totalTables > 0
        ? `${Math.round((stats.tablesOccupied / stats.totalTables) * 100)}%`
        : "0%",
      changeType: "neutral",
      icon: Users,
      iconColor: "text-violet-500 dark:text-violet-400",
      iconBg:    "bg-violet-50 dark:bg-violet-500/10",
    },
    {
      name: "Pending Orders",
      value: loading ? "—" : stats.pendingOrders.toString(),
      change: "Active",
      changeType: "warning",
      icon: Clock,
      iconColor: "text-amber-500 dark:text-amber-400",
      iconBg:    "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      name: "Completed",
      value: loading ? "—" : stats.completedOrders.toString(),
      change: loading ? "" : `${stats.completedPercent}%`,
      changeType: "positive",
      icon: CheckCircle2,
      iconColor: "text-emerald-500 dark:text-emerald-400",
      iconBg:    "bg-emerald-50 dark:bg-emerald-500/10",
    },
  ] as const

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" style={{ fontFamily: "var(--font-kantumruy), sans-serif" }}>
      {items.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.name}
            className="relative bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] rounded-xl p-4 overflow-hidden group hover:border-gray-300 dark:hover:border-white/[0.13] transition-all shadow-sm dark:shadow-none hover:shadow-md hover:-translate-y-0.5 duration-200">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#03624C]/[0.03] dark:from-[#1857D8]/[0.04] to-transparent rounded-xl" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-[14px] text-gray-600 dark:text-white/35 truncate uppercase tracking-wide">
                {stat.name}
              </p>
              <div className={`w-7 h-7 rounded-lg ${stat.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                <Icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className={`text-[14px] font-semibold leading-tight transition-opacity ${loading ? "opacity-30 animate-pulse" : ""} text-gray-800 dark:text-white/85`}>
              {stat.value}
            </p>
            <span className={`text-[14px] font-medium mt-1 block transition-all duration-200 ${
              stat.changeType === "positive" ? "text-[#03624C] dark:text-[#1857D8]"
              : stat.changeType === "warning"  ? "text-amber-500 dark:text-amber-400"
              : "text-gray-400 dark:text-white/35"
            }`}>
              {stat.changeType === "positive" && stat.change ? "↑ " : ""}
              {stat.change}
            </span>
          </div>
        )
      })}
    </div>
  )
}