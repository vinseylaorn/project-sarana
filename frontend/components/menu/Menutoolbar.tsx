"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, RefreshCw, Plus } from "lucide-react"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { INPUT, SEL_T, SEL_C, SEL_I } from "./menu.config"

interface Props {
  search: string
  availability: string
  canCreate: boolean
  isKh: boolean
  lT: ReturnType<typeof import("./menu.config").getMenuTranslations>
  tAdd: string
  onSearch: (v: string) => void
  onAvailability: (v: string) => void
  onReset: () => void
  onAdd: () => void
}

export function MenuToolbar({
  search, availability, canCreate, isKh, lT, tAdd,
  onSearch, onAvailability, onReset, onAdd,
}: Props) {
  const isDirty = search || availability !== "all"

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-wrap items-center justify-between gap-3 shrink-0" >
      <div className="flex flex-1 items-center gap-2.5 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-white/25 pointer-events-none" />
          <input
            placeholder={lT.search}
            value={search}
            onChange={e => onSearch(e.target.value)}
            className={cn(INPUT, "pl-9 rounded-lg")}
          />
        </div>
        <Select value={availability} onValueChange={onAvailability}>
          <SelectTrigger className={cn(SEL_T, "w-[160px] rounded-lg")}>
            <Filter className="w-3.5 h-3.5 mr-2 text-violet-400 shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={SEL_C}>
            <SelectItem value="all" className={SEL_I}>{lT.allStatus}</SelectItem>
            <SelectItem value="available" className={SEL_I}>{lT.available}</SelectItem>
            <SelectItem value="unavailable" className={SEL_I}>{lT.unavailable}</SelectItem>
          </SelectContent>
        </Select>
        <AnimatePresence>
          {isDirty && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onReset}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all" >
              <RefreshCw className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      {canCreate && (
        <button
          onClick={onAdd}
          className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] bg-[#03624C] hover:bg-[#03624C]/80 text-white shadow-md shadow-[#03624C]/20 dark:bg-[#1857D8] dark:hover:bg-[#1857D8]/80 dark:text-white dark:border dark:border-[#1857D8] dark:shadow-none transition-all" >
          <Plus className="w-3.5 h-3.5" /> {tAdd}
        </button>
      )}
    </motion.div>
  )
}