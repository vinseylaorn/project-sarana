"use client"
import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
   Banknote, Loader2, RefreshCw, CheckCircle, Landmark, PenLine, ArrowRight,
} from "lucide-react"
import { systemSettingApi, exchangeRateApi } from "@/lib/api"

/* ------------------------------------------------------------------ */
/*  NBC rate ត្រូវបានទាញតាម Laravel backend:                           */
/*  GET /system-settings/nbc-rate[?refresh=1]                          */
/*  → { success, data: { rate, date, stale } }                         */
/*  (backend មាន cache + fallback ពេល API ធនាគារ/MEF ដាច់)              */
/* ------------------------------------------------------------------ */
const MODE_KEY = "exchange_rate_mode"

type RateMode = "auto" | "manual"

const requestNbcRate = async (refresh = false): Promise<{ rate: number; date?: string; stale?: boolean }> => {
   const res = await exchangeRateApi.getNbcRate(refresh)
   const rate = Number(res?.data?.rate)
   if (!res?.success || !rate || isNaN(rate)) throw new Error("Invalid NBC response")
   return { rate, date: res.data.date, stale: !!res.data.stale }
}

const readStoredMode = (): RateMode | null => {
   try {
      const v = localStorage.getItem(MODE_KEY)
      return v === "auto" || v === "manual" ? v : null
   } catch { return null }
}
const writeStoredMode = (m: RateMode) => {
   try { localStorage.setItem(MODE_KEY, m) } catch { /* ignore */ }
}

const ACCENT = {
   text: "text-[#03624C] dark:text-[#1857D8]",
   iconBg: "bg-[#03624C] dark:bg-[#1857D8]",
}

const INPUT =
   "w-full h-9 px-3 text-[14px] font-medium rounded-lg outline-none transition-all " +
   "bg-white dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] " +
   "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/20 " +
   "focus:border-[#03624C] dark:focus:border-[#1857D8] focus:ring-2 focus:ring-[#03624C]/10 " +
   "dark:focus:ring-[#1857D8]/10 shadow-sm dark:shadow-none"

const MIN_RATE = 1000
const MAX_RATE = 10000

export function ExchangeRateSection({ isKh, delay = 0 }: { isKh: boolean; delay?: number }) {
   const [isLoading, setIsLoading] = useState(true)

   // saved values
   const [savedMode, setSavedMode] = useState<RateMode>("manual")
   const [savedRate, setSavedRate] = useState("4100")

   // editing values
   const [mode, setMode] = useState<RateMode>("manual")
   const [rate, setRate] = useState("4100")

   // NBC
   const [nbcRate, setNbcRate] = useState<number | null>(null)
   const [nbcDate, setNbcDate] = useState<string | null>(null)
   const [nbcStale, setNbcStale] = useState(false)
   const [isFetchingNbc, setIsFetchingNbc] = useState(false)
   const [nbcError, setNbcError] = useState("")

   // save
   const [isSaving, setIsSaving] = useState(false)
   const [saveSuccess, setSaveSuccess] = useState(false)
   const [saveError, setSaveError] = useState("")

   const rateNum = parseFloat(rate)
   const rateErr =
      mode === "manual" &&
      rate.trim() !== "" &&
      (isNaN(rateNum) || rateNum < MIN_RATE || rateNum > MAX_RATE)

   const fetchNbcRate = useCallback(async (refresh = false) => {
      try {
         setIsFetchingNbc(true)
         setNbcError("")
         const r = await requestNbcRate(refresh)
         setNbcRate(r.rate)
         setNbcDate(r.date ?? null)
         setNbcStale(!!r.stale)
      } catch (err) {
         console.error("Failed to fetch NBC rate:", err)
         setNbcError(isKh ? "មិនអាចទាញអត្រាពីធនាគារជាតិបាន" : "Could not fetch NBC rate")
      } finally {
         setIsFetchingNbc(false)
      }
   }, [isKh])

   // load saved settings
   useEffect(() => {
      let cancelled = false
         ; (async () => {
            try {
               const res = await systemSettingApi.get()
               if (!cancelled && res.success) {
                  const r = String(res.data.exchange_rate ?? 4100)
                  const serverMode = res.data.exchange_rate_mode
                  const m: RateMode =
                     serverMode === "auto" || serverMode === "manual" ? serverMode : (readStoredMode() ?? "manual")
                  setSavedRate(r); setRate(r)
                  setSavedMode(m); setMode(m)
               }
            } catch (err) {
               console.error("Failed to load exchange rate:", err)
            } finally {
               if (!cancelled) setIsLoading(false)
            }
         })()
      return () => { cancelled = true }
   }, [])

   // ទាញអត្រា NBC ពេលជ្រើស Auto (ម្ដងគត់)
   useEffect(() => {
      if (!isLoading && mode === "auto" && nbcRate === null && !isFetchingNbc && !nbcError) {
         fetchNbcRate()
      }
   }, [isLoading, mode, nbcRate, isFetchingNbc, nbcError, fetchNbcRate])

   const manualValue = !isNaN(rateNum) && rate.trim() !== "" ? rateNum : Number(savedRate) || 4100

   // អត្រាដែលនឹងប្រើតាមការកំណត់បច្ចុប្បន្ន (preview)
   const effectiveRate = mode === "auto" && nbcRate ? nbcRate : manualValue
   const usingFallback = mode === "auto" && !nbcRate && !isFetchingNbc

   const dirty = mode !== savedMode || (rate.trim() !== "" && rate !== savedRate)

   const handleReset = () => {
      setMode(savedMode)
      setRate(savedRate)
      setSaveError("")
   }

   const handleSave = async () => {
      if (rateErr) {
         setSaveError(isKh ? "អត្រាមិនត្រឹមត្រូវ (1000 - 10000)" : "Rate must be between 1000 and 10000")
         return
      }
      setIsSaving(true)
      setSaveError("")
      try {
         const manualValid = rate.trim() !== "" && !isNaN(rateNum)
         const res = await systemSettingApi.update({
            exchange_rate_mode: mode,
            // ផ្ញើអត្រា manual ជានិច្ច ដើម្បីជា fallback ពេល NBC ដាច់
            exchange_rate: manualValid ? rateNum : undefined,
         })
         if (res.success) {
            const r = String(res.data.exchange_rate ?? savedRate)
            const m: RateMode = (res.data.exchange_rate_mode ?? mode) === "auto" ? "auto" : "manual"
            setSavedRate(r); setRate(r)
            setSavedMode(m); setMode(m)
            writeStoredMode(m)
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 2500)
         }
      } catch (err: unknown) {
         setSaveError(err instanceof Error ? err.message : "Failed to save exchange rate.")
      } finally {
         setIsSaving(false)
      }
   }

   const modes: { id: RateMode; icon: React.ElementType; title: string; desc: string }[] = [
      {
         id: "auto",
         icon: Landmark,
         title: isKh ? "ធនាគារជាតិ" : "NBC (Auto)",
         desc: isKh ? "ទាញអត្រាស្វ័យប្រវត្តិ" : "Fetched automatically",
      },
      {
         id: "manual",
         icon: PenLine,
         title: isKh ? "ដោយដៃ" : "Manual",
         desc: isKh ? "បញ្ចូលអត្រាខ្លួនឯង" : "Enter your own rate",
      },
   ]

   return (
      <motion.div
         initial={{ opacity: 0, y: 14 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.35, delay }}
         className="h-full bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-white/[0.06] shadow-sm dark:shadow-none overflow-hidden"
      >
         {/* 1) Header */}
         <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] rounded-t-2xl">
            <div className="flex items-center gap-2.5">
               <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", ACCENT.iconBg)}>
                  <Banknote className="w-4 h-4 text-white" />
               </div>
               <div>
                  <p className="text-[14px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                     {isKh ? "អត្រាប្តូរប្រាក់" : "Exchange Rate"}
                  </p>
                  <p className="text-[12px] text-gray-600 dark:text-white/30 leading-tight mt-0.5">
                     {isKh
                        ? "ប្រើសម្រាប់គណនាសាច់ប្រាក់ពេលបិទវេន (Close Shift)"
                        : "Used to reconcile cash drawer totals when closing a shift"}
                  </p>
               </div>
            </div>
         </div>

         {/* 2) Body */}
         <div className="p-6 space-y-5 flex-1">
            {isLoading ? (
               <div className="h-full min-h-[160px] flex items-center justify-center">
                  <Loader2 className={cn("w-5 h-5 animate-spin", ACCENT.text)} />
               </div>
            ) : (
               <>
                  {/* Mode selector */}
                  <div className="space-y-2">
                     <Label className="text-[14px] font-black uppercase tracking-wider text-gray-600 dark:text-white/30">
                        {isKh ? "ប្រភពអត្រា" : "Rate source"}
                     </Label>
                     <div className="grid grid-cols-2 gap-3">
                        {modes.map((m) => {
                           const active = mode === m.id
                           return (
                              <button
                                 key={m.id}
                                 type="button"
                                 onClick={() => setMode(m.id)}
                                 className={cn(
                                    "relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200",
                                    active
                                       ? "border-[#03624C] dark:border-[#1857D8] bg-[#03624C]/5 dark:bg-[#1857D8]/10 shadow-md shadow-[#03624C]/10 dark:shadow-[#1857D8]/10"
                                       : "border-gray-100 dark:border-white/[0.06] hover:border-gray-200 dark:hover:border-white/[0.12]"
                                 )} >
                                 <div className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                    active ? ACCENT.iconBg : "bg-gray-100 dark:bg-white/[0.06]"
                                 )}>
                                    <m.icon className={cn("w-4 h-4", active ? "text-white" : "text-gray-400 dark:text-white/30")} />
                                 </div>
                                 <div className="min-w-0">
                                    <p className={cn(
                                       "text-[14px] font-bold leading-tight",
                                       active ? "text-[#03624C] dark:text-[#6b9fff]" : "text-gray-700 dark:text-white/60"
                                    )}>{m.title}</p>
                                    <p className="text-[12px] text-gray-500 dark:text-white/30 leading-tight mt-0.5 truncate">{m.desc}</p>
                                 </div>
                                 {active && (
                                    <CheckCircle className={cn("w-4 h-4 absolute top-2 right-2", ACCENT.text)} />
                                 )}
                              </button>
                           )
                        })}
                     </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-white/[0.06]" />

                  {/* Rate input / NBC display */}
                  <div className="flex items-start justify-between gap-4">
                     <div className="space-y-0.5 min-w-0">
                        <Label className="text-[14px] font-black uppercase tracking-wider text-gray-600 dark:text-white/30">
                           {mode === "auto"
                              ? (isKh ? "អត្រាធនាគារជាតិ" : "NBC rate")
                              : (isKh ? "អត្រាដោយដៃ" : "Manual rate")}
                        </Label>
                        <p className="text-[12px] text-gray-600 dark:text-white/30">
                           {mode === "auto"
                              ? (nbcDate
                                 ? `${isKh ? "ធនាគារជាតិនៃកម្ពុជា · " : "National Bank of Cambodia · "}${nbcDate}${nbcStale ? (isKh ? " · អត្រាចាស់" : " · cached") : ""}`
                                 : (isKh ? "ធនាគារជាតិនៃកម្ពុជា" : "National Bank of Cambodia"))
                              : (isKh ? "ត្រូវនៅចន្លោះ 1000 - 10000" : "Between 1000 and 10000")}
                        </p>
                     </div>

                     {mode === "manual" ? (
                        <div className="flex flex-col items-end gap-1 shrink-0">
                           <div className="relative w-44">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-gray-500 dark:text-white/30 pointer-events-none">
                                 1$ =
                              </span>
                              <input
                                 type="number" min={MIN_RATE} max={MAX_RATE} step="1"
                                 className={cn(
                                    INPUT, "pl-10 pr-8 text-right",
                                    rateErr && "border-red-400 dark:border-red-500/60 focus:border-red-400 focus:ring-red-400/15"
                                 )}
                                 value={rate}
                                 onChange={(e) => setRate(e.target.value)}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-500 dark:text-white/30 pointer-events-none">
                                 ៛
                              </span>
                           </div>
                           {rateErr && (
                              <p className="text-[10px] text-red-400">
                                 {isKh ? "ត្រូវនៅចន្លោះ 1000 - 10000" : "Must be between 1000 - 10000"}
                              </p>
                           )}
                        </div>
                     ) : (
                        <div className="flex items-center gap-2 shrink-0">
                           <div
                              className={cn(
                                 INPUT,
                                 "w-44 flex items-center justify-end cursor-default select-none bg-gray-50 dark:bg-white/[0.03]",
                                 nbcError && "border-red-400 dark:border-red-500/60"
                              )} >
                              {isFetchingNbc
                                 ? <Loader2 className={cn("w-3.5 h-3.5 animate-spin", ACCENT.text)} />
                                 : nbcRate !== null
                                    ? `1$ = ${nbcRate.toLocaleString()}៛`
                                    : "—"}
                           </div>
                           <button
                              type="button"
                              onClick={() => fetchNbcRate(true)}
                              disabled={isFetchingNbc}
                              title={isKh ? "ទាញអត្រាថ្មី" : "Refresh rate"}
                              className="h-9 w-9 rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.05] flex items-center justify-center text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.08] transition disabled:opacity-50 shadow-sm dark:shadow-none" >
                              <RefreshCw className={cn("w-3.5 h-3.5", isFetchingNbc && "animate-spin")} />
                           </button>
                        </div>
                     )}
                  </div>

                  {mode === "auto" && nbcError && (
                     <p className="text-[12px] text-red-400 dark:text-red-400">
                        {nbcError}
                        {" · "}
                        {isKh
                           ? `នឹងប្រើអត្រាដោយដៃ (${Number(savedRate).toLocaleString()}៛) ជំនួស`
                           : `Falls back to manual (${Number(savedRate).toLocaleString()}៛)`}
                     </p>
                  )}

                  {/* Live preview */}
                  <div className={cn(
                     "rounded-xl border p-3 flex items-center justify-between gap-3",
                     "bg-[#03624C]/[0.05] dark:bg-[#1857D8]/[0.10] border-[#03624C]/15 dark:border-[#1857D8]/20"
                  )}>
                     <div className="min-w-0">
                        <p className="text-[12px] text-gray-600 dark:text-white/40 leading-tight">
                           {isKh ? "អត្រាដែលនឹងប្រើ" : "Rate that will be used"}
                           {usingFallback && (isKh ? " (ដោយដៃ)" : " (manual fallback)")}
                        </p>
                        <p className={cn("text-[20px] font-black leading-tight mt-0.5 truncate", ACCENT.text)}>
                           1$ = {effectiveRate.toLocaleString()}៛
                        </p>
                     </div>
                     <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-600 dark:text-white/50 shrink-0">
                        <span>$10</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                        <span>{(effectiveRate * 10).toLocaleString()}៛</span>
                     </div>
                  </div>
               </>
            )}
         </div>

         {/* 3) Footer */}
         <div className="px-6 py-4 bg-gray-50 dark:bg-[#1e2235] border-t border-gray-100 dark:border-white/[0.07] flex items-center justify-between gap-3 rounded-b-2xl">
            <div className="flex items-center gap-3 min-w-0">
               <button
                  onClick={handleReset}
                  disabled={!dirty || isSaving}
                  className="text-[14px] font-semibold text-gray-600 dark:text-white/30 hover:text-gray-800 dark:hover:text-white/60 transition disabled:opacity-40" >
                  {isKh ? "កំណត់ឡើងវិញ" : "Reset changes"}
               </button>
               {saveError && (
                  <p className="text-[14px] text-rose-500 dark:text-rose-400 font-medium truncate">{saveError}</p>
               )}
            </div>
            <button
               onClick={handleSave}
               disabled={isLoading || isSaving || saveSuccess || !dirty || rateErr}
               className={cn(
                  "h-9 px-6 rounded-lg text-[14px] font-bold flex items-center gap-2 transition-all disabled:opacity-60 active:scale-[0.97] text-white shrink-0",
                  saveSuccess
                     ? "bg-emerald-500 shadow-sm shadow-emerald-500/20"
                     : "bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90"
               )} >
               {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
               {saveSuccess && <CheckCircle className="w-3.5 h-3.5" />}
               {saveSuccess
                  ? (isKh ? "រក្សាទុករួច!" : "Saved!")
                  : isSaving
                     ? (isKh ? "កំពុងរក្សា..." : "Saving...")
                     : (isKh ? "រក្សាទុក" : "Save")}
            </button>
         </div>
      </motion.div>
   )
}