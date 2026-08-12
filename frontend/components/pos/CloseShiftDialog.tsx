"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, Loader2, CheckCircle2, AlertTriangle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { post } from "@/lib/api/client";
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

export function CloseShiftDialog({ open, onOpenChange, isKh, tables, onSuccess }: CloseShiftDialogProps) {
  const [cashKhr, setCashKhr] = useState("");
  const [cashUsd, setCashUsd] = useState("");
  const [note, setNote]       = useState("");
  const [closing, setClosing] = useState(false);
  const [done, setDone]       = useState(false);

  const posStaffName = typeof window !== "undefined" ? sessionStorage.getItem("pos_staff_name") ?? "—" : "—";
  const openKhr      = typeof window !== "undefined" ? sessionStorage.getItem("pos_cash_khr")   ?? "0" : "0";
  const openUsd      = typeof window !== "undefined" ? sessionStorage.getItem("pos_cash_usd")   ?? "0" : "0";
  const occupied     = tables.filter(t => t.status === "occupied").length;
  const now          = new Date();
  const dateStr      = now.toLocaleDateString(isKh ? "km-KH" : "en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    if (open) {
      setCashKhr(""); setCashUsd(""); setNote("");
      setClosing(false); setDone(false);
    }
  }, [open]);

  const khrNum = parseFloat(cashKhr)
  const usdNum = parseFloat(cashUsd)
  const khrErr = cashKhr.trim() === "" || isNaN(khrNum) || khrNum <= 0
  const usdErr = cashUsd.trim() === "" || isNaN(usdNum) || usdNum <= 0
  const isFormValid = !khrErr && !usdErr

  const handleClose = async () => {
    if (closing) return;
    if (!isFormValid) {
      toast.error(isKh ? "សូមបញ្ចូលទឹកប្រាក់ KHR និង USD លើសពី 0" : "Please enter KHR and USD amounts greater than 0")
      return
    }
    setClosing(true);
    try {
      const shiftId = sessionStorage.getItem("pos_shift_id");
      if (shiftId) {
        await post(`/pos/close-shift/${shiftId}`, {
          close_amount_usd: parseFloat(cashUsd || "0") || 0,
          close_amount_khr: parseInt(cashKhr   || "0") || 0,
          total_orders: 0, total_revenue_usd: 0, total_revenue_khr: 0,
          note: note || null,
        });
      }

      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "pos_token=;  expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      ["pos_staff_id","pos_staff_name","pos_cash_khr","pos_cash_usd","pos_shift_type","pos_shift_id","login_screen"]
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

  const iCls = [
    "w-full h-10 px-3 text-[14px] rounded-lg outline-none transition-all",
    "bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400",
    "focus:border-[#03624C] focus:ring-2 focus:ring-[#03624C]/15",
  ].join(" ");

  return (
    <Dialog open={open} onOpenChange={v => !closing && onOpenChange(v)}>
      <DialogContent
        className="max-w-[420px] p-0 border border-gray-200 shadow-2xl rounded-2xl bg-white flex flex-col [&>button]:hidden overflow-hidden"
        style={SORA} >
        <DialogTitle className="sr-only">
          Close Shift
        </DialogTitle>
        <DialogDescription className="sr-only">
          Close the current working shift
        </DialogDescription>
        <div className="h-1 w-full bg-[#03624C]" />
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
                className="w-16 h-16 rounded-2xl bg-[#03624C]/10 border border-[#03624C]/20 flex items-center justify-center" >
                <CheckCircle2 className="w-8 h-8 text-[#03624C]" />
              </motion.div>
              <div className="text-center">
                <p className="text-[17px] text-[#03624C]">
                  {isKh ? "វេនបានបិទ!" : "Shift Closed!"}
                </p>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  {isKh ? "កំពុងបញ្ជូន..." : "Redirecting..."}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              <div className="px-5 pt-5 pb-4 flex items-start justify-between border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1857D8]/10 border border-[#1857D8]/20 flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4 text-[#1857D8]" />
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-gray-900">
                      {isKh ? "បិទវេនការងារ" : "Close Shift"}
                    </p>
                    <p className="text-[12px] text-gray-400 mt-0.5">{posStaffName}</p>
                  </div>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors" >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div className="rounded-lg border border-gray-100 bg-gray-50 divide-y divide-gray-100">
                  {[
                    { label: isKh ? "ថ្ងៃនេះ"         : "Date",          val: dateStr },
                    { label: isKh ? "ប្រាក់បើក (KHR)" : "Opening KHR",   val: `៛${parseInt(openKhr).toLocaleString()}` },
                    { label: isKh ? "ប្រាក់បើក (USD)" : "Opening USD",   val: `$${parseFloat(openUsd).toFixed(2)}` },
                    { label: isKh ? "តុមានភ្ញៀវ"      : "Active tables", val: String(occupied), warn: occupied > 0 },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-[14px] text-gray-600">{row.label}</span>
                      <span className={cn(
                        "text-[14px] font-semibold",
                        row.warn && occupied > 0 ? "text-amber-600" : "text-gray-800"
                      )}>
                        {row.val}
                        {row.warn && occupied > 0 && (
                          <span className="ml-1.5 text-[12px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">
                            {isKh ? "មិនទាន់សម្រេច" : "unpaid"}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                {occupied > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200" >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[14px] font-semibold text-amber-700">
                      {isKh
                        ? `មានតុ ${occupied} ដែលនៅមានភ្ញៀវវិធី — ត្រូវសម្រេចការបង់ប្រាក់ជាមុន`
                        : `${occupied} table(s) still occupied — please settle payments first`}
                    </p>
                  </motion.div>
                )}
                <div>
                  <p className="text-[16px] text-gray-600 font-medium mb-2.5">
                    {isKh ? "ប្រាក់ក្នុង Cash Drawer (ពេលបិទ)" : "Closing Cash"}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: isKh ? "រៀល (KHR)" : "Riel (KHR)",      sym: "៛", val: cashKhr, set: setCashKhr, step: "1000", ph: "0",    hasErr: khrErr && cashKhr !== "" },
                      { label: isKh ? "ដុល្លារ (USD)" : "Dollar (USD)", sym: "$", val: cashUsd, set: setCashUsd, step: "1",    ph: "0.00", hasErr: usdErr && cashUsd !== "" },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="text-[14px]  text-gray-600 block mb-1.5">
                          {f.label}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-gray-600 pointer-events-none">
                            {f.sym}
                          </span>
                          <input
                            type="number" min="0.01" step={f.step}
                            className={cn(
                              iCls, "pl-7",
                              f.hasErr && "border-red-400 focus:border-red-400 focus:ring-red-400/15"
                            )}
                            placeholder={f.ph} value={f.val}
                            onChange={e => f.set(e.target.value)}
                          />
                        </div>
                        {f.hasErr && (
                          <p className="text-[10px] text-red-400 mt-1 ml-0.5">
                            {isKh ? "សូមបញ្ចូលចំនួនលើសពី 0" : "Must be greater than 0"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[14px]  text-gray-600 block mb-1.5">
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
              <div className="px-5 pb-5 pt-3 border-t border-gray-100 bg-gray-50 flex gap-2 justify-end rounded-b-lg">
                <button
                  onClick={() => onOpenChange(false)}
                  className="h-9 px-4 rounded-lg text-[14px] border border-gray-200 text-gray-500 hover:bg-gray-100 transition-all" >
                  {isKh ? "បោះបង់" : "Cancel"}
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleClose}
                  disabled={closing || !isFormValid}
                  className="h-9 px-5 rounded-lg text-[14px] flex items-center gap-2 bg-[#1857D8] hover:bg-[#1448b0] active:bg-[#1040a0] text-white disabled:opacity-50 transition-all shadow-md shadow-[#1857D8]/25" >
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
  );
}