"use client"
import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import type { MenuItem } from "@/types"

// ── Types ─────────────────────────────────────────────────────────
export interface CartItem {
  menu_item_id: number
  name:         string
  price:        number
  quantity:     number
  image:        string | null
}

interface CartContextValue {
  items:    CartItem[]
  total:    number
  count:    number
  add:      (item: MenuItem) => void
  remove:   (menu_item_id: number) => void
  increase: (menu_item_id: number) => void
  decrease: (menu_item_id: number) => void
  clear:    () => void
}

// ── Context ───────────────────────────────────────────────────────
const CartContext = createContext<CartContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const add = useCallback((item: MenuItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.menu_item_id === item.id)
      if (existing) {
        return prev.map(i =>
          i.menu_item_id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, {
        menu_item_id: item.id,
        name:         item.name,
        price:        item.price,
        quantity:     1,
        // ✅ FIX: MenuItem.image can be undefined, CartItem.image cannot.
        // Coerce undefined to null here at the one place that copies
        // from MenuItem into CartItem.
        image:        item.image ?? null,
      }]
    })
  }, [])

  const remove = useCallback((menu_item_id: number) => {
    setItems(prev => prev.filter(i => i.menu_item_id !== menu_item_id))
  }, [])

  const increase = useCallback((menu_item_id: number) => {
    setItems(prev =>
      prev.map(i =>
        i.menu_item_id === menu_item_id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      )
    )
  }, [])

  const decrease = useCallback((menu_item_id: number) => {
    setItems(prev =>
      prev
        .map(i =>
          i.menu_item_id === menu_item_id
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
        .filter(i => i.quantity > 0)
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, total, count, add, remove, increase, decrease, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>")
  return ctx
}