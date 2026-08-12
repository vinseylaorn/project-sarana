"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ChevronRight, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { get, post } from "@/lib/api/client"
import { token } from "@/lib/auth/token"

import {
  BackBtn,
  PosShift,
  PosStaff,
  Screen,
  Shell,
  StaffAvatar,
  Steps,
  theme,
  useTx,
  setCookieAndRedirect,
} from "./shared"
import { PinCode }             from "./Pincode"
import { OpenShift, PosReady } from "./OpenShift"

const PIN_LENGTH = 6
const VISIBLE_STAFF_ROWS = 4

interface Props {
  screen: Screen
  isKh:   boolean
  goTo:   (s: Screen) => void
  onBack: () => void
}

export function PosFlow({ screen, isKh, goTo, onBack }: Props) {
  const tx = useTx(isKh)

  const [staffList,     setStaffList]     = useState<PosStaff[]>([])
  const [staffLoading,  setStaffLoading]  = useState(false)
  const [staffErr,      setStaffErr]      = useState("")
  const [selectedStaff, setSelectedStaff] = useState<PosStaff | null>(null)
  const [openedShift,   setOpenedShift]   = useState<PosShift | null>(null)

  const [pin,      setPin]      = useState("")
  const [pinErr,   setPinErr]   = useState("")
  const [pinShake, setPinShake] = useState(false)
  const [pinBusy,  setPinBusy]  = useState(false)

  const [cashKhr,      setCashKhr]      = useState("")
  const [cashUsd,      setCashUsd]      = useState("")
  const [shiftErr,     setShiftErr]     = useState("")
  const [shiftOpening, setShiftOpening] = useState(false)

  const staffListRef = useRef<HTMLDivElement>(null)
  const [staffListMaxHeight, setStaffListMaxHeight] = useState<number | undefined>(undefined)

  const resetAll = () => {
    setStaffList([]); setSelectedStaff(null); setOpenedShift(null)
    setPin(""); setPinErr(""); setShiftErr("")
    setCashKhr(""); setCashUsd("")
  }

  useEffect(() => {
    if (screen !== "pos-staff" || staffList.length > 0) return

    let active = true
    setStaffLoading(true)
    setStaffErr("")

    get<PosStaff[]>("/pos/staff-list")
      .then((list) => {
        if (!active) return
        if (!list.length) {
          setStaffErr(isKh ? "គ្មាន Staff សកម្មក្នុងប្រព័ន្ធ" : "No active staff in system")
          return
        }
        setStaffList(list)
      })
      .catch((err: any) => {
        if (!active) return
        setStaffErr(err?.message ?? (isKh ? "ទាញយក Staff មិនបាន" : "Failed to load staff"))
      })
      .finally(() => active && setStaffLoading(false))

    return () => { active = false }
  }, [screen, staffList.length, isKh])

  useEffect(() => {
    if (screen !== "pos-staff") return

    const calc = () => {
      const container = staffListRef.current
      if (!container) return

      const items = Array.from(container.children) as HTMLElement[]
      if (items.length <= VISIBLE_STAFF_ROWS) {
        setStaffListMaxHeight(undefined) 
        return
      }

      const first = items[0]
      const last  = items[VISIBLE_STAFF_ROWS - 1]
      if (!first || !last) return

      const containerTop = container.getBoundingClientRect().top
      const height = last.getBoundingClientRect().bottom - containerTop
      setStaffListMaxHeight(height)
    }

    const raf = requestAnimationFrame(calc)

    window.addEventListener("resize", calc)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", calc)
    }
  }, [screen, staffList])

  const handleSelectStaff = (staff: PosStaff) => {
    if (!staff.has_pin) return
    setSelectedStaff(staff)
    setPin("")
    setPinErr("")
    goTo("pos-pin")
  }

  const handlePinKey    = (digit: string) => {
    if (pin.length >= PIN_LENGTH || pinBusy) return
    const next = pin + digit
    setPin(next)
    setPinErr("")
    if (next.length === PIN_LENGTH) setTimeout(() => verifyPin(next), 120)
  }
  const handlePinDelete = () => { if (!pinBusy) setPin((p) => p.slice(0, -1)) }
  const handlePinClear  = () => { if (!pinBusy) setPin("") }

  const verifyPin = async (enteredPin: string) => {
    if (!selectedStaff) return
    setPinBusy(true)
    setPinErr("")
    try {
      const result = await post<{
        staff:      any
        open_shift: PosShift | null | undefined
        message?:   string
      }>("/pos/verify-pin", { staff_id: selectedStaff.id, pin_code: enteredPin })

      if (result?.message && !result?.staff) {
        setPinShake(true)
        setTimeout(() => setPinShake(false), 500)
        setPin("")
        setPinErr(result.message)
        return
      }

      if (result?.open_shift) {
        const shift = result.open_shift
        sessionStorage.setItem("pos_staff_id",    String(selectedStaff.id))
        sessionStorage.setItem("pos_staff_name",  selectedStaff.name)
        sessionStorage.setItem("pos_shift_id",    String(shift.id))
        sessionStorage.setItem("pos_shift_type",  shift.shift_type)
        sessionStorage.setItem("pos_shift_start", shift.start_time)
        sessionStorage.setItem("pos_shift_end",   shift.end_time ?? "23:59")
        sessionStorage.setItem("pos_cash_khr",    String(shift.open_amount_khr))
        sessionStorage.setItem("pos_cash_usd",    String(shift.open_amount_usd))

        await setCookieAndRedirect(shift.id, "/pos")
        return
      }

      goTo("pos-shift")
    } catch (err: any) {
      setPinShake(true)
      setTimeout(() => setPinShake(false), 500)
      setPin("")
      setPinErr(err?.message ?? tx.pinWrong)
    } finally {
      setPinBusy(false)
    }
  }

  const handleOpenShift = async () => {
    if (!selectedStaff) return
    setShiftOpening(true)
    setShiftErr("")
    const khr = parseInt(cashKhr   || "0") || 0
    const usd = parseFloat(cashUsd || "0") || 0
    try {
      const shift = await post<PosShift>("/pos/open-shift", {
        staff_id:        selectedStaff.id,
        open_amount_usd: usd,
        open_amount_khr: khr,
      })
      await token.pos.set(shift.id)

      sessionStorage.setItem("pos_staff_id",    String(selectedStaff.id))
      sessionStorage.setItem("pos_staff_name",  selectedStaff.name)
      sessionStorage.setItem("pos_shift_id",    String(shift.id))
      sessionStorage.setItem("pos_shift_type",  shift.shift_type)
      sessionStorage.setItem("pos_shift_start", shift.start_time)
      sessionStorage.setItem("pos_shift_end",   shift.end_time ?? "23:59")
      sessionStorage.setItem("pos_cash_khr",    String(khr))
      sessionStorage.setItem("pos_cash_usd",    String(usd))

      setOpenedShift(shift)
      goTo("pos-ready")
    } catch (err: any) {
      setShiftErr(err?.message ?? (isKh ? "បើក Shift មិនបាន" : "Failed to open shift"))
    } finally {
      setShiftOpening(false)
    }
  }

  if (screen === "pos-staff") return (
    <Shell k="pos-staff">
      <BackBtn onBack={() => { resetAll(); goTo("choose") }} label={tx.back} />
      <Steps current={1} total={3} />
      <div className="text-center mb-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, type: "spring", stiffness: 260, damping: 18 }}
          className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: `${theme.secondary}10`, borderColor: `${theme.secondary}30`, borderWidth: 1 }} >
          <Users className="w-5 h-5" style={{ color: theme.secondary }} />
        </motion.div>
        <p className="text-[16px] font-bold text-gray-900 dark:text-white">{tx.staffTitle}</p>
        <p className="text-[12px] text-gray-500 dark:text-white/30 mt-1">{tx.staffSub}</p>
      </div>
      {staffLoading ? (
        <div className="text-center py-10 text-[14px] text-gray-600 dark:text-white/25 font-medium">
          {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
        </div>
      ) : staffErr ? (
        <div className="text-center py-10 text-[12px] text-rose-500 dark:text-rose-400 font-medium">
          {staffErr}
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-10 text-[14px] text-gray-600 dark:text-white/25 font-medium">
          {tx.noStaff}
        </div>
      ) : (
        <div
          ref={staffListRef}
          className="space-y-2 overflow-y-auto pr-1"
          style={staffListMaxHeight ? { maxHeight: staffListMaxHeight } : undefined}
        >
          {staffList.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectStaff(s)}
              disabled={!s.has_pin}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg border transition-all text-left group",
                "bg-white dark:bg-white/[0.03] border-gray-100 dark:border-white/[0.07]",
                s.has_pin
                  ? "hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 cursor-pointer"
                  : "opacity-50 cursor-not-allowed",
              )} >
              <StaffAvatar name={s.name} image={s.image} size="md" />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-[14px] font-bold truncate transition-colors",
                  s.has_pin
                    ? "text-gray-800 dark:text-white/90 group-hover:text-indigo-700 dark:group-hover:text-indigo-300"
                    : "text-gray-500 dark:text-white/40",
                )}>
                  {s.name}
                </p>
                <p className="text-[12px] text-gray-400 dark:text-white/30 truncate">
                  {s.position || "—"}
                  {!s.has_pin && (
                    <span className="ml-1.5 text-rose-400 dark:text-rose-500 font-semibold">
                      · {isKh ? "គ្មាន PIN" : "No PIN set"}
                    </span>
                  )}
                </p>
              </div>
              <div className={cn(
                "shrink-0 px-2 py-0.5 rounded-lg text-[12px] border",
                s.open_shift_id
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                  : "bg-gray-50 text-gray-400 border-gray-100 dark:bg-white/[0.03] dark:text-white/25 dark:border-white/[0.08]",
              )}>
                {s.open_shift_id ? tx.hasShift : tx.noShift}
              </div>
              {s.has_pin && (
                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/20 group-hover:text-indigo-400 transition-colors shrink-0" />
              )}
            </motion.button>
          ))}
        </div>
      )}
    </Shell>
  )
  if (screen === "pos-pin") return (
    <PinCode
      isKh={isKh}
      selectedStaff={selectedStaff}
      pin={pin}           pinErr={pinErr}
      pinShake={pinShake} pinBusy={pinBusy}
      PIN_LENGTH={PIN_LENGTH}
      onBack={() => { setPin(""); setPinErr(""); goTo("pos-staff") }}
      onPinKey={handlePinKey}
      onPinDelete={handlePinDelete}
      onPinClear={handlePinClear}
      onVerify={verifyPin}
    />
  )
  if (screen === "pos-shift") return (
    <OpenShift
      isKh={isKh}
      selectedStaff={selectedStaff}
      cashKhr={cashKhr}   cashUsd={cashUsd}
      shiftErr={shiftErr} shiftOpening={shiftOpening}
      onBack={() => { setPin(""); setPinErr(""); goTo("pos-pin") }}
      setCashKhr={setCashKhr} setCashUsd={setCashUsd}
      setShiftErr={setShiftErr}
      onOpenShift={handleOpenShift}
    />
  )
  if (screen === "pos-ready") return (
    <PosReady
      isKh={isKh}
      selectedStaff={selectedStaff}
      openedShift={openedShift}
      cashKhr={cashKhr}
      cashUsd={cashUsd}
      onBackToChoose={() => goTo("choose")}
    />
  )
  return null
}