"use client";

// hooks/use-table-transfer.tsx
// One hook = state + dialog. The POS page only needs ~4 lines (see bottom).
import { useCallback, useState } from "react";
import { TableTransferDialog } from "@/components/pos/table-transfer";
import type { PosTable } from "@/store/pos.store";

export function useTableTransfer(opts: {
   tables: PosTable[];
   isKh: boolean;
   onSuccess: () => void; // refetch tables (and clear selected table if you want)
}) {
   const [state, setState] = useState<{ mode: "transfer" | "merge"; source: PosTable } | null>(null);

   const open = useCallback(
      (mode: "transfer" | "merge", source: PosTable | null | undefined) => {
         if (source) setState({ mode, source });
      },
      []
   );

   const dialog = (
      <TableTransferDialog
         open={!!state}
         onOpenChange={v => !v && setState(null)}
         mode={state?.mode ?? "transfer"}
         source={state?.source ?? null}
         tables={opts.tables}
         isKh={opts.isKh}
         onSuccess={opts.onSuccess}
      />
   );

   return { open, dialog };
}

/* ── In your POS page ───────────────────────────────────────────
const tt = useTableTransfer({ tables, isKh, onSuccess: refetchTables });

<OrderFooter
  ...existing props
  showTableActions={selectedTable?.status === "occupied"}
  onTransferTable={() => tt.open("transfer", selectedTable)}
  onMergeTable={() => tt.open("merge", selectedTable)}
/>
{tt.dialog}
───────────────────────────────────────────────────────────────── */