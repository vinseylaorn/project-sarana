"use client";

import { motion } from "framer-motion";
import { Clock, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt12 } from "@/lib/utils/pos-helpers";
import type { PosTable } from "./pos-type";

const STATUS_STYLE = {
  available: {
    card: "border-[#1857D8]/30 hover:border-[#1857D8]",
    body: "bg-[#1857D8]/10 border-2 border-[#1857D8]/30 text-[#1857D8]",
    badge:
      "bg-[#1857D8]/15 border border-[#1857D8]/25 text-[#1857D8]",
  },
  occupied: {
    card: "border-rose-200 hover:border-rose-400",
    body: "bg-rose-50 border-2 border-rose-200 text-rose-600",
    badge:
      "bg-rose-100 border border-rose-200 text-rose-700",
  },
  reserved: {
    card: "border-amber-200 hover:border-amber-400",
    body: "bg-amber-50 border-2 border-amber-200 text-amber-600",
    badge:
      "bg-amber-100 border border-amber-200 text-amber-700",
  },
} as const;

interface TableCardProps {
  table: PosTable;
  isSelected: boolean;
  isKh: boolean;
  onClick: (table: PosTable) => void;
}

export function TableCard({ table, isSelected, isKh, onClick }: TableCardProps) {
  const s = STATUS_STYLE[table.status] ?? STATUS_STYLE.available;

  return (
    <motion.div
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(table)}
      className={cn(
        "relative bg-white rounded-lg border cursor-pointer p-4 shadow-sm transition-colors",
        s.card,
        isSelected && "ring-2 ring-[#1857D8]"
      )} >
      {table.isOrderConfirmed && (
        <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-lg bg-[#1857D8] flex items-center justify-center">
          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
        </span>
      )}
      <p className="text-[14px] font-semibold text-gray-600 mb-2">{table.name}</p>
      <div
        className={cn(
          "aspect-square rounded-lg flex flex-col items-center justify-center mb-2.5",
          s.body
        )} >
        <span className="text-[24px] font-black leading-none">
          {table.name.replace(/\D/g, "") || "?"}
        </span>
        <div className="flex items-center gap-1 mt-1 opacity-70">
          <Users className="w-3 h-3" />
          <span className="text-[14px] font-medium">{table.seats}</span>
        </div>
      </div>
      <div
        className={cn(
          "w-full py-1.5 rounded-lg text-[14px] flex flex-col items-center justify-center gap-0.5",
          s.badge
        )} >
        {table.status === "reserved" ? (
          <>
            <div className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {fmt12(table.reserveTime || "")}
            </div>
            {table.reservedBy && (
              <div
                className="text-[14px] font-normal truncate max-w-full"
                title={table.reservedBy}
              >
                {table.reservedBy}
                {table.reservedPhone && ` · ${table.reservedPhone}`}
              </div>
            )}
          </>
        ) : table.status === "occupied" ? (
          isKh ? "មានភ្ញៀវ" : "Occupied"
        ) : (
          isKh ? "ទំនេរ" : "Available"
        )}
      </div>
    </motion.div>
  );
}