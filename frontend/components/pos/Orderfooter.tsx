"use client";

import { motion } from "framer-motion";
import { Loader2, Utensils, CreditCard, Printer, LogOut } from "lucide-react";
import { printBill } from "@/components/pos/print-bill";
import type { CartItem } from "./pos-type";

interface OrderFooterProps {
  isKh: boolean;
  orderTotal: number;
  pendingTotal: number;
  discountTotal: number;
  items: CartItem[];
  orderType: string;
  orderId: number | null;
  systemName?: string | null;
  systemLogo?: string | null;
  isReserved: boolean;
  showPreOrderConfirm: boolean;
  showConfirm: boolean;
  showConfirmAdditional: boolean;
  showPay: boolean;
  showCheckOut: boolean;
  isSendingPreOrder: boolean;
  onGuestArrived: () => void;
  onCancelReservation: () => void;
  onConfirmPreOrder: () => void;
  onConfirmKitchen: () => void;
  onConfirmAdditional: () => void;
  onOpenCheckout: () => void;
  onCheckOut: () => void;
}

export function OrderFooter({
  isKh, orderTotal, pendingTotal, discountTotal,
  items, orderType, orderId, systemName, systemLogo,
  isReserved, showPreOrderConfirm, showConfirm, showConfirmAdditional,
  showPay, showCheckOut, isSendingPreOrder,
  onGuestArrived, onCancelReservation, onConfirmPreOrder,
  onConfirmKitchen, onConfirmAdditional, onOpenCheckout, onCheckOut,
}: OrderFooterProps) {
  const subtotal = orderTotal + pendingTotal + discountTotal;
  const total    = orderTotal + pendingTotal;

  const handlePrintBill = () => {
    printBill({
      items, orderType, orderId,
      subtotal,
      discountAmount:    discountTotal,
      discountMode:      "$",
      discountPct:       0,
      taxEnabled:        false,
      taxPct:            0,
      taxAmount:         0,
      finalTotal:        total,
      itemDiscountTotal: discountTotal,
      systemName,
      systemLogo,
    });
  };

  return (
    <div className="px-4 pt-3 pb-4 border-t border-gray-100 bg-gray-50 shrink-0 space-y-2">
      <div className="space-y-1">
        <div className="flex justify-between text-[14px]">
          <span className="text-gray-500">{isKh ? "សរុបរង :" : "Sub total :"}</span>
          <span className="font-semibold text-gray-800">${subtotal.toFixed(2)}</span>
        </div>
        {discountTotal > 0 && (
          <div className="flex justify-between text-[14px]">
            <span className="text-gray-500">{isKh ? "បញ្ចុះតម្លៃ :" : "Discount :"}</span>
            <span className="font-semibold text-[#03624C]">-${discountTotal.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between pt-2 border-t border-gray-200">
        <span className="text-[14px] font-bold text-gray-800">{isKh ? "សរុប :" : "Total :"}</span>
        <span className="text-[22px] font-black text-gray-900">${total.toFixed(2)}</span>
      </div>

      {isReserved && (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onGuestArrived} className="h-10 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[14px] font-bold transition-colors">
            {isKh ? "✓ មកដល់ហើយ" : "✓ Guest Arrived"}
          </button>
          <button onClick={onCancelReservation} className="h-10 rounded-lg bg-rose-100 border border-rose-200 text-rose-600 text-[14px] font-bold hover:bg-rose-200 transition-colors">
            {isKh ? "✕ លុបការកក់" : "✕ Cancel"}
          </button>
        </div>
      )}

      {showPreOrderConfirm && (
        <motion.button whileTap={{ scale: 0.98 }} onClick={onConfirmPreOrder} disabled={isSendingPreOrder}
          className="w-full h-11 rounded-lg text-[14px] font-bold flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white transition-all">
          {isSendingPreOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Utensils className="w-4 h-4" />}
          {isKh ? "បញ្ជូន Pre-order ទៅផ្ទះបាយ" : "Send Pre-order to Kitchen"}
        </motion.button>
      )}

      {showConfirm && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={onConfirmKitchen}
          className="w-full h-11 rounded-lg text-[14px] font-bold flex items-center justify-center gap-2 bg-[#03624C] hover:bg-[#024a38] text-white transition-all">
          <Utensils className="w-4 h-4" />
          {isKh ? "បញ្ជូនទៅផ្ទះបាយ" : "Send to Kitchen"}
        </motion.button>
      )}

      {showConfirmAdditional && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={onConfirmAdditional}
          className="w-full h-10 rounded-lg text-[14px] font-bold flex items-center justify-center gap-1.5 bg-[#1857D8] hover:bg-[#1448b0] text-white transition-all">
          <Printer className="w-3.5 h-3.5" />
          {isKh ? "ទទួលការកម្ម៉ង" : "Confirm Order"}
        </motion.button>
      )}

      {showPay && (
        <div className="grid grid-cols-2 gap-2">
          <motion.button whileTap={{ scale: 0.97 }} onClick={handlePrintBill}
            className="h-10 rounded-lg text-[14px] font-bold flex items-center justify-center gap-1.5 bg-[#1857D8] hover:bg-[#1448b0] text-white transition-all">
            <Printer className="w-3.5 h-3.5" />
            {isKh ? "ចេញវិក័យបត្រ" : "Print Bill"}
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onOpenCheckout}
            className="h-10 rounded-lg text-[14px] font-bold flex items-center justify-center gap-1.5 bg-[#03624C] hover:bg-[#024a38] text-white transition-all">
            <CreditCard className="w-3.5 h-3.5" />
            {isKh ? "Bill & Payment" : "Bill & Payment"}
          </motion.button>
        </div>
      )}
      {showCheckOut && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={onCheckOut}
          className="w-full h-11 rounded-lg text-[12px] font-bold flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white transition-all">
          <LogOut className="w-4 h-4" />
          {isKh ? "ភ្ញៀវចេញ (Check Out)" : "Check Out"}
        </motion.button>
      )}
    </div>
  );
}