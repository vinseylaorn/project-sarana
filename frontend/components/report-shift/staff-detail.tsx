"use client"

import { useState }   from "react"
import { motion }     from "framer-motion"
import { Eye, Sun, Sunset, Moon, Calendar } from "lucide-react"
import { cn }         from "@/lib/utils"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button }     from "@/components/ui/button"
import { SHIFT_META } from "./types"
import type { WorkingShift } from "@/types"
import type { StaffInfo }    from "./types"

const ICONS: Record<string, any> = { Morning: Sun, Afternoon: Sunset, Night: Moon, "Full Day": Calendar }

interface Props {
  staff:          StaffInfo
  filteredShifts: WorkingShift[]
  shiftTypes:     string[]
  totalHours:     number
  isSingleDay:    boolean
  isKh:           boolean
}

export function StaffDetail({ staff, filteredShifts, shiftTypes, totalHours, isSingleDay, isKh }: Props) {
  const [viewAllOpen,  setViewAllOpen]  = useState(false)
  const [viewAllStart, setViewAllStart] = useState("")
  const [viewAllEnd,   setViewAllEnd]   = useState("")

  const recentShifts = [...filteredShifts]
    .sort((a, b) => {
      const aT = a.open_time_raw ?? a.open_time
      const bT = b.open_time_raw ?? b.open_time
      if (!aT) return 1; if (!bT) return -1
      return new Date(bT).getTime() - new Date(aT).getTime()
    })
    .slice(0, 2)

  const viewAllFiltered = filteredShifts.filter(s => {
    if (viewAllStart && s.date && new Date(s.date) < new Date(viewAllStart)) return false
    if (viewAllEnd   && s.date && new Date(s.date) > new Date(viewAllEnd))   return false
    return true
  }).sort((a, b) => {
    const aT = a.open_time_raw ?? a.open_time
    const bT = b.open_time_raw ?? b.open_time
    if (!aT) return 1; if (!bT) return -1
    return new Date(bT).getTime() - new Date(aT).getTime()
  })

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#1a1d2e] p-5 space-y-4"
        style={{ fontFamily: "'Sora', sans-serif" }}>
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white/90">{staff.name} : <span className="text-[16px] text-gray-600 dark:text-white/40">{staff.position}</span></h3>
          </div>
          {isSingleDay && (
            <div className="flex gap-2 flex-wrap">
              {shiftTypes.map(type => {
                const meta = SHIFT_META[type] ?? SHIFT_META.Morning
                return (
                  <span key={type} className={cn("px-3 py-1 rounded-full text-[14px] font-bold border", meta.bg, meta.text, meta.border)}>
                    {type}
                  </span>
                )
              })}
              <span className="px-3 py-1 rounded-full text-[14px] font-bold bg-gray-100 dark:bg-white/[0.08] text-gray-600 dark:text-white/50">
                {totalHours.toFixed(1)} h
              </span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-[14px] font-black uppercase tracking-wider text-gray-600 dark:text-white/30">
              {isKh ? "វេនការងារ" : "Work Shifts"}
            </p>
            {filteredShifts.length > 2 && (
              <button onClick={() => setViewAllOpen(true)}
                className="text-[14px] font-bold flex items-center gap-1 text-[#03624C] dark:text-[#4d80e8] hover:underline">
                <Eye className="w-3 h-3" /> View All ({filteredShifts.length})
              </button>
            )}
          </div>
          {recentShifts.map(shift => <ShiftRow key={shift.id} shift={shift} />)}
          {filteredShifts.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-white/30 text-center py-2">
              {isKh ? "គ្មានវេនការងារ" : "No shifts found"}
            </p>
          )}
        </div>
      </motion.div>
      <Dialog open={viewAllOpen} onOpenChange={setViewAllOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#1e2235] border-gray-200 dark:border-white/[0.07] text-gray-900 dark:text-white"
          style={{ fontFamily: "'Sora', sans-serif" }}>
          <DialogHeader>
            <DialogTitle>{isKh ? "វេនការងារទាំងអស់" : "All Work Shifts"} — {staff.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <DateRangePicker startDate={viewAllStart} endDate={viewAllEnd} onStartChange={setViewAllStart} onEndChange={setViewAllEnd} />
              {(viewAllStart || viewAllEnd) && (
                <button onClick={() => { setViewAllStart(""); setViewAllEnd("") }}
                  className="text-[14px] text-[#03624C] dark:text-[#4d80e8] hover:underline">
                  {isKh ? "កំណត់ឡើងវិញ" : "Reset"}
                </button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {viewAllFiltered.length === 0
                ? <p className="text-center text-sm text-gray-400 dark:text-white/30 py-8">{isKh ? "គ្មានវេនការងារ" : "No shifts found"}</p>
                : viewAllFiltered.map(shift => <ShiftRow key={shift.id} shift={shift} />)
              }
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setViewAllOpen(false)} variant="outline" className="border-gray-200 dark:border-white/[0.1]">
              {isKh ? "បិទ" : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ShiftRow({ shift }: { shift: WorkingShift }) {
  const meta = SHIFT_META[shift.shift_type] ?? SHIFT_META.Morning
  const Icon = ICONS[shift.shift_type] ?? Sun
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border", meta.border, meta.bg)}>
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", meta.text)} />
        <span className="text-[14px] font-semibold text-gray-800 dark:text-white/80">{shift.shift_type}</span>
        <span className="text-[14px] text-gray-500 dark:text-white/40">{shift.staff_name}</span>
      </div>
      <div className="flex gap-4 text-[14px] text-gray-600 dark:text-white/60">
        <span>{shift.open_time?.split(" ")[1] || shift.open_time}</span>
        {shift.close_time  && <span>→ {shift.close_time.split(" ")[1] || shift.close_time}</span>}
        {!shift.close_time && <span className="text-amber-600 dark:text-amber-400">(Open)</span>}
      </div>
    </div>
  )
}