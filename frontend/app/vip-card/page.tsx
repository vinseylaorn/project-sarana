"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { DataTableCustom } from "@/components/ui/table"
import {
   Dialog, DialogContent, DialogHeader, DialogTitle,
   DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
   Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
   Search, Plus, Eye, EyeOff, Trash2, AlertTriangle, TrendingUp,
   Crown, CreditCard, Settings2, Filter,
   Calendar, RotateCcw, Loader2, ArrowUpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { toastSuccess, toastError } from "@/lib/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { VipCardSummary } from "@/components/vip-card/summary"
import { UpgradeLogDialog } from "@/components/vip-card/upgrade-log"
import { CardTypesDialog } from "@/components/vip-card/card-types"
import { ExtendDialog } from "@/components/vip-card/extend"
import { CardVisual, PrintCardButton } from "@/components/vip-card/card-print"
import { TierIcon } from "@/components/vip-card/tier-icon"
import { IssueCardDialog } from "@/components/vip-card/issuevipcard"
import type { VipTier, VipCard } from "@/types/vipcard"

import {
   SORA,
   getTierById, isCardExpired,
} from "@/components/vip-card/types"

import {
   useVipTiers, useVipCards, useVipCardStats, useVipUpgradeLogs, useVipCardMutations,
} from "@/hooks/vipcard/use-vipcard"

const ACCENT_CLASS = {
   text: "text-[#03624C] dark:text-[#1857D8]",
   bg: "bg-[#03624C] dark:bg-[#1857D8]",
   border: "border-[#03624C]/30 dark:border-[#1857D8]/30",
   iconBg: "bg-[#03624C] dark:bg-[#1857D8]",
}

const SEL_T =
   "h-9 rounded-lg border border-gray-200/80 dark:border-white/[0.08] " +
   "bg-white dark:bg-[#22263a] text-[14px] font-medium " +
   "text-gray-700 dark:text-white/70 shadow-sm dark:shadow-none " +
   "focus:ring-0 focus:ring-offset-0 transition-all"

const SEL_C =
   "rounded-xl border border-gray-100 dark:border-white/[0.10] " +
   "bg-white dark:bg-[#22263a] shadow-lg p-1"

const SEL_I =
   "text-[14px] font-medium rounded-lg cursor-pointer " +
   "text-gray-700 dark:text-white/70 " +
   "focus:bg-[#03624C]/10 dark:focus:bg-[#03624C]/10 " +
   "focus:text-[#03624C] dark:focus:text-[#03624C]"

const ITEMS_PER_PAGE = 10

const UNKNOWN_TIER: VipTier = {
   id: -1,
   name: "Unknown",
   nameKh: "មិនស្គាល់",
   icon: "star",
   color: "#9ca3af",
   accentColor: "#9ca3af",
   discount: 0,
   minVisits: 0,
   maxVisits: null,
} as VipTier

function safeTier(tiers: VipTier[], tierId: number): VipTier {
   return getTierById(tiers, tierId) ?? UNKNOWN_TIER
}

function UpgradeCardDialog({ open, onClose, card, tiers, onUpgrade, isKh }: {
   open: boolean
   onClose: () => void
   card: VipCard | null
   tiers: VipTier[]
   onUpgrade: (cardId: number, toTierId: number) => Promise<void>
   isKh: boolean
}) {
   const [loading, setLoading] = useState(false)
   if (!card) return null

   const currentTier = safeTier(tiers, card.tierId)
   const sortedTiers = [...tiers].sort((a, b) => a.minVisits - b.minVisits)
   const currentIndex = sortedTiers.findIndex(t => t.id === card.tierId)
   const upgradableTo = sortedTiers.slice(currentIndex + 1)
   const canUpgrade = currentTier?.maxVisits != null
      && currentTier.maxVisits > 0
      && card.totalVisits >= currentTier.maxVisits

   async function handleConfirm(toTierId: number) {
      setLoading(true)
      try { await onUpgrade(card!.id, toTierId); onClose() }
      finally { setLoading(false) }
   }

   return (
      <Dialog open={open} onOpenChange={onClose}>
         <DialogContent
            className="max-w-[420px] p-0 border border-gray-200 dark:border-white/[0.10] shadow-2xl rounded-2xl bg-white dark:bg-[#1e2235] [&>button]:hidden"
            style={SORA} >
            <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] rounded-t-2xl">
               <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/20">
                     <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                     <DialogTitle className="text-[14px] text-gray-800 dark:text-white/90">
                        {isKh ? "ដំឡើងកំរឹតកាត" : "Upgrade Card Tier"}
                     </DialogTitle>
                     <DialogDescription className="text-[12px] text-gray-600 dark:text-white/30 font-mono">
                        {card.code}
                     </DialogDescription>
                  </div>
               </div>
            </DialogHeader>
            <div className="px-6 py-5 space-y-4">
               <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: `${currentTier?.accentColor}22`, border: `1px solid ${currentTier?.accentColor}44` }}>
                     <TierIcon icon={currentTier?.icon ?? "star"} size={14} color={currentTier?.color ?? "#03624C"} />
                  </div>
                  <div className="flex-1">
                     <p className="text-[12px]  text-gray-700 dark:text-white/70">
                        {isKh ? (currentTier?.nameKh || currentTier?.name) : currentTier?.name} · {card.totalVisits} {isKh ? "ចូល" : "visits"}
                     </p>
                     <p className="text-[10px] text-gray-600 dark:text-white/30">
                        {isKh ? "maxVisits" : "Max visits"}: {currentTier?.maxVisits ?? "∞"}
                     </p>
                  </div>
                  {currentTier?.maxVisits && (
                     <p className={cn("text-[11px] font-black", canUpgrade ? "text-emerald-500" : "text-amber-500")}>
                        {canUpgrade ? "✅ Ready!" : `${card.totalVisits}/${currentTier.maxVisits}`}
                     </p>
                  )}
               </div>

               {!canUpgrade && (
                  <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                     <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                     <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                        {isKh
                           ? `កាតត្រូវការ ${currentTier?.maxVisits} ចូលទើប Upgrade បាន (បច្ចុប្បន្ន: ${card.totalVisits})`
                           : `Card needs ${currentTier?.maxVisits} visits to upgrade (current: ${card.totalVisits})`}
                     </p>
                  </div>
               )}
               {canUpgrade && (
                  <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                     <CreditCard className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                     <p className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
                        {isKh
                           ? `កាត ${card.code} នឹង Paused ហើយ Card ថ្មីនឹងចេញ tier ថ្មី។`
                           : `Card ${card.code} will be paused and a new card will be issued with the new tier.`}
                     </p>
                  </div>
               )}
               {canUpgrade && upgradableTo.length > 0 && (
                  <div>
                     <label className="text-[14px] text-gray-600 dark:text-white/30 block mb-2">
                        {isKh ? "ជ្រើស Tier ថ្មី" : "Select New Tier"}
                     </label>
                     <div className="space-y-2">
                        {upgradableTo.map(t => (
                           <button key={t.id} type="button"
                              onClick={() => handleConfirm(t.id)}
                              disabled={loading}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all border-gray-200 dark:border-white/[0.08] hover:border-emerald-400 dark:hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 disabled:opacity-60"
                           >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                 style={{ background: `${t.accentColor}22`, border: `1px solid ${t.accentColor}44` }}>
                                 <TierIcon icon={t.icon} size={14} color={t.color} />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-1.5">
                                    <span className="text-[12px]  text-gray-800 dark:text-white/90">
                                       {isKh ? (t.nameKh || t.name) : t.name}
                                    </span>
                                    <span className="text-[10px] text-gray-600 dark:text-white/30">
                                       ({isKh ? t.name : t.nameKh})
                                    </span>
                                 </div>
                                 <p className="text-[10px] text-gray-600 dark:text-white/30 mt-0.5">
                                    {t.discount}% off · {isKh ? "ចូល" : "visits"} {t.minVisits}{t.maxVisits ? `–${t.maxVisits}` : "+"}
                                 </p>
                              </div>
                              {loading
                                 ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500 shrink-0" />
                                 : <ArrowUpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                              }
                           </button>
                        ))}
                     </div>
                  </div>
               )}
            </div>
            <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-2xl">
               <button onClick={onClose} disabled={loading}
                  className="h-9 px-5 rounded-xl text-[12px] border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all disabled:opacity-50">
                  {isKh ? "បិទ" : "Close"}
               </button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   )
}

function ViewDialog({ open, onClose, card, tiers, isKh }: {
   open: boolean; onClose: () => void; card: VipCard | null; tiers: VipTier[]; isKh: boolean
}) {
   if (!card) return null
   const tier = safeTier(tiers, card.tierId)
   const expired = isCardExpired(card)
   return (
      <Dialog open={open} onOpenChange={onClose}>
         <DialogContent
            className="max-w-[460px] p-0 border border-gray-200 dark:border-white/[0.10] shadow-2xl rounded-2xl bg-white dark:bg-[#1e2235] [&>button]:hidden"
            style={SORA} >
            <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] rounded-t-2xl">
               <div className="flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", ACCENT_CLASS.iconBg)}>
                     <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <div>
                     <DialogTitle className="text-[16px] text-gray-800 dark:text-white/90">
                        {isKh ? "ព័ត៌មានកាត VIP" : "VIP Card Details"}
                     </DialogTitle>
                     <DialogDescription className="text-[12px] text-gray-600 dark:text-white/30 font-mono">
                        {card.code}
                     </DialogDescription>
                  </div>
               </div>
            </DialogHeader>
            <div className="px-6 py-5 space-y-3">
               <CardVisual card={card} tier={tier} />
               {[
                  { label: isKh ? "លេខកូដ" : "Card Code", value: card.code },
                  {
                     label: isKh ? "ប្រភេទកាត" : "Card Type",
                     value: isKh
                        ? `${tier.nameKh || tier.name} (${tier.name}) — ${tier.discount}% off`
                        : `${tier.name} (${tier.nameKh}) — ${tier.discount}% off`
                  },
                  { label: isKh ? "ចូលសរុប" : "Total Visits", value: `${card.totalVisits} ដង` },
                  { label: isKh ? "ចូល/ខែ" : "Used/Month", value: `${card.usedThisMonth} ដង` },
                  { label: isKh ? "ថ្ងៃចេញ" : "Issued At", value: card.issuedAt },
                  { label: isKh ? "ផុតសពលភាព" : "Expires At", value: card.expiresAt ?? (isKh ? "គ្មានកំណត់" : "No expiry") },
                  { label: isKh ? "កំណត់ចំណាំ" : "Note", value: card.note || "—" },
               ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                     <span className="text-[12px] text-gray-600 dark:text-white/30 w-28 shrink-0">{label}</span>
                     <span className="text-[14px]  text-gray-800 dark:text-white/85">{value}</span>
                  </div>
               ))}
               <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                  <span className="text-[12px] text-gray-600 dark:text-white/30 w-28 shrink-0">
                     {isKh ? "ស្ថានភាព" : "Status"}
                  </span>
                  <span className={cn(
                     "inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border",
                     expired
                        ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300"
                        : card.isActive
                           ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                           : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-300"
                  )}>
                     <span className={cn("w-1.5 h-1.5 rounded-full",
                        expired ? "bg-amber-400" : card.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                     {expired ? (isKh ? "ផុតកំណត់" : "Expired") : card.isActive ? (isKh ? "សកម្ម" : "Active") : (isKh ? "ផ្អាក" : "Paused")}
                  </span>
               </div>
            </div>
            <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-2xl gap-2">
               <PrintCardButton card={card} tier={tier} isKh={isKh} />
               <button onClick={onClose}
                  className="h-9 px-5 rounded-xl text-[14px] border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all">
                  {isKh ? "បិទ" : "Close"}
               </button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   )
}

export default function VipCardPage() {
   const { i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"

   const { data: tiers = [], isLoading: loadingTiers, isFetching: fetchingTiers } = useVipTiers()
   const { data: cards = [], isLoading: loadingCards, isFetching: fetchingCards } = useVipCards()
   const { data: stats = { total: 0, active: 0, expired: 0, paused: 0 }, isLoading: loadingStats, isFetching: fetchingStats } = useVipCardStats()
   const { data: upgradeHistory = [], isLoading: loadingLogs, isFetching: fetchingLogs } = useVipUpgradeLogs()
   const {
      issueCard, toggleActive, extendCard, upgradeCard, deleteCard, saveTiers,
   } = useVipCardMutations()

   const pageLoading = loadingTiers || loadingCards || loadingStats || loadingLogs
   const isFetching = fetchingTiers || fetchingCards || fetchingStats || fetchingLogs
   const showInitialLoading = pageLoading && (tiers.length === 0 || (cards.length === 0 && tiers.length === 0))

   const [search, setSearch] = useState("")
   const [filterTier, setFilterTier] = useState("all")
   const [currentPage, setCurrentPage] = useState(1)
   const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" })
   const [historyOpen, setHistoryOpen] = useState(false)
   const [issueOpen, setIssueOpen] = useState(false)
   const [tierOpen, setTierOpen] = useState(false)
   const [viewOpen, setViewOpen] = useState(false)
   const [viewCard, setViewCard] = useState<VipCard | null>(null)
   const [deleteOpen, setDeleteOpen] = useState(false)
   const [deleteCardItem, setDeleteCardItem] = useState<VipCard | null>(null)
   const [extendOpen, setExtendOpen] = useState(false)
   const [extendCardItem, setExtendCardItem] = useState<VipCard | null>(null)
   const [upgradeOpen, setUpgradeOpen] = useState(false)
   const [upgradeCardItem, setUpgradeCardItem] = useState<VipCard | null>(null)

   const processedData = useMemo(() => {
      let result = cards.filter(c => {
         const matchSearch = c.code.toLowerCase().includes(search.toLowerCase()) ||
            c.note.toLowerCase().includes(search.toLowerCase())
         const matchTier = filterTier === "all" || c.tierId === parseInt(filterTier)
         return matchSearch && matchTier
      })
      if (sortConfig.key) {
         result = [...result].sort((a: any, b: any) => {
            const dir = sortConfig.direction === "asc" ? 1 : -1
            return a[sortConfig.key!] < b[sortConfig.key!] ? -dir : a[sortConfig.key!] > b[sortConfig.key!] ? dir : 0
         })
      }
      return result
   }, [cards, search, filterTier, sortConfig])

   const hasActiveFilter = search || filterTier !== "all"

   async function handleIssue(tierId: number, note: string, expiresAt: string | null, monthlyLimit: number) {
      try {
         const res = await issueCard.mutateAsync({ tierId, note, expiresAt, monthlyLimit })
         toastSuccess(
            isKh ? "បញ្ចេញកាតបានជោគជ័យ" : "Card issued",
            isKh ? `កាត ${res.data.code} បានបញ្ចេញ` : `Card ${res.data.code} issued`
         )
      } catch (e: any) {
         toastError(
            isKh ? "បញ្ចេញកាតមិនបាន" : "Failed to issue card",
            isKh ? "អ្នកមិនមានសិទ្ធិសម្រាប់សកម្មភាពនេះ" : (e?.message ?? "You do not have permission for this action")
         )
      }
   }

   async function handleToggleActive(card: VipCard) {
      try {
         const res = await toggleActive.mutateAsync(card)
         toastSuccess(
            res.data.isActive ? (isKh ? "កាតសកម្ម" : "Card activated") : (isKh ? "កាតត្រូវបានផ្អាក" : "Card paused"),
            card.code
         )
      } catch (e: any) {
         toastError(isKh ? "មានបញ្ហា" : "Error", e.message)
      }
   }

   async function handleExtend(cardId: number, newExpiry: string | null, newMonthlyLimit: number) {
      try {
         const card = cards.find(c => c.id === cardId)
         await extendCard.mutateAsync({ cardId, newExpiry, newMonthlyLimit })
         toastSuccess(isKh ? "បន្តសពលភាពបានជោគជ័យ" : "Expiry extended", card?.code ?? "")
      } catch (e: any) {
         toastError(isKh ? "មានបញ្ហា" : "Error", e.message)
      }
   }

   async function handleUpgrade(cardId: number, toTierId: number) {
      try {
         const res = await upgradeCard.mutateAsync({ cardId, toTierId })
         const { newCard, oldCard } = res.data
         toastSuccess(
            isKh ? "Upgrade បានជោគជ័យ" : "Card Upgraded",
            isKh
               ? `${oldCard.code} → ${newCard.code} (${newCard.tierName})`
               : `${oldCard.code} archived → new card ${newCard.code}`
         )
      } catch (e: any) {
         toastError(isKh ? "មានបញ្ហា" : "Error", e.message)
      }
   }

   async function handleDelete() {
      if (!deleteCardItem) return
      try {
         await deleteCard.mutateAsync(deleteCardItem.id)
         toastSuccess(isKh ? "លុបបានជោគជ័យ" : "Deleted", deleteCardItem.code)
         setDeleteOpen(false)
         setDeleteCardItem(null)
      } catch (e: any) {
         toastError(isKh ? "មានបញ្ហា" : "Error", e.message)
      }
   }

   async function handleSaveTiers(updated: VipTier[]) {
      try {
         await saveTiers.mutateAsync(updated)
         toastSuccess(isKh ? "រក្សាទុកបានជោគជ័យ" : "Saved", isKh ? "ប្រភេទកាតត្រូវបានធ្វើបច្ចុប្បន្នភាព" : "Card types updated")
      } catch (e: any) {
         toastError(isKh ? "មានបញ្ហា" : "Error", e.message)
      }
   }

   const columns = [
      {
         key: "no", header: isKh ? "ល.រ" : "No.",
         render: (_: any, i: number) => (
            <span className="text-[14px] text-gray-600 dark:text-white/25 font-mono tabular-nums">
               {String((currentPage - 1) * ITEMS_PER_PAGE + i + 1).padStart(2, "0")}
            </span>
         ),
      },
      {
         key: "code", header: isKh ? "លេខកូដ" : "Card Code", sortable: true,
         render: (item: VipCard) => {
            const tier = safeTier(tiers, item.tierId)
            const expired = isCardExpired(item)
            return (
               <div className="flex items-center gap-2.5 py-0.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: `${tier.accentColor}22`, border: `1px solid ${tier.accentColor}44`, opacity: expired ? 0.5 : 1 }}>
                     <TierIcon icon={tier.icon} size={12} color={tier.color} />
                  </div>
                  <div>
                     <p className="text-[14px] text-gray-800 dark:text-white/90 font-mono tracking-widest">{item.code}</p>
                     {item.note && <p className="text-[14px] text-gray-600 dark:text-white/30">{item.note}</p>}
                  </div>
               </div>
            )
         },
      },
      {
         key: "tierId", header: isKh ? "ប្រភេទ" : "Type",
         render: (item: VipCard) => {
            const tier = safeTier(tiers, item.tierId)
            return (
               <span className="inline-flex items-center gap-1.5 text-[12px]  px-2 py-1 rounded-full border"
                  style={{ background: `${tier.accentColor}15`, borderColor: `${tier.accentColor}33`, color: tier.color }}>
                  <TierIcon icon={tier.icon} size={10} color={tier.color} />
                  {isKh ? (tier.nameKh || tier.name) : tier.name} · {tier.discount}%
               </span>
            )
         },
      },
      {
         key: "totalVisits", header: isKh ? "ចូលសរុប" : "Visits", sortable: true,
         render: (item: VipCard) => {
            const tier = safeTier(tiers, item.tierId)
            const sortedTiers = [...tiers].sort((a, b) => a.minVisits - b.minVisits)
            const nextTier = sortedTiers.find(t => t.minVisits > tier.minVisits)
            const canUpgrade = item.isActive && tier.maxVisits != null && tier.maxVisits > 0 && item.totalVisits >= tier.maxVisits
            const showProgress = item.isActive && !canUpgrade && tier.maxVisits != null && tier.maxVisits > 0
            const progress = showProgress ? Math.min((item.totalVisits - tier.minVisits + 1) / (tier.maxVisits! - tier.minVisits + 1) * 100, 100) : 0
            const remaining = showProgress ? tier.maxVisits! - item.totalVisits : 0

            return (
               <div className="min-w-[100px]">
                  <div className="flex items-center gap-1.5 mb-1">
                     <span className="text-[14px] text-gray-700 dark:text-white/70">{item.totalVisits}</span>
                     <span className="text-[14px] text-gray-600 dark:text-white/30">
                        {tier.maxVisits && tier.maxVisits > 0 ? `/ ${tier.maxVisits}` : "∞"}
                     </span>
                  </div>
                  {canUpgrade && nextTier && (
                     <button onClick={() => { setUpgradeCardItem(item); setUpgradeOpen(true) }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 w-fit hover:bg-emerald-500/20 transition-all">
                        <TrendingUp className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                        <span className="text-[14px] font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap uppercase tracking-wide">
                           → {isKh ? "ដំឡើងទៅ" : "Upgrade"} {isKh ? (nextTier.nameKh || nextTier.name) : nextTier.name}
                        </span>
                     </button>
                  )}
                  {canUpgrade && !nextTier && (
                     <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#34d399]/10 border border-[#34d399]/25 w-fit">
                        <Crown className="w-2.5 h-2.5 text-[#34d399] shrink-0" />
                        <span className="text-[14px] font-black text-[#34d399] whitespace-nowrap uppercase tracking-wide">
                           {isKh ? "កំរិតខ្ពស់" : "Max Tier"}
                        </span>
                     </div>
                  )}
                  {showProgress && nextTier && (
                     <div>
                        <div className="h-1 rounded-full bg-gray-100 dark:bg-white/[0.07] overflow-hidden w-full">
                           <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: tier.accentColor }} />
                        </div>
                        <span className="text-[12px] text-gray-600 dark:text-white/25 mt-0.5 block">
                           {isKh ? `ខ្វះ ${remaining} ដង → ${nextTier.nameKh || nextTier.name}` : `${remaining} more → ${nextTier.name}`}
                        </span>
                     </div>
                  )}
               </div>
            )
         },
      },
      {
         key: "usedThisMonth", header: isKh ? "ប្រើ/ខែ" : "Used/Mo", sortable: true,
         render: (item: VipCard) => {
            const tier = safeTier(tiers, item.tierId)
            const limit = item.monthlyLimit
            if (!limit || limit <= 0) return <span className="text-[14px] text-gray-500 dark:text-white/20">—</span>
            const usage = item.usedThisMonth / limit
            return (
               <div className="flex items-center gap-2 min-w-[90px]">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.07] overflow-hidden">
                     <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(usage * 100, 100)}%`, background: usage >= 1 ? "#ef4444" : tier.accentColor }} />
                  </div>
                  <span className="text-[14px] text-gray-600 dark:text-white/30 whitespace-nowrap tabular-nums">
                     {item.usedThisMonth}/{limit}
                  </span>
               </div>
            )
         },
      },
      {
         key: "expiresAt", header: isKh ? "ផុតថ្ងៃ" : "Expires", sortable: true,
         render: (item: VipCard) => {
            const expired = isCardExpired(item)
            if (!item.expiresAt) return <span className="text-[14px] text-gray-600 dark:text-white/20">—</span>
            return (
               <span className={cn("text-[14px] font-medium flex items-center gap-1",
                  expired ? "text-rose-500 dark:text-rose-400" : "text-gray-600 dark:text-white/30")}>
                  {expired && <AlertTriangle className="w-3 h-3" />}
                  {item.expiresAt}
               </span>
            )
         },
      },
      {
         key: "isActive", header: isKh ? "ស្ថានភាព" : "Status",
         render: (item: VipCard) => {
            const expired = isCardExpired(item)
            return (
               <span className={cn(
                  "inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border",
                  expired
                     ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300"
                     : item.isActive
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-300"
               )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full",
                     expired ? "bg-amber-400" : item.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                  {expired ? (isKh ? "ផុតកំណត់" : "Expired") : item.isActive ? (isKh ? "សកម្ម" : "Active") : (isKh ? "ផ្អាក" : "Paused")}
               </span>
            )
         },
      },
      {
         key: "actions", header: isKh ? "សកម្មភាព" : "Actions", className: "text-right",
         render: (item: VipCard) => {
            const tier = safeTier(tiers, item.tierId)
            const canUpgrade = item.isActive && tier.maxVisits != null && tier.maxVisits > 0 && item.totalVisits >= tier.maxVisits
            return (
               <div className="flex items-center justify-end gap-1.5">
                  <button
                     onClick={() => { setViewCard(item); setViewOpen(true) }}
                     className="w-[30px] h-[30px] flex items-center justify-center rounded-lg text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-700/40 dark:hover:bg-blue-900/40 dark:hover:border-blue-500 transition-all duration-150"
                     title={isKh ? "មើលកាត" : "View Card"} >
                     <Eye className="w-3.5 h-3.5" />
                  </button>
                  {canUpgrade && (
                     <button
                        onClick={() => { setUpgradeCardItem(item); setUpgradeOpen(true) }}
                        className="w-[30px] h-[30px] flex items-center justify-center rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700/40 dark:hover:bg-emerald-900/40 dark:hover:border-emerald-500 transition-all duration-150"
                        title={isKh ? "ដំឡើងកំរឹត" : "Upgrade Tier"}
                     >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                     </button>
                  )}
                  <button
                     onClick={() => { setExtendCardItem(item); setExtendOpen(true) }}
                     className="w-[30px] h-[30px] flex items-center justify-center rounded-lg text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 hover:border-violet-300 dark:text-violet-300 dark:bg-violet-900/20 dark:border-violet-700/40 dark:hover:bg-violet-900/40 dark:hover:border-violet-500 transition-all duration-150"
                     title={isKh ? "បន្តសពលភាព" : "Extend Expiry"} >
                     <Calendar className="w-3.5 h-3.5" />
                  </button>
                  <button
                     onClick={() => handleToggleActive(item)}
                     className="w-[30px] h-[30px] flex items-center justify-center rounded-lg text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-700/40 dark:hover:bg-amber-900/40 dark:hover:border-amber-500 transition-all duration-150"
                     title={item.isActive ? (isKh ? "ផ្អាក" : "Pause") : (isKh ? "ធ្វើឱ្យសកម្ម" : "Activate")} >
                     {item.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                     onClick={() => { setDeleteCardItem(item); setDeleteOpen(true) }}
                     className="w-[30px] h-[30px] flex items-center justify-center rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-700/40 dark:hover:bg-rose-900/40 dark:hover:border-rose-500 transition-all duration-150"
                     title={isKh ? "លុបចោល" : "Delete"} >
                     <Trash2 className="w-3.5 h-3.5" />
                  </button>
               </div>
            )
         },
      },
   ]

   return (
      <div className="flex h-screen bg-gray-50 dark:bg-[#13151f] overflow-hidden transition-colors duration-300" style={SORA}>
         <AnimatePresence>
            {isFetching && !pageLoading && (
               <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left", ACCENT_CLASS.bg)}
               />
            )}
         </AnimatePresence>
         <Sidebar />
         <div className="flex-1 flex flex-col overflow-hidden">
            <Header
               title={isKh ? "គ្រប់គ្រងកាតសមាជិក VIP" : "VIP Card Management"}
               subtitle={isKh ? "បញ្ចេញ និង គ្រប់គ្រង VIP Cards ទាំងអស់" : "Issue and manage all anonymous VIP cards"}
            />
            {showInitialLoading ? (
               <div className="flex-1 flex items-center justify-center flex-col gap-4">
                  <Loader2 className={cn("w-5 h-5 animate-spin", ACCENT_CLASS.text)} />
                  <span className={cn("text-[11px] uppercase tracking-[0.2em] animate-pulse", ACCENT_CLASS.text)}>
                     {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
                  </span>
               </div>
            ) : (
               <main className="flex-1 p-5 space-y-4 overflow-hidden flex flex-col">

                  <VipCardSummary
                     total={stats.total}
                     active={stats.active}
                     expired={stats.expired}
                     paused={stats.paused}
                     isKh={isKh}
                  />
                  <motion.div
                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.2 }}
                     className="flex flex-wrap gap-2 items-center justify-between shrink-0" >
                     <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white/25 pointer-events-none" />
                           <input
                              className="w-56 h-9 pl-8 pr-3 text-[14px] rounded-lg outline-none transition-all bg-white dark:bg-[#22263a] border border-gray-200/80 dark:border-white/[0.08] text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/20 shadow-sm focus:border-[#03624C] dark:focus:border-[#1857D8] focus:ring-2 focus:ring-[#03624C]/10 dark:focus:ring-[#1857D8]/10"
                              placeholder={isKh ? "ស្វែងរកលេខ" : "Search by code or note"}
                              value={search}
                              onChange={e => setSearch(e.target.value)}
                           />
                        </div>
                        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07] shrink-0" />
                        <Select value={filterTier} onValueChange={v => { setFilterTier(v); setCurrentPage(1) }}>
                           <SelectTrigger className={cn(SEL_T, "w-44")} style={SORA}>
                              <Filter className={cn("w-3.5 h-3.5 mr-1.5 shrink-0", ACCENT_CLASS.text)} />
                              <SelectValue placeholder={isKh ? "ប្រភេទ" : "Card Type"} />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="all" className={SEL_I}>{isKh ? "ប្រភេទទាំងអស់" : "All Types"}</SelectItem>
                              {tiers.map(t => (
                                 <SelectItem key={t.id} value={String(t.id)} className={SEL_I}>
                                    {isKh ? (t.nameKh || t.name) : t.name} — {t.discount}%
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <AnimatePresence>
                           {hasActiveFilter && (
                              <motion.button
                                 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                 onClick={() => { setSearch(""); setFilterTier("all") }}
                                 className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all">
                                 <RotateCcw className="w-3.5 h-3.5" />
                              </motion.button>
                           )}
                        </AnimatePresence>
                     </div>
                     <div className="flex items-center gap-2">
                        <button onClick={() => setHistoryOpen(true)}
                           className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:bg-[#22263a] dark:hover:bg-white/[0.06] transition-all">
                           <TrendingUp className="w-3.5 h-3.5" />
                           {isKh ? "ប្រវត្តិUpgrade" : "Upgrade Log"}
                        </button>
                        <button onClick={() => setTierOpen(true)}
                           className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] border border-gray-200 dark:bg-[#22263a] dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all">
                           <Settings2 className="w-3.5 h-3.5" />
                           {isKh ? "ប្រភេទកាត" : "Card Types"}
                        </button>
                        <button onClick={() => setIssueOpen(true)}
                           className={cn("h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] text-white transition-all active:scale-[0.97] hover:opacity-90 shadow-md", ACCENT_CLASS.bg)}>
                           <Plus className="w-3.5 h-3.5" />
                           {isKh ? "បញ្ចេញកាតថ្មី" : "Issue Card"}
                        </button>
                     </div>
                  </motion.div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.28 }}
                     className="flex-1 overflow-hidden" >
                     <Card className="h-full border-0 shadow-none bg-transparent flex flex-col">
                        <DataTableCustom
                           data={processedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)}
                           columns={columns}
                           currentPage={currentPage}
                           totalPages={Math.ceil(processedData.length / ITEMS_PER_PAGE) || 1}
                           onPageChange={setCurrentPage}
                           totalItems={processedData.length}
                           sortConfig={sortConfig}
                           onSort={key => setSortConfig(prev => ({
                              key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
                           }))}
                           itemsPerPage={ITEMS_PER_PAGE}
                           language={i18n.language as any}
                        />
                     </Card>
                  </motion.div>
               </main>
            )}
         </div>
         <IssueCardDialog open={issueOpen} onClose={() => setIssueOpen(false)} tiers={tiers} onIssue={handleIssue} isKh={isKh} />
         <CardTypesDialog open={tierOpen} onClose={() => setTierOpen(false)} tiers={tiers} onSave={handleSaveTiers} isKh={isKh} />
         <ViewDialog open={viewOpen} onClose={() => setViewOpen(false)} card={viewCard} tiers={tiers} isKh={isKh} />
         <UpgradeLogDialog open={historyOpen} onClose={() => setHistoryOpen(false)} logs={upgradeHistory} tiers={tiers} isKh={isKh} />
         <ExtendDialog open={extendOpen} onClose={() => setExtendOpen(false)} card={extendCardItem} onExtend={handleExtend} isKh={isKh} />
         <UpgradeCardDialog
            open={upgradeOpen} onClose={() => { setUpgradeOpen(false); setUpgradeCardItem(null) }}
            card={upgradeCardItem} tiers={tiers} onUpgrade={handleUpgrade} isKh={isKh}
         />
         <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onConfirm={handleDelete}
            loading={deleteCard.isPending}
            variant="danger"
            icon={Trash2}
            title={isKh ? "បញ្ជាក់ការលុប" : "Confirm Delete"}
            description={isKh ? "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។" : "This action cannot be undone."}
            highlight={deleteCardItem?.code}
            confirmLabel={isKh ? "លុបចោល" : "Delete"}
            cancelLabel={isKh ? "បោះបង់" : "Cancel"}
         />
      </div>
   )
}