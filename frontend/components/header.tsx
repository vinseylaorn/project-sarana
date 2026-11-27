"use client"

import { useState, useEffect, useRef, type ReactElement } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import {
  Bell, Search, Sun, Moon, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle2, X
} from "lucide-react"
import { SettingsDropdown } from "@/components/settings-dropdown"
import { useNotifications, type Notification } from "@/lib/notification-context"
import { navigation, type NavItem } from "@/components/sidebar"
import { cn } from "@/lib/utils"

const KANTUMRUY = { fontFamily: "var(--font-kantumruy), sans-serif" }

interface HeaderProps {
  title: string
  subtitle?: string
}

function flattenNav(items: NavItem[]): { name: string; href: string; icon: any; parent?: string }[] {
  const result: { name: string; href: string; icon: any; parent?: string }[] = []
  for (const item of items) {
    if (item.isDropdown && item.subItems) {
      for (const sub of item.subItems) {
        if (sub.href) {
          result.push({ name: sub.name, href: sub.href, icon: sub.icon, parent: item.name })
        }
      }
    } else if (item.href) {
      result.push({ name: item.name, href: item.href, icon: item.icon })
    }
  }
  return result
}

const ALL_PAGES = flattenNav(navigation)

const NOTIF_STYLE: Record<string, { icon: ReactElement; bg: string }> = {
  warning: { icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />, bg: "bg-amber-50 dark:bg-amber-500/10" },
  success: { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />, bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  info: { icon: <Info className="w-3.5 h-3.5 text-indigo-500" />, bg: "bg-indigo-50 dark:bg-indigo-500/10" },
}
const notifStyle = (type: string) => NOTIF_STYLE[type] ?? NOTIF_STYLE.info

export function Header({ title, subtitle }: HeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications()

  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const isDark = mounted && resolvedTheme === "dark"

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const results = query.trim().length > 0
    ? ALL_PAGES.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.parent && p.parent.toLowerCase().includes(query.toLowerCase()))
    )
    : []
  useEffect(() => { setHighlighted(0) }, [results.length])

  const navigateTo = (href: string) => {
    router.push(href)
    setQuery("")
    setSearchOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      navigateTo(results[highlighted].href)
    } else if (e.key === "Escape") {
      setSearchOpen(false)
      setQuery("")
    }
  }

  return (
    <header
      className="flex items-center justify-between h-[68px] px-6 shrink-0 border-b
        bg-white dark:bg-[#1e2235]
        border-gray-200 dark:border-white/[0.08]
        transition-colors duration-300"
      style={KANTUMRUY} >
      <div>
        <h1
          suppressHydrationWarning
          className="text-[18px] font-semibold leading-tight text-gray-900 dark:text-white/[0.92]"
        >
          {title}
        </h1>
        {subtitle && (
          <p
            suppressHydrationWarning
            className="text-[12px] uppercase tracking-widest mt-0.5 text-gray-400 dark:text-white/[0.28]"
          >
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative hidden md:block" ref={searchRef}>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10
              text-gray-400 dark:text-white/[0.28]" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSearchOpen(true) }}
            onFocus={() => { if (query.trim()) setSearchOpen(true) }}
            onKeyDown={handleKeyDown}
            placeholder="Search menu..."
            className="w-56 h-9 pl-8 pr-7 text-[14px] rounded-lg outline-none
              bg-gray-100 dark:bg-white/[0.06]
              border border-gray-200 dark:border-white/[0.08]
              text-gray-900 dark:text-white/80
              placeholder-gray-600 dark:placeholder-white/[0.28]
              hover:border-gray-300 dark:hover:border-white/[0.14]
              focus:border-[#03624C] dark:focus:border-indigo-500/55
              transition-colors duration-200"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setSearchOpen(false); inputRef.current?.focus() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 transition-colors
                text-gray-400 dark:text-white/[0.28]
                hover:text-gray-900 dark:hover:text-white/80" >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {searchOpen && results.length > 0 && (
            <div
              className="absolute left-0 top-[calc(100%+6px)] w-[260px] rounded-xl shadow-2xl z-50 overflow-hidden py-1 border
                bg-white dark:bg-[#22263a]
                border-gray-100 dark:border-white/[0.08]" >
              {results.map((item, i) => {
                const Icon = item.icon
                const isHl = i === highlighted
                return (
                  <button
                    key={item.href}
                    onMouseEnter={() => setHighlighted(i)}
                    onClick={() => navigateTo(item.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      isHl
                        ? "bg-indigo-50 dark:bg-indigo-500/[0.12]"
                        : "bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                    )} >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                        isHl
                          ? "bg-indigo-200 dark:bg-indigo-500/20"
                          : "bg-gray-100 dark:bg-white/[0.06]"
                      )} >
                      <Icon className={cn(
                        "w-3.5 h-3.5",
                        isHl ? "text-indigo-700 dark:text-indigo-300" : "text-gray-500 dark:text-white/40"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[12px] font-semibold truncate",
                        isHl ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-white/70"
                      )}>
                        {item.name}
                      </p>
                      {item.parent && (
                        <p className={cn(
                          "text-[10px] truncate",
                          isHl ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-white/30"
                        )}>
                          {item.parent}
                        </p>
                      )}
                    </div>
                    {isHl && (
                      <kbd className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0
                        bg-indigo-200 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" >
                        ↵
                      </kbd>
                    )}
                  </button>
                )
              })}
            </div>
          )}
          {searchOpen && query.trim().length > 0 && results.length === 0 && (
            <div
              className="absolute left-0 top-[calc(100%+6px)] w-[260px] rounded-xl shadow-2xl z-50 py-6 flex flex-col items-center gap-1 border
                bg-white dark:bg-[#22263a]
                border-gray-100 dark:border-white/[0.08]" >
              <Search className="w-6 h-6 text-gray-200 dark:text-white/10" />
              <p className="text-[11px] font-medium text-gray-400 dark:text-white/30">
                No pages found
              </p>
            </div>
          )}
        </div>
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200
            text-gray-500 dark:text-white/40
            hover:text-gray-900 dark:hover:text-white/[0.92]
            hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")} >
          {mounted && (
            isDark
              ? <Sun className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200
              text-gray-500 dark:text-white/40
              hover:text-gray-900 dark:hover:text-white/[0.92]
              hover:bg-gray-100 dark:hover:bg-white/[0.06]" >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-indigo-500 border-2
                border-white dark:border-[#1e2235]" />
            )}
          </button>
          {notifOpen && (
            <div
              className="absolute right-0 top-[calc(100%+8px)] w-[340px] rounded-2xl shadow-2xl z-50 overflow-hidden border
                bg-white dark:bg-[#22263a]
                border-gray-100 dark:border-white/[0.08]"
              style={KANTUMRUY} >
              <div className="flex items-center justify-between px-4 py-3 border-b
                border-gray-100 dark:border-white/[0.08]" >
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-bold text-gray-800 dark:text-white/90">
                    Notifications
                  </p>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full
                      bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" >
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-all
                        text-indigo-700 dark:text-indigo-300
                        hover:bg-indigo-100 dark:hover:bg-indigo-500/20" >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-all
                        text-rose-500 hover:bg-rose-500/10" >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Bell className="w-8 h-8 text-gray-200 dark:text-white/10" />
                    <p className="text-[12px] font-medium text-gray-400 dark:text-white/30">
                      No notifications
                    </p>
                  </div>
                ) : (
                  notifications.map((n: Notification) => {
                    const ns = notifStyle(n.type)
                    return (
                      <button
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={cn(
                          "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b last:border-0",
                          "border-gray-50 dark:border-white/[0.05]",
                          n.read
                            ? "bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                            : "bg-indigo-50/40 dark:bg-indigo-500/[0.06] hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                        )} >
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", ns.bg)}>
                          {ns.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              "text-[12px] font-semibold truncate",
                              n.read ? "text-gray-600 dark:text-white/50" : "text-gray-800 dark:text-white/90"
                            )}>
                              {n.title}
                            </p>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                          </div>
                          <p className="text-[11px] mt-0.5 leading-relaxed line-clamp-2 text-gray-400 dark:text-white/30">
                            {n.message}
                          </p>
                          <p className="text-[10px] mt-1 font-medium text-gray-300 dark:text-white/20">
                            {n.time}
                          </p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
        <SettingsDropdown />
      </div>
    </header>
  )
}