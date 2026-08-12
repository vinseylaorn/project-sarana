"use client"

import React from "react"
import { motion } from "framer-motion"
import { AlertTriangle, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAvatarUrl } from "@/lib/avatar"
import { token } from "@/lib/auth/token"

export type Screen =
  | "choose"
  | "admin-login"
  | "pos-staff"
  | "pos-pin"
  | "pos-shift"
  | "pos-ready"

export interface PosStaff {
  id:            number
  name:          string
  position:      string | null
  image:         string | null
  has_pin:       boolean
  open_shift_id: number | null
}

export interface PosShift {
  id:              number
  shift_type:      string
  shift_status:    string
  open_time:       string
  open_amount_usd: number
  open_amount_khr: number
  start_time:      string
  end_time:        string | null
}

export const theme = {
  primary:   "#1857D8",
  secondary: "#03624C",
  danger:    "#e11d48",
}

export const iCls = [
  "w-full h-11 px-3 text-[14px] font-medium rounded-lg outline-none transition-all duration-200",
  "bg-white border border-gray-200",
  "text-gray-900 placeholder:text-gray-400",
  "shadow-sm",
  "dark:bg-[#13151f] dark:border-white/[0.10]",
  "dark:text-white dark:placeholder:text-white/25",
  "dark:shadow-none",
  "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15",
  "dark:focus:border-indigo-500/60 dark:focus:ring-indigo-500/10",
].join(" ")

export const iClsErr =
  "border-rose-400 dark:border-rose-500/40 focus:border-rose-400 focus:ring-rose-400/15"
export async function setPosCookie(shiftId: number | string): Promise<void> {
  await token.pos.set(shiftId)
}
export async function setCookieAndRedirect(shiftId: number | string, path: string): Promise<void> {
  token.pos.clear()
  await token.pos.set(shiftId)
  await new Promise(r => setTimeout(r, 100))
  window.location.href = path
}
export function clearPosSession() {
  token.pos.clear()
}
export function getPosToken(): string | null {
  return token.pos.get()
}

export function Shell({ children, k }: { children: React.ReactNode; k: string }) {
  return (
    <motion.div
      key={k}
      initial={{ opacity: 0, x: 24, filter: "blur(3px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.3, ease: "easeOut" } }}
      exit={{ opacity: 0, x: -20, filter: "blur(3px)", transition: { duration: 0.2, ease: "easeIn" } }}
      className="w-full" >
      <div className="relative bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] rounded-lg overflow-hidden shadow-xl shadow-gray-200/60 dark:shadow-none transition-colors duration-300">
        <div
          className="h-[2px] w-full"
          style={{ backgroundImage: `linear-gradient(to right, ${theme.secondary}, ${theme.primary}, ${theme.secondary})` }}
        />
        <div className="px-7 py-6">
          {children}
        </div>
      </div>
    </motion.div>
  )
}
export function BackBtn({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 }}
      onClick={onBack}
      className="flex items-center gap-1 text-[13px] text-gray-500 dark:text-white/30 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors mb-5"
      onMouseEnter={(e) => (e.currentTarget.style.color = theme.primary)}
      onMouseLeave={(e) => (e.currentTarget.style.color = "")}
    >
      <ChevronLeft className="w-3.5 h-3.5" /> {label}
    </motion.button>
  )
}

export function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ width: i < current ? 20 : 8, opacity: i < current ? 1 : 0.25 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="h-[3px] rounded-lg"
          style={{ backgroundColor: i < current ? theme.primary : "#e2e8f0" }}
        />
      ))}
    </div>
  )
}

export function ErrBanner({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20" >
      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
      <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
        {msg}
      </p>
    </motion.div>
  )
}

export function StaffAvatar({
  name,
  image,
  size = "sm",
}: {
  name:   string
  image?: string | null
  size?:  "sm" | "md" | "lg"
}) {
  const sz  = size === "lg" ? "w-14 h-14 text-[18px]" : size === "md" ? "w-10 h-10 text-[13px]" : "w-9 h-9 text-[12px]"
  const src = image ? getAvatarUrl(image) : null
  return (
    <div
      className={cn(
        sz,
        "rounded-lg overflow-hidden shrink-0 flex items-center justify-center font-bold",
        "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        "border border-gray-100 dark:border-white/[0.08]",
      )} >
      {src
        ? <img src={src} className="w-full h-full object-cover" alt={name} />
        : name.charAt(0).toUpperCase()
      }
    </div>
  )
}

export function useTx(isKh: boolean) {
  return {
    back:         isKh ? "ត្រឡប់"                              : "Back",
    loginTitle:   isKh ? "ចូលប្រើ POS"                         : "POS Sign In",
    loginSub:     isKh ? "បញ្ចូល Username & Password"           : "Enter your credentials",
    userLbl:      isKh ? "Username"                              : "Username",
    passLbl:      isKh ? "Password"                              : "Password",
    userPh:       isKh ? "បញ្ចូល username..."                    : "Enter username...",
    passPh:       isKh ? "បញ្ចូល password..."                    : "Enter password...",
    loginBtn:     isKh ? "ចូល"                                   : "Sign In",
    verifying:    isKh ? "កំពុងបញ្ជាក់..."                      : "Verifying...",
    staffTitle:   isKh ? "ជ្រើស Staff"                          : "Select Staff",
    staffSub:     isKh ? "ជ្រើស Staff Profile របស់អ្នក"         : "Choose your staff profile",
    noStaff:      isKh ? "គ្មាន Staff សកម្ម"                    : "No active staff found",
    pinTitle:     isKh ? "បញ្ចូល PIN Code"                       : "Enter PIN Code",
    pinSub:       isKh ? "បញ្ចូល PIN 6 ខ្ទង់"                    : "Enter your 6-digit PIN",
    pinWrong:     isKh ? "PIN មិនត្រឹមត្រូវ សូមព្យាយាមម្ដងទៀត"  : "Incorrect PIN. Please try again.",
    pinFail:      isKh ? "ពិនិត្យ PIN មិនបាន"                   : "PIN verification failed",
    openSh:       isKh ? "បើកវេនការងារ"                         : "Open Shift",
    cashSub:      isKh ? "ដាក់ប្រាក់ក្នុង Cash Drawer"          : "Enter opening cash amount",
    cashKhrLbl:   isKh ? "ប្រាក់រៀល (KHR)"                     : "Cash — Riel (KHR)",
    cashUsdLbl:   isKh ? "ប្រាក់ដុល្លារ (USD)"                  : "Cash — Dollar (USD)",
    opening:      isKh ? "កំពុងបើក..."                          : "Opening...",
    opened:       isKh ? "វេនការងារបើករួចរាល់!"                  : "Shift Opened!",
    goPOS:        isKh ? "ចូលទៅ POS"                            : "Go to POS",
    backSel:      isKh ? "ត្រឡប់ជ្រើសសារ"                      : "Back to selection",
    hasShift:     isKh ? "វេនបើក"                               : "Shift Open",
    noShift:      isKh ? "គ្មានវេន"                              : "No Shift",
    willOpen:     isKh ? "នឹងបើកវេនថ្មី"                        : "Will open a new shift",
    hasOpenShift: isKh ? "មានវេនបើករួចហើយ"                      : "Already has an open shift today",
  }
}