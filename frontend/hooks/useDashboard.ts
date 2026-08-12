// hooks/useDashboard.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { dashboardApi } from "@/lib/api/dashboard"
import type { DashboardData } from "@/lib/api/dashboard"

const EMPTY: DashboardData = {
  stats: {
    todayRevenue: 0, ordersToday: 0, avgOrderValue: 0,
    tablesOccupied: 0, totalTables: 0, pendingOrders: 0, completedOrders: 0,
    revenueChangePercent: 0, ordersChangePercent: 0,
    avgOrderChangePercent: 0, completedPercent: 0,
  },
  revenue: { week: [], month: [], year: [] },
  orders:  [],
  alerts:  [],
  tables:  [],
}

export function useDashboard() {
  const [data,    setData]    = useState<DashboardData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await dashboardApi.get()
      setData(result)
    } catch (err: any) {
      setError(err?.message ?? "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { ...data, loading, error, refetch: fetch }
}