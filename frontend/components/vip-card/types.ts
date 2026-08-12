// components/vip-card/types.ts

import type React from "react"
import type { VipTier, VipCard } from "@/types/vipcard"

export type { VipTier, VipCard, UpgradeLog } from "@/types/vipcard"

export const KANTUMRUY: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }
export const SORA = KANTUMRUY

export const AC = {
  text:   "text-[#03624C] dark:text-[#03624C]",
  iconBg: "bg-[#03624C] dark:bg-[#03624C]",
  subtle: "bg-[#03624C]/[0.08] dark:bg-[#03624C]/[0.15]",
  border: "border-[#03624C]/20 dark:border-[#03624C]/25",
  lbl:    "text-[#03624C]/70 dark:text-[#03624C]/70",
  pill:   "bg-[#03624C]/10 dark:bg-[#03624C]/10 border-[#03624C]/20 dark:border-[#03624C]/20 text-[#03624C] dark:text-[#03624C]",
}

export const INP =
  "w-full h-9 px-3 text-[14px] rounded-lg outline-none transition-all " +
  "bg-white dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] " +
  "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/25 " +
  "focus:border-[#03624C] dark:focus:border-[#03624C] focus:ring-2 focus:ring-[#03624C]/10"

export function getTierById(tiers: VipTier[], id: number): VipTier {
  return tiers.find(t => t.id === id) ?? tiers[0]
}

export function isCardExpired(card: VipCard): boolean {
  if (!card.expiresAt) return false
  return new Date(card.expiresAt) < new Date()
}