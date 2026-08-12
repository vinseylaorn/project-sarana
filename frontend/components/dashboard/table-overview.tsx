"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/hooks/useDashboard"

const getStatusStyle = (status: string) => {
  switch (status) {
    case "available": return "bg-[#1857D8]/8 dark:bg-[#1857D8]/[0.09] border-[#1857D8]/20 dark:border-[#1857D8]/35 text-[#1857D8] dark:text-[#6b9fff] hover:border-[#1857D8]/50"
    case "occupied":  return "bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20"
    case "reserved":  return "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20"
    default:          return "bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/10 text-gray-300 dark:text-white/30"
  }
}

const MAX_VISIBLE_TABLES = 8

export function TableOverview() {
  const { tables, loading } = useDashboard()
  const router = useRouter()
  const visibleTables = tables.slice(0, MAX_VISIBLE_TABLES)

  return (
    <Card className="bg-white dark:bg-[#1a1d2e] border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none flex flex-col h-full" style={{ fontFamily: "'Sora', sans-serif" }}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-5 pt-5 shrink-0">
        <CardTitle className="text-[14px] font-semibold text-gray-700 dark:text-white/80">Table Status</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/tables")}
          className="h-7 text-[14px] text-[#03624C] dark:text-[#1857D8] hover:text-[#03624C]/80 dark:hover:text-[#1857D8]/80 hover:bg-[#03624C]/10 dark:hover:bg-[#1857D8]/10 px-3">
          Manage
        </Button>
      </CardHeader>
      <CardContent className="px-5 pb-5 flex flex-col flex-1 min-h-0">
        {loading ? (
          <div className="grid grid-cols-4 gap-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[60px] rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2.5">
            {visibleTables.map((table) => (
              <button
                key={table.id}
                className={cn("flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:scale-[1.03]", getStatusStyle(table.status))} >
                <span className="text-[14px] font-semibold">{table.id}</span>
                <span className="text-[12px] opacity-70 mt-0.5">{table.seats} seats</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-5 mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.06] shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#1857D8]" />
            <span className="text-[12px] text-gray-400 dark:text-white/35">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-[12px] text-gray-400 dark:text-white/35">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[12px] text-gray-400 dark:text-white/35">Reserved</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}