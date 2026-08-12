"use client";

import { Minus, Plus } from "lucide-react";
import type { CartItem } from "./pos-type";
import type { MenuItem } from "@/types";

interface PendingOrderItemProps {
  item: CartItem;
  menuItem?: MenuItem;
  onChangeQty: (id: string, delta: number) => void;
}

export function PendingOrderItem({
  item,
  menuItem,
  onChangeQty,
}: PendingOrderItemProps) {
  const hasDiscount = item.original_price
    ? item.original_price > item.price
    : !!menuItem?.discounted_price;
  const originalPrice = item.original_price ?? menuItem?.price ?? item.price;
  const itemId = String(item.id);

  return (
    <div className="px-4 py-3 border-b border-amber-100 bg-amber-50/30">
      <p className="text-[12px] font-semibold text-gray-800">{item.name}</p>
      {hasDiscount ? (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] line-through text-gray-400">
            ${originalPrice.toFixed(2)}
          </span>
          <span className="text-[11px] font-bold text-[#03624C]">
            ${item.price.toFixed(2)}
          </span>
          <span className="text-[10px] text-gray-400">× {item.quantity} =</span>
          <span className="text-[12px] font-bold text-amber-600 ml-1">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      ) : (
        <p className="text-[11px] font-bold text-[#03624C] mt-0.5">
          ${item.price.toFixed(2)} × {item.quantity} ={" "}
          <span className="text-[12px] ml-1 text-amber-600">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </p>
      )}

      <div className="flex items-center gap-1.5 mt-2">
        <button
          onClick={() => onChangeQty(itemId, -1)}
          className="w-6 h-6 rounded-lg border border-gray-200 bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all" >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-7 text-center text-[13px] font-bold text-gray-800">
          {item.quantity}
        </span>
        <button
          onClick={() => onChangeQty(itemId, +1)}
          className="w-6 h-6 rounded-lg border border-[#03624C]/20 bg-[#03624C]/10 text-[#03624C] flex items-center justify-center hover:bg-[#03624C]/10 transition-all" >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}