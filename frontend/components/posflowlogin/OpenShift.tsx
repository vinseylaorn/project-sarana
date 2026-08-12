"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wallet, Loader2, CheckCircle2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  BackBtn,
  ErrBanner,
  PosShift,
  PosStaff,
  Shell,
  StaffAvatar,
  Steps,
  iCls,
  iClsErr,
  theme,
  useTx,
} from "./shared"

interface OpenShiftProps {
  isKh:          boolean
  selectedStaff: PosStaff | null
  cashKhr:       string
  cashUsd:       string
  shiftErr:      string
  shiftOpening:  boolean
  onBack:        () => void
  setCashKhr:    (v: string) => void
  setCashUsd:    (v: string) => void
  setShiftErr:   (v: string) => void
  onOpenShift:   () => void
}

export function OpenShift({
  isKh,
  selectedStaff,
  cashKhr,
  cashUsd,
  shiftErr,
  shiftOpening,
  onBack,
  setCashKhr,
  setCashUsd,
  setShiftErr,
  onOpenShift,
}: OpenShiftProps) {
  const tx = useTx(isKh)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (shiftOpening) return
    onOpenShift()
  }

  const handleNumInput = (
    raw: string,
    setter: (v: string) => void,
    allowDecimal: boolean,
  ) => {
    const cleaned = allowDecimal
      ? raw.replace(/[^0-9.]/g, "")
      : raw.replace(/[^0-9]/g, "")
    setter(cleaned)
    if (shiftErr) setShiftErr("")
  }

  return (
    <Shell k="pos-shift">
      <BackBtn onBack={onBack} label={tx.back} />
      <Steps current={3} total={3} />

      <div className="text-center mb-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, type: "spring", stiffness: 260, damping: 18 }}
          className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}30`, borderWidth: 1 }}
        >
          <Wallet className="w-5 h-5" style={{ color: theme.primary }} />
        </motion.div>
        <p className="text-[16px] font-bold text-gray-900 dark:text-white">{tx.openSh}</p>
        <p className="text-[12px] text-gray-500 dark:text-white/30 mt-1">{tx.cashSub}</p>
      </div>
      {selectedStaff && (
        <div className="flex items-center gap-3 px-3 py-2.5 mb-5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07]">
          <StaffAvatar name={selectedStaff.name} image={selectedStaff.image} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-gray-800 dark:text-white/90 truncate">
              {selectedStaff.name}
            </p>
            <p className="text-[12px] text-gray-400 dark:text-white/30 truncate">
              {selectedStaff.position || "—"}
            </p>
          </div>
          <div className="shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-bold border bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
            {tx.willOpen}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[14px] text-gray-600 dark:text-white/50 mb-1.5">
            {tx.cashUsdLbl}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-gray-400 dark:text-white/25">
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={cashUsd}
              onChange={(e) => handleNumInput(e.target.value, setCashUsd, true)}
              placeholder="0.00"
              disabled={shiftOpening}
              className={cn(iCls, "pl-7", shiftErr && iClsErr)}
            />
          </div>
        </div>
        <div>
          <label className="block text-[14px] text-gray-600 dark:text-white/50 mb-1.5">
            {tx.cashKhrLbl}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-gray-400 dark:text-white/25">
              ៛
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={cashKhr}
              onChange={(e) => handleNumInput(e.target.value, setCashKhr, false)}
              placeholder="0"
              disabled={shiftOpening}
              className={cn(iCls, "pl-7", shiftErr && iClsErr)}
            />
          </div>
        </div>
        <AnimatePresence>
          {shiftErr && <ErrBanner msg={shiftErr} />}
        </AnimatePresence>
        <motion.button
          type="submit"
          whileTap={{ scale: 0.98 }}
          disabled={shiftOpening}
          className={cn(
            "w-full h-11 rounded-lg text-[14px] text-white transition-all flex items-center justify-center gap-2",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
          style={{ backgroundColor: theme.primary }} >
          {shiftOpening ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {tx.opening}
            </>
          ) : (
            <>
              {tx.openSh}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>
    </Shell>
  )
}

interface PosReadyProps {
  isKh:           boolean
  selectedStaff:  PosStaff | null
  openedShift:    PosShift | null
  cashKhr:        string
  cashUsd:        string
  onBackToChoose: () => void
}

export function PosReady({
  isKh,
  selectedStaff,
  openedShift,
  cashKhr,
  cashUsd,
  onBackToChoose,
}: PosReadyProps) {
  const tx = useTx(isKh)
  const [navigating, setNavigating] = useState(false)

  const goToPos = () => {
    if (navigating) return
    setNavigating(true)
    window.location.href = "/pos"
  }

  const fmtUsd = (v: string) => (parseFloat(v || "0") || 0).toFixed(2)
  const fmtKhr = (v: string) => new Intl.NumberFormat("en-US").format(parseInt(v || "0") || 0)

  return (
    <Shell k="pos-ready">
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 16 }}
          className="w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: `${theme.secondary}10`, borderColor: `${theme.secondary}30`, borderWidth: 1 }} >
          <CheckCircle2 className="w-7 h-7" style={{ color: theme.secondary }} />
        </motion.div>
        <p className="text-[16px] font-bold text-gray-900 dark:text-white">{tx.opened}</p>
        <p className="text-[12px] text-gray-500 dark:text-white/30 mt-1">
          {openedShift?.shift_type
            ? `${openedShift.shift_type} · ${openedShift.start_time} – ${openedShift.end_time ?? "23:59"}`
            : ""}
        </p>
      </div>

      {selectedStaff && (
        <div className="flex items-center gap-3 px-3 py-2.5 mb-4 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07]">
          <StaffAvatar name={selectedStaff.name} image={selectedStaff.image} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-bold text-gray-800 dark:text-white/90 truncate">
              {selectedStaff.name}
            </p>
            <p className="text-[14px] text-gray-400 dark:text-white/30 truncate">
              {selectedStaff.position || "—"}
            </p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <div className="rounded-lg border border-gray-100 dark:border-white/[0.07] px-3 py-2.5 text-center">
          <p className="text-[14px]  text-gray-600 dark:text-white/30 mb-0.5">
            {tx.cashUsdLbl}
          </p>
          <p className="text-[18px] font-bold text-gray-800 dark:text-white/90">
            ${fmtUsd(cashUsd)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-100 dark:border-white/[0.07] px-3 py-2.5 text-center">
          <p className="text-[14px]  text-gray-600 dark:text-white/30 mb-0.5">
            {tx.cashKhrLbl}
          </p>
          <p className="text-[18px] font-bold text-gray-800 dark:text-white/90">
            ៛{fmtKhr(cashKhr)}
          </p>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={goToPos}
        disabled={navigating}
        className="w-full h-11 rounded-lg text-[14px] text-white transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        style={{ backgroundColor: theme.secondary }} >
        {navigating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {tx.goPOS}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </motion.button>
      <button
        onClick={onBackToChoose}
        className="w-full mt-2 h-9 rounded-lg text-[14px] text-gray-600 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/50 transition-colors" >
        {tx.backSel}
      </button>
    </Shell>
  )
}