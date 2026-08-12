"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Smartphone, ShoppingBag, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  setGlobalTables, getGlobalTables,
  setGlobalMenuItems, setGlobalCategoryItems,
  saveTableOrder, getTableOrder, clearTableOrder,
  saveExternalOrders, getExternalOrders,
  type PosTable,
} from "@/store/pos.store";
import { ordersApi, tablesApi, menuItemsApi, menuCategoriesApi } from "@/lib/api";
import { post } from "@/lib/api/client";
import type { MenuItem } from "@/types";
import { toastSuccess, toastError, toastWarn } from "@/lib/toast";
import { ReserveDialog } from "@/components/pos/reserve-dialog";
import { PendingDialog } from "@/components/pos/pending-dialog";
import { CheckoutDialog } from "@/components/pos/checkout-dialog";
import { useTranslation } from "react-i18next";
import {
  getPosStaffId, saveTableOrderId, getTableOrderId, clearTableOrderId,
  saveReservationData, getReservationData, clearReservationData,
  type ReservationData,
} from "@/lib/utils/pos-helpers";
import { CloseShiftDialog } from "@/components/pos/CloseShiftDialog";
import { RemoveItemDialog } from "@/components/pos/RemoveItemDialog";
import { discountsApi } from "@/lib/api/discount";
import { PosHeader } from "@/components/pos/Posheader";
import { TableGrid } from "@/components/pos/Tablegrid";
import { MenuPanel } from "@/components/pos/Menupanel";
import { OrderPanel } from "@/components/pos/Posorderpanel";
import type { CartItem } from "@/components/pos/pos-type";
import { reservationsApi } from "@/lib/api/reservations";
import { clearPosSession } from "@/components/posflowlogin/shared";
import { useSettings } from "@/lib/settings-context";
import { token } from "@/lib/auth/token";

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" };

export default function POSPage() {
  const { t, i18n } = useTranslation("common");
  const isKh = i18n.language === "kh";
  const { systemName, systemLogo } = useSettings();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<PosTable[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeFloor, setActiveFloor] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [posOpen, setPosOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<PosTable | null>(null);
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [isExternal, setIsExternal] = useState(false);
  const [pendingItems, setPendingItems] = useState<CartItem[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [externalOrders, setExternalOrders] = useState<any[]>([]);
  const [removeAlert, setRemoveAlert] = useState<{ item: any; delta: number } | null>(null);
  const [isRestoringStock, setIsRestoringStock] = useState(false);
  const [preOrderSent, setPreOrderSent] = useState(false);
  const [isSendingPreOrder, setIsSendingPreOrder] = useState(false);
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);
  const [noteItems, setNoteItems] = useState<Record<string, string>>({});
  const [noteEditId, setNoteEditId] = useState<string | null>(null);
  const [noteEditValue, setNoteEditValue] = useState("");
  const [draftOrders, setDraftOrders] = useState<PosTable[]>([]);

  const isConfirmingKitchen = useRef(false);
  const isConfirmingAdditional = useRef(false);

  const toOrderItem = (i: CartItem) => ({
    menu_item_id: Number(i.id),
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    note: i.note || null,
  });

  useEffect(() => {
    const posToken = token.pos.get();

    console.log("[POS PAGE] pos_token:", posToken ?? "MISSING");

    if (!posToken) {
      window.location.href = "/login";
      return;
    }

    setMounted(true);
    const saved = getExternalOrders();
    if (saved.length) setExternalOrders(saved);
    const savedDrafts = localStorage.getItem("pos_draft_orders");
    if (savedDrafts) {
      try { setDraftOrders(JSON.parse(savedDrafts)); } catch { }
    }

    Promise.all([loadTables(), loadMenu()])
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const loadTables = useCallback(async (): Promise<PosTable[]> => {
    try {
      const [data, reservationsRes] = await Promise.all([
        tablesApi.list(),
        reservationsApi.list({ per_page: 500 }).catch(() => ({ data: [] })),
      ]);

      const tableList: any[] = Array.isArray(data) ? data : (data as any)?.data ?? [];
      const resList: any[] = Array.isArray(reservationsRes)
        ? reservationsRes
        : (reservationsRes as any)?.data ?? [];

      const reservationMap = new Map<number, any>();
      for (const r of resList) {
        if (r.status === "pending" || r.status === "confirmed") {
          for (const t of r.tables ?? []) reservationMap.set(t.id, r);
        }
      }

      const converted: PosTable[] = tableList.map((t) => {
        const savedOrder = t.status === "occupied" ? getTableOrder(t.id) : null;
        const activeRes = reservationMap.get(t.id);
        let reservedBy: string | undefined = activeRes?.customer_name ?? (t as any).reserved_by;
        let reservedPhone: string | undefined = activeRes?.customer_phone ?? (t as any).reserved_phone;
        let reserveItems: any[] | undefined = undefined;

        if (t.status === "reserved") {
          const resData = getReservationData(t.id);
          if (resData) {
            reservedBy = resData.reservedBy || reservedBy;
            reservedPhone = resData.reservedPhone || reservedPhone;
            reserveItems = resData.items;
            if (!resData.reservedBy && activeRes) {
              saveReservationData(t.id, {
                ...resData,
                reservedBy: activeRes.customer_name,
                reservedPhone: activeRes.customer_phone,
              });
            }
          } else if (activeRes) {
            saveReservationData(t.id, {
              reservedBy: activeRes.customer_name,
              reservedPhone: activeRes.customer_phone,
              reserveTime: activeRes.arrival_datetime ?? "",
              items: activeRes.items?.map((i: any) => ({
                id: String(i.menu_item_id),
                name: i.name,
                price: Number(i.price),
                quantity: i.quantity,
              })) ?? [],
              preOrderSent: false,
            });
            reservedBy = activeRes.customer_name;
            reservedPhone = activeRes.customer_phone;
            reserveItems = activeRes.items?.map((i: any) => ({
              id: String(i.menu_item_id),
              name: i.name,
              price: Number(i.price),
              quantity: i.quantity,
            }));
          }
        } else {
          clearReservationData(t.id);
        }
        return {
          id: t.id, name: t.name, seats: t.seats, floor: t.floor,
          status: t.status as PosTable["status"],
          reserveTime: t.reserve_time ?? undefined,
          reservedBy,
          reservedPhone,
          isOrderConfirmed: t.status === "occupied",
          order: savedOrder?.items?.length
            ? { id: `ORD-${t.id}`, items: savedOrder.items, total: savedOrder.total }
            : reserveItems?.length
              ? { id: `RES-${t.id}`, items: reserveItems, total: reserveItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0) }
              : undefined,
        };
      });

      tableList.forEach((t) => { if (t.status === "available") clearTableOrder(t.id); });
      setGlobalTables(converted);
      setTables(converted);
      return converted;

    } catch (err) {
      console.error("[POS] loadTables error:", err);
      const cached = getGlobalTables();
      setTables(cached);
      return cached;
    }
  }, []);

  const loadMenu = useCallback(async () => {
    try {
      const [items, cats, discounts] = await Promise.all([
        menuItemsApi.list(),
        menuCategoriesApi.list(),
        discountsApi.list(),
      ]);

      const itemList: any[] = Array.isArray(items) ? items : (items as any)?.data ?? [];
      const catList: any[] = Array.isArray(cats) ? cats : (cats as any)?.data ?? [];
      const discountList: any[] = Array.isArray(discounts) ? discounts : (discounts as any)?.data ?? [];

      const today = new Date().toISOString().slice(0, 10);
      const activeDiscounts = discountList.filter((d: any) => {
        if (d.status !== "active") return false;
        if (d.start_date && d.start_date > today) return false;
        if (d.end_date && d.end_date < today) return false;
        return true;
      });

      const available = itemList.filter((i: any) =>
        i.available === true || i.available === 1 || i.available === "1"
      );

      const withDiscount = available.map((item: any) => {
        if (item.discounted_price != null) return item;
        const catDiscount = activeDiscounts.find((d: any) => {
          if (d.scope !== "category") return false;
          const ids: number[] = Array.isArray(d.target_ids) ? d.target_ids : d.target_id ? [d.target_id] : [];
          return ids.includes(Number(item.category_id));
        });
        if (!catDiscount) return item;
        const discounted_price = catDiscount.value_type === "percentage"
          ? parseFloat((item.price * (1 - catDiscount.value / 100)).toFixed(2))
          : parseFloat((item.price - catDiscount.value).toFixed(2));
        return {
          ...item,
          discount: { id: catDiscount.id, name: catDiscount.name, value: catDiscount.value, value_type: catDiscount.value_type },
          discounted_price: Math.max(0, discounted_price),
        };
      });

      setMenuItems(withDiscount);
      setCategories(catList);
      setGlobalMenuItems(withDiscount.map((i: any) => ({
        id: i.id, name: i.name, price: i.price, category: i.category ?? "", category_id: i.category_id,
        image: i.image, available: i.available, discounted_price: i.discounted_price ?? undefined,
        discount: i.discount ?? undefined, recipe: i.recipe ?? undefined,
      })));
      setGlobalCategoryItems(catList.map((c: any) => ({ id: c.id, name: c.name })));

    } catch (err) {
      console.error("[POS] loadMenu error:", err);
      setMenuItems([]);
      setCategories([]);
    }
  }, []);

  const openPOS = useCallback((table: PosTable, external = false) => {
    if (selectedTable && posOpen && !checkoutOpen && orderItems.length > 0 && !selectedTable.isOrderConfirmed) {
      const existingDraft = draftOrders.some(d => d.id === selectedTable.id);
      if (!existingDraft) {
        const draft: PosTable = {
          ...selectedTable,
          name: `Draft-${Date.now()}`,
          order: { id: selectedTable.order?.id || `DRAFT-${Date.now()}`, items: [...orderItems], total: orderItems.reduce((s, i) => s + i.price * i.quantity, 0) },
          isOrderConfirmed: false, status: "available",
        };
        setDraftOrders(prev => [...prev, draft]);
        toastWarn(isKh ? "បានរក្សាទុកការកម្ម៉ង់បច្ចុប្បន្នជាសេចក្តីព្រាង" : "Current order saved as draft");
      }
    }
    loadMenu();
    setIsExternal(external);
    const persistedOrderId = getTableOrderId(String(table.id));
    setCurrentOrderId(persistedOrderId);
    setSearchQuery(""); setActiveCategory("all");

    let items: CartItem[] = [];
    if (!external && typeof table.id === "number" && table.status === "occupied") {
      const saved = getTableOrder(table.id);
      if (saved?.items?.length) items = saved.items;
    }
    if (!items.length) items = table.order?.items || [];

    let sentFlag = false;
    if (!external && typeof table.id === "number" && table.status === "reserved") {
      const resData = getReservationData(table.id);
      sentFlag = resData?.preOrderSent ?? false;
    }
    setPreOrderSent(sentFlag);

    const enriched: PosTable = {
      ...table,
      isOrderConfirmed: external ? items.length > 0 : table.status === "occupied",
      order: items.length
        ? { id: table.order?.id || `ORD-${table.id}`, items, total: items.reduce((s, i) => s + i.price * i.quantity, 0) }
        : table.order,
    };
    setSelectedTable(enriched);
    setOrderItems([...items]);
    setPendingItems([]);
    setNoteItems({});
    setNoteEditId(null);
    setPosOpen(true);
  }, [selectedTable, posOpen, checkoutOpen, orderItems, draftOrders, isKh, loadMenu]);

  const syncTables = (updated: PosTable[]) => { setTables(updated); setGlobalTables(updated); };
  const syncExternal = (orders: any[]) => { setExternalOrders(orders); saveExternalOrders(orders); };

  const addToPending = (item: MenuItem) => {
    const effectivePrice = item.discounted_price ?? item.price;
    const confirmed = selectedTable?.isOrderConfirmed === true;
    const setter = confirmed ? setPendingItems : setOrderItems;
    setter((prev) => {
      const ex = prev.find((i) => String(i.id) === String(item.id));
      return ex
        ? prev.map((i) => String(i.id) === String(item.id) ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { id: String(item.id), name: item.name, price: effectivePrice, original_price: item.price, quantity: 1 }];
    });
  };

  const changePendingQty = (id: string, delta: number) => {
    setPendingItems((prev) =>
      prev.reduce((acc, i) => {
        if (String(i.id) !== id) return [...acc, i];
        const q = i.quantity + delta;
        return q <= 0 ? acc : [...acc, { ...i, quantity: q }];
      }, [] as CartItem[])
    );
  };

  const changeQty = (id: string, delta: number) => {
    if (selectedTable?.isOrderConfirmed === true) {
      if (delta < 0) { const item = orderItems.find((i) => String(i.id) === id); if (item) setRemoveAlert({ item, delta }); }
      return;
    }
    setOrderItems((prev) =>
      prev.reduce((acc, i) => {
        if (String(i.id) !== id) return [...acc, i];
        const q = i.quantity + delta;
        return q <= 0 ? acc : [...acc, { ...i, quantity: q }];
      }, [] as CartItem[])
    );
  };

  const executeRemoveConfirmed = async (restoreStock: boolean) => {
    if (!removeAlert || !selectedTable) return;
    const { item, delta } = removeAlert;
    if (restoreStock) setIsRestoringStock(true);
    setRemoveAlert(null);
    const updatedItems = orderItems.reduce((acc, i) => {
      if (String(i.id) !== String(item.id)) return [...acc, i];
      const q = i.quantity + delta;
      return q <= 0 ? acc : [...acc, { ...i, quantity: q }];
    }, [] as CartItem[]);
    setOrderItems(updatedItems);
    if (!isExternal && typeof selectedTable.id === "number") saveTableOrder(selectedTable.id, updatedItems);
    const total = updatedItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const updOrder = updatedItems.length > 0
      ? { id: selectedTable.order?.id ?? `ORD-${selectedTable.id}`, items: updatedItems, total }
      : undefined;
    setSelectedTable({ ...selectedTable, order: updOrder });
    if (!isExternal) {
      syncTables(tables.map((t) => {
        if (t.id !== selectedTable.id) return t;
        return { ...t, order: updatedItems.length > 0 ? { id: t.order?.id ?? `ORD-${t.id}`, items: updatedItems, total } : undefined };
      }));
    }
    if (currentOrderId && updatedItems.length > 0) {
      try {
        await ordersApi.updateItems(currentOrderId, updatedItems.map(toOrderItem));
      } catch (err: any) {
        toastError(isKh ? "មិនអាចធ្វើបច្ចុប្បន្នភាពការកម្ម៉ង់: " + err?.message : "Failed to update order: " + err?.message);
      }
    }
    if (restoreStock) {
      try {
        const full = menuItems.find((m) => String(m.id) === String(item.id));
        if (!full?.recipe?.length) {
          toastWarn(isKh ? "មុខម្ហូបនេះមិនមានគ្រឿងផ្សំក្នុងស្តុក" : "This item has no inventory ingredients");
          setIsRestoringStock(false); return;
        }
        await Promise.all(full.recipe.map((ing) => post("/stock-history", {
          inventory_id: ing.inventory_id, qty: ing.deduct_qty * Math.abs(delta),
          type: "IN", reason: `Returned from cancelled order item: ${item.name}`,
        })));
        toastSuccess(isKh ? "បានដាក់ទំនិញត្រឡប់ទៅស្តុកវិញ" : "Stock restored successfully");
      } catch (err: any) {
        toastError(isKh ? "មិនអាចដាក់ស្តុកវិញបានទាំងស្រុង: " + err?.message : "Failed to restore stock: " + err?.message);
      } finally { setIsRestoringStock(false); }
    } else {
      toastSuccess(isKh ? "បានដកមុខម្ហូបចេញ" : "Item removed from order");
    }
  };

  const confirmPreOrderToKitchen = async () => {
    if (!selectedTable || !orderItems.length || isSendingPreOrder) return;
    setIsSendingPreOrder(true);
    try {
      const response = await ordersApi.create({
        table_name: selectedTable.name, order_type: "dine_in", staff_id: getPosStaffId(),
        items: orderItems.map(toOrderItem),
      });
      if (response?.id) {
        setCurrentOrderId(response.id);
        if (typeof selectedTable.id === "number") saveTableOrderId(selectedTable.id, response.id);
      }
      if (typeof selectedTable.id === "number") {
        const resData = getReservationData(selectedTable.id);
        if (resData) saveReservationData(selectedTable.id, { ...resData, preOrderSent: true });
      }
      setPreOrderSent(true);
    } catch (err: any) {
      toastError(isKh ? "មានបញ្ហា: " + err?.message : "Error: " + err?.message);
    } finally { setIsSendingPreOrder(false); }
  };

  const confirmAdditionalItems = async () => {
    if (!selectedTable || !pendingItems.length) return;
    if (isConfirmingAdditional.current) return;
    isConfirmingAdditional.current = true;
    const mergedItems = [...orderItems];
    pendingItems.forEach((p) => {
      const idx = mergedItems.findIndex((i) => String(i.id) === String(p.id));
      if (idx !== -1) mergedItems[idx] = { ...mergedItems[idx], quantity: mergedItems[idx].quantity + p.quantity };
      else mergedItems.push({ ...p });
    });
    const total = mergedItems.reduce((s, i) => s + i.price * i.quantity, 0);
    try {
      if (currentOrderId) {
        await ordersApi.updateItems(currentOrderId, mergedItems.map(toOrderItem));
      } else {
        const response = await ordersApi.create({
          table_name: selectedTable.name,
          order_type: isExternal ? (selectedTable.name?.toLowerCase().includes("app") ? "app" : "takeaway") : "dine_in",
          staff_id: getPosStaffId(),
          items: pendingItems.map(toOrderItem),
        });
        if (response?.id) { setCurrentOrderId(response.id); saveTableOrderId(String(selectedTable.id), response.id); }
      }
      if (currentOrderId) {
        for (const p of pendingItems) {
          const full = menuItems.find((m) => String(m.id) === String(p.id));
          if (full?.recipe?.length) {
            await Promise.all(full.recipe.map((ing) => post("/stock-history", {
              inventory_id: ing.inventory_id, qty: ing.deduct_qty * p.quantity,
              type: "OUT", reason: `Additional order item: ${p.name}`,
            })));
          }
        }
      }
      if (!isExternal && typeof selectedTable.id === "number") saveTableOrder(selectedTable.id, mergedItems);
      setOrderItems(mergedItems); setPendingItems([]);
      const upd: PosTable = {
        ...selectedTable,
        order: { id: selectedTable.order?.id ?? `ORD-${selectedTable.id}`, items: mergedItems, total },
      };
      setSelectedTable(upd);
      if (isExternal) syncExternal(externalOrders.map((o) => (o.id === upd.id ? upd : o)));
      else syncTables(tables.map((t) =>
        t.id !== selectedTable.id ? t
          : { ...t, order: { id: t.order?.id ?? `ORD-${Date.now()}`, items: mergedItems, total } }
      ));
    } catch (err: any) {
      toastError(isKh ? "មានបញ្ហា: " + err?.message : "Error: " + err?.message);
    } finally { isConfirmingAdditional.current = false; }
  };

  const confirmKitchen = async () => {
    if (!selectedTable || !orderItems.length) return;
    if (isConfirmingKitchen.current) return;
    isConfirmingKitchen.current = true;
    const total = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    try {
      const response = await ordersApi.create({
        table_name: selectedTable.name,
        order_type: isExternal ? (selectedTable.name?.toLowerCase().includes("app") ? "app" : "takeaway") : "dine_in",
        staff_id: getPosStaffId(),
        items: orderItems.map(toOrderItem),
      });
      if (response?.id) { setCurrentOrderId(response.id); saveTableOrderId(String(selectedTable.id), response.id); }
      if (!isExternal && typeof selectedTable.id === "number") {
        await tablesApi.updateStatus(selectedTable.id, "occupied");
        saveTableOrder(selectedTable.id, orderItems);
      }
      if (isExternal) {
        const upd: PosTable = {
          ...selectedTable, isOrderConfirmed: true,
          order: { id: selectedTable.order?.id ?? `ORD-${selectedTable.id}`, items: [...orderItems], total },
        };
        setSelectedTable(upd);
        syncExternal(externalOrders.find((o) => o.id === upd.id)
          ? externalOrders.map((o) => (o.id === upd.id ? upd : o))
          : [...externalOrders, upd]);
      } else {
        syncTables(tables.map((t) => {
          if (t.id !== selectedTable.id) return t;
          const upd: PosTable = {
            ...t, status: "occupied", isOrderConfirmed: true,
            order: { id: t.order?.id ?? `ORD-${Date.now()}`, items: [...orderItems], total },
          };
          setSelectedTable(upd); return upd;
        }));
      }
    } catch (err: any) {
      toastError(isKh ? "មានបញ្ហា: " + err?.message : "Error: " + err?.message);
    } finally { isConfirmingKitchen.current = false; }
  };

  const paymentComplete = async (paymentMethod: string) => {
    if (!selectedTable) return;
    try {
      if (isExternal) {
        syncExternal(externalOrders.filter((o) => o.id !== selectedTable.id));
        setCheckoutOpen(false);
        setOrderItems([]);
        setPendingItems([]);
        setCurrentOrderId(null);
        setPreOrderSent(false);
        toastSuccess(
          isKh ? "ការទូទាត់បានជោគជ័យ" : "Payment complete!",
          isKh ? "តុនៅជាប់រវល់ដដែលចុចចាក់ចេញបើសិនជាចង់ឲតុទំនេ!!" : "This table is still occupied. Please check out if you want to make it available!!"
        );
        return;
      }
      if (typeof selectedTable.id === "number") {
        clearTableOrder(selectedTable.id);
        clearTableOrderId(String(selectedTable.id));
      }
      const updatedTable: PosTable = {
        ...selectedTable,
        status: "occupied",
        isOrderConfirmed: false,
        order: undefined,
      };
      setSelectedTable(updatedTable);
      syncTables(tables.map((t) =>
        t.id === selectedTable.id
          ? { ...t, order: undefined, isOrderConfirmed: false }
          : t
      ));
      setCheckoutOpen(false);
      setOrderItems([]);
      setPendingItems([]);
      setCurrentOrderId(null);
      setNoteItems({});
      setNoteEditId(null);
      toastSuccess(
        isKh ? "ការទូទាត់បានជោគជ័យ" : "Payment complete!",
        isKh ? "តុនៅជាប់រវល់ដដែលចុចចាក់ចេញបើសិនជាចង់ឲតុទំនេ!!" : "This table is still occupied. Please check out if you want to make it available!!"
      );
    } catch (err: any) {
      toastError("Failed: " + err?.message);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedTable) return;
    try {
      if (!isExternal && typeof selectedTable.id === "number") {
        await tablesApi.updateStatus(selectedTable.id, "available");
        clearTableOrder(selectedTable.id);
        clearTableOrderId(String(selectedTable.id));
        clearReservationData(String(selectedTable.id));
      }
      setDraftOrders(prev => prev.filter(d => d.id !== selectedTable.id));
      if (isExternal) {
        syncExternal(externalOrders.filter((o) => o.id !== selectedTable.id));
      } else {
        syncTables(tables.map((t) =>
          t.id === selectedTable.id
            ? { ...t, status: "available" as const, order: undefined, isOrderConfirmed: false, reservedBy: undefined, reservedPhone: undefined }
            : t
        ));
      }
      setPosOpen(false);
      setCheckoutOpen(false);
      setSelectedTable(null);
      setIsExternal(false);
      setOrderItems([]);
      setPendingItems([]);
      setCurrentOrderId(null);
      setPreOrderSent(false);
      await loadTables();
      toastSuccess(
        isKh ? "ចាកចេញបានជោគជ័យ" : "Checked out successfuly!!",
        isKh ? "ភ្ញៀវចេញហើយ — តុទំនេរ" : "Guest checked out — table available!"
      );
    } catch (err: any) {
      toastError("Check out failed: " + err?.message);
    }
  };

  const confirmArrival = async (id: number) => {
    try {
      const res = await reservationsApi.list({ per_page: 500 });
      const resList: any[] = Array.isArray(res) ? res : (res as any)?.data ?? [];
      const matched = resList.find(
        (r: any) => r.tables?.some((t: any) => t.id === id) && (r.status === "confirmed" || r.status === "pending")
      );
      if (matched) await reservationsApi.updateTableStatus(matched.id, id, "complete");
      else await tablesApi.updateStatus(id, "occupied");
    } catch (err: any) { toastError("Failed: " + err?.message); return; }

    const resData = getReservationData(id);
    if (resData?.items?.length && !resData.preOrderSent) {
      try {
        const response = await ordersApi.create({
          table_name: tables.find((t) => t.id === id)?.name ?? String(id),
          order_type: "dine_in", staff_id: getPosStaffId(),
          items: resData.items.map((i: any) => ({ menu_item_id: Number(i.id), name: i.name, price: i.price, quantity: i.quantity })),
        });
        if (response?.id) { saveTableOrderId(id, response.id); setCurrentOrderId(response.id); }
        saveReservationData(id, { ...resData, preOrderSent: true });
      } catch (err: any) { toastError("Failed to send pre-order: " + err?.message); }
    }
    if (resData?.items?.length) saveTableOrder(id, resData.items);
    clearReservationData(id);
    await loadTables();
    if (selectedTable?.id === id)
      setSelectedTable((p) => p ? { ...p, status: "occupied", reservedBy: undefined, reservedPhone: undefined } : p);
    toastSuccess(isKh ? "ភ្ញៀវមកដល់ហើយ" : "Guest arrived!");
  };

  const cancelReservation = async (id: number) => {
    try {
      const res = await reservationsApi.list({ per_page: 500 });
      const resList: any[] = Array.isArray(res) ? res : (res as any)?.data ?? [];
      const matched = resList.find(
        (r: any) => r.tables?.some((t: any) => t.id === id) && (r.status === "pending" || r.status === "confirmed")
      );
      if (matched) await reservationsApi.updateTableStatus(matched.id, id, "cancel");
      else await tablesApi.updateStatus(id, "available");
    } catch (err: any) { toastError("Failed: " + err?.message); return; }
    clearTableOrder(id); clearTableOrderId(id); clearReservationData(id);
    await loadTables();
    setPosOpen(false); setSelectedTable(null);
    toastSuccess(isKh ? "លុបការកក់បានជោគជ័យ" : "Reservation cancelled");
  };

  const handleReserve = async (tableIds: number[], time: string, items: any[], customerName: string, customerPhone: string) => {
    const reserveTime = time !== "មិនកំណត់ម៉ោង" && time !== "No fixed time" ? time : undefined;
    try { await Promise.all(tableIds.map((id) => tablesApi.updateStatus(id, "reserved", reserveTime))); }
    catch (err: any) { toastError("Reserve failed: " + err?.message); return; }
    const resData: ReservationData = { reservedBy: customerName, reservedPhone: customerPhone, reserveTime: time, items, preOrderSent: false };
    tableIds.forEach((id) => saveReservationData(id, resData));
    const orderData: PosTable["order"] = items.length > 0
      ? { id: `RES-${Date.now()}`, items, total: items.reduce((s, i) => s + i.price * i.quantity, 0) }
      : undefined;
    syncTables(tables.map((t) =>
      tableIds.includes(t.id as number)
        ? { ...t, status: "reserved" as const, reserveTime: time, reservedBy: customerName, reservedPhone: customerPhone, order: orderData }
        : t
    ));
    setReserveOpen(false);
    toastSuccess(tableIds.length > 1
      ? (isKh ? `កក់តុ ${tableIds.length} បានជោគជ័យ` : `${tableIds.length} tables reserved!`)
      : (isKh ? "កក់តុបានជោគជ័យ" : "Table reserved!"));
  };

  const handleCloseShiftSuccess = useCallback(() => {
    clearPosSession();
    localStorage.removeItem("pos_draft_orders");
    window.location.href = "/login";
  }, []);

  const filteredTables = useMemo(
    () => (activeFloor === "all" ? tables : tables.filter((t) => t.floor === activeFloor)),
    [tables, activeFloor]
  );

  const filteredMenu = useMemo(() => {
    let items = menuItems;
    if (activeCategory !== "all") items = items.filter((i) => String(i.category_id) === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [menuItems, activeCategory, searchQuery]);

  const orderTotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const pendingTotal = pendingItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const discountTotal = useMemo(
    () => [...orderItems, ...pendingItems].reduce((sum, cartItem) => {
      if (cartItem.original_price && cartItem.original_price > cartItem.price)
        return sum + (cartItem.original_price - cartItem.price) * cartItem.quantity;
      const menuItem = menuItems.find((m) => String(m.id) === String(cartItem.id));
      if (!menuItem?.discounted_price) return sum;
      return sum + (menuItem.price - menuItem.discounted_price) * cartItem.quantity;
    }, 0),
    [orderItems, pendingItems, menuItems]
  );

  const isOccupied = !isExternal && selectedTable?.status === "occupied";
  const isReserved = !isExternal && selectedTable?.status === "reserved";
  const isOrderConfirmed = selectedTable?.isOrderConfirmed === true;

  const hasNewItems = useMemo(() => {
    const savedItems = selectedTable?.order?.items || [];
    if (orderItems.length !== savedItems.length) return true;
    return JSON.stringify(orderItems) !== JSON.stringify(savedItems);
  }, [orderItems, selectedTable]);

  const cartEmpty = orderItems.length === 0 && pendingItems.length === 0;
  const showCheckOut = isOccupied && cartEmpty && !isExternal;
  const showConfirm = orderItems.length > 0 && hasNewItems && !isOrderConfirmed && !isReserved;
  const showConfirmAdditional = pendingItems.length > 0 && isOrderConfirmed;
  const showPay = isOrderConfirmed && !hasNewItems && pendingItems.length === 0 && orderItems.length > 0;
  const showPreOrderConfirm = isReserved && orderItems.length > 0 && !preOrderSent;
  const checkoutItems = [...orderItems, ...pendingItems];
  const checkoutTotal = checkoutItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleNoteEditStart = (id: string, current: string) => { setNoteEditId(id); setNoteEditValue(current); };
  const handleNoteEditSave = (id: string, value: string) => {
    setNoteItems((p) => ({ ...p, [id]: value }));
    setNoteEditId(null);
    const updateNote = (items: CartItem[]) =>
      items.map(i => String(i.id) === id ? { ...i, note: value || undefined } : i);
    setOrderItems(prev => updateNote(prev));
    setPendingItems(prev => updateNote(prev));
  };
  const handleNoteEditCancel = () => setNoteEditId(null);

  if (!mounted || loading)
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center" style={SORA}>
        <Loader2 className="w-6 h-6 animate-spin text-[#03624C]" />
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-gray-50 transition-colors duration-300" style={SORA}>
      <PosHeader isKh={isKh} tables={tables} onCloseShift={() => setCloseShiftOpen(true)} />
      <div className="h-[48px] px-4 flex items-center justify-between bg-white border-b border-gray-200 shrink-0 gap-4 transition-colors">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-[10px]">
          <button
            onClick={() => setActiveFloor("all")}
            className={cn("px-3 py-[5px] rounded-lg text-[14px] font-semibold transition-all",
              activeFloor === "all" ? "bg-white text-[#03624C] shadow-sm" : "text-gray-500 hover:text-gray-700")} >
            {isKh ? "ទាំងអស់" : "All"}
          </button>
          {[...new Set(tables.map((t) => t.floor))].filter(Boolean).map((f, i) => (
            <button key={i} onClick={() => setActiveFloor(String(f))}
              className={cn("px-3 py-[5px] rounded-lg text-[14px] capitalize transition-all",
                activeFloor === String(f) ? "bg-white text-[#03624C] shadow-sm" : "text-gray-500 hover:text-gray-700")}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openPOS({ id: `Order-${Date.now()}`, name: "Order", seats: 0, floor: "", status: "available", order: { id: `#-ORD-${Date.now()}`, items: [], total: 0 } }, true)}
            className="h-7 w-[128px] justify-center flex items-center gap-1.5 rounded-lg border text-[14px] font-semibold bg-[#03624C]/10 border-[#03624C]/30 text-[#03624C] hover:bg-[#03624C]/20 transition-all" >
            <Plus className="w-4 h-4" /> New Order
          </button>

          <div className="w-[128px]">
            <PendingDialog
              orders={[...externalOrders, ...draftOrders]}
              onSelectOrder={(o) => {
                if (draftOrders.some(d => d.id === o.id)) setDraftOrders(prev => prev.filter(d => d.id !== o.id));
                openPOS(o, true);
              }}
              language={i18n.language as any}
            />
          </div>

          <button onClick={() => setReserveOpen(true)}
            className="h-7 w-[128px] justify-center flex items-center gap-1.5 rounded-lg border text-[14px] font-semibold bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 transition-all">
            <Clock className="w-4 h-4" />
            {isKh ? "កក់ទុក" : "Reserve"}
          </button>

          <button
            onClick={() => openPOS({ id: `APP-${Date.now()}`, name: "App Order", seats: 0, floor: "", status: "available", order: { id: `APP-ORD-${Date.now()}`, items: [], total: 0 } }, true)}
            className="h-7 w-[128px] justify-center flex items-center gap-1.5 rounded-lg border text-[14px] font-semibold bg-[#03624C]/10 border-[#03624C]/30 text-[#03624C] hover:bg-[#03624C]/20 transition-all">
            <Smartphone className="w-4 h-4" /> App
          </button>

          <button
            onClick={() => openPOS({ id: `TK-${Date.now()}`, name: "Takeaway", seats: 0, floor: "", status: "available", order: { id: `TK-ORD-${Date.now()}`, items: [], total: 0 } }, true)}
            className="h-7 w-[128px] justify-center flex items-center gap-1.5 rounded-lg border text-[14px] font-semibold bg-[#03624C]/10 border-[#03624C]/30 text-[#03624C] hover:bg-[#03624C]/20 transition-all">
            <ShoppingBag className="w-4 h-4" /> Takeaway
          </button>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto p-5 pb-10">
        <TableGrid tables={filteredTables} selectedTableId={selectedTable?.id} posOpen={posOpen} isKh={isKh} onSelectTable={openPOS} />
      </main>
      <Dialog open={posOpen} onOpenChange={(open) => { if (!open) setPosOpen(false); }}>
        <DialogContent
          className="sm:max-w-[1300px] w-full h-[90vh] flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl p-0 left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] [&>button]:hidden"
          style={SORA} >
          <DialogTitle className="sr-only">POS Order Dialog</DialogTitle>
          <div className="flex h-full min-h-0">
            <MenuPanel
              isKh={isKh} categories={categories} filteredMenu={filteredMenu}
              activeCategory={activeCategory} searchQuery={searchQuery}
              onCategoryChange={setActiveCategory} onSearchChange={setSearchQuery} onAddItem={addToPending}
            />
            <OrderPanel
              isKh={isKh}
              selectedTable={selectedTable}
              currentOrderId={currentOrderId}
              isExternal={isExternal}
              isOccupied={!!isOccupied}
              isReserved={!!isReserved}
              isOrderConfirmed={isOrderConfirmed}
              preOrderSent={preOrderSent}
              orderItems={orderItems}
              pendingItems={pendingItems}
              menuItems={menuItems}
              noteItems={noteItems}
              noteEditId={noteEditId}
              noteEditValue={noteEditValue}
              orderTotal={orderTotal}
              pendingTotal={pendingTotal}
              discountTotal={discountTotal}
              showPreOrderConfirm={showPreOrderConfirm}
              showConfirm={showConfirm}
              showConfirmAdditional={showConfirmAdditional}
              showPay={showPay}
              showCheckOut={showCheckOut}
              isSendingPreOrder={isSendingPreOrder}
              hasNewItems={hasNewItems}
              systemName={systemName}
              systemLogo={systemLogo}
              onClose={() => setPosOpen(false)}
              onChangeQty={changeQty}
              onChangePendingQty={changePendingQty}
              onNoteEditStart={handleNoteEditStart}
              onNoteEditSave={handleNoteEditSave}
              onNoteEditCancel={handleNoteEditCancel}
              onNoteValueChange={setNoteEditValue}
              onGuestArrived={() => confirmArrival(selectedTable!.id as number)}
              onCancelReservation={() => cancelReservation(selectedTable!.id as number)}
              onConfirmPreOrder={confirmPreOrderToKitchen}
              onConfirmKitchen={confirmKitchen}
              onConfirmAdditional={confirmAdditionalItems}
              onOpenCheckout={() => setCheckoutOpen(true)}
              onCheckOut={handleCheckOut}
            />
          </div>
        </DialogContent>
      </Dialog>
      <RemoveItemDialog
        open={!!removeAlert} onClose={() => setRemoveAlert(null)}
        item={removeAlert?.item} delta={removeAlert?.delta ?? 0}
        onConfirm={executeRemoveConfirmed} isRestoring={isRestoringStock} isKh={isKh}
      />
      <CloseShiftDialog
        open={closeShiftOpen} onOpenChange={setCloseShiftOpen}
        isKh={isKh} tables={tables} onSuccess={handleCloseShiftSuccess}
      />
      <ReserveDialog
        open={reserveOpen} onOpenChange={setReserveOpen}
        language={i18n.language as any} onSuccess={loadTables}
      />
      <CheckoutDialog
        open={checkoutOpen} onOpenChange={setCheckoutOpen}
        total={checkoutTotal} items={checkoutItems} onComplete={paymentComplete}
        orderType={selectedTable?.name || ""} orderId={currentOrderId}
        language={i18n.language as any}
      />
    </div>
  );
}