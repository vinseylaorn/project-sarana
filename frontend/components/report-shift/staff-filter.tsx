"use client"

import { useState, useEffect } from "react"
import { User, ChevronDown, Search } from "lucide-react"
import { cn }     from "@/lib/utils"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { StaffInfo } from "./types"

interface Props {
  staffList:       StaffInfo[]
  selectedStaffId: number | "all"
  onSelect:        (id: number | "all") => void
  isKh:            boolean
}

export function StaffFilter({ staffList, selectedStaffId, onSelect, isKh }: Props) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => { if (!open) setSearch("") }, [open])

  const filtered = search.trim()
    ? staffList.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.position?.toLowerCase().includes(search.toLowerCase())
      )
    : staffList

  const selectedName = selectedStaffId === "all"
    ? (isKh ? "បុគ្គលិកទាំងអស់" : "All Staff")
    : staffList.find(s => s.id === selectedStaffId)?.name || "Staff"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"
          className="gap-2 border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#22263a] text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.08]"
          style={{ fontFamily: "'Sora', sans-serif" }}>
          <User className="w-4 h-4" />
          {selectedName}
          <ChevronDown className="w-3 h-3 opacity-60" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white dark:bg-[#1e2235] border-gray-200 dark:border-white/[0.07] text-gray-900 dark:text-white"
        style={{ fontFamily: "'Sora', sans-serif" }}>
        <DialogHeader>
          <DialogTitle>{isKh ? "ជ្រើសរើសបុគ្គលិក" : "Select Staff"}</DialogTitle>
        </DialogHeader>
        <div className="relative mt-1 mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white/30 pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isKh ? "ស្វែងរកបុគ្គលិក..." : "Search staff..."}
            className="w-full pl-8 pr-3 py-2 text-[14px] rounded-lg border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.05] text-gray-800 dark:text-white/80 placeholder-gray-600 dark:placeholder-white/30 focus:ring-[#03624C] dark:focus:ring-[#1857D8]"
          />
        </div>
        <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
          {!search.trim() && (
            <button
              onClick={() => { onSelect("all"); setOpen(false) }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-[14px] transition-all",
                selectedStaffId === "all"
                  ? "bg-[#03624C]/10 dark:bg-[#1857D8]/15 text-[#03624C] dark:text-[#4d80e8]"
                  : "hover:bg-gray-100 dark:hover:bg-white/[0.08] text-gray-700 dark:text-white/80"
              )}>
              {isKh ? "ទាំងអស់" : "All Staff"}
            </button>
          )}
          {filtered.length === 0
            ? <p className="px-3 py-4 text-center text-[14px] text-gray-400 dark:text-white/30">{isKh ? "រកមិនឃើញ" : "No results found"}</p>
            : filtered.map(staff => (
                <button key={staff.id}
                  onClick={() => { onSelect(staff.id); setOpen(false) }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-[14px] transition-all",
                    selectedStaffId === staff.id
                      ? "bg-[#03624C]/10 dark:bg-[#1857D8]/15 text-[#03624C] dark:text-[#4d80e8]"
                      : "hover:bg-gray-100 dark:hover:bg-white/[0.08] text-gray-700 dark:text-white/80"
                  )}>
                  {staff.name}
                  {staff.position && (
                    <span className="text-gray-600 dark:text-white/40 text-xs ml-1">· {staff.position}</span>
                  )}
                </button>
              ))
          }
        </div>
      </DialogContent>
    </Dialog>
  )
}