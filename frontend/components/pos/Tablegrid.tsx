"use client";

import { Users } from "lucide-react";
import { TableCard } from "./Table-card";
import type { PosTable } from "./pos-type";

interface TableGridProps {
  tables: PosTable[];
  selectedTableId?: string | number | null;
  posOpen: boolean;
  isKh: boolean;
  onSelectTable: (table: PosTable) => void;
}
export function TableGrid({
  tables,
  selectedTableId,
  posOpen,
  isKh,
  onSelectTable,
}: TableGridProps) {
  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-300">
        <Users className="w-12 h-12" />
        <p className="text-[14px] font-medium">
          {isKh ? "មិនមានតុ" : "No tables found"}
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-3">
      {tables.map((table, idx) => (
        <TableCard
          key={`${table.id}-${idx}`}
          table={table}
          isSelected={selectedTableId === table.id && posOpen}
          isKh={isKh}
          onClick={onSelectTable}
        />
      ))}
    </div>
  );
}