// utils/pos-helpers.ts

export const getPosStaffId = (): number | null => {
  if (typeof window === "undefined") return null;
  const id = sessionStorage.getItem("pos_staff_id");
  if (!id || id === "null" || id === "undefined") return null;
  const num = Number(id);
  return isNaN(num) ? null : num;
};

export const fmt12 = (t: string) => {
  if (!t) return "";
  try {
    let [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, "0")} ${ap}`;
  } catch {
    return t;
  }
};

const TABLE_ORDER_ID_KEY = "pos_table_order_ids";
export const saveTableOrderId = (tableId: number | string, orderId: number) => {
  try {
    const raw = localStorage.getItem(TABLE_ORDER_ID_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    map[String(tableId)] = orderId;
    localStorage.setItem(TABLE_ORDER_ID_KEY, JSON.stringify(map));
  } catch {}
};

export const getTableOrderId = (tableId: number | string): number | null => {
  try {
    const raw = localStorage.getItem(TABLE_ORDER_ID_KEY);
    if (!raw) return null;
    const map: Record<string, number> = JSON.parse(raw);
    return map[String(tableId)] ?? null;
  } catch {
    return null;
  }
};

export const clearTableOrderId = (tableId: number | string) => {
  try {
    const raw = localStorage.getItem(TABLE_ORDER_ID_KEY);
    if (!raw) return;
    const map: Record<string, number> = JSON.parse(raw);
    delete map[String(tableId)];
    localStorage.setItem(TABLE_ORDER_ID_KEY, JSON.stringify(map));
  } catch {}
};

const RESERVATION_DATA_KEY = "pos_reservation_data";
export interface ReservationData {
  reservedBy: string;
  reservedPhone: string;
  reserveTime: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  preOrderSent: boolean;
}

export const saveReservationData = (tableId: number | string, data: ReservationData) => {
  try {
    const raw = localStorage.getItem(RESERVATION_DATA_KEY);
    const map: Record<string, ReservationData> = raw ? JSON.parse(raw) : {};
    map[String(tableId)] = data;
    localStorage.setItem(RESERVATION_DATA_KEY, JSON.stringify(map));
  } catch {}
};

export const getReservationData = (tableId: number | string): ReservationData | null => {
  try {
    const raw = localStorage.getItem(RESERVATION_DATA_KEY);
    if (!raw) return null;
    const map: Record<string, ReservationData> = JSON.parse(raw);
    return map[String(tableId)] ?? null;
  } catch {
    return null;
  }
};

export const clearReservationData = (tableId: number | string) => {
  try {
    const raw = localStorage.getItem(RESERVATION_DATA_KEY);
    if (!raw) return;
    const map: Record<string, ReservationData> = JSON.parse(raw);
    delete map[String(tableId)];
    localStorage.setItem(RESERVATION_DATA_KEY, JSON.stringify(map));
  } catch {}
};