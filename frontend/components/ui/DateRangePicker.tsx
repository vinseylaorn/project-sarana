"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"]

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`

const parseDate = (s: string) => {
  if (!s) return new Date()
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d)
}

const fmtDisplay = (s: string) => {
  if (!s) return ""
  const d = parseDate(s)
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

const CalIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"
    />
  </svg>
)

function useCalendarStyle(
  open       : boolean,
  triggerRef : React.RefObject<HTMLElement | null>,
) {
  const [style, setStyle] = useState<React.CSSProperties>({ position: "fixed", opacity: 0, pointerEvents: "none" })

  const reposition = useCallback(() => {
    if (!triggerRef.current) return
    const r    = triggerRef.current.getBoundingClientRect()
    const calH = 380
    const calW = 290

    const top = window.innerHeight - r.bottom - 8 >= calH
      ? r.bottom + 4
      : r.top - calH - 4
    let left = r.left
      if (left + calW > window.innerWidth - 8) left = window.innerWidth - calW - 8
    setStyle({
      position:  "fixed",
      top,
      left,
      width:     calW,
      zIndex:    99999,
      opacity:   1,
      pointerEvents: "auto",
    })
  }, [triggerRef])

  useEffect(() => {
    if (!open) return
    reposition()
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("resize", reposition)
    return () => {
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("resize", reposition)
    }
  }, [open, reposition])
  return style
}

interface CalendarPanelProps {
  value:       string
  onChange:    (v: string) => void
  onClose:     () => void
  minDate?:    string
  maxDate?:    string
  style:       React.CSSProperties
  panelRef:    React.RefObject<HTMLDivElement | null>
  rangeStart?: string
  rangeEnd?:   string
}

function CalendarPanel({
  value, onChange, onClose,
  minDate, maxDate,
  style, panelRef,
  rangeStart, rangeEnd,
}: CalendarPanelProps) {
  const now  = new Date()
  const init = value ? parseDate(value) : now
  const [viewYear,   setViewYear]   = useState(init.getFullYear())
  const [viewMonth,  setViewMonth]  = useState(init.getMonth())
  const [showPicker, setShowPicker] = useState(false)
  const [yearInput,  setYearInput]  = useState(String(init.getFullYear()))
  const savedValue                  = useRef(value)
  const todayStr    = fmt(now)
  const first       = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const prevDays    = new Date(viewYear, viewMonth, 0).getDate()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => { const n = y - 1; setYearInput(String(n)); return n }) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => { const n = y + 1; setYearInput(String(n)); return n }) }
    else setViewMonth(m => m + 1)
  }
  const commitYear = () => {
    let y = parseInt(yearInput, 10)
    if (isNaN(y)) y = now.getFullYear()
    y = Math.min(2100, Math.max(1900, y))
    setViewYear(y); setYearInput(String(y))
  }

  const isDisabled  = (s: string) => (!!minDate && s < minDate) || (!!maxDate && s > maxDate)
  const isInRange   = (s: string) => !!rangeStart && !!rangeEnd && s > rangeStart && s < rangeEnd
  const isRangeEdge = (s: string) => !!rangeStart && !!rangeEnd && (s === rangeStart || s === rangeEnd)

  return (
    <div
      ref={panelRef}
      style={style}
      onMouseDown={e => e.stopPropagation()}
      className="bg-white dark:bg-[#1a1d2d] border border-gray-100 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4 select-none"
    >
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-100 dark:border-white/[0.08] text-gray-400 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/[0.05] text-sm transition-colors">
          ←
        </button>
        <button type="button" onClick={() => setShowPicker(v => !v)}
          className="text-[13px]  text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.08] px-2 py-1 rounded-lg transition-colors">
          {MONTHS[viewMonth]} {viewYear}
        </button>
        <button type="button" onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-100 dark:border-white/[0.08] text-gray-400 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/[0.05] text-sm transition-colors">
          →
        </button>
      </div>
      {showPicker ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((m, idx) => (
              <button type="button" key={m}
                onClick={() => { setViewMonth(idx); setShowPicker(false) }}
                className={cn(
                  "text-[12px] py-2 rounded-lg  transition-colors",
                  viewMonth === idx
                    ? "bg-[#03624C] dark:bg-[#1857D8] text-white"
                    : "text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/[0.08]",
                )}>
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <input
              type="text" inputMode="numeric" pattern="[0-9]*"
              value={yearInput}
              onChange={e => setYearInput(e.target.value)}
              onBlur={commitYear}
              onKeyDown={e => e.key === "Enter" && commitYear()}
              className="w-28 px-3 py-1.5 text-[13px]  rounded-lg border border-gray-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.05] text-gray-800 dark:text-white/80 text-center focus:outline-none focus:border-[#03624C] dark:focus:border-[#1857D8]"
            />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[11px]  text-gray-300 dark:text-white/25 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: first }).map((_, i) => (
              <div key={`p${i}`} className="text-center text-[12px] text-gray-200 dark:text-white/10 py-1.5">
                {prevDays - first + 1 + i}
              </div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day     = i + 1
              const dateStr = fmt(new Date(viewYear, viewMonth, day))
              const isSel   = dateStr === value
              const isToday = dateStr === todayStr
              const isDis   = isDisabled(dateStr)
              const inRange = isInRange(dateStr)
              const isEdge  = isRangeEdge(dateStr)
              return (
                <button
                  type="button"
                  key={day}
                  disabled={isDis}
                  onClick={() => {
                    onChange(dateStr)
                    onClose()
                  }}
                  className={cn(
                    "text-center text-[12px] py-1.5 rounded-md transition-colors ",
                    isDis                                   && "text-gray-200 dark:text-white/10 cursor-not-allowed",
                    (isSel || isEdge) && !isDis             && "bg-[#03624C] dark:bg-[#1857D8] text-white",
                    inRange           && !isDis             && "bg-[#03624C]/10 dark:bg-[#1857D8]/20 text-[#03624C] dark:text-[#1857D8] rounded-none",
                    !isSel && !isDis && !inRange && !isEdge && isToday  && "text-[#03624C] dark:text-[#1857D8] font-black",
                    !isSel && !isDis && !inRange && !isEdge && !isToday && "text-gray-700 dark:text-white/70 hover:bg-[#03624C]/10 dark:hover:bg-white/[0.06]",
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-white/[0.05]">
            <button type="button"
              onClick={() => { onChange(todayStr); onClose() }}
              disabled={isDisabled(todayStr)}
              className="flex-1 bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90 disabled:opacity-40 text-white text-[12px]  py-2 rounded-lg transition-all">
              Today
            </button>
            <button type="button"
              onClick={() => { onChange(savedValue.current); onClose() }}
              className="flex-1 border border-gray-200 dark:border-white/[0.10] text-gray-500 dark:text-white/40 text-[12px]  py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors">
              Cancel
            </button>
            <button type="button"
              onClick={() => { onChange(""); onClose() }}
              className="flex-1 border border-gray-200 dark:border-white/[0.10] text-rose-400 dark:text-rose-400/70 text-[12px]  py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export interface DatePickerProps {
  value:        string
  onChange:     (v: string) => void
  placeholder?: string
  minDate?:     string
  maxDate?:     string
  className?:   string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef   = useRef<HTMLDivElement>(null)
  const calStyle   = useCalendarStyle(open, triggerRef)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handler)
      return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          "w-full flex items-center gap-2 h-9 px-3 rounded-lg border shadow-sm transition-all",
          "bg-white dark:bg-white/[0.05] text-[14px] ",
          open
            ? "border-[#03624C] dark:border-[#1857D8] ring-2 ring-[#03624C]/10 dark:ring-[#1857D8]/10"
            : "border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20",
        )}
      >
        <CalIcon className={cn("w-4 h-4 shrink-0",
          value ? "text-[#03624C] dark:text-[#1857D8]" : "text-gray-400 dark:text-white/30")} />
          <span className={cn("flex-1 text-left truncate",
            value ? "text-gray-800 dark:text-white/80" : "text-gray-400 dark:text-white/20")}>
            {value ? fmtDisplay(value) : placeholder}
          </span>
          {value && (
          <span
            role="button"
            onMouseDown={e => { e.stopPropagation(); onChange("") }}
            className="text-gray-300 dark:text-white/20 hover:text-rose-400 transition-colors text-[16px] leading-none">
            ×
          </span>
        )}
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <CalendarPanel
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
          minDate={minDate}
          maxDate={maxDate}
          style={calStyle}
          panelRef={panelRef}
        />,
        document.body
      )}
    </div>
  )
}

export interface DateRangePickerProps {
  startDate:     string
  endDate:       string
  onStartChange: (v: string) => void
  onEndChange:   (v: string) => void
  className?:    string
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  className,
}: DateRangePickerProps) {
  const [active, setActive] = useState<"start" | "end" | null>(null)

  const startRef = useRef<HTMLButtonElement>(null)
  const endRef   = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const activeRef = active === "start" ? startRef : endRef
  const calStyle  = useCalendarStyle(!!active, activeRef)
  useEffect(() => {
    if (!active) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        startRef.current?.contains(t) ||
        endRef.current?.contains(t)   ||
        panelRef.current?.contains(t)
      ) return
      setActive(null)
    }
    document.addEventListener("mousedown", handler)
      return () => document.removeEventListener("mousedown", handler)
  }, [active])

  const handleStartPick = (v: string) => {
    onStartChange(v)
    if (endDate && v > endDate) onEndChange("")
    setActive(null)
  }
  const handleEndPick = (v: string) => {
    onEndChange(v)
    setActive(null)
  }

  const btnClass = (hasVal: boolean, isOpen: boolean) => cn(
    "flex items-center gap-2 h-9 px-3 rounded-lg border shadow-sm transition-all",
    "bg-white dark:bg-[#22263a] text-[14px]  min-w-[130px]",
    isOpen
      ? "border-[#03624C] dark:border-[#1857D8] ring-2 ring-[#03624C]/10 dark:ring-[#1857D8]/10"
      : "border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20",
  )

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        ref={startRef}
        type="button"
        onClick={() => setActive(a => a === "start" ? null : "start")}
        className={btnClass(!!startDate, active === "start")}
      >
        <CalIcon className={cn("w-4 h-4 shrink-0",
          startDate ? "text-[#03624C] dark:text-[#1857D8]" : "text-gray-600 dark:text-white/30")} />
        <span className={cn("truncate flex-1 text-left",
          startDate ? "text-gray-800 dark:text-white/80" : "text-gray-600 dark:text-white/30")}>
          {startDate ? fmtDisplay(startDate) : "Start date"}
        </span>
        {startDate && (
          <span role="button"
            onMouseDown={e => { e.stopPropagation(); onStartChange("") }}
            className="text-gray-300 dark:text-white/20 hover:text-rose-400 transition-colors text-[16px] leading-none">
            ×
          </span>
        )}
      </button>

      <span className="text-gray-300 dark:text-white/20 text-[13px]  select-none shrink-0">→</span>
      <button
        ref={endRef}
        type="button"
        onClick={() => setActive(a => a === "end" ? null : "end")}
        className={btnClass(!!endDate, active === "end")}
      >
        <CalIcon className={cn("w-4 h-4 shrink-0",
          endDate ? "text-[#03624C] dark:text-[#1857D8]" : "text-gray-600 dark:text-white/30")} />
        <span className={cn("truncate flex-1 text-left",
          endDate ? "text-gray-800 dark:text-white/80" : "text-gray-600 dark:text-white/30")}>
          {endDate ? fmtDisplay(endDate) : "End date"}
        </span>
        {endDate && (
          <span role="button"
            onMouseDown={e => { e.stopPropagation(); onEndChange("") }}
            className="text-gray-300 dark:text-white/20 hover:text-rose-400 transition-colors text-[16px] leading-none">
            ×
          </span>
        )}
      </button>
      {active && typeof document !== "undefined" && createPortal(
        <CalendarPanel
          value={active === "start" ? startDate : endDate}
          onChange={active === "start" ? handleStartPick : handleEndPick}
          onClose={() => setActive(null)}
          minDate={active === "end"   ? (startDate || undefined) : undefined}
          maxDate={active === "start" ? (endDate   || undefined) : undefined}
          style={calStyle}
          panelRef={panelRef}
          rangeStart={startDate}
          rangeEnd={endDate}
        />,
        document.body
      )}
    </div>
  )
}