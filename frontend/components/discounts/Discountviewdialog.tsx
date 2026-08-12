"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Tag, Percent, DollarSign, Calendar, Package, Grid3X3, ShoppingBag, CircleDollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import type { Discount, MenuCategory, MenuItem } from "@/types"
import { SORA, SCOPE_CONFIG, VALUE_CONFIG, STATUS_CONFIG, getAccent } from "./Discount.config"
import { extractCambodiaDate } from "@/lib/utils/time"

export function DiscountViewDialog({
  open, onClose, item, categories, menuItems, isKh,
}: {
  open: boolean
  onClose: () => void
  item: Discount | null
  categories: MenuCategory[]
  menuItems: MenuItem[]
  isKh: boolean
}) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = !mounted || resolvedTheme === "dark"
  const accent = getAccent(isDark)

  if (!open || !item) return null

  const isActuallyExpired =
    item.status === "expired" ||
    (!!item.end_date && new Date(item.end_date) < new Date())

  const effectiveStatus = isActuallyExpired ? "expired" : item.status
  const st = STATUS_CONFIG[effectiveStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.inactive
  const sc = SCOPE_CONFIG[item.scope as keyof typeof SCOPE_CONFIG] ?? SCOPE_CONFIG.category
  const vt = VALUE_CONFIG[item.value_type as keyof typeof VALUE_CONFIG] ?? VALUE_CONFIG.percentage

  const targetNames = (() => {
    const ids: number[] = Array.isArray(item.target_ids)
      ? item.target_ids
      : item.target_id ? [item.target_id] : []
    if (ids.length === 0) return isKh ? "គ្មាន" : "None"
    const source = item.scope === "category" ? categories : menuItems
    const names = ids.map(id => source.find((x: any) => x.id === id)?.name).filter(Boolean)
    return names.length > 0 ? names.join(", ") : "—"
  })()

  const formattedValue =
    item.value_type === "percentage" ? `${item.value}%` : `$${Number(item.value).toFixed(2)}`

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return isKh ? "គ្មានកំណត់" : "No limit"
    return extractCambodiaDate(dateStr)
  }

  const rows = [
    {
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
      label: isKh ? "គោលដៅ" : "Target",
      value: targetNames,
    },
    {
      icon: <CircleDollarSign className="w-3.5 h-3.5" />,
      label: isKh ? "តម្លៃអប្បបរមា" : "Min Order",
      value: item.min_order_amount ? `$${Number(item.min_order_amount).toFixed(2)}` : (isKh ? "គ្មាន" : "None"),
    },
    {
      icon: <Calendar className="w-3.5 h-3.5" />,
      label: isKh ? "ថ្ងៃចាប់ផ្ដើម" : "Start Date",
      value: formatDate(item.start_date),
    },
    {
      icon: <Calendar className="w-3.5 h-3.5" />,
      label: isKh ? "ថ្ងៃផុតកំណត់" : "End Date",
      value: formatDate(item.end_date),
    },
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
        style={{ ...SORA, fontSize: isKh ? "16px" : undefined }} >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.22 }}
          className="w-full max-w-[480px] bg-white dark:bg-[#1e2235] rounded-lg shadow-2xl border border-gray-100 dark:border-white/[0.08] overflow-hidden" >
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${accent}15` }}
              >
                <Tag className="w-4 h-4" style={{ color: accent }} />
              </div>
              <div>
                <p className="text-[16px]  text-gray-800 dark:text-white/90">
                  {isKh ? "ព័ត៌មានលម្អិត" : "Discount Details"}
                </p>
                <p className="text-[13px] text-gray-400 dark:text-white/30">
                  {item.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-all" >
              <X className="w-4 h-4 text-gray-500 dark:text-white/40" />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "inline-flex items-center gap-1.5 text-[14px]  px-2.5 py-0.5 rounded-full border",
                sc.bg, sc.border, sc.text
              )}>
                {item.scope === "category" ? <Grid3X3 className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                {item.scope === "category" ? "Category" : "Product"}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1.5  px-2.5 py-0.5 rounded-full border text-[14px]",
                vt.bg, vt.border, vt.text
              )}>
                {item.value_type === "percentage" ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                {item.value_type === "percentage" ? (isKh ? "ភាគរយ" : "Percent") : (isKh ? "តម្លៃពិត" : "Amount")}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1.5  px-2.5 py-0.5 rounded-full border text-[14px]",
                st.bg, st.border, st.text
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                {st.label[isKh ? "kh" : "en"]}
              </span>
            </div>
            <div className="rounded-lg border border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.02] px-4 py-3 flex items-center justify-between">
              <span className="text-[14px] uppercase tracking-wider text-gray-600 dark:text-white/30">
                {isKh ? "ការបញ្ចុះ" : "Discount Value"}
              </span>
              <span className="text-[20px] font-black" style={{ color: accent }}>
                {formattedValue}
              </span>
            </div>
            <div className="space-y-0.5">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-100 dark:border-white/[0.05] last:border-b-0" >
                  <span className="flex items-center gap-2 text-gray-700 dark:text-white/30 text-[14px] font-medium shrink-0">
                    {row.icon}
                    {row.label}
                  </span>
                  <span className="text-[14px]  text-gray-700 dark:text-white/70 text-right">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            {item.description && (
              <div className="space-y-1.5">
                <label className="text-[14px] uppercase tracking-wider text-gray-400 dark:text-white/30">
                  {isKh ? "ចំណាំ" : "Description"}
                </label>
                <p className="text-[14px] text-gray-600 dark:text-white/60 leading-relaxed bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2.5 border border-gray-100 dark:border-white/[0.06]">
                  {item.description}
                </p>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] flex items-center justify-end">
            <button
              onClick={onClose}
              className="h-9 px-5 rounded-lg text-[12px]  text-white transition-all active:scale-[0.97]"
              style={{ background: accent, boxShadow: `0 4px 14px ${accent}30` }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.88" }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1" }} >
              {isKh ? "បិទ" : "Close"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}