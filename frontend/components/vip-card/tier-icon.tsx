// components/vip-card/tier-icon.tsx

import { Crown, Gem, Star } from "lucide-react"
import type { VipTier } from "./types"

export function TierIcon({
  icon,
  size = 14,
  color,
}: {
  icon: VipTier["icon"]
  size?: number
  color: string
}) {
  if (icon === "crown") return <Crown size={size} color={color} strokeWidth={1.8} />
  if (icon === "gem")   return <Gem   size={size} color={color} strokeWidth={1.8} />
  return                       <Star  size={size} color={color} strokeWidth={1.8} />
}