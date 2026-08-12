"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter }                  from "next/navigation"
import { authApi }                    from "@/lib/api"
import { token }                      from "@/lib/auth/token"
import type { User, PagePermissions } from "@/types"

function setUserCookie(user: User) {
  const val = encodeURIComponent(JSON.stringify({
    id:          user.id,
    role:        user.role,
    permissions: user.permissions ?? {}, 
  }))
  document.cookie = `user_data=${val}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

function clearUserCookie() {
  document.cookie = "user_data=; path=/; max-age=0"
}

const PAGE_HREF_MAP: Record<string, string> = {
  dashboard:  "/",
  menu:       "/menu",
  orders:     "/orders",
  tables:     "/tables",
  reserved:   "/reserved",
  discount:   "/discount",
  inventory:  "/inventory",
  finance:    "/payments",
  reports:    "/reports",
  "vip-card": "/vip-card",
  settings:   "/settings/general",
  staff:      "/settings/staff",
  users:      "/settings/users",
  roles:      "/settings/role",
  workshifts: "/settings/workshifts",
}

const PAGE_PRIORITY = [
  "dashboard", "orders", "menu", "tables", "reserved",
  "discount", "inventory", "finance", "reports", "vip-card",
  "settings", "staff", "users", "roles", "workshifts",
]

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
    if (permissions[key]?.view === true && PAGE_HREF_MAP[key]) {
      return PAGE_HREF_MAP[key]
    }
  }
  for (const [key, perms] of Object.entries(permissions)) {
    if (!PAGE_HREF_MAP[key]) continue
    if (perms?.view === true) return PAGE_HREF_MAP[key]
  }
  return "/unauthorized"
}

function getHomeRoute(user: User, fromPosScreen: boolean): string {
  if (isPosUser(user.role)) {
    return fromPosScreen ? "/pos" : "/unauthorized"
  }
  if (isAdminUser(user.role)) return "/"
  return getFirstAccessibleAdminPage(user.permissions)
}

interface RoleContextValue {
  user:      User | null
  isLoading: boolean
  login:     (username: string, password: string, fromPos?: boolean) => Promise<void>
  logout:    () => Promise<void>
  can:       (page: string, permission: keyof PagePermissions) => boolean
  isAdmin:   boolean
}

const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const router                    = useRouter()
  const [user, setUser]           = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const login = async (username: string, password: string, fromPos = false) => {
    const { token: t, user: loggedIn } = await authApi.login(username, password)
    token.set(t)
    document.cookie = `auth_token=${t}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    setUser(loggedIn)
    setUserCookie(loggedIn)
    router.replace(getHomeRoute(loggedIn, fromPos))
  }

  const logout = async () => {
    try { await authApi.logout() } catch {}
    token.clear()
    document.cookie = "auth_token=; path=/; max-age=0"
    clearUserCookie()
    setUser(null)
    router.replace("/login")
  }

  const can = (page: string, permission: keyof PagePermissions): boolean => {
    if (!user) return false
    if (isAdminUser(user.role)) return true
    return user.permissions?.[page]?.[permission] === true
  }

  const isAdmin = isAdminUser(user?.role)

  return (
    <RoleContext.Provider value={{ user, isLoading, login, logout, can, isAdmin }}>
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
    return user.permissions?.[page]?.[permission] === true
  }
  return { can, isAdmin, user }
}