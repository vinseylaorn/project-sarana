"use client"

import type React from "react"
import { useRole } from "@/lib/role-context"
import LoginPage from "@/app/login/page"
import { usePathname } from "next/navigation"

const PUBLIC_ROUTES = ["/login", "/forgot-password"]
export function AppShell({ children }: { children: React.ReactNode }) {
  
  const { user, isLoading } = useRole()
  const pathname = usePathname()
  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname === r || pathname?.startsWith(r))

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#13151f]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }
  if (isPublicRoute) {
    return <>{children}</>
  }
  if (!user) {
    return <LoginPage />
  }
  return <>{children}</>
}