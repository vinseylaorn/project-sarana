// lib/api/tables.ts

import { get, post, put, del } from "./client"
import type { Table }          from "@/types"

export const tablesApi = {
  list:   ()           => get<Table[]>("/tables"),
  get:    (id: number) => get<Table>(`/tables/${id}`),

  create: (payload: {
    name:  string
    seats: number
    floor: string
  }) => post<Table>("/tables", payload),

  update: (id: number, payload: Partial<{
    name:  string
    seats: number
    floor: string
  }>) => put<Table>(`/tables/${id}`, payload),

  delete: (id: number) => del<{ message: string }>(`/tables/${id}`),

  updateStatus: (
    id:            number,
    status:        "available" | "occupied" | "reserved",
    reserve_time?: string,
  ) => put<Table>(`/tables/${id}/status`, {
    status,
    reserve_time: reserve_time ?? null,
  }),
}