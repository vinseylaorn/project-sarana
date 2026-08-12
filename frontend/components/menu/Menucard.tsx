
"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Edit2, Trash2, Eye } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { MenuItem, MenuCategory } from "@/types"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

interface Props {
  item: MenuItem
  index: number
  categories: MenuCategory[]
  canEdit: boolean
  canDelete: boolean
  lT: { outOfStock: string }
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
  onView: (item: MenuItem) => void
  onToggle: (item: MenuItem) => void
}

export function MenuItemCard({
  item, index, categories, canEdit, canDelete, lT,
  onEdit, onDelete, onView, onToggle,
}: Props) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = !mounted || resolvedTheme === "dark"

  const discountColor = isDark ? "#1857D8" : "#03624C"

  const productDisc = item.discount ?? null
  const cat = categories.find((c) => c.id === item.category_id)
  const categoryDisc = cat?.discounts?.[0] ?? null
  const disc = productDisc ?? categoryDisc

  const discounted =
    item.discounted_price != null
      ? item.discounted_price
      : disc
        ? disc.value_type === "percentage"
          ? Math.max(0, item.price * (1 - disc.value / 100))
          : Math.max(0, item.price - disc.value)
        : null

  const badgeLabel = disc
    ? disc.value_type === "percentage"
      ? `-${disc.value}%`
      : `-$${Number(disc.value).toFixed(2)}`
    : null

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className={cn(
        "group relative bg-white dark:bg-[#1e2235]",
        "border border-gray-200/80 dark:border-white/[0.08]",
        "rounded-xl overflow-hidden isolate",
        "shadow-sm dark:shadow-none",
        "transition-[box-shadow,border-color] duration-300 ease-out",
        "hover:shadow-[0_10px_30px_-12px_rgba(3,98,76,0.25)]",
        "dark:hover:shadow-[0_10px_30px_-12px_rgba(24,87,216,0.35)]",
        "hover:border-[#03624C]/30 dark:hover:border-[#1857D8]/40",
        !item.available && "opacity-60"
      )} >
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        <Image
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          fill
          className={cn(
            "object-cover transition-transform duration-500 ease-out",
            "group-hover:scale-[1.08]",
            !item.available && "grayscale"
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        {!item.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/40">
            <span className="px-2.5 py-1 rounded-lg text-[14px] font-bold uppercase bg-rose-100 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-700/50 text-rose-500 dark:text-rose-400">
              {lT.outOfStock}
            </span>
          </div>
        )}
        {badgeLabel && item.available && (
          <div className="absolute top-2 right-2">
            <span
              className="px-2 py-0.5 rounded-lg text-[9px] font-black text-white shadow-sm"
              style={{ background: discountColor }}
            >
              {badgeLabel}
            </span>
          </div>
        )}
      </div>
      <div className="p-3 bg-white dark:bg-[#1e2235] transition-colors duration-300">
        <div className="flex justify-between items-start mb-0.5">
          <h3 className="text-[14px] font-semibold truncate pr-2 text-gray-800 dark:text-white/85">
            {item.name}
          </h3>
          <div className="shrink-0 text-right">
            {discounted !== null && discounted < item.price ? (
              <>
                <span className="block text-[14px] line-through text-gray-400 dark:text-white/25">
                  ${item.price.toFixed(2)}
                </span>
                <span
                  className="block font-bold text-[14px]"
                  style={{ color: discountColor }}
                >
                  ${discounted.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="font-bold text-[14px] text-[#03624C] dark:text-[#1857D8]">
                ${item.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-white/[0.07]">
          <div className="flex gap-2 items-center">
            {canEdit && (
              <button
                onClick={() => onEdit(item)}
                className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                text-amber-700 bg-amber-50 border border-amber-200
                hover:bg-amber-100 hover:border-amber-300 hover:-translate-y-0.5
                dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-700/40
                dark:hover:bg-amber-900/40 dark:hover:border-amber-500
                transition-all duration-150"
                title="Edit" >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(item)}
                className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                text-rose-700 bg-rose-50 border border-rose-200
                hover:bg-rose-100 hover:border-rose-300 hover:-translate-y-0.5
                dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-700/40
                dark:hover:bg-rose-900/40 dark:hover:border-rose-500
                transition-all duration-150"
                title="Delete" >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onView(item)}
              className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
              text-blue-700 bg-blue-50 border border-blue-200
              hover:bg-blue-100 hover:border-blue-300 hover:-translate-y-0.5
              dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-700/40
              dark:hover:bg-blue-900/40 dark:hover:border-blue-500
              transition-all duration-150"
              title="View" >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
          {canEdit && (
            <Switch
              checked={item.available}
              onCheckedChange={() => onToggle(item)}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}