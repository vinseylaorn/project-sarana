"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, RotateCcw, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { SORA, SEL_T, SEL_C, SEL_I } from "./Discount.config"

interface DiscountToolbarProps {
  search:       string
  filterScope:  string
  filterStatus: string
  canCreate:    boolean
  isKh:         boolean
  accent:       string
  onSearch:     (v: string) => void
  onScope:      (v: string) => void
  onStatus:     (v: string) => void
  onReset:      () => void
  onAdd:        () => void
}

export function DiscountToolbar({
  search, filterScope, filterStatus, canCreate, isKh, accent,
  onSearch, onScope, onStatus, onReset, onAdd,
}: DiscountToolbarProps) {
  const hasFilter = search || filterScope !== "all" || filterStatus !== "all"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="flex flex-wrap gap-2 items-center justify-between shrink-0"
      style={{ ...SORA, fontSize: isKh ? "16px" : undefined }} >
      <div className="flex flex-wrap gap-2 items-center">

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 dark:text-white/25 pointer-events-none" />
          <input
            className="w-56 h-9 pl-8 pr-3 text-[14px] rounded-lg outline-none bg-white dark:bg-[#22263a] border border-gray-200/80 dark:border-white/[0.08] text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/20 shadow-sm transition-all"
            placeholder={isKh ? "ស្វែងរកការបញ្ចុះ..." : "Search discount..."}
            value={search}
            onChange={e => onSearch(e.target.value)}
            onFocus={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}15` }}
            onBlur={e =>  { e.currentTarget.style.borderColor = "";     e.currentTarget.style.boxShadow = "" }}
          />
        </div>
        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07] shrink-0" />
        <Select value={filterScope} onValueChange={onScope}>
          <SelectTrigger className={cn(SEL_T, "w-40 h-9 rounded-lg")} style={SORA}>
            <Filter className="w-3 h-3 shrink-0" style={{ color: accent }} />
            <SelectValue placeholder={isKh ? "Scope ទាំងអស់" : "All Scopes"} />
          </SelectTrigger>
          <SelectContent className={SEL_C} style={SORA}>
            <SelectItem value="all"      className={SEL_I}>{isKh ? "Scope ទាំងអស់" : "All Scopes"}</SelectItem>
            <SelectItem value="category" className={SEL_I}>Category</SelectItem>
            <SelectItem value="product"  className={SEL_I}>Product</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={onStatus}>
          <SelectTrigger className={cn(SEL_T, "w-44 h-9 rounded-lg")} style={SORA}>
            <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-400 dark:text-white/30 shrink-0" />
            <SelectValue placeholder={isKh ? "ស្ថានភាពទាំងអស់" : "All Status"} />
          </SelectTrigger>
          <SelectContent className={SEL_C} style={SORA}>
            <SelectItem value="all"       className={SEL_I}>{isKh ? "ស្ថានភាពទាំងអស់" : "All Status"}</SelectItem>
            <SelectItem value="active"    className={SEL_I}>{isKh ? "សកម្ម"           : "Active"}</SelectItem>
            <SelectItem value="inactive"  className={SEL_I}>{isKh ? "អសកម្ម"          : "Inactive"}</SelectItem>
            <SelectItem value="expired"   className={SEL_I}>{isKh ? "ផុតកំណត់"        : "Expired"}</SelectItem>
            <SelectItem value="scheduled" className={SEL_I}>{isKh ? "កំណត់ពេល"        : "Scheduled"}</SelectItem>
          </SelectContent>
        </Select>
        <AnimatePresence>
          {hasFilter && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={onReset}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all" >
              <RotateCcw className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      {canCreate && (
        <button
          onClick={onAdd}
          className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] text-white transition-all active:scale-[0.97]"
          style={{ background: accent, boxShadow: `0 4px 14px ${accent}30` }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")} >
          <Plus className="w-3.5 h-3.5" />
          {isKh ? "បន្ថែមថ្មី" : "Add New"}
        </button>
      )}
    </motion.div>
  )
}