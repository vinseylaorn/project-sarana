// lib/api/spoilage.ts

import { get, post, put, del } from './client'
import type { Spoilage }       from '@/types'

export const spoilageApi = {
  list: (params?: {
    search?:      string
    category_id?: number
    start_date?:  string
    end_date?:    string
  }) => {
    const q = new URLSearchParams()
    if (params?.search)      q.set('search',      params.search)
    if (params?.category_id) q.set('category_id', String(params.category_id))
    if (params?.start_date)  q.set('start_date',  params.start_date)
    if (params?.end_date)    q.set('end_date',     params.end_date)
    const qs = q.toString()
    return get<Spoilage[]>(`/spoilages${qs ? '?' + qs : ''}`)
  },

  create: (payload: {
    inventory_id: number
    qty:          number
    date:         string
    description?: string
  }) => post<Spoilage>('/spoilages', payload),

  update: (id: number, payload: {
    qty:          number
    date:         string
    description?: string
  }) => put<Spoilage>(`/spoilages/${id}`, payload),

  delete: (id: number) => del<{ message: string }>(`/spoilages/${id}`),
}