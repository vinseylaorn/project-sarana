"use client"

import { useEffect, useState } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Plus, Check, AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

import { TierIcon } from "@/components/vip-card/tier-icon"
import { DatePicker } from "@/components/ui/DatePicker"
import { SORA, AC, INP } from "@/components/vip-card/types"
import type { VipTier } from "@/types/vipcard"

interface IssueCardDialogProps {
  open: boolean
  onClose: () => void
  tiers: VipTier[]
  onIssue: (
    tierId: number,
    note: string,
    expiresAt: string | null,
    monthlyLimit: number,
  ) => Promise<void>
  isKh: boolean
}

export function IssueCardDialog({
  open,
  onClose,
  tiers,
  onIssue,
  isKh,
}: IssueCardDialogProps) {
  const [tierId, setTierId] = useState<number>(tiers[0]?.id ?? 1)
  const [note, setNote] = useState("")
  const [validityType, setValidityType] = useState<"none" | "months" | "custom">("none")
  const [validMonths, setValidMonths] = useState("12")
  const [customDate, setCustomDate] = useState("")
  const [monthlyLimit, setMonthlyLimit] = useState("0")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setTierId(tiers[0]?.id ?? 1)
      setNote("")
      setValidityType("none")
      setValidMonths("12")
      setCustomDate("")
      setMonthlyLimit("0")
      setLoading(false)
    }
  }, [open, tiers])

  function computeExpiry(): string | null {
    if (validityType === "none") return null
    if (validityType === "custom") return customDate || null
    const d = new Date()
    d.setMonth(d.getMonth() + parseInt(validMonths))
    return d.toISOString().slice(0, 10)
  }

  async function handleIssue() {
    setLoading(true)
    try {
      await onIssue(tierId, note, computeExpiry(), parseInt(monthlyLimit) || 0)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[440px] p-0 border border-gray-200 dark:border-white/[0.10] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] [&>button]:hidden"
        style={SORA} >
        <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", AC.iconBg)}>
              <Plus className="w-4 h-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90">
                {isKh ? "បញ្ចេញកាត VIP ថ្មី" : "Issue New VIP Card"}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-gray-600 dark:text-white/30">
                {isKh
                  ? "លេខកូតនឹងជា 000-000-XXX"
                  : "Code format: 000-000-XXX (auto-numbered)"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[14px]  text-gray-600 dark:text-white/30 block mb-2">
              {isKh ? "ប្រភេទកាត" : "Card Type"}
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {tiers.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTierId(t.id)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all",
                    tierId === t.id
                      ? "border-[#03624C] dark:border-[#03624C] bg-[#03624C]/[0.06] dark:bg-[#03624C]/[0.08]"
                      : "border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.03]",
                  )} >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: `${t.accentColor}22`,
                      border: `1px solid ${t.accentColor}44`,
                    }} >
                    <TierIcon icon={t.icon} size={14} color={t.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-semibold text-gray-800 dark:text-white/90">
                        {isKh ? (t.nameKh || t.name) : t.name}
                      </span>
                      <span className="text-[14px] text-gray-600 dark:text-white/30">
                        ({isKh ? t.name : t.nameKh})
                      </span>
                    </div>
                    <div className="text-[14px] text-gray-600 dark:text-white/30 mt-0.5">
                      {t.discount}% off · {isKh ? "ចូល" : "visits"} {t.minVisits}
                      {t.maxVisits ? `–${t.maxVisits}` : "+"} ·{" "}
                      {t.monthlyLimit > 0
                        ? `${isKh ? "Quota" : "quota"} ${t.monthlyLimit}/${isKh ? "ខែ" : "mo"}`
                        : isKh ? "ប្រើ Unlimited" : "unlimited/mo"}
                    </div>
                  </div>
                  {tierId === t.id && (
                    <Check className={cn("w-4 h-4 shrink-0", AC.text)} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[14px]  text-gray-600 dark:text-white/30 block mb-1.5">
              {isKh ? "សពលភាពកាត" : "Card Validity"}
            </label>
            <div className="flex gap-2 mb-2">
              {(
                [
                  { v: "none", label: isKh ? "គ្មានកំណត់" : "No Limit" },
                  { v: "months", label: isKh ? "ខែ" : "Months" },
                  { v: "custom", label: isKh ? "កំណត់ថ្ងៃ" : "Pick Date" },
                ] as const
              ).map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setValidityType(opt.v)}
                  className={cn(
                    "flex-1 h-8 rounded-lg text-[14px] border transition-all",
                    validityType === opt.v
                      ? "border-[#03624C] dark:border-[#03624C] bg-[#03624C]/[0.07] dark:bg-[#03624C]/[0.08] text-[#03624C] dark:text-[#03624C]"
                      : "border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/[0.03]",
                  )} >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {validityType === "months" && (
                <div key="months-input">
                  <label className="text-[14px]  text-gray-600 dark:text-white/30 block mb-1.5">
                    {isKh ? "ចំនួនខែ" : "Months"}
                  </label>
                  <input
                    className={cn(INP, "w-full text-center text-[14px]")}
                    type="number"
                    min="1"
                    max="60"
                    value={validMonths}
                    onChange={e => setValidMonths(e.target.value)}
                  />
                </div>
              )}

              {validityType === "custom" && (
                <div key="custom-input" style={{ overflow: "visible" }}>
                  <label className="text-[14px]  text-gray-600 dark:text-white/30 block mb-1.5">
                    {isKh ? "ថ្ងៃផុតកំណត់" : "Expiry Date"}
                  </label>
                  <DatePicker
                    value={customDate}
                    onChange={setCustomDate}
                    placeholder={isKh ? "ជ្រើសថ្ងៃ" : "Pick date"}
                    className="w-full text-[14px]"
                  />
                </div>
              )}
              <div className={cn(validityType === "none" ? "col-span-2" : "")}>
                <label className="text-[14px]  text-gray-600 dark:text-white/30 block mb-1.5">
                  {isKh ? "Quota ប្រើ/ខែ (0=∞ Unlimited)" : "Quota / Month (0 = Unlimited)"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    className={cn(INP, "flex-1 text-[14px]")}
                    type="number"
                    min="0"
                    max="99"
                    placeholder="0"
                    value={monthlyLimit}
                    onChange={e => setMonthlyLimit(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[14px]  text-gray-600 dark:text-white/30 block mb-1.5">
              {isKh ? "កំណត់ចំណាំ (ស្រេចចិត្ត)" : "Note (Optional)"}
            </label>
            <input
              className={cn(INP, "text-[14px]")}
              placeholder={
                isKh
                  ? "ដូចជា: ភ្ញៀវវេ, តុ ៥..."
                  : "e.g. Table 5, regular guest..."
              }
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[14px] font-medium text-amber-700 dark:text-amber-300">
              {isKh
                ? "កាតនេះជា Anonymous — គ្មានឈ្មោះភ្ញៀវ។"
                : "Anonymous card — no customer name required."}
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-9 px-4 rounded-xl text-[14px] border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all disabled:opacity-50" >
            {isKh ? "បោះបង់" : "Cancel"}
          </button>
          <button
            onClick={handleIssue}
            disabled={loading}
            className="h-9 px-5 rounded-xl text-[14px] text-white bg-[#03624C] dark:bg-[#03624C] hover:opacity-90 transition-all flex items-center gap-1.5 disabled:opacity-60" >
            {loading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Check className="w-3.5 h-3.5" />
            }
            {isKh ? "បញ្ចេញ & Print" : "Issue & Print"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}