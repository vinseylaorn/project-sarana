// lib/api/suppliers.ts

import { get, post, put, del } from './client'
import type { Supplier } from '@/types'

type SupplierPayload = Omit<Supplier, 'id' | 'created_at' | 'category'>

export const suppliersApi = {
  list:   () => get<Supplier[]>('/suppliers'),
  get:    (id: number) => get<Supplier>(`/suppliers/${id}`),
  create: (payload: SupplierPayload) => post<Supplier>('/suppliers', payload),
  update: (id: number, payload: Partial<SupplierPayload>) => put<Supplier>(`/suppliers/${id}`, payload),
  delete: (id: number) => del<{ message: string }>(`/suppliers/${id}`),
}