// lib/api/working-shifts.ts

import { get, post, put, del } from './client'  // ✅ reuse client.ts ទាំងស្រុង
import type { WorkingShift, WorkingShiftPayload, WorkingShiftSummary } from '@/types'

export const workingShiftsApi = {
  list: (params?: {
    staff_id?:   number
    start_date?: string
    end_date?:   string
    status?:     string
    shift_type?: string
  }): Promise<WorkingShift[]> => {
    const qs = new URLSearchParams()
    if (params?.staff_id)   qs.set('staff_id',   String(params.staff_id))
    if (params?.start_date) qs.set('start_date', params.start_date)
    if (params?.end_date)   qs.set('end_date',   params.end_date)
    if (params?.status)     qs.set('status',     params.status)
    if (params?.shift_type) qs.set('shift_type', params.shift_type)
    const q = qs.toString()
    return get<WorkingShift[]>(`/working-shifts${q ? `?${q}` : ''}`)
  },

  summary: (params?: { start_date?: string; end_date?: string }): Promise<WorkingShiftSummary> => {
    const qs = new URLSearchParams()
    if (params?.start_date) qs.set('start_date', params.start_date)
    if (params?.end_date)   qs.set('end_date',   params.end_date)
    const q = qs.toString()
    return get<WorkingShiftSummary>(`/working-shifts/summary${q ? `?${q}` : ''}`)
  },

  get:    (id: number)                              => get<WorkingShift>(`/working-shifts/${id}`),
  create: (payload: WorkingShiftPayload)             => post<WorkingShift>('/working-shifts', payload),
  update: (id: number, payload: Partial<WorkingShiftPayload>) => put<WorkingShift>(`/working-shifts/${id}`, payload),
  delete: (id: number)                              => del<{ message: string }>(`/working-shifts/${id}`),
}