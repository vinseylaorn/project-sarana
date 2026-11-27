"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, Loader2, CheckCircle2, AlertTriangle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { post, get } from "@/lib/api/client";
import { toast } from "sonner";
import type { PosTable } from "@/store/pos.store";

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" };

interface CloseShiftDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isKh: boolean;
  tables: PosTable[];
  onSuccess?: () => void;
}

interface CashPreview {
  total_orders: number;
  cash_sales_usd: number;
  non_cash_sales_usd: number;
  split_payment_count: number;
  open_amount_usd: number;
  open_amount_khr: number;
  expected_cash_usd: number;
  exchange_rate: number;
  // Optional: backend can tell which Settings mode produced `exchange_rate`
  exchange_rate_mode?: "auto" | "manual";
}

const DEFAULT_EXCHANGE_RATE = 4100;



// How often (ms) the expected-cash preview refreshes while the dialog is open
const REFRESH_MS = 5000;

export function CloseShiftDialog({ open, onOpenChange, isKh, tables, onSuccess }: CloseShiftDialogProps) {
  const [cashKhr, setCashKhr] = useState("");
  const [cashUsd, setCashUsd] = useState("");
  const [note, setNote] = useState("");
  const [closing, setClosing] = useState(false);
  const [done, setDone] = useState(false);
  const [preview, setPreview] = useState<CashPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showDiscrepancyConfirm, setShowDiscrepancyConfirm] = useState(false);

  const posStaffName = typeof window !== "undefined" ? sessionStorage.getItem("pos_staff_name") ?? "—" : "—";
  const openKhr = typeof window !== "undefined" ? sessionStorage.getItem("pos_cash_khr") ?? "0" : "0";
  const openUsd = typeof window !== "undefined" ? sessionStorage.getItem("pos_cash_usd") ?? "0" : "0";
  const occupied = tables.filter(t => t.status === "occupied").length;
  const now = new Date();
  const dateStr = now.toLocaleDateString(isKh ? "km-KH" : "en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // Fetch the expected-cash preview. The backend resolves the exchange rate from
  // System Settings (manual -> manual rate, auto -> real-time rate) and returns it
  // as `exchange_rate`, so the POS session never calls the admin Settings API.
  // `silent` = background refresh (no spinner, keep previous value on failure).
  const fetchPreview = useCallback(async (silent = false) => {
    const shiftId = sessionStorage.getItem("pos_shift_id");
    if (!shiftId) return;
    if (!silent) setLoadingPreview(true);
    try {
      const data = await get(`/pos/close-shift-preview/${shiftId}`);
      setPreview(data as CashPreview);
    } catch {
      if (!silent) setPreview(null);
    } finally {
      if (!silent) setLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    setCashKhr(""); setCashUsd(""); setNote("");
    setClosing(false); setDone(false); setPreview(null); setShowDiscrepancyConfirm(false);

    // Initial load (with spinner)
    fetchPreview();

    // Real-time: silent refresh while the dialog is open and the tab is visible
    const timer = setInterval(() => {
      if (!document.hidden) fetchPreview(true);
    }, REFRESH_MS);

    // Refresh immediately when the user comes back to this tab
    const onFocus = () => fetchPreview(true);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [open, fetchPreview]);

  // A blank field means "no cash of this currency was counted" — that's
  // valid and treated as 0 (e.g. a drawer with only KHR notes and no USD).
  // Only a negative or non-numeric entry is an error, and at least ONE of
  // the two currencies must actually be filled in.
  const khrFilled = cashKhr.trim() !== ""
  const usdFilled = cashUsd.trim() !== ""
  const khrNum = khrFilled ? parseFloat(cashKhr) : 0
  const usdNum = usdFilled ? parseFloat(cashUsd) : 0
  const khrErr = khrFilled && (isNaN(khrNum) || khrNum < 0)
  const usdErr = usdFilled && (isNaN(usdNum) || usdNum < 0)
  const isFormValid = !khrErr && !usdErr && (khrFilled || usdFilled)

  // Rate used to fold counted KHR notes into USD. Comes from the backend preview,
  // which follows System Settings (manual or real-time).
  const exchangeRate = preview?.exchange_rate && preview.exchange_rate > 0
    ? preview.exchange_rate
    : DEFAULT_EXCHANGE_RATE;
  const expectedCashUsd = preview ? preview.expected_cash_usd : null;

  // Actual cash counted, USD notes + KHR notes converted at the fixed rate.
  const actualTotalUsd = isFormValid ? usdNum + khrNum / exchangeRate : null;

  // Over/short: actual cash counted (USD+KHR combined) minus what the
  // system expects to be there (which also already folds the opening KHR
  // float into a USD-equivalent number on the backend).
  // Negative = money missing, Positive = extra cash in the drawer.
  const difference = expectedCashUsd !== null && actualTotalUsd !== null
    ? Math.round((actualTotalUsd - expectedCashUsd) * 100) / 100
    : null;
  const hasDiscrepancy = difference !== null && Math.abs(difference) >= 0.5; // ≥ $0.50 flagged

  const performClose = async () => {
    setClosing(true);
    try {
      const shiftId = sessionStorage.getItem("pos_shift_id");
      if (shiftId) {
        await post(`/pos/close-shift/${shiftId}`, {
          close_amount_usd: parseFloat(cashUsd || "0") || 0,
          close_amount_khr: parseInt(cashKhr || "0") || 0,
          note: note || null,
        });
      }

      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "pos_token=;  expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      ["pos_staff_id", "pos_staff_name", "pos_cash_khr", "pos_cash_usd", "pos_shift_type", "pos_shift_id", "login_screen"]
        .forEach(k => sessionStorage.removeItem(k));
      localStorage.removeItem("pos_draft_orders");

      setDone(true);
      setClosing(false);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = "/login";
        }
      }, 1400);

    } catch (err: any) {
      setClosing(false);
      toast.error(typeof err?.message === "string" ? err.message : "Failed to close shift");
    }
  };

  const handleClose = () => {
    if (closing) return;
    if (!isFormValid) {
      toast.error(isKh
        ? "សូមបញ្ចូលទឹកប្រាក់ USD ឬ KHR យ៉ាងហោចណាស់មួយប្រភេទ (មិនអាចជាលេខអវិជ្ជមាន)"
        : "Please enter at least one cash amount (USD or KHR) — it can't be negative")
      return
    }

    if (hasDiscrepancy) {
      setShowDiscrepancyConfirm(true);
      return;
    }

    performClose();
  };

  const iCls = [
    "w-full h-10 px-3 text-[14px] rounded-lg outline-none transition-all",
    "bg-white dark:bg-[#22263a] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30",
    "focus:border-[#03624C] dark:focus:border-[#1857D8] focus:ring-2 focus:ring-[#03624C]/15 dark:focus:ring-[#1857D8]/15",
  ].join(" ");

  // Discrepancy badge visual state (icon + colors), used by the over/short panel below
  const discrepancyStyle = !hasDiscrepancy
    ? {
      box: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
      chip: "bg-emerald-100 dark:bg-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-400",
      Icon: CheckCircle2,
    }
    : difference! < 0
      ? {
        box: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
        chip: "bg-red-100 dark:bg-red-500/20",
        text: "text-red-600 dark:text-red-400",
        Icon: AlertTriangle,
      }
      : {
        box: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
        chip: "bg-amber-100 dark:bg-amber-500/20",
        text: "text-amber-600 dark:text-amber-400",
        Icon: AlertTriangle,
      };

  return (
    <>
      <Dialog open={open} onOpenChange={v => !closing && onOpenChange(v)}>
        <DialogContent
          className="max-w-[420px] max-h-[88vh] p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-2xl bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden overflow-hidden"
          style={SORA} >
          <DialogTitle className="sr-only">
            Close Shift
          </DialogTitle>
          <DialogDescription className="sr-only">
            Close the current working shift
          </DialogDescription>
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-12 px-6 gap-4" >
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-16 h-16 rounded-2xl bg-[#03624C]/10 dark:bg-[#1857D8]/10 border border-[#03624C]/20 dark:border-[#1857D8]/20 flex items-center justify-center" >
                  <CheckCircle2 className="w-8 h-8 text-[#03624C] dark:text-[#1857D8]" />
                </motion.div>
                <div className="text-center">
                  <p className="text-[17px] text-[#03624C] dark:text-[#1857D8]">
                    {isKh ? "វេនបានបិទ!" : "Shift Closed!"}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-white/30 mt-1.5">
                    {isKh ? "កំពុងបញ្ជូន..." : "Redirecting..."}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col min-h-0 flex-1"
              >

                <div className="px-5 pt-5 pb-4 flex items-start justify-between border-b border-gray-100 dark:border-white/[0.07] shrink-0">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#1857D8]/10 border border-[#1857D8]/20 flex items-center justify-center shrink-0">
                      <LogOut className="w-4 h-4 text-[#1857D8]" />
                    </div>
                    <div>
                      <p className="text-[16px] font-bold text-gray-900 dark:text-white/90">
                        {isKh ? "បិទវេនការងារ" : "Close Shift"}
                      </p>
                      <p className="text-[12px] text-gray-400 dark:text-white/30 mt-0.5">{posStaffName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors" >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                  <div className="rounded-lg border border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.03] divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {[
                      { label: isKh ? "ថ្ងៃនេះ" : "Date", val: dateStr },
                      { label: isKh ? "ប្រាក់បើក (KHR)" : "Opening KHR", val: `៛${parseInt(openKhr).toLocaleString()}` },
                      { label: isKh ? "ប្រាក់បើក (USD)" : "Opening USD", val: `$${parseFloat(openUsd).toFixed(2)}` },
                      { label: isKh ? "តុមានភ្ញៀវ" : "Active tables", val: String(occupied), warn: occupied > 0 },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-[14px] text-gray-600 dark:text-white/40">{row.label}</span>
                        <span className={cn(
                          "text-[14px] font-semibold",
                          row.warn && occupied > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-800 dark:text-white/85"
                        )}>
                          {row.val}
                          {row.warn && occupied > 0 && (
                            <span className="ml-1.5 text-[12px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                              {isKh ? "មិនទាន់សម្រេច" : "unpaid"}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Expected cash reconciliation panel (auto-refreshes every few seconds) */}
                  <div className="rounded-lg border border-[#03624C]/20 dark:border-[#1857D8]/20 bg-[#03624C]/5 dark:bg-[#1857D8]/5 divide-y divide-[#03624C]/10 dark:divide-[#1857D8]/10">
                    {loadingPreview ? (
                      <div className="flex items-center justify-center py-4 gap-2 text-[13px] text-gray-500 dark:text-white/40">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {isKh ? "កំពុងគណនា..." : "Calculating..."}
                      </div>
                    ) : preview ? (
                      <>
                        <div className="flex items-center justify-between px-3.5 py-2">
                          <span className="text-[13px] text-gray-600 dark:text-white/40">
                            {isKh ? "លក់ដាច់ជាសាច់ប្រាក់ (Cash)" : "Cash Sales"}
                          </span>
                          <span className="text-[13px] font-semibold text-gray-800 dark:text-white/85">
                            ${preview.cash_sales_usd.toFixed(2)}
                          </span>
                        </div>
                        {preview.open_amount_khr > 0 && (
                          <div className="flex items-center justify-between px-3.5 py-2">
                            <span className="text-[13px] text-gray-500 dark:text-white/30">
                              {isKh ? "ប្រាក់រៀលបើកដើមទុន (≈ USD)" : "Opening KHR float (≈ USD)"}
                            </span>
                            <span className="text-[13px] text-gray-500 dark:text-white/30">
                              ៛{preview.open_amount_khr.toLocaleString()} ≈ ${(preview.open_amount_khr / exchangeRate).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {preview.non_cash_sales_usd > 0 && (
                          <div className="flex items-center justify-between px-3.5 py-2">
                            <span className="text-[13px] text-gray-500 dark:text-white/30">
                              {isKh ? "លក់ដាច់មិនមែនសាច់ប្រាក់ (Card/QR)" : "Non-cash Sales (Card/QR)"}
                            </span>
                            <span className="text-[13px] text-gray-500 dark:text-white/30">
                              ${preview.non_cash_sales_usd.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {preview.split_payment_count > 0 && (
                          <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-amber-50 dark:bg-amber-500/10">
                            <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                              <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="text-[12px] text-amber-700 dark:text-amber-300 pt-0.5 leading-relaxed">
                              {isKh
                                ? `មាន ${preview.split_payment_count} order បង់ចម្រុះ (cash+card) — សូមពិនិត្យដោយដៃ`
                                : `${preview.split_payment_count} split-payment order(s) — please verify manually`}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between px-3.5 py-2">
                          <span className="text-[13px] text-gray-500 dark:text-white/30">
                            {isKh ? "អត្រាប្តូរប្រាក់" : "Exchange rate"}
                          </span>
                          <span className="text-[13px] text-gray-500 dark:text-white/30 flex items-center gap-1.5">
                            $1 = ៛{exchangeRate.toLocaleString()}
                            {preview?.exchange_rate_mode && (
                              <span className={cn(
                                "text-[11px] font-bold px-1.5 py-0.5 rounded",
                                preview.exchange_rate_mode === "manual"
                                  ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                  : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              )}>
                                {preview.exchange_rate_mode === "manual"
                                  ? (isKh ? "ដោយដៃ" : "Manual")
                                  : (isKh ? "ស្វ័យប្រវត្តិ" : "Auto")}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between px-3.5 py-2.5">
                          <span className="text-[14px] font-bold text-[#03624C] dark:text-[#1857D8]">
                            {isKh ? "ប្រាក់គួរមាន (Expected, USD+KHR)" : "Expected Cash (USD+KHR)"}
                          </span>
                          <span className="text-[15px] font-bold text-[#03624C] dark:text-[#1857D8]">
                            ${(expectedCashUsd ?? preview.expected_cash_usd).toFixed(2)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="px-3.5 py-2.5 text-[12px] text-gray-400 dark:text-white/30">
                        {isKh ? "មិនអាចគណនាបានទេ" : "Could not load expected cash"}
                      </div>
                    )}
                  </div>

                  {occupied > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20" >
                      <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p className="text-[14px] font-semibold text-amber-700 dark:text-amber-300 pt-1 leading-snug">
                        {isKh
                          ? `មានតុ ${occupied} ដែលនៅមានភ្ញៀវវិធី — ត្រូវសម្រេចការបង់ប្រាក់ជាមុន`
                          : `${occupied} table(s) still occupied — please settle payments first`}
                      </p>
                    </motion.div>
                  )}
                  <div>
                    <p className="text-[16px] text-gray-600 dark:text-white/40 font-medium mb-2.5">
                      {isKh ? "ប្រាក់ក្នុង Cash Drawer (ពេលបិទ)" : "Closing Cash"}
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: isKh ? "រៀល (KHR)" : "Riel (KHR)", sym: "៛", val: cashKhr, set: setCashKhr, step: "1000", ph: "0", hasErr: khrErr && cashKhr !== "" },
                        { label: isKh ? "ដុល្លារ (USD)" : "Dollar (USD)", sym: "$", val: cashUsd, set: setCashUsd, step: "1", ph: "0.00", hasErr: usdErr && cashUsd !== "" },
                      ].map(f => (
                        <div key={f.label}>
                          <label className="text-[14px] text-gray-600 dark:text-white/40 block mb-1.5">
                            {f.label}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-gray-600 dark:text-white/40 pointer-events-none">
                              {f.sym}
                            </span>
                            <input
                              type="number" min="0.01" step={f.step}
                              className={cn(
                                iCls, "pl-7",
                                f.hasErr && "border-red-400 dark:border-red-500/60 focus:border-red-400 focus:ring-red-400/15"
                              )}
                              placeholder={f.ph} value={f.val}
                              onChange={e => f.set(e.target.value)}
                            />
                          </div>
                          {f.hasErr && (
                            <p className="text-[10px] text-red-400 dark:text-red-400 mt-1 ml-0.5">
                              {isKh ? "សូមបញ្ចូលចំនួនលើសពី 0" : "Must be greater than 0"}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Combined USD-equivalent total of what was actually counted */}
                    {actualTotalUsd !== null && (
                      <p className="mt-1.5 ml-0.5 text-[11px] text-gray-400 dark:text-white/30">
                        {isKh ? "សរុបទាំងអស់ (≈ USD)" : "Combined total (≈ USD)"}: ${actualTotalUsd.toFixed(2)}
                      </p>
                    )}

                    {/* Over/short badge — shown once staff has entered both amounts */}
                    {difference !== null && (
                      <div className={cn(
                        "mt-2.5 flex items-center gap-3 px-3 py-2.5 rounded-lg border",
                        discrepancyStyle.box
                      )}>
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", discrepancyStyle.chip)}>
                          <discrepancyStyle.Icon className={cn("w-3.5 h-3.5", discrepancyStyle.text)} />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <span className={cn("text-[13px] font-semibold", discrepancyStyle.text)}>
                            {hasDiscrepancy
                              ? (difference < 0
                                ? (isKh ? "លុយខ្វះ (Short)" : "Cash Short")
                                : (isKh ? "លុយលើស (Over)" : "Cash Over"))
                              : (isKh ? "ត្រូវគ្នា" : "Balanced")}
                          </span>
                          <span className={cn("text-[13px] font-bold", discrepancyStyle.text)}>
                            {difference >= 0 ? "+" : "-"}${Math.abs(difference).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[14px] text-gray-600 dark:text-white/40 block mb-1.5">
                      {isKh ? "កំណត់ចំណាំ" : "Note"}
                    </label>
                    <textarea
                      className={cn(iCls, "h-16 py-2.5 resize-none")}
                      placeholder={isKh ? "បន្ថែមកំណត់ចំណាំ (ស្រេចចិត្ត)..." : "Add a note (optional)..."}
                      value={note}
                      onChange={e => setNote(e.target.value)}
                    />
                  </div>
                </div>
                <div className="px-5 pb-5 pt-3 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] flex gap-2 justify-end rounded-b-lg shrink-0">
                  <button
                    onClick={() => onOpenChange(false)}
                    className="h-9 px-4 rounded-lg text-[14px] border border-gray-200 dark:border-white/[0.10] text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all" >
                    {isKh ? "បោះបង់" : "Cancel"}
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleClose}
                    disabled={closing || !isFormValid}
                    className="h-9 px-5 rounded-lg text-[14px] flex items-center gap-2 bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90 text-white disabled:opacity-50 transition-all shadow-md shadow-[#03624C]/25 dark:shadow-[#1857D8]/25" >
                    {closing
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{isKh ? "កំពុងបិទ..." : "Closing..."}</>
                      : <><LogOut className="w-3.5 h-3.5" />{isKh ? "បិទវេន" : "Close Shift"}</>
                    }
                  </motion.button>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <Dialog open={showDiscrepancyConfirm} onOpenChange={v => !closing && setShowDiscrepancyConfirm(v)}>
        <DialogContent
          className="max-w-md p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-2xl bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden overflow-hidden"
          style={SORA}
        >
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0">
            <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-lg border flex items-center justify-center",
                difference !== null && difference < 0
                  ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20"
                  : "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20"
              )}>
                <AlertTriangle className={cn(
                  "w-3.5 h-3.5",
                  difference !== null && difference < 0 ? "text-red-500 dark:text-red-400" : "text-amber-500 dark:text-amber-400"
                )} />
              </div>
              {isKh ? "ចំនួនទឹកប្រាក់មិនត្រូវគ្នា" : "Cash amount mismatch"}
            </DialogTitle>
            <DialogDescription className="sr-only">Confirm closing shift with a cash discrepancy</DialogDescription>
          </div>

          <div className="px-6 py-4">
            <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
              <div>
                <p className="text-[14px] font-semibold text-gray-800 dark:text-white/90">
                  {difference !== null && difference < 0
                    ? (isKh ? "លុយខ្វះ (Short)" : "Cash Short")
                    : (isKh ? "លុយលើស (Over)" : "Cash Over")}
                </p>
                <p className="text-[12px] text-gray-400 dark:text-white/30 mt-0.5">
                  {isKh ? "ធៀបនឹងចំនួនគួរមាន (USD+KHR)" : "compared to expected cash (USD+KHR)"}
                </p>
              </div>
              <span className={cn(
                "text-[16px] font-bold",
                difference !== null && difference < 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
              )}>
                {difference! >= 0 ? "+" : "-"}${Math.abs(difference ?? 0).toFixed(2)}
              </span>
            </div>
            <p className="text-[14px] text-gray-500 dark:text-white/40 mt-3 leading-relaxed">
              {isKh ? "តើអ្នកចង់បន្តបិទវេនទោះជាមានភាពខុសគ្នានេះដែរឬទេ?" : "Do you still want to continue closing the shift with this discrepancy?"}
            </p>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] rounded-b-2xl">
            <div className="flex justify-end gap-2 w-full">
              <button
                onClick={() => setShowDiscrepancyConfirm(false)}
                disabled={closing}
                className="h-9 px-4 rounded-lg text-[14px] font-semibold border border-gray-200 dark:border-white/[0.10] text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-all"
              >
                {isKh ? "បោះបង់" : "Cancel"}
              </button>
              <button
                onClick={() => { setShowDiscrepancyConfirm(false); performClose(); }}
                disabled={closing}
                className={cn(
                  "h-9 px-4 rounded-lg text-[14px] font-semibold text-white disabled:opacity-50 flex items-center gap-1.5 active:scale-[0.97] transition-all",
                  difference !== null && difference < 0 ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"
                )}
              >
                {closing && <Loader2 className="w-3 h-3 animate-spin" />}
                {isKh ? "បន្តទោះជាយ៉ាងណា" : "Continue anyway"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}