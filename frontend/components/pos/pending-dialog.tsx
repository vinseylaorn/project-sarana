"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ListFilter, ShoppingCart, ShoppingBag, Smartphone } from "lucide-react"
import { cn } from "@/lib/utils"

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }

interface PendingDialogProps {
  orders: any[]
  onSelectOrder: (order: any) => void
  language?: string
}

export function PendingDialog({ orders, onSelectOrder, language = "english" }: PendingDialogProps) {
  const isKh = language === "khmer"

  const getOrderIcon = (order: any) => {
    if (order.name?.toLowerCase().includes("app")) return Smartphone
    if (order.name?.toLowerCase().includes("takeaway")) return ShoppingBag
    return ShoppingCart
  }

  const getOrderColor = (order: any) => {
    if (order.name?.toLowerCase().includes("app")) return "bg-indigo-100 text-indigo-600"
    if (order.name?.toLowerCase().includes("takeaway")) return "bg-rose-100 text-rose-600"
    return "bg-violet-100 text-violet-600"
  }

  const pendingOrders = orders.filter(o => o.order && o.order.items && o.order.items.length > 0)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="h-7 px-3.5 flex items-center gap-1.5 rounded-lg border text-[14px] font-semibold transition-all bg-[#03624C]/10 border-[#03624C] text-gray-600 hover:bg-[#03624C]/20 relative"
          style={SORA} >
          <ListFilter className="w-3 h-3" />
          {isKh ? "កម្ម៉ង់កំពុងរង់ចាំ" : "Pending"}
          {pendingOrders.length > 0 && (
            <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#03624C] text-white text-[12px] font-bold flex items-center justify-center">
              {pendingOrders.length}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-md p-0 border border-gray-200 shadow-2xl rounded-2xl bg-white [&>button]:hidden"
        style={SORA} >
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-[16px] font-bold text-gray-800 flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-[#1857D8]" />
            {isKh ? "កម្ម៉ង់កំពុងរង់ចាំ" : "Pending Orders"}
            {pendingOrders.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-[#03624C]/30 text-[#03624C] text-[13px] font-bold">
                {pendingOrders.length}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-[14px] font-medium text-gray-600">
                {isKh ? "មិនមានការកម្ម៉ង់" : "No pending orders"}
              </p>
            </div>
          ) : (
            pendingOrders.map((order, idx) => {
              const Icon = getOrderIcon(order)
              const color = getOrderColor(order)
              const itemCount = order.order?.items?.length || 0
              const total = order.order?.total || 0

              let displayName = order.name || "Order"
              const isGeneric = /^Order/.test(displayName) || /^Draft/.test(displayName) || displayName === "Order"
              if (isGeneric) displayName = `Order #${idx + 1}`

              return (
                <div
                  key={`${order.id}-${idx}`}
                  onClick={() => onSelectOrder(order)}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-white hover:bg-[#1857D8]/[0.04] hover:border-[#1857D8]/30 cursor-pointer transition-all group" >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
                    <Icon className="w-4.5 h-4.5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold text-gray-800 truncate group-hover:text-[#1857D8] transition-colors">
                      {displayName}
                    </p>
                    <p className="text-[14px] text-gray-400 mt-0.5">
                      {itemCount} {isKh ? "មុខ" : "items"}
                      {itemCount > 0 && (
                        <span className="ml-2 text-gray-300">
                          · {order.order?.items?.map((i: any) => i.name).slice(0, 2).join(", ")}
                          {itemCount > 2 ? ` +${itemCount - 2}` : ""}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-bold text-[#03624C]">
                      ${total.toFixed(2)}
                    </p>
                    <p className="text-[12px] text-gray-300 uppercase tracking-wide mt-0.5">
                      {isKh ? "សរុប" : "total"}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
        {pendingOrders.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-[12px] text-center text-gray-400">
              {isKh ? "ចុចលើការកម្ម៉ង់ដើម្បីបើក POS" : "Click an order to open in POS"}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}