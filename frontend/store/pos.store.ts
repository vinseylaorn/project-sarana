// store/pos.store.ts

export interface PosTable {
  id: number | string
  name: string
  seats: number
  floor: string
  status: 'available' | 'occupied' | 'reserved'
  reserveTime?: string
  reservedBy?: string       
  reservedPhone?: string    
  isOrderConfirmed?: boolean
  order?: {
    id: string
    items: any[]
    total: number
  }
}

export interface PosMenuItem {
  id:           string | number
  name:         string
  price:        number
  category:     string
  category_id?: number
  image?:       string | null
  available:    boolean
}

export interface PosMenuCategory {
  id:   string | number
  name: string
}

export interface StoredTableOrder {
  tableId: number
  items:   any[]
  total:   number
}

// ── Safe localStorage ─────────────────────────────────────────────
function ls<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const r = localStorage.getItem(key)
    return r ? (JSON.parse(r) as T) : fallback
  } catch { return fallback }
}
function lsSave<T>(key: string, val: T): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ── Keys ──────────────────────────────────────────────────────────
const KM = "pos:menu"
const KC = "pos:cats"
const KO = "pos:orders"
const KE = "pos:external"

// ── In-memory tables ─────────────────────────────────────────────
export let globalTables: PosTable[] = []

export const setGlobalTables = (d: PosTable[]) => {
  globalTables = d
}

export const getGlobalTables = (): PosTable[] => globalTables

// ── Menu Items ────────────────────────────────────────────────────
export let globalMenuItems: PosMenuItem[] = []
export const setGlobalMenuItems = (d: PosMenuItem[]) => { globalMenuItems = d; lsSave(KM, d) }
export const getGlobalMenuItems = (): PosMenuItem[] => {
  if (globalMenuItems.length) return globalMenuItems
  const s = ls<PosMenuItem[]>(KM, [])
  globalMenuItems = s; return s
}

// ── Categories ────────────────────────────────────────────────────
export let globalCategoryItems: PosMenuCategory[] = []
export const setGlobalCategoryItems = (d: PosMenuCategory[]) => { globalCategoryItems = d; lsSave(KC, d) }
export const getGlobalCategoryItems = (): PosMenuCategory[] => {
  if (globalCategoryItems.length) return globalCategoryItems
  const s = ls<PosMenuCategory[]>(KC, [])
  globalCategoryItems = s; return s
}

// ── Table Cart Orders ────────────────────────────────────────────
export const saveTableOrder = (tableId: number, items: any[]) => {
  const all = ls<Record<number, StoredTableOrder>>(KO, {})
  all[tableId] = {
    tableId,
    items,
    total: items.reduce((s, i) => s + i.price * i.quantity, 0),
  }
  lsSave(KO, all)
}
export const getTableOrder = (tableId: number): StoredTableOrder | null =>
  ls<Record<number, StoredTableOrder>>(KO, {})[tableId] ?? null

export const clearTableOrder = (tableId: number) => {
  const all = ls<Record<number, StoredTableOrder>>(KO, {})
  delete all[tableId]
  lsSave(KO, all)
}

// ── External Orders ───────────────────────────────────────────────
export const saveExternalOrders = (orders: any[]) => lsSave(KE, orders)
export const getExternalOrders  = (): any[]        => ls<any[]>(KE, [])