// lib/api/finance.ts

import { get, post, put, del }                                      from "./client"
import type { FinanceCategory, Expense, Income, IncomesResponse }   from "@/types"

export const financeCategoriesApi = {
  list: (params?: { type?: string; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.type && params.type !== "all") q.set("type",   params.type)
    if (params?.search)                        q.set("search", params.search)
    const qs = q.toString()
    return get<FinanceCategory[]>(`/finance-categories${qs ? "?" + qs : ""}`)
  },
  create: (payload: { name: string; type: string }) =>
    post<FinanceCategory>("/finance-categories", payload),
  update: (id: number, payload: { name: string; type: string }) =>
    put<FinanceCategory>(`/finance-categories/${id}`, payload),

  delete: (id: number) => del<{ message: string }>(`/finance-categories/${id}`),
}

export const expensesApi = {
  list: (params?: {
    search?:     string
    category?:   string
    start_date?: string
    end_date?:   string
  }) => {
    const q = new URLSearchParams()
    if (params?.search)                                q.set("search",     params.search)
    if (params?.category && params.category !== "all") q.set("category",   params.category)
    if (params?.start_date)                            q.set("start_date", params.start_date)
    if (params?.end_date)                              q.set("end_date",   params.end_date)
    const qs = q.toString()
    return get<Expense[]>(`/expenses${qs ? "?" + qs : ""}`)
  },

  create: (payload: {
    title:     string
    amount:    number | string
    category?: string | null
    date?:     string
    is_auto?:  boolean
  }) => post<Expense>("/expenses", payload),

  update: (id: number, payload: Partial<{
    title:    string
    amount:   number | string
    category: string | null
    date:     string
  }>) => put<Expense>(`/expenses/${id}`, payload),

  delete: (id: number) => del<{ message: string }>(`/expenses/${id}`),
}

export const incomesApi = {
  list: (params?: {
    start_date?: string
    end_date?:   string
    category?:   string
    search?:     string
    per_page?:   number
    page?:       number
  }) => {
    const q = new URLSearchParams()
    if (params?.start_date)                            q.set("start_date", params.start_date)
    if (params?.end_date)                              q.set("end_date",   params.end_date)
    if (params?.category && params.category !== "all") q.set("category",   params.category)
    if (params?.search)                                q.set("search",     params.search)
    if (params?.per_page)                              q.set("per_page",   String(params.per_page))
    if (params?.page)                                  q.set("page",       String(params.page))
    const qs = q.toString()
    return get<IncomesResponse>(`/incomes${qs ? "?" + qs : ""}`)
  },

  get: (id: string) => get<Income>(`/incomes/${id}`),

  createManual: (payload: {
    title:            string
    amount:           number
    date?:            string
    category?:        string
    payment_method?:  string
    description?:     string
  }) => post<Income>("/incomes/manual", payload),

  update: (id: string, payload: Partial<{
    title:           string
    amount:          number
    date:            string
    category:        string
    payment_method:  string
    description:     string
  }>) => put<Income>(`/incomes/${id}`, payload),

  delete: (id: string) => del<{ message: string }>(`/incomes/${id}`),

  summary: (params?: { start_date?: string; end_date?: string }) => {
    const q = new URLSearchParams()
    if (params?.start_date) q.set("start_date", params.start_date)
    if (params?.end_date)   q.set("end_date",   params.end_date)
    const qs = q.toString()
    return get<IncomesResponse["summary"]>(`/incomes/summary${qs ? "?" + qs : ""}`)
  },
}