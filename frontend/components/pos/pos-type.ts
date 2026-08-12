
import type { PosTable } from "@/store/pos.store";

export type { PosTable };

export interface CartItem {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  note?: string;
  quantity: number;
}

export interface NoteItems {
  [itemId: string]: string;
}

export interface RemoveAlertState {
  item: CartItem;
  delta: number;
}