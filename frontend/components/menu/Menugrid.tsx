"use client"

import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { MenuItem, MenuCategory } from "@/types"
import { MenuItemCard } from "./Menucard"

interface Props {
  items: MenuItem[]
  categories: MenuCategory[]
  canEdit: boolean
  canDelete: boolean
  isKh: boolean
  lT: { noItems: string; outOfStock: string }
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
  onView: (item: MenuItem) => void
  onToggle: (item: MenuItem) => void
}

export function MenuItemGrid({
  items, categories, canEdit, canDelete, lT,
  onEdit, onDelete, onView, onToggle,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.14 }}
      className="flex-1 min-h-0" >
      <ScrollArea className="h-full w-full pr-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 pb-10">
          {items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="col-span-full flex flex-col items-center justify-center py-20 gap-3" >
              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center">
                <Search className="w-7 h-7 text-gray-300 dark:text-white/20" />
              </div>
              <p className="text-[13px] text-gray-400 dark:text-white/30">
                {lT.noItems}
              </p>
            </motion.div>
          ) : (
            items.map((item, i) => (
              <MenuItemCard
                key={item.id}
                item={item}
                index={i}
                categories={categories}
                canEdit={canEdit}
                canDelete={canDelete}
                lT={lT}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
                onToggle={onToggle}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </motion.div>
  )
}