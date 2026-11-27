// components/pos/RemoveItemDialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, Loader2, RotateCcw, Trash2 } from "lucide-react";
const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" };

interface RemoveItemDialogProps {
  open: boolean;
  onClose: () => void;
  item: any;
  delta: number;
  onConfirm: (restoreStock: boolean) => void;
  isRestoring: boolean;
  isKh: boolean;
}

export function RemoveItemDialog({ open, onClose, item, delta, onConfirm, isRestoring, isKh }: RemoveItemDialogProps) {
  if (!item) return null;
  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="max-w-md p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-2xl bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden overflow-hidden"
        style={SORA}
      >
        <div className="h-1 w-full bg-gradient-to-r bg-rose-600" />
        <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0">
          <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            </div>
            {isKh ? "លុបមុខម្ហូបនេះ?" : "Remove this item?"}
          </DialogTitle>
          <DialogDescription className="sr-only">Confirm removal</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="flex items-start gap-3 px-3 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
            <div>
              <p className="text-[14px] font-semibold text-gray-800 dark:text-white/90">{item.name}</p>
              <p className="text-[12px] text-gray-400 dark:text-white/30 mt-0.5">
                ×{item.quantity} · ${((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-[14px] text-gray-500 dark:text-white/40 mt-3 leading-relaxed">
            {isKh ? "តើអ្នកចង់ដាក់ទំនិញត្រឡប់ទៅស្តុកវិញទេ?" : "Do you want to return this item back to stock?"}
          </p>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] rounded-b-2xl">
          <div className="flex justify-end gap-2 w-full">
            <button
              onClick={onClose}
              disabled={isRestoring}
              className="h-9 px-4 rounded-lg text-[14px] font-semibold border border-gray-200 dark:border-white/[0.10] text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-all"
            >
              {isKh ? "បោះបង់" : "Cancel"}
            </button>
            <button
              onClick={() => onConfirm(true)}
              disabled={isRestoring}
              className="h-9 px-4 rounded-lg text-[14px] font-semibold bg-[#03624C] hover:bg-emerald-600 text-white disabled:opacity-50 flex items-center gap-1.5 active:scale-[0.97] transition-all"
            >
              {isRestoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              {isKh ? "ដាក់ស្តុកត្រឡប់" : "Restore stock"}
            </button>
            <button
              onClick={() => onConfirm(false)}
              disabled={isRestoring}
              className="h-9 px-4 rounded-lg text-[14px] font-semibold bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-50 flex items-center gap-1.5 active:scale-[0.97] transition-all"
            >
              <Trash2 className="w-3 h-3" />
              {isKh ? "លុបចេញ" : "Remove"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}