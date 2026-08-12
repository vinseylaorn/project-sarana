"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, LayoutGrid } from "lucide-react";
import type { PosTable } from "./pos-type";
import { GoToAdminDialog } from "./GoToAdminDialog";

interface PosHeaderProps {
  isKh: boolean;
  tables: PosTable[];
  onCloseShift: () => void;
}

export function PosHeader({ isKh, tables, onCloseShift }: PosHeaderProps) {
  const router = useRouter();
  const [goToAdminOpen, setGoToAdminOpen] = useState(false);

  const posStaffName =
    typeof window !== "undefined"
      ? (sessionStorage.getItem("pos_staff_name") ?? "")
      : "";
  const shiftType =
    typeof window !== "undefined"
      ? (sessionStorage.getItem("pos_shift_type") ?? "Morning")
      : "Morning";

  const available = tables.filter((t) => t.status === "available").length;
  const occupied = tables.filter((t) => t.status === "occupied").length;
  const reserved = tables.filter((t) => t.status === "reserved").length;
  const initials = posStaffName
    ? posStaffName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "POS";

  const handleConfirmGoToAdmin = () => {
    setGoToAdminOpen(false);
    router.push("/");
  };

  return (
    <>
      <div className="h-[56px] shrink-0 flex items-center justify-between px-5 gap-4 bg-white border-b border-gray-200 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-sm bg-[#03624C]/10 border border-[#03624C]/20 flex items-center justify-center">
            <LayoutGrid className="w-[18px] h-[18px] text-[#03624C]" />
          </div>
          <div className="hidden sm:block">
            <p className="text-[16px] font-bold text-gray-900 leading-none">
              Point of Sale (POS)
            </p>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Dashboard • Pos
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[14px] font-semibold px-3 py-1 rounded-lg bg-[#1857D8]/10 border border-[#1857D8]/25 text-[#1857D8]">
            <span className="w-[7px] h-[7px] rounded-lg bg-[#1857D8]/100" />
            {available} {isKh ? "ទំនេរ" : "Free"}
          </span>
          <span className="flex items-center gap-1.5 text-[14px] font-semibold px-3 py-1 rounded-lg bg-red-50 border border-red-200 text-red-600">
            <span className="w-[7px] h-[7px] rounded-lg bg-red-500 animate-pulse" />
            {occupied} {isKh ? "មានភ្ញៀវ" : "Occupied"}
          </span>
          <span className="flex items-center gap-1.5 text-[14px] font-semibold px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
            <span className="w-[7px] h-[7px] rounded-lg bg-amber-400" />
            {reserved} {isKh ? "កក់ទុក" : "Reserved"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {posStaffName && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50">
              <div className="w-[26px] h-[26px] rounded-lg bg-[#03624C]/10 border border-[#03624C]/20 flex items-center justify-center text-[10px] font-bold text-[#03624C]">
                {initials}
              </div>
              <span className="text-[14px] font-semibold text-gray-700">
                {posStaffName}
              </span>
              <span className="text-[12px] font-bold px-2 py-0.5 rounded-lg bg-[#03624C]/15 text-[#03624C]">
                {shiftType}
              </span>
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setGoToAdminOpen(true)}
            className="h-8 px-3 cursor-pointer flex items-center gap-1.5 rounded-lg border text-[14px] font-semibold bg-[#03624C]/10 border-[#03624C]/25 text-[#03624C] hover:bg-[#03624C]/20 transition-all" >
            <LogOut className="w-3 h-3" />
            {isKh ? "ទំព័រគ្រប់គ្រង" : "Go To Admin"}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCloseShift}
            className="h-8 px-3 cursor-pointer flex items-center gap-1.5 rounded-lg border text-[14px] font-semibold bg-red-50 border-red-200 text-red-600 hover:bg-red-100 transition-all" >
            <LogOut className="w-3 h-3" />
            {isKh ? "បិទវេន" : "Close Shift"}
          </motion.button>
        </div>
      </div>

      <GoToAdminDialog
        isKh={isKh}
        open={goToAdminOpen}
        onOpenChange={setGoToAdminOpen}
        onConfirm={handleConfirmGoToAdmin}
      />
    </>
  );
}