"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

const toStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

const parseStr = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d)
}

const displayStr = (s: string): string => {
  if (!s) return ""
  const d = parseStr(s)
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

const CalIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"
    />
  </svg>
)

interface CalendarPanelProps {
  value:    string
  onChange: (v: string) => void
  onClose:  () => void
  minDate?: string
  maxDate?: string
  panelRef: React.RefObject<HTMLDivElement | null>
  dropUp:   boolean
}

function CalendarPanel({ value, onChange, onClose, minDate, maxDate, panelRef, dropUp }: CalendarPanelProps) {
  const today    = new Date()
  const todayStr = toStr(today)
  const init     = value ? parseStr(value) : today

  const [viewYear,   setViewYear]   = useState(init.getFullYear())
  const [viewMonth,  setViewMonth]  = useState(init.getMonth())
  const [showPicker, setShowPicker] = useState(false)
  const [yearInput,  setYearInput]  = useState(String(init.getFullYear()))
  const savedRef = useRef(value)

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const prevDays    = new Date(viewYear, viewMonth, 0).getDate()

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(y => { const n = y - 1; setYearInput(String(n)); return n })
    } else {
      setViewMonth(m => m - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(y => { const n = y + 1; setYearInput(String(n)); return n })
    } else {
      setViewMonth(m => m + 1)
    }
  }

  const commitYear = () => {
    let y = parseInt(yearInput, 10)
    if (isNaN(y)) y = today.getFullYear()
    y = Math.min(2100, Math.max(1900, y))
    setViewYear(y)
    setYearInput(String(y))
  }

  const isDisabled = (s: string) =>
    (!!minDate && s < minDate) || (!!maxDate && s > maxDate)

  return (
    <div
      ref={panelRef}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      className={cn(
        "absolute left-0 w-[280px] z-[9999]",
        "bg-white dark:bg-[#1a1d2d]",
        "border border-gray-100 dark:border-white/[0.08]",
        "rounded-2xl shadow-2xl p-4 select-none",
        dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5",
      )}
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <button type="button" onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-100
                     dark:border-white/[0.08] text-gray-400 dark:text-white/40
                     hover:bg-gray-50 dark:hover:bg-white/[0.05] text-sm transition-colors">
          ←
        </button>
        <button type="button" onClick={() => setShowPicker(v => !v)}
          className="flex-1 text-[13px] font-bold text-gray-700 dark:text-white/80
                     hover:bg-gray-100 dark:hover:bg-white/[0.08] px-2 py-1 rounded-lg
                     transition-colors text-center">
          {MONTHS[viewMonth]} {viewYear}
        </button>
        <button type="button" onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-100
                     dark:border-white/[0.08] text-gray-400 dark:text-white/40
                     hover:bg-gray-50 dark:hover:bg-white/[0.05] text-sm transition-colors">
          →
        </button>
      </div>

      {showPicker ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((m, idx) => (
              <button type="button" key={m}
                onClick={() => { setViewMonth(idx); setShowPicker(false) }}
                className={cn(
                  "text-[12px] py-2 rounded-lg font-medium transition-colors",
                  viewMonth === idx
                    ? "bg-[#03624C] dark:bg-[#4dab8e] text-white"
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
              className="w-28 px-3 py-1.5 text-[13px] font-medium rounded-lg border
                         border-gray-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.05]
                         text-gray-800 dark:text-white/80 text-center
                         focus:outline-none focus:border-[#03624C] dark:focus:border-[#4dab8e]"
            />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-bold text-gray-300 dark:text-white/20 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`p${i}`} className="text-center text-[12px] text-gray-200 dark:text-white/10 py-1.5">
                {prevDays - firstDay + 1 + i}
              </div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day     = i + 1
              const dateStr = toStr(new Date(viewYear, viewMonth, day))
              const isSel   = dateStr === value
              const isToday = dateStr === todayStr
              const isDis   = isDisabled(dateStr)
              return (
                <button type="button" key={day} disabled={isDis}
                  onClick={() => { onChange(dateStr); onClose() }}
                  className={cn(
                    "text-center text-[12px] py-1.5 rounded-md transition-colors font-medium",
                    isDis  && "text-gray-200 dark:text-white/10 cursor-not-allowed",
                    isSel  && !isDis && "bg-[#03624C] dark:bg-[#4dab8e] text-white",
                    !isSel && !isDis && isToday  && "text-[#03624C] dark:text-[#4dab8e] font-black",
                    !isSel && !isDis && !isToday && "text-gray-700 dark:text-white/70 hover:bg-[#03624C]/10 dark:hover:bg-[#4dab8e]/10",
                  )}>
                  {day}
                </button>
              )
            })}
          </div>

          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-white/[0.05]">
            <button type="button"
              onClick={() => { onChange(todayStr); onClose() }}
              disabled={isDisabled(todayStr)}
              className="flex-1 bg-[#03624C] dark:bg-[#4dab8e] hover:opacity-90 disabled:opacity-40
                         text-white text-[12px] font-bold py-2 rounded-lg transition-all">
              Today
            </button>
            <button type="button"
              onClick={() => { onChange(savedRef.current); onClose() }}
              className="flex-1 border border-gray-200 dark:border-white/[0.10] text-gray-500
                         dark:text-white/40 text-[12px] font-bold py-2 rounded-lg
                         hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors">
              Cancel
            </button>
            <button type="button"
              onClick={() => { onChange(""); onClose() }}
              className="flex-1 border border-gray-200 dark:border-white/[0.10] text-rose-400
                         dark:text-rose-400/70 text-[12px] font-bold py-2 rounded-lg
                         hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
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
  disabled?:    boolean
  className?:   string
  hasError?:    boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  minDate,
  maxDate,
  disabled = false,
  className,
  hasError = false,
}: DatePickerProps) {
  const [open,   setOpen]   = useState(false)
  const [dropUp, setDropUp] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelRef   = useRef<HTMLDivElement>(null)

  const calcDropUp = useCallback(() => {
    if (!wrapperRef.current) return false
    const rect    = wrapperRef.current.getBoundingClientRect()
    const calH    = 380
    const below   = window.innerHeight - rect.bottom
    const above   = rect.top
    return below < calH && above > below
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (wrapperRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleToggle = () => {
    if (disabled) return
    if (!open) setDropUp(calcDropUp())
    setOpen(v => !v)
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "w-full flex items-center gap-2 h-9 px-3 rounded-lg border shadow-sm",
          "bg-white dark:bg-white/[0.05] text-[12px]",
          "transition-all outline-none",
          hasError
            ? "border-rose-400 dark:border-rose-500/50"
            : open
              ? "border-[#03624C] dark:border-[#4dab8e] ring-2 ring-[#03624C]/10 dark:ring-[#4dab8e]/10"
              : "border-gray-200/80 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        )} >
        <span className={cn(
          value ? "text-[#03624C] dark:text-[#4dab8e]" : "text-gray-300 dark:text-white/20",
        )}>
          <CalIcon />
        </span>
        <span className={cn(
          "flex-1 text-left truncate",
          value ? "text-gray-800 dark:text-white/80" : "text-gray-400 dark:text-white/20",
        )}>
          {value ? displayStr(value) : placeholder}
        </span>
        {value && !disabled && (
          <span
            role="button"
            onPointerDown={e => { e.stopPropagation(); onChange("") }}
            className="text-gray-300 dark:text-white/20 hover:text-rose-400
                       dark:hover:text-rose-400 transition-colors text-[16px] leading-none"
          >
            ×
          </span>
        )}
        {!value && (
          <svg className={cn(
            "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
            open ? "rotate-180 text-[#03624C] dark:text-[#4dab8e]" : "text-gray-300 dark:text-white/20",
          )} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <CalendarPanel
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
          minDate={minDate}
          maxDate={maxDate}
          panelRef={panelRef}
          dropUp={dropUp}
        />
      )}
    </div>
  )
}