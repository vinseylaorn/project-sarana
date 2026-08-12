"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useDashboard } from "@/hooks/useDashboard"

const getStatusStyle = (status: string) => {
  switch (status) {
    case "new":       return "bg-[#03624C]/10 dark:bg-[#1857D8]/10 text-[#03624C] dark:text-[#6b9fff] border border-[#03624C]/20 dark:border-[#1857D8]/25"
    case "preparing": return "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25"
    case "ready":     return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25"
    case "confirmed": return "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-500/25"
    default:          return "bg-gray-50 dark:bg-white/[0.05] text-gray-400 dark:text-white/40 border border-gray-200 dark:border-white/10"
  }
}

function LiveTimer({ timeStr }: { timeStr: string }) {
  const parseToSeconds = (raw: string): number => {
    const mins = parseFloat(raw.replace("m ago", "").trim())
    return isNaN(mins) ? 0 : Math.round(mins * 60)
  }
  const [elapsed, setElapsed] = useState(() => parseToSeconds(timeStr))
  const ref = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => { setElapsed(parseToSeconds(timeStr)) }, [timeStr])

  useEffect(() => {
    ref.current = setInterval(() => setElapsed(prev => prev + 1), 1000)
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [])

  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  const pad = (n: number) => String(n).padStart(2, "0")

  const color = elapsed < 600
    ? "text-emerald-500 dark:text-emerald-400"
    : elapsed < 1800
    ? "text-amber-500 dark:text-amber-400"
    : "text-rose-500 dark:text-rose-400"

  return (
    <div className={`flex items-center gap-1 font-mono text-[14px] font-bold tabular-nums ${color}`}>
      <Clock className="w-3 h-3 shrink-0" />
      {h > 0 && <span>{pad(h)}h:</span>}
      <span>{pad(m)}m:</span>
      <span>{pad(s)}s</span>
    </div>
  )
}

function OrderItem({ order }: { order: any }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.07]">
          <span className="text-[14px] font-semibold text-gray-600 dark:text-white/70">
            {order.table.replace(/\D/g, "") || "?"}
          </span>
        </div>
        <div>
          <p className="text-[14px] font-medium text-gray-700 dark:text-white/80">{order.table}</p>
          <p className="text-[14px] text-gray-400 dark:text-white/30">{order.items_count} items</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <LiveTimer timeStr={order.time} />
        <span className={`text-[14px] font-medium px-2.5 py-1 rounded-full capitalize ${getStatusStyle(order.status)}`}>
          {order.status}
        </span>
      </div>
    </div>
  )
}

export function RecentOrders() {
  const { orders, loading } = useDashboard()
  const [open, setOpen] = useState(false)
  const preview = orders.slice(0, 5)

  return (
    <>
      <Card className="bg-white dark:bg-[#1a1d2e] border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none h-full flex flex-col" style={{ fontFamily: "'Sora', sans-serif" }}>
        <CardHeader className="flex flex-row items-center justify-between pb-3 px-5 pt-5 shrink-0">
          <CardTitle className="text-[14px] font-semibold text-gray-700 dark:text-white/80 flex items-center gap-2">
            Active Orders
            {orders.length > 0 && (
              <span className="text-[14px] font-bold px-1.5 py-0.5 rounded-full bg-[#03624C]/10 dark:bg-[#1857D8]/15 text-[#03624C] dark:text-[#6b9fff]">
                {orders.length}
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost" size="sm"
            onClick={() => setOpen(true)}
            className="h-7 text-[14px] text-[#03624C] dark:text-[#1857D8] hover:text-[#03624C]/80 dark:hover:text-[#1857D8]/80 hover:bg-[#03624C]/10 dark:hover:bg-[#1857D8]/10 px-3">
            View all
          </Button>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-2 flex-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[58px] rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] animate-pulse" />
            ))
          ) : orders.length === 0 ? (
            <p className="text-center py-6 text-[14px] text-gray-300 dark:text-white/20">No active orders</p>
          ) : (
            preview.map((order) => <OrderItem key={order.id} order={order} />)
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-md bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] rounded-2xl p-0 max-h-[70vh] flex flex-col"
          style={{ fontFamily: "var(--font-kantumruy), sans-serif"}}>
          <DialogHeader className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] shrink-0">
            <DialogTitle className="text-[14px] font-semibold text-gray-700 dark:text-white/80 flex items-center gap-2">
              Active Orders
              <span className="text-[14px] font-bold px-1.5 py-0.5 rounded-full bg-[#03624C]/10 dark:bg-[#1857D8]/15 text-[#03624C] dark:text-[#6b9fff]">
                {orders.length} orders
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 py-4 space-y-2 overflow-y-auto flex-1">
            {orders.length === 0 ? (
              <p className="text-center py-6 text-[14px] text-gray-300 dark:text-white/20">No active orders</p>
            ) : (
              orders.map((order) => <OrderItem key={order.id} order={order} />)
            )}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 dark:border-white/[0.06] flex justify-end shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}
              className="h-8 px-4 text-[14px] font-semibold text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06]">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}