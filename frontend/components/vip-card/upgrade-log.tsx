"use client"

import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { TierIcon } from "./tier-icon"
import { SORA, AC } from "./types"
import type { UpgradeLog, VipTier } from "./types"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { Search, TrendingUp, RotateCcw, ArrowRight, CreditCard } from "lucide-react"
import {Dialog, DialogContent, DialogHeader,DialogTitle, DialogFooter, DialogDescription,} from "@/components/ui/dialog"

interface UpgradeLogDialogProps {
  open:    boolean
  onClose: () => void
  logs:    UpgradeLog[]
  tiers:   VipTier[]
  isKh:    boolean
}

export function UpgradeLogDialog({
  open, onClose, logs, tiers, isKh,
}: UpgradeLogDialogProps) {
  const [search,   setSearch]   = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo,   setDateTo]   = useState("")

  useEffect(() => {
    if (open) { setSearch(""); setDateFrom(""); setDateTo("") }
  }, [open])

  const filtered = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = !search ||
        log.cardCode.toLowerCase().includes(search.toLowerCase())           ||
        (log.oldCardCode ?? "").toLowerCase().includes(search.toLowerCase()) ||
        log.fromTierName.toLowerCase().includes(search.toLowerCase())       ||
        log.toTierName.toLowerCase().includes(search.toLowerCase())
      const logDate   = log.upgradedAt.slice(0, 10)
      const matchFrom = !dateFrom || logDate >= dateFrom
      const matchTo   = !dateTo   || logDate <= dateTo
      return matchSearch && matchFrom && matchTo
    })
  }, [logs, search, dateFrom, dateTo])

  const hasFilter = search || dateFrom || dateTo

  const cinp =
    "h-8 px-2.5 text-[14px] font-medium rounded-lg outline-none transition-all " +
    "bg-white dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] " +
    "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/25 " +
    "focus:border-[#03624C] dark:focus:border-[#03624C]"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-full p-0 border border-gray-200 dark:border-white/[0.10] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] [&>button]:hidden" style={SORA} >
        <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", AC.iconBg)}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90">
                {isKh ? "ប្រវត្តិដំឡើងកំរឹត" : "Upgrade History"}
              </DialogTitle>
              <DialogDescription className="text-[14px] text-gray-600 dark:text-white/30">
                {isKh
                  ? `បង្ហាញ ${filtered.length} / ${logs.length} ធាតុ`
                  : `Showing ${filtered.length} of ${logs.length} records`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="px-5 py-3 border-b border-gray-100 dark:border-white/[0.07] bg-white dark:bg-[#1e2235] flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white/25 pointer-events-none" />
            <input
              className={cn(cinp, "w-full pl-7")}
              placeholder={isKh ? "ស្វែងរក Code" : "Search code"}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <DateRangePicker
            startDate={dateFrom}
            endDate={dateTo}
            onStartChange={setDateFrom}
            onEndChange={setDateTo} />
          <AnimatePresence>
            {hasFilter && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => { setSearch(""); setDateFrom(""); setDateTo("") }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all shrink-0" >
                <RotateCcw className="w-3 h-3" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <div className="px-4 py-3 max-h-[52vh] overflow-y-auto space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-300 dark:text-white/20">
              <TrendingUp className="w-10 h-10" />
              <p className="text-[14px] font-semibold">
                {hasFilter
                  ? (isKh ? "រកមិនឃើញទិន្នន័យ" : "No results found")
                  : (isKh ? "មិនទាន់មានការដំឡើង" : "No upgrades yet")
                }
              </p>
            </div>
          ) : (
            filtered.map((log, idx) => {
              const fromTier = tiers.find(t => t.id === log.fromTierId)
              const toTier   = tiers.find(t => t.id === log.toTierId)
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="px-4 py-3 rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-all" >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: `${toTier?.accentColor ?? "#03624C"}22`,
                        border:     `1px solid ${toTier?.accentColor ?? "#03624C"}44`,
                      }} >
                      <TierIcon icon={toTier?.icon ?? "star"} size={15} color={toTier?.color ?? "#03624C"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1">
                          {log.oldCardCode && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08]">
                              <CreditCard className="w-2.5 h-2.5 text-gray-400 dark:text-white/30 shrink-0" />
                              <span className="text-[14px] font-mono font-bold text-gray-400 dark:text-white/40 line-through">
                                {log.oldCardCode}
                              </span>
                            </div>
                          )}
                          <span
                            className="text-[14px] font-bold px-2 py-0.5 rounded-full border"
                            style={{
                              background:  `${fromTier?.accentColor}18`,
                              borderColor: `${fromTier?.accentColor}33`,
                              color:       fromTier?.color,
                            }} >
                            {log.fromTierName}
                          </span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-gray-300 dark:text-white/20 shrink-0" />
                        <div className="flex items-center gap-1">
                          <div
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg border"
                            style={{
                              background:  `${toTier?.accentColor ?? "#03624C"}12`,
                              borderColor: `${toTier?.accentColor ?? "#03624C"}33`,
                            }} >
                            <CreditCard className="w-2.5 h-2.5 shrink-0" style={{ color: toTier?.color ?? "#03624C" }} />
                            <span className="text-[11px] font-mono font-bold" style={{ color: toTier?.color ?? "#03624C" }}>
                              {log.cardCode}
                            </span>
                          </div>
                          <span
                            className="text-[14px] font-black px-2 py-0.5 rounded-full border"
                            style={{
                              background:  `${toTier?.accentColor}22`,
                              borderColor: `${toTier?.accentColor}44`,
                              color:       toTier?.color,
                            }} >
                            {log.toTierName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[14px] font-mono text-gray-300 dark:text-white/15 shrink-0 tabular-nums self-start">
                      #{String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 pl-12">
                    <span className="text-[14px] text-gray-400 dark:text-white/30">
                      {isKh ? "ចូលសរុបពេល Upgrade" : "Visits at upgrade"}:{" "}
                      <strong className="text-gray-600 dark:text-white/50">
                        {log.totalVisitsAtUpgrade}
                      </strong>
                    </span>
                    <span className="text-[14px] text-gray-300 dark:text-white/15">·</span>
                    <span className="text-[14px] text-gray-400 dark:text-white/30 font-mono">
                      {log.upgradedAt.slice(0, 16).replace("T", " ")}
                    </span>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
        <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-3xl flex items-center justify-between">
          <span className="text-[14px] text-gray-400 dark:text-white/25">
            {filtered.length > 0 && (isKh ? `${filtered.length} ធាតុ` : `${filtered.length} records`)}
          </span>
          <button
            onClick={onClose}
            className="h-9 px-5 rounded-xl text-[14px] font-bold border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all" >
            {isKh ? "បិទ" : "Close"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}