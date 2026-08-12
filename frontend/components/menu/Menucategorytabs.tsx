// components/menu/MenuCategoryTabs.tsx

"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { MenuCategory } from "@/types"
import { TAB_BASE, TAB_ACTIVE } from "./menu.config"

interface Props {
  categories: MenuCategory[]
  activeCategory: string
  itemsCount: Map<number, number>
  totalCount: number
  isKh: boolean
  onSelect: (id: string) => void
}

export function MenuCategoryTabs({
  categories, activeCategory, isKh, onSelect,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.07 }}
      className="shrink-0" >
      <div className="w-full overflow-x-auto pb-1 scrollbar-thin">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            onClick={() => onSelect("all")}
            className={cn(TAB_BASE, activeCategory === "all" && TAB_ACTIVE, "rounded-lg")} >
            {isKh ? "មុខម្ហូបទាំងអស់" : "All Menus"}
          </button>
          {categories.map(cat => {
            const active = activeCategory === String(cat.id)
            const topDiscount = cat.discounts?.[0]
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(String(cat.id))}
                className={cn(TAB_BASE, active && TAB_ACTIVE, "rounded-lg")} >
                {cat.name}
                {topDiscount && (
                  <span className="ml-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-[#03624C] dark:text-emerald-400">
                    -{topDiscount.value_type === "percentage"
                      ? `${topDiscount.value}%`
                      : `$${topDiscount.value}`}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="border-b border-gray-200 shadow-sm dark:border-white/[0.10] pb-4" />
      </div>
    </motion.div>
  )
}