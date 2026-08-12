"use client"

import { useEffect, useState } from "react"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Calendar, AlertTriangle, CheckCircle2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { SORA, INP, isCardExpired } from "@/components/vip-card/types"
import type { VipCard } from "@/components/vip-card/types"
import { DatePicker } from "@/components/ui/DatePicker"

interface ExtendDialogProps {
  open:     boolean
  onClose:  () => void
  card:     VipCard | null
  onExtend: (cardId: number, newExpiry: string | null, newMonthlyLimit: number) => void
  isKh:     boolean
}

export function ExtendDialog({
  open, onClose, card, onExtend, isKh,
}: ExtendDialogProps) {
  const [extendType,   setExtendType]   = useState<"months" | "custom" | "none">("months")
  const [extendMonths, setExtendMonths] = useState("6")
  const [customDate,   setCustomDate]   = useState("")
  const [monthlyLimit, setMonthlyLimit] = useState("0")

  useEffect(() => {
    if (open) {
      setExtendType("months")
      setExtendMonths("6")
      setCustomDate("")
      setMonthlyLimit(String(card?.monthlyLimit ?? 0))
    }
  }, [open, card])

  function computeNewExpiry(): string | null {
    if (extendType === "none") return null
    const base =
      card?.expiresAt && new Date(card.expiresAt) > new Date()
        ? new Date(card.expiresAt)
        : new Date()
    if (extendType === "custom") return customDate || null
    base.setMonth(base.getMonth() + parseInt(extendMonths))
    return base.toISOString().slice(0, 10)
  }

  const preview   = computeNewExpiry()
  const isExpired = card ? isCardExpired(card) : false
  const limit     = parseInt(monthlyLimit) || 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[400px] p-0 border border-gray-200 dark:border-white/[0.10] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] [&>button]:hidden"
        style={SORA} >
        <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#03624C] dark:bg-emerald-400/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-[18px] font-bold text-gray-800 dark:text-white/90">
                {isKh ? "បន្តសពលភាពកាត" : "Extend Card Expiry"}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-gray-600 dark:text-white/30 font-mono">
                {card?.code}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
            <span className="text-[14px] text-gray-600 dark:text-white/30 w-28 shrink-0">
              {isKh ? "ផុតបច្ចុប្បន្ន" : "Current Expiry"}
            </span>
            <span className={cn(
              "text-[14px] font-semibold flex items-center gap-1.5",
              isExpired
                ? "text-rose-500"
                : card?.expiresAt
                  ? "text-gray-800 dark:text-white/85"
                  : "text-gray-500 dark:text-white/30"
            )}>
              {isExpired && <AlertTriangle className="w-3 h-3" />}
              {card?.expiresAt ?? (isKh ? "គ្មានកំណត់" : "No expiry")}
              {isExpired && (
                <span className="text-[14px] font-bold text-rose-400 ml-1">
                  ({isKh ? "ផុតហើយ" : "Expired"})
                </span>
              )}
            </span>
          </div>
          <div>
            <label className="text-[14px] text-gray-600 dark:text-white/30 block mb-1.5">
              {isKh ? "របៀបបន្ត" : "Extend Method"}
            </label>
            <div className="flex gap-2 mb-2">
              {([
                { v: "none",   label: isKh ? "គ្មានកំណត់" : "No Limit"   },
                { v: "months", label: isKh ? "ខែ"         : "Months"     },
                { v: "custom", label: isKh ? "កំណត់ថ្ងៃ"  : "Pick Date"  },
              ] as const).map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setExtendType(opt.v)}
                  className={cn(
                    "flex-1 h-8 rounded-lg text-[14px] border transition-all",
                    extendType === opt.v
                      ? "border-[#03624C] dark:border-[#1857D8] bg-[#03624C]/[0.07] dark:bg-[#1857D8]/[0.08] text-[#03624C] dark:text-[#1857D8]"
                      : "border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  )} >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {extendType === "months" && (
                <div key="months-input">
                  <label className="text-[14px] text-gray-600 dark:text-white/30 block mb-1.5">
                    {isKh ? "ចំនួនខែ" : "Months"}
                  </label>
                  <input
                    className={cn(INP, "w-full text-center")}
                    type="number" min="1" max="60"
                    value={extendMonths}
                    onChange={e => setExtendMonths(e.target.value)}
                  />
                  {isExpired && (
                    <p className="text-[14px] text-amber-500 mt-1.5 pl-1">
                      {isKh ? "✦ គណនាពីថ្ងៃនេះ (ព្រោះផុតហើយ)" : "✦ Calculated from today (card was expired)"}
                    </p>
                  )}
                </div>
              )}
              {extendType === "custom" && (
                <div key="custom-input" style={{ overflow: "visible" }}>
                  <label className="text-[14px] text-gray-600 dark:text-white/30 block mb-1.5">
                    {isKh ? "ថ្ងៃផុតកំណត់" : "Expiry Date"}
                  </label>
                  <DatePicker
                    value={customDate}
                    onChange={setCustomDate}
                    placeholder={isKh ? "ជ្រើសថ្ងៃ" : "Pick date"}
                    className="w-full"
                  />
                </div>
              )}
              <div className={cn(extendType === "none" ? "col-span-2" : "")}>
                <label className="text-[14px] text-gray-600 dark:text-white/30 block mb-1.5">
                  {isKh ? "Quota ប្រើ/ខែ (0=∞ Unlimited)" : "Quota / Month (0 = Unlimited)"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    className={cn(INP, "flex-1")}
                    type="number" min="0" max="99"
                    placeholder="0"
                    value={monthlyLimit}
                    onChange={e => setMonthlyLimit(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg border",
            extendType === "none"
              ? "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20"
              : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
          )}>
            <CheckCircle2 className={cn(
              "w-3.5 h-3.5 shrink-0",
              extendType === "none" ? "text-sky-500" : "text-emerald-500"
            )} />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[14px] font-bold",
                  extendType === "none" ? "text-sky-700 dark:text-sky-300" : "text-emerald-700 dark:text-emerald-300"
                )}>
                  {isKh ? "ថ្ងៃផុតថ្មី:" : "New expiry:"}
                </span>
                <span className={cn(
                  "text-[14px] font-mono",
                  extendType === "none" ? "text-sky-600 dark:text-sky-400" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {extendType === "none"
                    ? (isKh ? "គ្មានកំណត់" : "No Limit")
                    : preview ?? (isKh ? "មិនទាន់ជ្រើស" : "Not set")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[14px] font-bold",
                  extendType === "none" ? "text-sky-700 dark:text-sky-300" : "text-emerald-700 dark:text-emerald-300"
                )}>
                  {isKh ? "Quota ថ្មី:" : "New quota:"}
                </span>
                <span className={cn(
                  "text-[14px]",
                  extendType === "none" ? "text-sky-600 dark:text-sky-400" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {limit === 0
                    ? (isKh ? "Unlimited" : "Unlimited")
                    : `${limit} ${isKh ? "ដង/ខែ" : "times/mo"}`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg gap-2">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-[14px]  border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all" >
            {isKh ? "បោះបង់" : "Cancel"}
          </button>
          <button
            onClick={() => { if (card) { onExtend(card.id, preview, limit); onClose() } }}
            disabled={extendType === "custom" && !customDate}
            className="h-9 px-5 rounded-lg text-[14px] text-white bg-[#03624C] dark:bg-[#1857D8] hover:bg-[#03624C]/80 hover:dark:bg-[#1857D8]/80 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed" >
              <Check className="w-3.5 h-3.5" />
              {isKh ? "បន្តសពលភាព" : "Extend"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}