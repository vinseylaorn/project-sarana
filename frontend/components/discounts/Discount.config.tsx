import type { ReactNode } from "react"
import { Grid3X3, Package, Percent, DollarSign } from "lucide-react"

export const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }
export const ITEMS_PER_PAGE = 12

export const getAccent       = (isDark: boolean) => isDark ? "#1857D8" : "#03624C"
export const getAccentLight  = (isDark: boolean) => isDark ? "#1857D815" : "#03624C15"
export const getAccentBorder = (isDark: boolean) => isDark ? "#1857D830" : "#03624C30"

export const INPUT_BASE =
  "w-full h-10 px-3 text-[14px] rounded-xl outline-none transition-all " +
  "bg-white dark:bg-[#22263a] border border-gray-200 dark:border-white/[0.10] " +
  "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/20 " +
  "focus:border-[#03624C] dark:focus:border-[#1857D8]/60 focus:ring-2 focus:ring-[#03624C]/10 " +
  "dark:focus:ring-[#1857D8]/10 shadow-sm dark:shadow-none"

export const SEL_T =
  "h-10 text-[14px] rounded-lg border border-gray-200 dark:border-white/[0.10] " +
  "bg-white dark:bg-[#22263a] text-gray-700 dark:text-white/70 shadow-sm dark:shadow-none"

export const SEL_C =
  "bg-white dark:bg-[#1e2235] border border-gray-100 dark:border-white/[0.10] rounded-lg shadow-xl"

export const SEL_I =
  "text-[14px] text-gray-800 dark:text-white/80 rounded-lg " +
  "focus:bg-[#03624C]/5 dark:focus:bg-[#1857D8]/10"

export const SCOPE_CONFIG: Record<"category" | "product", {
  bg: string; border: string; text: string; icon: ReactNode
}> = {
  category: {
    bg:     "bg-[#03624C]/8 dark:bg-[#1857D8]/10",
    border: "border-[#03624C]/20 dark:border-[#1857D8]/25",
    text:   "text-[#03624C] dark:text-[#6b9fff]",
    icon:   <Grid3X3 className="w-3 h-3" />,
  },
  product: {
    bg:     "bg-sky-50 dark:bg-sky-500/10",
    border: "border-sky-200 dark:border-sky-500/20",
    text:   "text-sky-700 dark:text-sky-300",
    icon:   <Package className="w-3 h-3" />,
  },
}

export const VALUE_CONFIG: Record<"percentage" | "flat", {
  bg: string; border: string; text: string; icon: ReactNode
}> = {
  percentage: {
    bg:     "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-200 dark:border-emerald-500/20",
    text:   "text-emerald-700 dark:text-emerald-300",
    icon:   <Percent className="w-3 h-3" />,
  },
  flat: {
    bg:     "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-200 dark:border-amber-500/20",
    text:   "text-amber-700 dark:text-amber-300",
    icon:   <DollarSign className="w-3 h-3" />,
  },
}

export const STATUS_CONFIG: Record<"active" | "inactive" | "expired" | "scheduled", {
  bg: string; border: string; text: string; dot: string; label: { en: string; kh: string }
}> = {
  active: {
    bg:     "bg-emerald-50 dark:bg-[#22263a]",
    border: "border-emerald-200 dark:border-emerald-500/20",
    text:   "text-emerald-700 dark:text-emerald-300",
    dot:    "bg-emerald-500",
    label:  { en: "Active",    kh: "សកម្ម" },
  },
  inactive: {
    bg:     "bg-gray-50 dark:bg-[#22263a]",
    border: "border-gray-200 dark:border-white/10",
    text:   "text-gray-500 dark:text-white/40",
    dot:    "bg-gray-400",
    label:  { en: "Inactive",  kh: "អសកម្ម" },
  },
  expired: {
    bg:     "bg-rose-50 dark:bg-[#22263a]",
    border: "border-rose-200 dark:border-rose-500/20",
    text:   "text-rose-700 dark:text-rose-300",
    dot:    "bg-rose-500",
    label:  { en: "Expired",   kh: "ផុតកំណត់" },
  },
  scheduled: {
    bg:     "bg-blue-50 dark:bg-[#22263a]",
    border: "border-blue-200 dark:border-blue-500/20",
    text:   "text-blue-700 dark:text-blue-300",
    dot:    "bg-blue-400",
    label:  { en: "Scheduled", kh: "កំណត់ពេល" },
  },
}

export const COLOR_MAP = {
  green: {
    bg:       "bg-white dark:bg-[#22263a]",
    border:   "border-white dark:border-[#22263a]",
    text:     "!text-[#03624C] dark:!text-[#4dab8e]",
    label:    "text-[#03624C]/70 dark:text-[#4dab8e]/70",
    icon:     "text-[#03624C] dark:text-[#4dab8e]",
    iconBg:   "bg-[#03624C]/10 dark:bg-[#03624C]/20",
    blob:     "bg-[#03624C]/10",
    gradient: "from-[#03624C] to-[#03624C]/60",
  },
  blue: {
    bg:       "bg-white dark:bg-[#22263a]",
    border:   "border-white dark:border-[#22263a]",
    text:     "!text-[#1857D8] dark:!text-[#6b9fff]",
    label:    "text-[#1857D8]/70 dark:text-[#6b9fff]/70",
    icon:     "text-[#1857D8] dark:text-[#6b9fff]",
    iconBg:   "bg-[#1857D8]/10 dark:bg-[#1857D8]/20",
    blob:     "bg-[#1857D8]/10",
    gradient: "from-[#1857D8] to-[#1857D8]/60",
  },
  amber: {
    bg:       "bg-white dark:bg-[#22263a]",
    border:   "border-white dark:border-[#22263a]",
    text:     "!text-amber-800 dark:!text-amber-100",
    label:    "text-amber-500 dark:text-amber-300",
    icon:     "text-amber-600 dark:text-amber-300",
    iconBg:   "bg-amber-100 dark:bg-amber-500/20",
    blob:     "bg-amber-200/40",
    gradient: "from-[#C3CC21]/80 to-[#C3CC21]/40",
  },
  violet: {
    bg:       "bg-white dark:bg-[#22263a]",
    border:   "border-white dark:border-[#22263a]",
    text:     "!text-rose-800 dark:!text-rose-100",
    label:    "text-rose-500 dark:text-rose-300",
    icon:     "text-rose-600 dark:text-rose-300",
    iconBg:   "bg-rose-100 dark:bg-rose-500/20",
    blob:     "bg-rose-200/40",
    gradient: "from-[#C93014]/80 to-[#C93014]/40",
  },
}

export interface DiscountForm {
  name:             string
  scope:            "category" | "product"
  value_type:       "percentage" | "flat"
  value:            string
  target_ids:       string[]
  start_date:       string
  end_date:         string
  status:           "active" | "inactive" | "scheduled" | "expired"
  min_order_amount: string
  description:      string
}

export const EMPTY_FORM: DiscountForm = {
  name:             "",
  scope:            "category",
  value_type:       "percentage",
  value:            "",
  target_ids:       [],
  start_date:       "",
  end_date:         "",
  status:           "active",
  min_order_amount: "",
  description:      "",
}