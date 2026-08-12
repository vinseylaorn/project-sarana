"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Package } from "lucide-react"
import { useDashboard } from "@/hooks/useDashboard"

const getStatusStyle = (status: string) => {
  switch (status) {
    case "low": return { 
      badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25", 
      icon: "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-white/[0.06]", 
      iconColor: "text-amber-500 dark:text-amber-400" 
    }
    case "critical": return { 
      badge: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/25",       
      icon: "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-white/[0.06]",   
      iconColor: "text-rose-500 dark:text-rose-400" 
    }
    default: return { 
      badge: "bg-gray-50 dark:bg-white/[0.05] text-gray-400 dark:text-white/40 border border-gray-200 dark:border-white/10",           
      icon: "bg-gray-50 dark:bg-white/[0.05] border-gray-100 dark:border-white/[0.06]", 
      iconColor: "text-gray-400 dark:text-white/30" 
    }
  }
}

function AlertItem({ item }: { item: any }) {
  const styles = getStatusStyle(item.status)
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all">
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg border ${styles.icon}`}>
          <Package className={`w-4 h-4 ${styles.iconColor}`} />
        </div>
        <div>
          <p className="text-[14px] font-medium text-gray-700 dark:text-white/80">{item.name}</p>
          <p className="text-[14px] text-gray-400 dark:text-white/30">
            {item.stock} {item.unit} remaining
          </p>
        </div>
      </div>
      <span className={`text-[14px] font-medium px-2.5 py-1 rounded-full capitalize ${styles.badge}`}>
        {item.status}
      </span>
    </div>
  )
}

export function InventoryAlerts() {
  const { alerts, loading } = useDashboard()
  const [open, setOpen] = useState(false)
  const preview = alerts.slice(0, 5)

  return (
    <>
      <Card className="bg-white dark:bg-[#1a1d2e] border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none h-full flex flex-col" style={{ fontFamily: "'Sora', sans-serif" }}>
        <CardHeader className="flex flex-row items-center justify-between pb-3 px-5 pt-5 shrink-0">
          <CardTitle className="text-[14px] font-semibold text-gray-700 dark:text-white/80 flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            </div> 
            Inventory Alerts
            {alerts.length > 0 && (
              <span className="text-[14px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                {alerts.length}
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
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
          ) : alerts.length === 0 ? (
            <p className="text-center py-6 text-[14px] text-gray-300 dark:text-white/20">All stock levels are healthy 🎉</p>
          ) : (
            preview.map((item) => <AlertItem key={item.id} item={item} />)
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-md bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] rounded-2xl p-0 overflow-hidden"
          style={{ fontFamily: "var(--font-kantumruy), sans-serif" }}>
          <DialogHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
            <div className="w-5 h-5 rounded-md bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-[14px] font-semibold text-gray-700 dark:text-white/80"> Inventory Alerts
              <span className="ml-2 text-[14px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                {alerts.length} items
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-center py-6 text-[14px] text-gray-300 dark:text-white/20">
                All stock levels are healthy 🎉
              </p>
            ) : (
              <>
                {alerts.filter(a => a.status === "critical").length > 0 && (
                  <>
                    <p className="text-[14px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 mb-1">Critical</p>
                    {alerts.filter(a => a.status === "critical").map(item => (
                      <AlertItem key={item.id} item={item} />
                    ))}
                  </>
                )}
                {alerts.filter(a => a.status === "low").length > 0 && (
                  <>
                    <p className="text-[14px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400 mt-3 mb-1">Low Stock</p>
                    {alerts.filter(a => a.status === "low").map(item => (
                      <AlertItem key={item.id} item={item} />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 dark:border-white/[0.06] flex justify-end">
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