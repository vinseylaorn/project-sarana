"use client"

import { useState, useEffect, useCallback } from "react"
import { reportsApi, spoilageApi } from "@/lib/api" // ⚠️ ដូរ `spoilageApi` ឱ្យត្រូវនឹង API ដែលទំព័រ Spoilage ប្រើ
import type { InventoryReportData, Spoilage } from "@/types"

const EMPTY: InventoryReportData = {
   kpi: {
      totalProducts: 0, goodStock: 0, lowStock: 0, outStock: 0,
      totalIn: 0, totalOut: 0, totalSpoilage: 0,
   },
   charts: {
      stockByCategory: [],
      movementTrend: [],
      topRestocked: [],
      topConsumed: [],
   },
   lowStockItems: [],
   recentMovements: [],
}

// Sum spoilage qty within the selected date range (YYYY-MM-DD compare)
const sumSpoilage = (rows: Spoilage[], start: string, end: string): number =>
   rows
      .filter((r) => {
         const d = String(r.date ?? "").slice(0, 10)
         return (!start || d >= start) && (!end || d <= end)
      })
      .reduce((sum, r) => sum + Number(r.qty || 0), 0)

// Accept both a plain array and a paginated `{ data: [...] }` response
const toRows = (res: any): Spoilage[] =>
   Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : []

export function useInventoryReport(startDate: string, endDate: string) {
   const [data, setData] = useState<InventoryReportData>(EMPTY)
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)

   const fetchData = useCallback(async () => {
      setLoading(true)
      setError(null)
      try {
         const [result, spoilageRes] = await Promise.all([
            reportsApi.inventoryReport({
               start_date: startDate || undefined,
               end_date: endDate || undefined,
            }),
            // If the spoilage request fails, don't break the whole page
            spoilageApi
               .list({ start_date: startDate || undefined, end_date: endDate || undefined })
               .catch(() => [] as Spoilage[]),
         ])

         setData({
            ...result,
            kpi: {
               ...result.kpi,
               // Prefer backend value; otherwise compute on the frontend
               totalSpoilage:
                  result.kpi?.totalSpoilage ?? sumSpoilage(toRows(spoilageRes), startDate, endDate),
            },
         })
      } catch (err: any) {
         console.error("useInventoryReport error:", err)
         setError(err?.message ?? "Failed to load inventory report")
      } finally {
         setLoading(false)
      }
   }, [startDate, endDate])

   useEffect(() => { fetchData() }, [fetchData])

   return {
      loading,
      error,
      kpi: data.kpi,
      charts: data.charts,
      lowStockItems: data.lowStockItems,
      recentMovements: data.recentMovements,
      refetch: fetchData,
   }
}