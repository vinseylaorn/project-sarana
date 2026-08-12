"use client"

import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { KeyRound, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  BackBtn,
  ErrBanner,
  PosStaff,
  Shell,
  StaffAvatar,
  Steps,
  theme,
  useTx,
} from "./shared"

function PinDots({ length, filled }: { length: number; filled: number }) {
  return (
    <div className="flex items-center justify-center gap-3 my-5">
      {Array.from({ length }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ scale: i < filled ? 1.15 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="w-3.5 h-3.5 rounded-lg border-2 transition-all duration-200"
          style={{
            backgroundColor: i < filled ? theme.primary : "transparent",
            borderColor:     i < filled ? theme.primary : "rgba(0,0,0,0.2)",
          }}
        />
      ))}
    </div>
  )
}

function NumKey({
  label,
  onClick,
  variant = "default",
}: {
  label:    string
  onClick:  () => void
  variant?: "default" | "danger" | "clear"
}) {
  const getBg = () => {
    if (variant === "default") return "bg-gray-100 dark:bg-white/[0.06] hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
    if (variant === "danger")  return "bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20"
    return "bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.06]"
  }
  const getTextColor = () => {
    if (variant === "default") return "text-gray-800 dark:text-white/80 hover:text-indigo-600 dark:hover:text-indigo-400"
    if (variant === "danger")  return "text-rose-500"
    return "text-gray-400 dark:text-white/30"
  }
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={cn("h-14 rounded-lg text-[17px] font-bold transition-all select-none", getBg(), getTextColor())} >
      {label}
    </motion.button>
  )
}

interface Props {
  isKh:          boolean
  selectedStaff: PosStaff | null
  pin:           string
  pinErr:        string
  pinShake:      boolean
  pinBusy:       boolean
  PIN_LENGTH:    number
  onBack:        () => void
  onPinKey:      (digit: string) => void
  onPinDelete:   () => void
  onPinClear:    () => void
  onVerify:      (pin: string) => void
}

export function PinCode({
  isKh,
  selectedStaff,
  pin,
  pinErr,
  pinShake,
  pinBusy,
  PIN_LENGTH,
  onBack,
  onPinKey,
  onPinDelete,
  onPinClear,
  onVerify,
}: Props) {
  const tx = useTx(isKh)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pinBusy) return
      const key = e.key
      if (/^[0-9]$/.test(key)) {
        e.preventDefault()
        if (pin.length < PIN_LENGTH) onPinKey(key)
      } else if (key === "Backspace") {
        e.preventDefault()
        onPinDelete()
      } else if (key === "Delete" || key === "Escape") {
        e.preventDefault()
        onPinClear()
      } else if (key === "Enter" && pin.length === PIN_LENGTH && !pinBusy) {
        e.preventDefault()
        onVerify(pin)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [pin, pinBusy, PIN_LENGTH])

  return (
    <Shell k="pos-pin">
      <BackBtn onBack={onBack} label={tx.back} />
      <Steps current={3} total={4} />
      <div className="text-center mb-2">
        {selectedStaff && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.05, type: "spring", stiffness: 260, damping: 18 }}
            className="flex flex-col items-center gap-2 mb-4" >
            <StaffAvatar name={selectedStaff.name} image={selectedStaff.image} size="lg" />
            <p className="text-[13px] font-bold text-gray-800 dark:text-white/90">{selectedStaff.name}</p>
            {selectedStaff.position && (
              <p className="text-[10px] text-gray-400 dark:text-white/30">{selectedStaff.position}</p>
            )}
          </motion.div>
        )}
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <KeyRound className="w-4 h-4" style={{ color: theme.primary }} />
          <p className="text-[14px] font-bold text-gray-900 dark:text-white">{tx.pinTitle}</p>
        </div>
        <p className="text-[11px] text-gray-400 dark:text-white/30">{tx.pinSub}</p>
      </div>
      <motion.div
        animate={pinShake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.4 }} >
        <PinDots length={PIN_LENGTH} filled={pin.length} />
      </motion.div>
      {pinBusy && (
        <div className="flex items-center justify-center gap-2 mb-3 text-indigo-500 text-[11px] font-semibold">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {isKh ? "កំពុងពិនិត្យ..." : "Verifying..."}
        </div>
      )}
      <AnimatePresence>
        {pinErr && !pinBusy && (
          <div className="mb-3"><ErrBanner msg={pinErr} /></div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <NumKey key={d} label={d} onClick={() => onPinKey(d)} />
        ))}
        <NumKey label="C"  onClick={onPinClear}          variant="clear"  />
        <NumKey label="0"  onClick={() => onPinKey("0")}                  />
        <NumKey label="⌫" onClick={onPinDelete}          variant="danger" />
      </div>
    </Shell>
  )
}