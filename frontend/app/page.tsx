"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { TableOverview } from "@/components/dashboard/table-overview"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { InventoryAlerts } from "@/components/dashboard/inventory-alerts"
import { useRole } from "@/lib/role-context"
import { useTranslation } from "react-i18next"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
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
  if (!permissions) return "/unauthorized"
  for (const key of PAGE_PRIORITY) {
    if (permissions[key]?.view === true && PAGE_HREF_MAP[key]) {
      return PAGE_HREF_MAP[key]
    }
  }
  return "/unauthorized"
}

export default function HomePage() {
  const { user, isLoading } = useRole()
  const { i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) { router.replace("/login"); return }

    const role    = (user.role ?? "").toLowerCase()
    const isAdmin = ["administrator", "admin"].includes(role)
    const isPOS   = ["pos", "cashier"].includes(role)

    if (isPOS) { router.replace("/pos"); return }

    if (!isAdmin && !user.permissions?.["dashboard"]?.view) {
      router.replace(getFirstAccessiblePage(user.permissions))
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-[#13151f] transition-colors duration-300" />
    )
  }

  const role    = (user.role ?? "").toLowerCase()
  const isAdmin = ["administrator", "admin"].includes(role)
  const hasDashboard = isAdmin || user.permissions?.["dashboard"]?.view === true

  if (!hasDashboard) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-[#13151f] transition-colors duration-300" />
    )
  }

  const displayName = user.username || (isKh ? "អ្នកប្រើប្រាស់" : "User")

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.4, ease: "easeOut" as const },
    },
  }

  return (
    <div
      className="flex h-screen bg-gray-50 dark:bg-[#13151f] overflow-hidden transition-colors duration-300"
      style={{ fontFamily: "var(--font-kantumruy), sans-serif" }} >
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={isKh ? "ផ្ទាំងគ្រប់គ្រង" : "Dashboard"}
          subtitle={
            isKh
              ? `រីករាយដែលបានជួបអ្នកវិញ, ${displayName}`
              : `Welcome back, ${displayName}`
          }
        />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 pb-10">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants}>
              <StatsCards />
            </motion.div>
            <div className="grid lg:grid-cols-2 gap-6 mt-6 items-stretch">
              <motion.div variants={itemVariants} className="flex flex-col">
                <RevenueChart />
              </motion.div>
              <motion.div variants={itemVariants} className="flex flex-col">
                <TableOverview />
              </motion.div>
            </div>
            <div className="grid lg:grid-cols-2 gap-6 mt-6 items-stretch">
              <motion.div variants={itemVariants} className="flex flex-col">
                <RecentOrders />
              </motion.div>
              <motion.div variants={itemVariants} className="flex flex-col">
                <InventoryAlerts />
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}