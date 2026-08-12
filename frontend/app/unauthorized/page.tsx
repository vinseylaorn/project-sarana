"use client"

import { useRouter } from "next/navigation"
import { useRole }   from "@/lib/role-context"
import { ShieldX, Home } from "lucide-react"
import type { PagePermissions } from "@/types"

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

function getFirstAccessiblePage(permissions?: Record<string, PagePermissions>): string {
  if (!permissions) return "/login"
  for (const key of PAGE_PRIORITY) {
    if (permissions[key]?.view === true && PAGE_HREF_MAP[key]) {
      return PAGE_HREF_MAP[key]
    }
  }
  return "/login"
}

export default function UnauthorizedPage() {
  const router   = useRouter()
  const { user, logout } = useRole()

  const handleGoHome = () => {
    if (!user) { router.replace("/login"); return }

    const role    = (user.role ?? "").toLowerCase()
    const isAdmin = ["administrator", "admin"].includes(role)
    const isPOS   = ["pos", "cashier"].includes(role)

    if (isPOS)   { router.replace("/pos"); return }
    if (isAdmin) { router.replace("/");    return }
    router.replace(getFirstAccessiblePage(user.permissions))
  }

  return (
    <div
      className="h-screen bg-gray-50 dark:bg-[#13151f] flex items-center justify-center flex-col gap-4"
      style={{ fontFamily: "var(--font-kantumruy), sans-serif" }} >
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center">
        <ShieldX className="w-8 h-8 text-rose-500 dark:text-rose-400" />
      </div>
      <div className="text-center">
        <h1 className="text-[18px] font-bold text-gray-800 dark:text-white/90 mb-1">
          Access Denied
        </h1>
        <p className="text-[13px] text-gray-400 dark:text-white/30">
          You do not have permission to view this page.
        </p>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => logout()}
          className="h-9 px-5 flex items-center gap-2 rounded-lg text-[12px] font-semibold border border-gray-200 dark:border-white/[0.12] text-gray-600 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all" >
          <Home className="w-3.5 h-3.5" />
          Go Back
        </button>
      </div>
    </div>
  )
}