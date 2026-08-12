"use client";

import { X, ShoppingBag, CheckCircle2, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt12 } from "@/lib/utils/pos-helpers";
import { OrderItemRow } from "./OrderItem";
import { PendingOrderItem } from "./Pendingorderitem";
import { OrderFooter } from "./Orderfooter";
import type { CartItem, NoteItems, PosTable } from "./pos-type";
import type { MenuItem } from "@/types";

interface OrderPanelProps {
  isKh: boolean;
  selectedTable: PosTable | null;
  currentOrderId: number | null;
  isExternal: boolean;
  isOccupied: boolean;
  isReserved: boolean;
  isOrderConfirmed: boolean;
  preOrderSent: boolean;
  orderItems: CartItem[];
  pendingItems: CartItem[];
  menuItems: MenuItem[];
  noteItems: NoteItems;
  noteEditId: string | null;
  noteEditValue: string;
  orderTotal: number;
  pendingTotal: number;
  discountTotal: number;
  showPreOrderConfirm: boolean;
  showConfirm: boolean;
  showConfirmAdditional: boolean;
  showPay: boolean;
  showCheckOut: boolean;
  isSendingPreOrder: boolean;
  hasNewItems: boolean;
  systemName?: string | null;
  systemLogo?: string | null;
  onClose: () => void;
  onChangeQty: (id: string, delta: number) => void;
  onChangePendingQty: (id: string, delta: number) => void;
  onNoteEditStart: (id: string, current: string) => void;
  onNoteEditSave: (id: string, value: string) => void;
  onNoteEditCancel: () => void;
  onNoteValueChange: (value: string) => void;
  onGuestArrived: () => void;
  onCancelReservation: () => void;
  onConfirmPreOrder: () => void;
  onConfirmKitchen: () => void;
  onConfirmAdditional: () => void;
  onOpenCheckout: () => void;
  onCheckOut: () => void;
}

export function OrderPanel({
  isKh, selectedTable, currentOrderId, isExternal, isOccupied, isReserved,
  isOrderConfirmed, preOrderSent, orderItems, pendingItems, menuItems,
  noteItems, noteEditId, noteEditValue, orderTotal, pendingTotal, discountTotal,
  showPreOrderConfirm, showConfirm, showConfirmAdditional, showPay, showCheckOut,
  isSendingPreOrder, hasNewItems, systemName, systemLogo,
  onClose, onChangeQty, onChangePendingQty, onNoteEditStart, onNoteEditSave,
  onNoteEditCancel, onNoteValueChange, onGuestArrived, onCancelReservation,
  onConfirmPreOrder, onConfirmKitchen, onConfirmAdditional, onOpenCheckout, onCheckOut,
}: OrderPanelProps) {
  const isEmpty = orderItems.length === 0 && pendingItems.length === 0;

  return (
    <div className="w-[350px] flex flex-col bg-white shrink-0">
      <div className={cn("px-4 py-3.5 border-b border-gray-100 shrink-0",
        isOccupied ? "bg-rose-50" : isReserved ? "bg-amber-50" : "bg-[#03624C]/10")}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className={cn("text-[15px] font-black",
                isOccupied ? "text-rose-600" : isReserved ? "text-amber-600" : "text-[#03624C]")}>
                {selectedTable?.name}
                {isExternal && <span className="ml-1.5 text-[9px] font-bold uppercase opacity-50">(External)</span>}
              </p>
              {currentOrderId && <span className="text-[10px] font-bold text-gray-400">#{currentOrderId}</span>}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {isOccupied && (
                <span className="flex items-center gap-1 text-[14px] font-semibold text-rose-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {isKh ? "មានភ្ញៀវ" : "Occupied"}
                </span>
              )}
              {isReserved && (
                <span className="text-[10px] font-semibold text-amber-600">
                  ● {isKh ? "កក់ទុក" : "Reserved"}{" "}
                  {selectedTable?.reserveTime ? fmt12(selectedTable.reserveTime) : ""}
                </span>
              )}
              {isReserved && selectedTable?.reservedBy && (
                <span className="text-[10px] text-amber-600">· {selectedTable.reservedBy}</span>
              )}
              {isOrderConfirmed && !hasNewItems && pendingItems.length === 0 && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#03624C]">
                  <CheckCircle2 className="w-3 h-3" />In kitchen
                </span>
              )}
              {isReserved && preOrderSent && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#03624C]">
                  <CheckCircle2 className="w-3 h-3" />Pre-order sent
                </span>
              )}
              {pendingItems.length > 0 && isOrderConfirmed && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                  <PlusCircle className="w-3 h-3" />
                  {isKh ? "កម្ម៉ង់បន្ថែម" : "Additional"}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200/60 transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-300 p-6">
            <ShoppingBag className="w-9 h-9" />
            <p className="text-[11px] font-medium">{isKh ? "រទេះទំនិញទទេ" : "Cart is empty"}</p>
            <p className="text-[10px]">{isKh ? "ចុចលើមុខម្ហូបដើម្បីបន្ថែម" : "Click items to add"}</p>
          </div>
        ) : (
          <div>
            {orderItems.map((item, i) => (
              <OrderItemRow
                key={`main-${i}`}
                item={item}
                menuItem={menuItems.find((m) => String(m.id) === String(item.id))}
                isOrderConfirmed={isOrderConfirmed}
                isKh={isKh}
                noteItems={noteItems}
                noteEditId={noteEditId}
                noteEditValue={noteEditValue}
                onChangeQty={onChangeQty}
                onNoteEditStart={onNoteEditStart}
                onNoteEditSave={onNoteEditSave}
                onNoteEditCancel={onNoteEditCancel}
                onNoteValueChange={onNoteValueChange}
              />
            ))}
            {pendingItems.length > 0 && (
              <>
                <div className="px-4 py-2 bg-amber-50 border-y border-amber-100">
                  <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                    <PlusCircle className="w-3 h-3" />
                    {isKh ? "កម្ម៉ង់បន្ថែម (រង់ចាំបញ្ជាក់)" : "Additional Items (Pending)"}
                  </p>
                </div>
                {pendingItems.map((item, i) => (
                  <PendingOrderItem
                    key={`pending-${i}`}
                    item={item}
                    menuItem={menuItems.find((m) => String(m.id) === String(item.id))}
                    onChangeQty={onChangePendingQty}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
      <OrderFooter
        isKh={isKh}
        orderTotal={orderTotal}
        pendingTotal={pendingTotal}
        discountTotal={discountTotal}
        items={[...orderItems, ...pendingItems]}
        orderType={selectedTable?.name || ""}
        orderId={currentOrderId}
        systemName={systemName}
        systemLogo={systemLogo}
        isReserved={isReserved}
        showPreOrderConfirm={showPreOrderConfirm}
        showConfirm={showConfirm}
        showConfirmAdditional={showConfirmAdditional}
        showPay={showPay}
        showCheckOut={showCheckOut}
        isSendingPreOrder={isSendingPreOrder}
        onGuestArrived={onGuestArrived}
        onCancelReservation={onCancelReservation}
        onConfirmPreOrder={onConfirmPreOrder}
        onConfirmKitchen={onConfirmKitchen}
        onConfirmAdditional={onConfirmAdditional}
        onOpenCheckout={onOpenCheckout}
        onCheckOut={onCheckOut}
      />
    </div>
  );
}