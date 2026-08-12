// lib/api/report.ts

import { get } from "./client"
import type { ReportData } from "@/types"

export interface ReportParams {
  start_date?: string
  end_date?:   string
}

export interface ExportOrder {
  order_ref:      string
  order_type:     string
  table_name:     string
  total:          number
  payment_method: string
  created_at:     string
}

export const reportsApi = {
  dashboard: (params: ReportParams = {}): Promise<ReportData> => {
    const qs = new URLSearchParams()
    if (params.start_date) qs.set("start_date", params.start_date)
    if (params.end_date)   qs.set("end_date",   params.end_date)
    const query = qs.toString() ? `?${qs.toString()}` : ""
    return get<ReportData>(`/reports/dashboard${query}`)
  },

  export: (params: ReportParams = {}): Promise<ExportOrder[]> => {
    const qs = new URLSearchParams()
    if (params.start_date) qs.set("start_date", params.start_date)
    if (params.end_date)   qs.set("end_date",   params.end_date)
    const query = qs.toString() ? `?${qs.toString()}` : ""
    return get<ExportOrder[]>(`/reports/export${query}`)
  },
}