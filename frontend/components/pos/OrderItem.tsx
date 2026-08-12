"use client";

import { Trash2, Minus, Plus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CartItem, NoteItems } from "./pos-type";
import type { MenuItem } from "@/types";

interface OrderItemRowProps {
  item: CartItem;
  menuItem?: MenuItem;
  isOrderConfirmed: boolean;
  isKh: boolean;
  noteItems: NoteItems;
  noteEditId: string | null;
  noteEditValue: string;
  onChangeQty: (id: string, delta: number) => void;
  onNoteEditStart: (id: string, current: string) => void;
  onNoteEditSave: (id: string, value: string) => void;
  onNoteEditCancel: () => void;
  onNoteValueChange: (value: string) => void;
}

export function OrderItemRow({
  item,
  menuItem,
  isOrderConfirmed,
  isKh,
  noteItems,
  noteEditId,
  noteEditValue,
  onChangeQty,
  onNoteEditStart,
  onNoteEditSave,
  onNoteEditCancel: onNot16pxtCancel,
  onNoteValueChange,
}: OrderItemRowProps) {
  const hasDiscount = item.original_price
    ? item.original_price > item.price
    : !!menuItem?.discounted_price;
  const originalPrice = item.original_price ?? menuItem?.price ?? item.price;
  const itemId = String(item.id);
  const isEditingNote = noteEditId === itemId;
  const currentNote = noteItems[itemId] || item.note || "";

  return (
    <div className="px-4 py-3 border-b border-gray-50">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[16px] font-semibold text-gray-800 flex-1 leading-snug">
          {item.name}
        </p>
        <button
          onClick={() => onChangeQty(itemId, -item.quantity)}
          className="w-[22px] h-[22px] shrink-0 rounded-md bg-red-50 border border-red-200 flex items-center justify-center hover:bg-red-100 transition-colors" >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
      {hasDiscount ? (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[14px] line-through text-gray-400">
            ${originalPrice.toFixed(2)}
          </span>
          <span className="text-[14px] font-bold text-[#03624C]">
            ${item.price.toFixed(2)}
          </span>
          <span className="text-[14px] text-gray-400">× {item.quantity} =</span>
          <span className="text-[16px] font-bold text-[#03624C] ml-1">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      ) : (
        <p className="text-[14px] font-bold text-[#03624C] mt-0.5">
          ${item.price.toFixed(2)} × {item.quantity} ={" "}
          <span className="text-[14px] ml-1">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onChangeQty(itemId, -1)}
            className={cn(
              "w-6 h-6 rounded-lg border flex items-center justify-center text-[13px] font-bold transition-all",
              isOrderConfirmed
                ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
            )} >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-7 text-center text-[13px] font-bold text-gray-800">
            {item.quantity}
          </span>
          <button
            onClick={() => !isOrderConfirmed && onChangeQty(itemId, +1)}
            disabled={isOrderConfirmed}
            className="w-6 h-6 rounded-lg border border-[#03624C]/20 bg-[#03624C]/10 text-[#03624C] flex items-center justify-center hover:bg-[#03624C]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {isEditingNote ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              className="h-6 w-28 px-2 text-[12px] rounded-md border border-gray-200 outline-none focus:border-[#03624C]"
              value={noteEditValue}
              onChange={(e) => onNoteValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter")  onNoteEditSave(itemId, noteEditValue);
                if (e.key === "Escape") onNot16pxtCancel();
              }}
            />
            <button
              onClick={() => onNoteEditSave(itemId, noteEditValue)}
              className="text-[12px]font-bold text-[#03624C] hover:opacity-70"
            >
              ✓
            </button>
            <button
              onClick={onNot16pxtCancel}
              className="text-[12px] ml-1 font-bold text-gray-600 hover:opacity-70"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNoteEditStart(itemId, currentNote)}
            className={cn(
              "flex items-center gap-1 text-[12px] border rounded-md px-2 py-0.5 transition-all max-w-[140px]",
              currentNote
                ? "border-[#03624C]/30 text-[#03624C] bg-[#03624C]/5 hover:bg-[#03624C]/10"
                : "border-gray-200 text-gray-400 bg-gray-50 hover:border-[#03624C]/30 hover:text-[#03624C]"
            )}
          >
            <FileText className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">
              {currentNote || (isKh ? "ចំណាំ" : "Add note")}
            </span>
          </button>
        )}
      </div>
      {currentNote && !isEditingNote && (
        <p className="mt-1.5 text-[12px] text-amber-600 bg-amber-50 rounded-md px-2 py-1 border border-amber-100">
          📝 {currentNote}
        </p>
      )}
    </div>
  );
}