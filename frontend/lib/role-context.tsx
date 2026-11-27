"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"
import { token } from "@/lib/auth/token"
import type { User, PagePermissions } from "@/types"

function setUserCookie(user: User) {
  const val = encodeURIComponent(JSON.stringify({
    id: user.id,
    role: user.role,
    permissions: user.permissions ?? {},
  }))
  document.cookie = `user_data=${val}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

function clearUserCookie() {
  document.cookie = "user_data=; path=/; max-age=0"
}

const PAGE_HREF_MAP: Record<string, string> = {
  // Main
  dashboard: "/",

  // Menus
  menu: "/menu",
  "menu-categories": "/menu/categories",

  // Operations
  reserved: "/reserved",
  discount: "/discount",
  tables: "/tables",
  "vip-card": "/vip-card",

  // Inventory
  inventory: "/inventory",
  "inventory-categories": "/inventory/categories",
  supplier: "/inventory/suppliers",
  spoilage: "/inventory/spoilage",
  "stock-history": "/inventory/stock-history",

  // Sales
  transactions: "/payments",
  "orders-history": "/orders",

  // Records
  income: "/records/income",
  "finance-categories": "/records/categories",
  expense: "/records/expense",

  // Reports
  "overview-report": "/reports",
  "shift-report": "/reports/shifts",
  "inventory-report": "/reports/inventory",

  // Settings
  "general-settings": "/settings/general",
  staff: "/settings/staff",
  users: "/settings/users",
  roles: "/settings/role",
  workshifts: "/settings/workshifts",

  // Legacy keys (សម្រាប់ role ចាស់ៗដែលនៅរក្សា key មេ)
  finance: "/payments",
  reports: "/reports",
  settings: "/settings/general",
}

const PAGE_PRIORITY = [
  "dashboard",
  "orders",
  "menu", "menu-categories",
  "tables", "reserved", "discount", "vip-card",
  "inventory", "inventory-categories", "supplier", "spoilage", "stock-history",
  "transactions", "orders-history",
  "income", "finance-categories", "expense",
  "overview-report", "shift-report", "inventory-report",
  "general-settings", "staff", "users", "roles", "workshifts",
  // legacy
  "finance", "reports", "settings",
]

/**
 * ក្បួនរកសិទ្ធិ:
 *  1) បើ permissions មាន key ផ្ទាល់ (ឧ. "supplier") => ប្រើ key នោះតែប៉ុណ្ណោះ (ឯករាជ្យ)
 *  2) បើគ្មាន key ផ្ទាល់ => ធ្លាក់ទៅ key មេ/alias (សម្រាប់ role ចាស់ ឬ alias ឈ្មោះផ្សេង)
 *
 * key ខាងឆ្វេង = pageKey ក្នុង Sidebar ឬ alias ដែល page ប្រើ
 */
const PAGE_FALLBACKS: Record<string, string[]> = {
  // Menus
  "menu-categories": ["menu"],

  // Inventory
  "inventory-categories": ["inventory"],
  supplier: ["inventory"],
  suppliers: ["supplier", "inventory"],   // alias បើ page ណាប្រើ "suppliers"
  spoilage: ["inventory"],
  "stock-history": ["inventory"],

  // Sales / Records
  transactions: ["finance"],
  "orders-history": ["orders"],
  income: ["finance"],
  expense: ["finance"],
  "finance-categories": ["finance"],
  finance: ["income", "expense"],

  // Reports
  "overview-report": ["reports"],
  "shift-report": ["reports"],
  "inventory-report": ["reports"],

  // Settings
  "general-settings": ["settings"],
  staff: ["settings"],
  users: ["settings"],
  roles: ["settings"],
  workshifts: ["settings"],
  "working-shifts": ["workshifts"],

  // alias ផ្សេងៗ
  reservations: ["reserved"],
  discounts: ["discount"],
}

function hasPerm(
  permissions: Record<string, PagePermissions> | undefined,
  page: string,
  perm: keyof PagePermissions
): boolean {
  if (!permissions) return false
  if (permissions[page]) return permissions[page][perm] === true
  const fallbacks = PAGE_FALLBACKS[page] ?? []
  return fallbacks.some(k => permissions[k]?.[perm] === true)
}

/** មានសិទ្ធិណាមួយ (view/create/edit/delete) លើ page នោះ */
function hasAnyAction(p?: PagePermissions): boolean {
  return !!p && (p.view === true || p.create === true || p.edit === true || p.delete === true)
}

function isPosUser(role?: string | null): boolean {
  if (!role) return false
  return ["pos", "cashier"].includes(role.toLowerCase())
}

function isAdminUser(role?: string | null): boolean {
  if (!role) return false
  return ["administrator", "admin"].includes(role.toLowerCase())
}

function getFirstAccessibleAdminPage(permissions?: Record<string, PagePermissions>): string {
  if (!permissions || Object.keys(permissions).length === 0) return "/unauthorized"
  for (const key of PAGE_PRIORITY) {
    if (hasAnyAction(permissions[key]) && PAGE_HREF_MAP[key]) return PAGE_HREF_MAP[key]
  }
  for (const [key, perms] of Object.entries(permissions)) {
    if (!PAGE_HREF_MAP[key]) continue
    if (hasAnyAction(perms)) return PAGE_HREF_MAP[key]
  }
  return "/unauthorized"
}

function getHomeRoute(user: User, fromPosScreen: boolean): string {
  if (isPosUser(user.role)) return fromPosScreen ? "/pos" : "/unauthorized"
  if (isAdminUser(user.role)) return "/"
  return getFirstAccessibleAdminPage(user.permissions)
}

interface RoleContextValue {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string, fromPos?: boolean) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  can: (page: string, permission: keyof PagePermissions) => boolean
  /** មានសិទ្ធិណាមួយលើ page (សម្រាប់ Sidebar / route guard) */
  canAccess: (page: string) => boolean
  isAdmin: boolean
}

const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    if (!token.get()) return
    try {
      const me = await authApi.me()
      setUser(me)
      setUserCookie(me)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const restore = async () => {
      if (!token.get()) { setIsLoading(false); return }
      try {
        const me = await authApi.me()
        setUser(me)
        setUserCookie(me)
      } catch {
        token.clear()
        clearUserCookie()
      } finally {
        setIsLoading(false)
      }
    }
    restore()
  }, [])

  useEffect(() => {
    const onFocus = () => { refreshUser() }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [refreshUser])

  const login = async (username: string, password: string, fromPos = false) => {
    const { token: t, user: loggedIn } = await authApi.login(username, password)
    token.set(t)
    document.cookie = `auth_token=${t}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    setUser(loggedIn)
    setUserCookie(loggedIn)
    router.replace(getHomeRoute(loggedIn, fromPos))
  }

  const logout = async () => {
    try { await authApi.logout() } catch { }
    token.clear()
    document.cookie = "auth_token=; path=/; max-age=0"
    clearUserCookie()
    setUser(null)
    router.replace("/login")
  }

  const can = (page: string, permission: keyof PagePermissions): boolean => {
    if (!user) return false
    if (isAdminUser(user.role)) return true
    return hasPerm(user.permissions, page, permission)
  }

  const canAccess = (page: string): boolean => {
    if (!user) return false
    if (isAdminUser(user.role)) return true
    return (["view", "create", "edit", "delete"] as (keyof PagePermissions)[])
      .some(p => hasPerm(user.permissions, page, p))
  }

  const isAdmin = isAdminUser(user?.role)

  return (
    <RoleContext.Provider value={{ user, isLoading, login, logout, refreshUser, can, canAccess, isAdmin }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error("useRole must be used inside <RoleProvider>")
  return ctx
}

export function usePermission(page: string) {
  const { user, isAdmin } = useRole()
  const can = (permission: keyof PagePermissions): boolean => {
    if (!user) return false
    if (isAdmin) return true
    return hasPerm(user.permissions, page, permission)
  }
  const canAccess = (): boolean => {
    if (!user) return false
    if (isAdmin) return true
    return (["view", "create", "edit", "delete"] as (keyof PagePermissions)[])
      .some(p => hasPerm(user.permissions, page, p))
  }
  return { can, canAccess, isAdmin, user }
}