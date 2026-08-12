"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

// ── Types ─────────────────────────────────────────────────────────
interface UIContextValue {
  sidebarOpen:    boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar:  () => void

  isLoading:      boolean
  setLoading:     (loading: boolean) => void
}

// ── Context ───────────────────────────────────────────────────────
const UIContext = createContext<UIContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────
export function UIProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setLoading]       = useState(false)

  const toggleSidebar = useCallback(() => setSidebarOpen(p => !p), [])

  return (
    <UIContext.Provider value={{
      sidebarOpen, setSidebarOpen, toggleSidebar,
      isLoading, setLoading,
    }}>
      {children}
    </UIContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────
export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>")
  return ctx
}