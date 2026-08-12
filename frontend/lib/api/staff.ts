// lib/api/staff.ts

import { get, post, put, del } from "./client"
import type { Staff }          from "@/types"

export const staffApi = {
  list:   ()                                       => get<Staff[]>("/staff"),
  get:    (id: number)                             => get<Staff>(`/staff/${id}`),
  create: (payload: Partial<Staff>)                => post<Staff>("/staff", payload),
  update: (id: number, payload: Partial<Staff>)    => put<Staff>(`/staff/${id}`, payload),
  delete: (id: number)                             => del<{ message: string }>(`/staff/${id}`),
}