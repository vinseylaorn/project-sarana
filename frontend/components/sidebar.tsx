"use client"

import { useState, useEffect, useRef, useLayoutEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useRole } from "@/lib/role-context"
import { useSettings } from "@/lib/settings-context"
import { useTranslation } from "react-i18next"
import { useTheme } from "next-themes"
import { LogoutDialog } from "@/components/logout-dialog"
import { getAvatarUrl } from "@/lib/avatar"
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, Package, Users, History,
  BarChart3, LogOut, ChevronLeft, ChevronRight, ChevronDown, Trash2, ClipboardList,
  Settings, ShieldCheck, UserCog, TrendingUp, CalendarCheck, TrendingDown,
  BadgeDollarSign, Wallet, ListTree, Tags, Settings2, LayoutGrid, Truck, BadgePercent, Sun, Moon,
} from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { VipCardIcon } from "@/components/ui/vip-card"

export interface NavItem {
  name: string
  href?: string
  icon: any
  key: string
  pageKey?: string
  labelKh: string
  isDropdown?: boolean
  hideInSidebar?: boolean
  hideForAdmin?: boolean
  subItems?: NavItem[]
}

export const navigation: NavItem[] = [
  {
    name: "Dashboard", href: "/", icon: LayoutDashboard,
    key: "dashboard", pageKey: "dashboard",
    labelKh: "ផ្ទាំងគ្រប់គ្រង",
  },
  {
    name: "POS", href: "/pos", icon: ShoppingCart,
    key: "pos", pageKey: "orders",
    labelKh: "ការលក់",
    hideInSidebar: true,
  },
  {
    name: "Menus", icon: UtensilsCrossed,
    key: "menu_group", isDropdown: true, labelKh: "មុខម្ហូប",
    subItems: [
      { name: "Menu List", href: "/menu", icon: ListTree, key: "menulist", pageKey: "menu", labelKh: "បញ្ជីមុខម្ហូប" },
      { name: "Categories", href: "/menu/categories", icon: Tags, key: "menucategories", pageKey: "menu-categories", labelKh: "ប្រភេទម្ហូប" },
    ],
  },
  {
    name: "Reservations", href: "/reserved", icon: CalendarCheck,
    key: "reserved", pageKey: "reserved", labelKh: "ការកក់តុ",
  },
  {
    name: "Discounts", href: "/discount", icon: BadgePercent,
    key: "discount", pageKey: "discount", labelKh: "ការបញ្ចុះតម្លៃ",
  },
  {
    name: "Tables", href: "/tables", icon: LayoutGrid,
    key: "tables", pageKey: "tables", labelKh: "តុអាហារ",
  },
  {
    name: "VIP Card", href: "/vip-card", icon: VipCardIcon,
    key: "vip-card", pageKey: "vip-card", labelKh: "កាតសមាជិក",
  },
  {
    name: "Inventory", icon: Package,
    key: "inventory_group", isDropdown: true, labelKh: "ស្តុកទំនិញ",
    subItems: [
      { name: "Stock", href: "/inventory", icon: Package, key: "inventory", pageKey: "inventory", labelKh: "បញ្ជីស្តុក" },
      { name: "Categories", href: "/inventory/categories", icon: ListTree, key: "inv_cats", pageKey: "inventory-categories", labelKh: "ប្រភេទស្តុក" },
      { name: "Supplier", href: "/inventory/suppliers", icon: Truck, key: "supplier", pageKey: "supplier", labelKh: "អ្នកផ្គត់ផ្គង់" },
      { name: "Spoilage", href: "/inventory/spoilage", icon: Trash2, key: "spoilage", pageKey: "spoilage", labelKh: "ទំនិញខូច" },
      { name: "Stock History", href: "/inventory/stock-history", icon: ClipboardList, key: "stockhistory", pageKey: "stock-history", labelKh: "ប្រវត្តិស្តុក" },
    ],
  },
  {
    name: "Sales", icon: BadgeDollarSign,
    key: "sales_group", isDropdown: true, labelKh: "ការលក់",
    subItems: [
      { name: "Transactions", href: "/payments", icon: History, key: "transaction", pageKey: "transactions", labelKh: "ប្រតិបត្តិការ" },
      { name: "Order History", href: "/orders", icon: ClipboardList, key: "orders-history", pageKey: "orders-history", labelKh: "ប្រវត្តិលក់" },
    ],
  },
  {
    name: "Records", icon: Wallet,
    key: "accounting_group", isDropdown: true, labelKh: "កំណត់ត្រា",
    subItems: [
      { name: "Income", href: "/records/income", icon: TrendingUp, key: "income", pageKey: "income", labelKh: "ចំណូល" },
      { name: "Categories", href: "/records/categories", icon: Tags, key: "rcategories", pageKey: "finance-categories", labelKh: "ប្រភេទ" },
      { name: "Expenses", href: "/records/expense", icon: TrendingDown, key: "expense", pageKey: "expense", labelKh: "ចំណាយ" },
    ],
  },
  {
    name: "Reports", icon: BarChart3,
    key: "reports_group", isDropdown: true, labelKh: "របាយការណ៍",
    subItems: [
      { name: "Overview", href: "/reports", icon: BarChart3, key: "overview-report", pageKey: "overview-report", labelKh: "របាយការណ៍លក់" },
      { name: "Shift Report", href: "/reports/shifts", icon: History, key: "shift-report", pageKey: "shift-report", labelKh: "របាយការណ៍វេន" },
      { name: "Inventory", href: "/reports/inventory", icon: Package, key: "inventory-report", pageKey: "inventory-report", labelKh: "របាយការណ៍ស្តុក" },
    ],
  },
  {
    name: "Settings", icon: Settings,
    key: "settings_group", isDropdown: true, labelKh: "ការកំណត់",
    subItems: [
      { name: "General Settings", href: "/settings/general", icon: Settings2, key: "general", pageKey: "general-settings", labelKh: "ការកំណត់ទូទៅ" },
      { name: "Staff", href: "/settings/staff", icon: Users, key: "staff", pageKey: "staff", labelKh: "បុគ្គលិក" },
      { name: "Users", href: "/settings/users", icon: UserCog, key: "users", pageKey: "users", labelKh: "អ្នកប្រើប្រាស់" },
      { name: "Role", href: "/settings/role", icon: ShieldCheck, key: "roles", pageKey: "roles", labelKh: "កំណត់សិទ្ធិ" },
      { name: "Working Shifts", href: "/settings/workshifts", icon: History, key: "workshifts", pageKey: "workshifts", labelKh: "វេនធ្វើការ" },
    ],
  },
]

const SECTION_MAP: Record<string, string> = {
  dashboard: "MAIN",
  menu_group: "OPERATIONS",
  reserved: "OPERATIONS",
  discount: "OPERATIONS",
  tables: "OPERATIONS",
  inventory_group: "MANAGE",
  sales_group: "MANAGE",
  accounting_group: "MANAGE",
  reports_group: "ANALYTICS",
  settings_group: "SYSTEM",
}
function getSectionLabel(key: string): string | null { return SECTION_MAP[key] ?? null }

const SCROLL_STORAGE_KEY = "sidebar-scroll-pos"
const COLLAPSED_STORAGE_KEY = "sidebar-collapsed"

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false // SSR: no localStorage, keep default
  try {
    const saved = window.localStorage.getItem(COLLAPSED_STORAGE_KEY)
    return saved !== null ? JSON.parse(saved) : false
  } catch {
    return false
  }
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useRole()
  const { systemName, systemLogo } = useSettings()
  const { t, i18n } = useTranslation("common")
  const { resolvedTheme, setTheme } = useTheme()
  const isKh = i18n.language === "kh"
  const [collapsed, setCollapsed] = useState<boolean>(getInitialCollapsed)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  const navRef = useRef<HTMLElement | null>(null)
  const scrollPosRef = useRef(0)

  useLayoutEffect(() => {
    if (navRef.current) {
      navRef.current.scrollTop = scrollPosRef.current
    }
  })

  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(SCROLL_STORAGE_KEY) : null
    if (saved) {
      const pos = parseInt(saved, 10)
      if (!Number.isNaN(pos)) {
        scrollPosRef.current = pos
        if (navRef.current) navRef.current.scrollTop = pos
      }
    }
  }, [])

  const handleNavScroll = () => {
    if (navRef.current) {
      scrollPosRef.current = navRef.current.scrollTop
      sessionStorage.setItem(SCROLL_STORAGE_KEY, String(scrollPosRef.current))
    }
  }

  useEffect(() => setMounted(true), [])

  const isDark = !mounted || resolvedTheme === "dark"

  const displayName = user?.username || "User"
  const isAdmin = ["administrator", "admin"].includes((user?.role ?? "").toLowerCase())

  const canViewPage = (pageKey?: string): boolean => {
    if (!pageKey) return true
    if (isAdmin) return true
    const p = user?.permissions?.[pageKey]
    // បង្ហាញ menu បើមានសិទ្ធិណាមួយ មិនមែនតែ view
    return !!p && (p.view === true || p.create === true || p.edit === true || p.delete === true)
  }

  const visibleSubItems = (subItems?: NavItem[]) =>
    (subItems ?? []).filter(s => canViewPage(s.pageKey))

  const isGroupVisible = (item: NavItem): boolean => {
    if (item.hideInSidebar) return false
    if (item.hideForAdmin && isAdmin) return false
    if (isAdmin) return true
    if (item.isDropdown) return visibleSubItems(item.subItems).length > 0
    return canViewPage(item.pageKey)
  }

  useEffect(() => {
    const activeGroup = navigation.find(item =>
      item.isDropdown && item.subItems?.some(sub => pathname === sub.href)
    )
    if (activeGroup) setOpenMenus(prev => ({ ...prev, [activeGroup.key]: true }))
  }, [pathname])

  const toggleSidebar = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(next))
    if (next) setOpenMenus({})
  }

  const toggleSubMenu = (key: string) => {
    if (collapsed) {
      setCollapsed(false)
      localStorage.setItem(COLLAPSED_STORAGE_KEY, "false")
    }
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getTranslatedName = (item: NavItem) => {
    if (isKh && item.labelKh) return item.labelKh
    const translated = t(item.key)
    return translated !== item.key ? translated : item.name
  }

  const avatarUrl = getAvatarUrl(user?.image)
  const renderedSections = new Set<string>()

  const onHoverIn = (el: HTMLElement, active: boolean) => {
    if (!active) { el.style.background = "var(--sb-hover)"; el.style.color = "var(--sb-text)" }
  }
  const onHoverOut = (el: HTMLElement, active: boolean) => {
    if (!active) { el.style.background = "transparent"; el.style.color = "var(--sb-muted)" }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <style jsx global>{`
        [data-sidebar] .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        [data-sidebar] .no-scrollbar::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        /* Light theme (default) */
        [data-sidebar] {
          --sb-bg:           linear-gradient(180deg, #03624C 0%, #024a3a 60%, #022e24 100%);
          /* Text hierarchy: kept intentionally close together — nav labels
             and icons render essentially as bright as the active text so
             nothing in the sidebar reads dim. Section labels are only
             marginally quieter, as dividers. */
          --sb-text:         rgba(255,255,255,0.97);
          --sb-muted:        rgba(255,255,255,0.97);
          --sb-section:      rgba(255,255,255,0.75);
          --sb-divider:      rgba(255,255,255,0.10);
          --sb-hover:        rgba(255,255,255,0.07);
          --sb-active-bg:    rgba(255,255,255,0.22);
          --sb-active-sub:   rgba(255,255,255,0.16);
          --sb-active-icon:  #a7f3d0;
          --sb-active-bar:   #ffffff;
          --sb-footer-bg:    rgba(0,0,0,0.15);
          --sb-toggle-bg:    rgba(0,0,0,0.12);
          --sb-border:       rgba(255,255,255,0.08);
          --sb-badge:        linear-gradient(135deg,#03624C,#059669);
          --sb-badge-border: rgba(255,255,255,0.18);
          --sb-blob:         #059669;
        }

        /* Dark theme override — applies the instant <html> has class="dark",
           which next-themes sets before hydration/paint. No JS involved. */
        .dark [data-sidebar] {
          --sb-bg:           linear-gradient(180deg, #22263a 0%, #1e2235 60%, #181b28 100%);
          --sb-text:         rgba(255,255,255,0.97);
          --sb-muted:        rgba(255,255,255,0.97);
          --sb-section:      rgba(255,255,255,0.72);
          --sb-divider:      rgba(255,255,255,0.08);
          --sb-hover:        rgba(255,255,255,0.06);
          --sb-active-bg:    rgba(99,102,241,0.26);
          --sb-active-sub:   rgba(99,102,241,0.18);
          --sb-active-icon:  #818cf8;
          --sb-active-bar:   #6366f1;
          --sb-footer-bg:    rgba(0,0,0,0.20);
          --sb-toggle-bg:    rgba(0,0,0,0.15);
          --sb-border:       rgba(255,255,255,0.07);
          --sb-badge:        linear-gradient(135deg,#312e81,#4f46e5);
          --sb-badge-border: rgba(99,102,241,0.35);
          --sb-blob:         #4f46e5;
        }
      `}</style>
      <aside
        data-sidebar
        suppressHydrationWarning
        className={cn(
          "flex flex-col h-screen z-50 relative border-r shadow-xl",
          "transition-[width] duration-300",
          collapsed ? "w-[72px]" : "w-[220px]"
        )}
        style={{
          background: "var(--sb-bg)",
          borderColor: "var(--sb-border)",
          transition: "width 0.3s ease, background 0.35s ease",
        }}
      >
        <div className="pointer-events-none absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.14] blur-3xl"
          style={{ background: "var(--sb-blob)" }} />
        <div className="pointer-events-none absolute bottom-32 left-0 w-24 h-24 rounded-full opacity-[0.07] blur-2xl"
          style={{ background: "var(--sb-blob)" }} />
        <div
          className={cn("relative flex items-center h-[68px] shrink-0 overflow-hidden px-[18px]", collapsed ? "justify-center" : "gap-3")}
          style={{ borderBottom: "1px solid var(--sb-divider)" }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
            style={{ background: "var(--sb-badge)", border: "1px solid var(--sb-badge-border)" }}>
            {systemLogo
              ? <img src={systemLogo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
              : <UtensilsCrossed className="w-[18px] h-[18px] text-white" />
            }
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[15px] font-black tracking-tight leading-tight" style={{ color: "var(--sb-text)" }}>
                {systemName || "My System"}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[1.8px] mt-0.5" style={{ color: "var(--sb-section)" }}>
                System Admin
              </p>
            </div>
          )}
        </div>
        <nav
          ref={navRef}
          onScroll={handleNavScroll}
          className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 no-scrollbar"
        >
          {navigation.map(item => {
            if (!isGroupVisible(item)) return null
            const Icon = item.icon
            const translatedName = getTranslatedName(item)
            const sectionLabel = getSectionLabel(item.key)
            const showLabel = !collapsed && sectionLabel != null && !renderedSections.has(sectionLabel)
            if (showLabel && sectionLabel) renderedSections.add(sectionLabel)
            const visibleSubs = isAdmin
              ? (item.subItems ?? [])
              : visibleSubItems(item.subItems)
            const subActive = item.subItems
              ? visibleSubs.some(sub => pathname === sub.href)
              : false
            return (
              <div key={item.key}>
                {showLabel && (
                  <div className="flex items-center gap-2 px-1 pt-6 pb-2">
                    <p className="text-[10.5px] font-black uppercase tracking-[2.5px] select-none shrink-0"
                      style={{ color: "var(--sb-section)" }}>
                      {sectionLabel}
                    </p>
                    <div className="flex-1 h-px" style={{ background: "var(--sb-divider)" }} />
                  </div>
                )}
                {item.isDropdown ? (
                  <div>
                    <button
                      onClick={() => toggleSubMenu(item.key)}
                      className={cn(
                        "w-full flex items-center h-10 rounded-xl transition-colors duration-150 outline-none",
                        collapsed ? "justify-center px-0" : "gap-2.5 px-3",
                      )}
                      style={subActive
                        ? { background: "var(--sb-active-bg)", color: "var(--sb-text)" }
                        : { background: "transparent", color: "var(--sb-muted)" }
                      }
                      onMouseEnter={e => onHoverIn(e.currentTarget as HTMLElement, subActive)}
                      onMouseLeave={e => onHoverOut(e.currentTarget as HTMLElement, subActive)}
                    >
                      <Icon className="w-[17px] h-[17px] shrink-0"
                        style={subActive ? { color: "var(--sb-active-icon)" } : {}} />
                      {!collapsed && (
                        <>
                          <span className={cn("flex-1 text-left text-[15px]", subActive ? "" : "")}>{translatedName}</span>
                          <ChevronDown
                            className={cn("w-3.5 h-3.5 transition-transform duration-300", openMenus[item.key] && "rotate-180")}
                            style={{ color: "var(--sb-section)" }}
                          />
                        </>
                      )}
                    </button>
                    {!collapsed && openMenus[item.key] && (
                      <div className="ml-[26px] pl-3 mt-1.5 mb-2 space-y-1"
                        style={{ borderLeft: "2px solid var(--sb-divider)" }}>
                        {visibleSubs.map(sub => {
                          const SubIcon = sub.icon
                          const isActive = pathname === sub.href
                          return (
                            <Link key={sub.key} href={sub.href || "#"}>
                              <div
                                className={cn(
                                  "flex items-center gap-2.5 h-9 px-3 rounded-lg text-[14px] transition-colors relative",
                                  isActive ? "" : ""
                                )}
                                style={isActive
                                  ? { background: "var(--sb-active-sub)", color: "var(--sb-text)" }
                                  : { background: "transparent", color: "var(--sb-muted)" }
                                }
                                onMouseEnter={e => onHoverIn(e.currentTarget as HTMLElement, isActive)}
                                onMouseLeave={e => onHoverOut(e.currentTarget as HTMLElement, isActive)} >
                                <span className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-all duration-300"
                                  style={{
                                    background: "var(--sb-active-bar)",
                                    opacity: isActive ? 1 : 0,
                                    transform: `translateY(-50%) scale(${isActive ? 1.2 : 0.8})`,
                                  }} />
                                <SubIcon className="w-3.5 h-3.5 shrink-0"
                                  style={isActive ? { color: "var(--sb-active-icon)" } : {}} />
                                <span className="truncate">{getTranslatedName(sub)}</span>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href={item.href || "#"}>
                    <div
                      className={cn(
                        "flex items-center h-10 rounded-xl transition-colors duration-150 relative cursor-pointer",
                        collapsed ? "justify-center px-0" : "gap-2.5 px-3",
                      )}
                      style={pathname === item.href
                        ? { background: "var(--sb-active-bg)", color: "var(--sb-text)" }
                        : { background: "transparent", color: "var(--sb-muted)" }
                      }
                      onMouseEnter={e => onHoverIn(e.currentTarget as HTMLElement, pathname === item.href)}
                      onMouseLeave={e => onHoverOut(e.currentTarget as HTMLElement, pathname === item.href)}
                    >
                      {pathname === item.href && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[55%] rounded-r-full"
                          style={{ background: "var(--sb-active-bar)" }} />
                      )}
                      <Icon className="w-[17px] h-[17px] shrink-0"
                        style={pathname === item.href ? { color: "var(--sb-active-icon)" } : {}} />
                      {!collapsed && (
                        <span className={cn("text-[15px] truncate", pathname === item.href ? "" : "")}>{translatedName}</span>
                      )}
                    </div>
                  </Link>
                )}
              </div>
            )
          })}
        </nav>
        <div className="p-3" style={{ borderTop: "1px solid var(--sb-divider)", background: "var(--sb-footer-bg)" }}>
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="w-9 h-9 rounded-xl shrink-0 overflow-hidden shadow-md flex items-center justify-center"
              style={{ background: "var(--sb-badge)", border: "1px solid var(--sb-badge-border)" }}>
              {avatarUrl
                ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer"
                  onError={e => {
                    const tg = e.target as HTMLImageElement; tg.style.display = "none"
                    const p = tg.parentElement
                    if (p && !p.querySelector("span.avatar-fallback")) {
                      const s = document.createElement("span"); s.className = "avatar-fallback"
                      s.style.cssText = "color:#fff;font-weight:900;font-size:13px"
                      s.textContent = displayName.charAt(0).toUpperCase(); p.appendChild(s)
                    }
                  }}
                />
                : <span className="font-black text-white" style={{ fontSize: "13px" }}>{displayName.charAt(0).toUpperCase()}</span>
              }
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px]  truncate leading-tight" style={{ color: "var(--sb-text)" }}>{displayName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <p className="text-[11px]  uppercase tracking-wider truncate" style={{ color: "var(--sb-section)" }}>
                      {user?.role ?? "Staff"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setTheme(isDark ? "light" : "dark")} className="p-1.5 rounded-lg transition-colors"
                  title={isDark ? "Light Mode" : "Dark Mode"}
                  style={{ color: "var(--sb-section)", background: "transparent" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--sb-text)"; (e.currentTarget as HTMLElement).style.background = "var(--sb-hover)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--sb-section)"; (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  {isDark ? <Sun className="w-[15px] h-[15px]" /> : <Moon className="w-[15px] h-[15px]" />}
                </button>
                <button onClick={() => setShowLogoutDialog(true)} className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "var(--sb-section)", background: "transparent" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--sb-section)"; (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="px-3 py-2" style={{ borderTop: "1px solid var(--sb-divider)", background: "var(--sb-toggle-bg)" }}>
          <button className="w-full h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--sb-section)", background: "transparent" }}
            onClick={toggleSidebar}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--sb-text)"; (e.currentTarget as HTMLElement).style.background = "var(--sb-hover)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--sb-section)"; (e.currentTarget as HTMLElement).style.background = "transparent" }} >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        <LogoutDialog
          open={showLogoutDialog}
          onOpenChange={setShowLogoutDialog}
          onConfirm={() => { setShowLogoutDialog(false); logout() }}
        />
      </aside>
    </TooltipProvider>
  )
}