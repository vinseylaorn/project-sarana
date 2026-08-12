// middleware.ts
import { NextResponse }    from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = ["/login", "/forgot-password", "/pos-login"]

function getUserFromCookie(request: NextRequest) {
  try {
    const raw = request.cookies.get("user_data")?.value
    if (!raw) return null
    return JSON.parse(decodeURIComponent(raw))
  } catch { return null }
}

function isPosRole(role?: string): boolean {
  if (!role) return false
  return ["pos", "cashier"].includes(role.toLowerCase())
}

function isAdminRole(role?: string): boolean {
  if (!role) return false
  return ["administrator", "admin"].includes(role.toLowerCase())
}

// ✅ Settings pages → permission key mapping
const SETTINGS_PAGE_PERMS: { path: string; key: string }[] = [
  { path: "/settings/users",      key: "users"      },
  { path: "/settings/role",       key: "roles"      },
  { path: "/settings/roles",      key: "roles"      },
  { path: "/settings/staff",      key: "staff"      },
  { path: "/settings/workshifts", key: "workshifts" },
  { path: "/settings/general",    key: "settings"   },
  { path: "/settings/printers",   key: "settings"   },
]

// ✅ Other pages → permission key mapping
// IMPORTANT: specific paths must come before general ones
const OTHER_PAGE_PERMS: { path: string; key: string }[] = [
  // Records (finance sub-pages)
  { path: "/records/income",      key: "finance"    },
  { path: "/records/expense",     key: "finance"    },
  { path: "/records/categories",  key: "finance"    },
  { path: "/records",             key: "finance"    },

  // Payments / transactions
  { path: "/payments",            key: "finance"    },

  // Inventory sub-pages (specific before general)
  { path: "/inventory/suppliers",    key: "inventory" },
  { path: "/inventory/categories",   key: "inventory" },
  { path: "/inventory/spoilage",     key: "inventory" },
  { path: "/inventory/stock-history",key: "inventory" },
  { path: "/inventory",              key: "inventory" },

  // Reports sub-pages
  { path: "/reports/shifts",      key: "reports"    },
  { path: "/reports",             key: "reports"    },

  // Menu sub-pages
  { path: "/menu/categories",     key: "menu"       },
  { path: "/menu",                key: "menu"       },

  // Others
  { path: "/discount",            key: "discount"   },
  { path: "/reserved",            key: "reserved"   },
  { path: "/tables",              key: "tables"     },
  { path: "/orders",              key: "orders"     },
  { path: "/vip-card",            key: "vip-card"   },
]

// ✅ Check if user has permission for a page key
// Matches database page keys via aliases
const PAGE_ALIASES: Record<string, string[]> = {
  finance:   ["finance", "income", "expense", "finance-categories", "transactions"],
  inventory: ["inventory", "inventory-categories", "supplier", "spoilage", "stock-history"],
  settings:  ["settings", "general-settings"],
  orders:    ["orders", "orders-history"],
  reports:   ["reports", "shift-report"],
  menu:      ["menu", "menu-categories"],
}

function hasPermission(
  permissions: Record<string, any>,
  pageKey: string,
  permission: string = "view"
): boolean {
  // Get all possible DB keys for this page key
  const keysToCheck = PAGE_ALIASES[pageKey] ?? [pageKey]

  return keysToCheck.some(key => permissions?.[key]?.[permission] === true)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authToken    = request.cookies.get("auth_token")?.value
  const posToken     = request.cookies.get("pos_token")?.value

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isPos    = pathname === "/pos" || pathname.startsWith("/pos/")

  // ── POS pages ────────────────────────────────────────────────────
  if (isPos) {
    if (!posToken || posToken.trim() === "") {
      return NextResponse.redirect(new URL("/pos-login", request.url))
    }
    return NextResponse.next()
  }

  // ── Public pages ──────────────────────────────────────────────────
  if (isPublic) {
    if (authToken && pathname === "/login") {
      const user = getUserFromCookie(request)
      if (isPosRole(user?.role)) {
        return NextResponse.redirect(new URL("/pos-login", request.url))
      }
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  // ── Protected — require auth_token ────────────────────────────────
  if (!authToken) {
    const url = new URL("/login", request.url)
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  const user        = getUserFromCookie(request)
  const role        = user?.role
  const permissions = user?.permissions ?? {}

  // ── POS role — block all non-pos pages ───────────────────────────
  if (isPosRole(role) && !isPos && !pathname.startsWith("/pos-login")) {
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  // ── Admin — allow everything ──────────────────────────────────────
  if (isAdminRole(role)) {
    return NextResponse.next()
  }

  // ── Non-admin: Settings pages ─────────────────────────────────────
  if (pathname.startsWith("/settings/")) {
    const match = SETTINGS_PAGE_PERMS.find(p => pathname.startsWith(p.path))
    if (!match) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }
    if (!hasPermission(permissions, match.key)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }
    return NextResponse.next()
  }

  // ── Non-admin: Other pages ────────────────────────────────────────
  const otherMatch = OTHER_PAGE_PERMS.find(p => pathname.startsWith(p.path))
  if (otherMatch) {
    if (!hasPermission(permissions, otherMatch.key)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|api/|locales/|icons/|images/|fonts/).*)",
  ],
}