"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Settings2, Plus, Trash2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { TierIcon } from "./tier-icon"
import { SORA, AC } from "@/components/vip-card/types"
import type { VipTier } from "@/types/vipcard"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

const ICONS: Array<VipTier["icon"]> = ["star", "gem", "crown"]

const COLORS = [
  { color: "#F0B429", bg: "#1C1A0E", bgTo: "#2A2410", accent: "#F0B429" },
  { color: "#1857D8", bg: "#0E0F1C", bgTo: "#14152A", accent: "#1857D8" },
  { color: "#03624C", bg: "#041811", bgTo: "#071f15", accent: "#03624C" },
  { color: "#f472b6", bg: "#1C0E16", bgTo: "#2A1420", accent: "#db2777" },
  { color: "#fb923c", bg: "#1C1008", bgTo: "#2A1A0A", accent: "#ea580c" },
]

interface CardTypesDialogProps {
  open:    boolean
  onClose: () => void
  tiers:   VipTier[]
  onSave:  (updated: VipTier[]) => void
  isKh:    boolean
}

export function CardTypesDialog({
  open, onClose, tiers, onSave, isKh,
}: CardTypesDialogProps) {
  const [local, setLocal] = useState<VipTier[]>(tiers)
  const [deleteTarget, setDeleteTarget] = useState<VipTier | null>(null)

  useEffect(() => {
    if (open) setLocal(tiers)
  }, [open, tiers])

  const isDirty = useMemo(
    () => JSON.stringify(local) !== JSON.stringify(tiers),
    [local, tiers]
  )

  function update<K extends keyof VipTier>(id: number, field: K, val: VipTier[K]) {
    setLocal(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t))
  }

  function addNewTier() {
    const maxId = local.length > 0 ? Math.max(...local.map(t => t.id)) : 0
    const newTier: VipTier = {
      id:           maxId + 1,
      name:         "",
      nameKh:       "",
      discount:     5,
      minVisits:    1,
      maxVisits:    null,
      monthlyLimit: 0,
      color:        "#F0B429",
      bgFrom:       "#1C1A0E",
      bgTo:         "#2A2410",
      accentColor:  "#F0B429",
      icon:         "star",
      upgrade:      null,
    }
    setLocal(prev => [newTier, ...prev])
  }

  function confirmDelete() {
    if (!deleteTarget) return
    setLocal(prev => prev.filter(t => t.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const cinp =
    "w-full h-8 px-2 text-[14px] font-medium rounded-lg outline-none transition-all " +
    "bg-white dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] " +
    "text-gray-800 dark:text-white focus:border-[#03624C] dark:focus:border-[#03624C]"

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="max-w-[560px] p-0 border border-gray-200 dark:border-white/[0.10] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] [&>button]:hidden"
          style={SORA} >
          <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
            <div className="flex items-center gap-2.5">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", AC.iconBg)}>
                <Settings2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90">
                  {isKh ? "ប្រភេទកាត VIP" : "VIP Card Types"}
                </DialogTitle>
                <DialogDescription className="text-[12px] text-gray-600 dark:text-white/30">
                  {isKh ? "កែប្រែ ឬ បន្ថែមប្រភេទកាត" : "Edit or add card types"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-6 py-5 space-y-3 max-h-[60vh] overflow-y-auto">
            <button
              type="button"
              onClick={addNewTier}
              className={cn(
                "w-full h-10 rounded-xl border-2 border-dashed text-[14px] font-bold",
                "flex items-center justify-center gap-2 transition-all",
                AC.border, AC.text, "hover:bg-[#03624C]/[0.05]"
              )} >
              <Plus className="w-4 h-4" />
              {isKh ? "បន្ថែមប្រភេទថ្មី" : "Add New Card Type"}
            </button>
            {local.map((tier, idx) => (
              <div key={tier.id} className="rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ background: `${tier.accentColor}12` }} >
                  <TierIcon icon={tier.icon} size={16} color={tier.color} />
                  <span className="text-[14px] font-semibold" style={{ color: tier.color }}>
                    {isKh ? (tier.nameKh || tier.name || `ប្រភេទ ${idx + 1}`) : (tier.name || `Card Type ${idx + 1}`)}
                  </span>
                  <span className="text-[14px] text-gray-600 dark:text-white/30 ml-auto">
                    {isKh ? tier.name : tier.nameKh}
                  </span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3 bg-gray-50 dark:bg-white/[0.02]">
                  <div>
                    <label className="text-[14px] text-gray-600 dark:text-white/30 block mb-1">
                      {isKh ? "ឈ្មោះ (EN)" : "Name (EN)"}
                    </label>
                    <input
                      className={cinp}
                      value={tier.name}
                      onChange={e => update(tier.id, "name", e.target.value)}
                      placeholder="Gold"
                    />
                  </div>
                  <div>
                    <label className="text-[14px] text-gray-600 dark:text-white/30 block mb-1">
                      {isKh ? "ឈ្មោះ (KH)" : "Name (KH)"}
                    </label>
                    <input
                      className={cinp}
                      value={tier.nameKh}
                      onChange={e => update(tier.id, "nameKh", e.target.value)}
                      placeholder="មាស"
                    />
                  </div>
                  <div>
                    <label className="text-[14px] text-gray-600 dark:text-white/30 block mb-1">
                      {isKh ? "ការបញ្ចុះតម្លៃ (%)" : "Discount (%)"}
                    </label>
                    <input
                      className={cinp}
                      type="number" min="1" max="50"
                      value={tier.discount}
                      onChange={e => update(tier.id, "discount", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="text-[14px] text-gray-600 dark:text-white/30 block mb-1">
                      {isKh ? "ដំឡើងកំរឹត (ចូល)" : "Upgrade At (visits)"}
                    </label>
                    <input
                      className={cinp}
                      type="number" min="0"
                      placeholder={isKh ? "ចូល..." : "visits..."}
                      value={tier.maxVisits ?? ""}
                      onChange={e =>
                        update(tier.id, "maxVisits", e.target.value ? parseInt(e.target.value) : null)
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[14px] text-gray-600 dark:text-white/30 block mb-1">
                      {isKh ? "រូបតំណាង" : "Icon"}
                    </label>
                    <div className="flex gap-2">
                      {ICONS.map(ic => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => update(tier.id, "icon", ic)}
                          className={cn(
                            "w-8 h-8 rounded-lg border flex items-center justify-center transition-all",
                            tier.icon === ic
                              ? "border-[#03624C] dark:border-[#03624C] bg-[#03624C]/[0.07]"
                              : "border-gray-200 dark:border-white/[0.08]"
                          )} >
                          <TierIcon icon={ic} size={13} color={tier.color} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[14px] text-gray-600 dark:text-white/30 block mb-1">
                      {isKh ? "ពណ៌កាត" : "Card Color"}
                    </label>
                    <div className="flex gap-2">
                      {COLORS.map((c, ci) => (
                        <button
                          key={ci}
                          type="button"
                          onClick={() => {
                            setLocal(prev => prev.map(t =>
                              t.id === tier.id
                                ? { ...t, color: c.color, accentColor: c.accent, bgFrom: c.bg, bgTo: c.bgTo }
                                : t
                            ))
                          }}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            tier.color === c.color
                              ? "border-white scale-110 shadow-md"
                              : "border-transparent scale-90"
                          )}
                          style={{ background: c.color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {local.length > 1 && (
                  <div className="px-4 py-2 border-t border-gray-100 dark:border-white/[0.06] flex justify-end bg-white dark:bg-[#1e2235]">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(tier)}
                      className="text-[14px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1" >
                      <Trash2 className="w-3 h-3" />
                      {isKh ? "លុបប្រភេទនេះ" : "Remove type"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-xl text-[14px] font-bold border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all" >
              {isKh ? "បោះបង់" : "Cancel"}
            </button>
            <button
              onClick={() => { if (isDirty) { onSave(local); onClose() } }}
              disabled={!isDirty}
              className={cn(
                "h-9 px-5 rounded-xl text-[14px] font-bold text-white flex items-center gap-1.5 transition-all",
                isDirty
                  ? "bg-[#03624C] hover:opacity-90 cursor-pointer"
                  : "bg-gray-300 dark:bg-white/[0.10] text-gray-600 dark:text-white/25 cursor-not-allowed opacity-60"
              )} >
              <Check className="w-3.5 h-3.5" />
              {isKh ? "រក្សាទុក" : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v: boolean) => { if (!v) setDeleteTarget(null) }}
        onConfirm={confirmDelete}
        variant="danger"
        title={isKh ? "លុបប្រភេទកាតនេះ?" : "Remove this card type?"}
        description={
          isKh
            ? "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។ សូមប្រាកដថាមិនមានទិន្នន័យសំខាន់ត្រូវបានប៉ះពាល់។"
            : "This action cannot be undone. Make sure no important data depends on this card type."
        }
        highlight={deleteTarget ? (isKh ? deleteTarget.nameKh || deleteTarget.name : deleteTarget.name || deleteTarget.nameKh) : undefined}
        confirmLabel={isKh ? "លុប" : "Delete"}
        cancelLabel={isKh ? "បោះបង់" : "Cancel"}
      />
    </>
  )
}