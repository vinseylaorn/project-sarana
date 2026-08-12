// hooks/useReports.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { reportsApi } from "@/lib/api"
import type { ReportData } from "@/types"

const EMPTY: ReportData = {
  kpi: {
    totalRevenue: 0, salesRevenue: 0, manualIncome: 0,
    totalOrders: 0, avgOrder: 0, totalExpense: 0,
    revenueChange: 0, dineIn: 0, takeaway: 0, app: 0,
  },
  charts: {
    revenueByDay:   [],
    revenueByWeek:  [],
    revenueByMonth: [],
    revenueTrend:   [],
    categoryData:   [],
    topItems:       [],
    paymentData:    [],
  },
  recent: [],
}

export function useReports(startDate: string, endDate: string) {
  const [data, setData]       = useState<ReportData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await reportsApi.dashboard({
        start_date: startDate || undefined,
        end_date:   endDate   || undefined,
      })
      setData(result)
    } catch (err: any) {
      console.error("useReports error:", err)
      setError(err?.message ?? "Failed to load report data")
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => { fetchData() }, [fetchData])

  return {
    loading,
    error,
    kpi:     data.kpi,
    charts:  data.charts,
    recent:  data.recent,
    refetch: fetchData,
  }
}