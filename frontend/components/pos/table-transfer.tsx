"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, ArrowLeftRight, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { transferTable, mergeTables } from "@/lib/api/table-transfer";
import { toast } from "sonner";
import {
   type PosTable,
   getTableOrder, saveTableOrder, clearTableOrder,
} from "@/store/pos.store";
import { saveTableOrderId, clearTableOrderId } from "@/lib/utils/pos-helpers";

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" };

interface Props {
   open: boolean;
   onOpenChange: (v: boolean) => void;
   mode: "transfer" | "merge";
   source: PosTable | null;
   tables: PosTable[];
   isKh: boolean;
   onSuccess: () => void; // parent: refetch tables
}

// Move / combine the LOCAL (not yet sent to kitchen) cart of the tables
function moveDraft(mode: "transfer" | "merge", fromId: number, toId: number, orderId: number | null) {
   if (mode === "transfer") {
      // bill ផ្ទេរទៅតុថ្មី → ចងចាំ order id លើតុថ្មី, លុបលើតុចាស់
      if (orderId) saveTableOrderId(toId, orderId);
      clearTableOrderId(fromId);
   } else if (orderId) {
      // ✅ merge: តុទាំងពីរចង្អុលទៅ bill តែមួយ (មិនលុប order id របស់តុ source ទៀតទេ)
      saveTableOrderId(fromId, orderId);
      saveTableOrderId(toId, orderId);
   }

   const from = getTableOrder(fromId);
   if (!from || !from.items.length) return;

   if (mode === "transfer") {
      saveTableOrder(toId, from.items);
   } else {
      const to = getTableOrder(toId);
      const map = new Map<string, any>();
      [...(to?.items ?? []), ...from.items].forEach(i => {
         const key = `${i.id ?? i.menu_item_id ?? i.name}|${i.price}`;
         const ex = map.get(key);
         map.set(key, ex ? { ...ex, quantity: ex.quantity + i.quantity } : { ...i });
      });
      saveTableOrder(toId, [...map.values()]);
   }
   clearTableOrder(fromId);
}

export function TableTransferDialog({ open, onOpenChange, mode, source, tables, isKh, onSuccess }: Props) {
   const [targetId, setTargetId] = useState<number | null>(null);
   const [busy, setBusy] = useState(false);

   useEffect(() => { if (open) { setTargetId(null); setBusy(false); } }, [open]);

   const isTransfer = mode === "transfer";

   // តុដែលនៅ bill តែមួយជាមួយ source រួចហើយ មិនត្រូវបង្ហាញ
   const sourceOrderId = (source as any)?.order_id ?? null;
   const sameBill = (t: any) => !!sourceOrderId && t?.order_id === sourceOrderId;

   const candidates = tables.filter(t =>
      t.id !== source?.id &&
      (isTransfer ? t.status === "available" : t.status === "occupied" && !sameBill(t))
   );
   const target = candidates.find(t => Number(t.id) === targetId) ?? null;

   const title = isTransfer
      ? (isKh ? "ប្តូរតុ" : "Transfer Table")
      : (isKh ? "បញ្ចូលតុ" : "Merge Tables");
   const Icon = isTransfer ? ArrowLeftRight : Link2;

   const confirm = async () => {
      if (!source || !target || busy) return;
      setBusy(true);
      try {
         const res: any = isTransfer
            ? await transferTable(Number(source.id), Number(target.id))
            : await mergeTables(Number(source.id), Number(target.id));
         moveDraft(mode, Number(source.id), Number(target.id), res?.order_id ?? null);
         toast.success(isTransfer
            ? (isKh ? `បានប្តូរ ${source.name} → ${target.name}` : `Moved ${source.name} → ${target.name}`)
            : (isKh ? `បានបញ្ចូល ${source.name} ទៅ ${target.name}` : `Merged ${source.name} into ${target.name}`));
         onSuccess();
         onOpenChange(false);
      } catch (e: any) {
         toast.error(typeof e?.message === "string" ? e.message : "Failed");
         setBusy(false);
      }
   };

   return (
      <Dialog open={open} onOpenChange={v => !busy && onOpenChange(v)}>
         <DialogContent
            className="max-w-[440px] p-0 rounded-2xl border border-gray-200 dark:border-white/[0.13] bg-white dark:bg-[#1e2235] shadow-2xl [&>button]:hidden overflow-hidden"
            style={SORA}
         >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center gap-3">
               <div className="w-9 h-9 rounded-lg bg-[#03624C]/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#03624C]" />
               </div>
               <div>
                  <DialogTitle className="text-[16px] font-bold text-gray-900 dark:text-white/90">{title}</DialogTitle>
                  <DialogDescription className="text-[12px] text-gray-500 dark:text-white/40">
                     {isTransfer
                        ? (isKh ? `ពី ${source?.name} ទៅតុទំនេរ` : `From ${source?.name} to an empty table`)
                        : (isKh ? `បញ្ចូលវិក្កយបត្រ ${source?.name} ទៅតុផ្សេង` : `Add ${source?.name}'s items to another table's bill`)}
                  </DialogDescription>
               </div>
            </div>

            <div className="px-5 py-4 max-h-[50vh] overflow-y-auto">
               {candidates.length === 0 ? (
                  <p className="text-[14px] text-gray-500 dark:text-white/40 text-center py-6">
                     {isTransfer
                        ? (isKh ? "គ្មានតុទំនេរ" : "No empty tables available")
                        : (isKh ? "គ្មានតុផ្សេងដែលមានភ្ញៀវ" : "No other occupied tables")}
                  </p>
               ) : (
                  <div className="grid grid-cols-3 gap-2">
                     {candidates.map(t => (
                        <button
                           key={t.id}
                           onClick={() => setTargetId(Number(t.id))}
                           className={cn(
                              "h-14 rounded-lg border text-[14px] font-semibold transition-all",
                              Number(t.id) === targetId
                                 ? "bg-[#03624C] text-white border-[#03624C]"
                                 : "bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-white/80 hover:border-[#03624C]/50"
                           )}
                        >
                           {t.name}
                           <span className="block text-[11px] font-normal opacity-70">{t.seats} {isKh ? "កៅអី" : "seats"}</span>
                        </button>
                     ))}
                  </div>
               )}

               {target && source && (
                  <p className="mt-3 text-[13px] text-center text-gray-600 dark:text-white/60">
                     {source.name} → <b>{target.name}</b>
                  </p>
               )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] flex justify-end gap-2">
               <button
                  onClick={() => onOpenChange(false)} disabled={busy}
                  className="h-9 px-4 rounded-lg text-[14px] border border-gray-200 dark:border-white/[0.10] text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50"
               >
                  {isKh ? "បោះបង់" : "Cancel"}
               </button>
               <button
                  onClick={confirm} disabled={!target || busy}
                  className="h-9 px-5 rounded-lg text-[14px] font-bold flex items-center gap-2 bg-[#03624C] hover:bg-[#024a38] text-white disabled:opacity-50"
               >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                  {isKh ? "បញ្ជាក់" : "Confirm"}
               </button>
            </div>
         </DialogContent>
      </Dialog>
   );
}