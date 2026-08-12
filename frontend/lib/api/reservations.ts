// lib/api/reservations.ts

import { token } from "@/lib/auth/token"
import type {
  Reservation,
  ReservationTable,
  ReservationItem,
  ReservationListResponse,
  CreateReservationPayload,
} from "@/types"

export type { Reservation, ReservationTable, ReservationItem, ReservationListResponse, CreateReservationPayload }
export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

function isInPosContext(): boolean {
  if (typeof window === "undefined") return false
  return window.location.pathname.startsWith("/pos")
}

function getBearerToken(): string | null {
  if (isInPosContext()) return token.pos.get() ?? token.get()
  return token.get()
}

async function rsvRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const bearerToken = getBearerToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type":  "application/json",
      "Accept":        "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma":        "no-cache",
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
    },
    body:        body ? JSON.stringify(body) : undefined,
    cache:       "no-store",
    credentials: "include",
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    if (err.errors) {
      const firstMsg = Object.values(err.errors as Record<string, string[]>)[0]?.[0]
      throw new Error(firstMsg ?? "Validation error")
    }
    throw new Error(err.message ?? "API error")
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const reservationsApi = {

  list(params?: {
    status?:   ReservationStatus
    date?:     string
    page?:     number
    per_page?: number
  }): Promise<ReservationListResponse> {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString()
    const base = isInPosContext() ? "/pos/reservations" : "/reservations"
    return rsvRequest<ReservationListResponse>("GET", `${base}${qs ? `?${qs}` : ""}`)
  },

  create(payload: CreateReservationPayload): Promise<{ message: string; reservation: Reservation }> {
    const path = isInPosContext() ? "/pos/reservations" : "/reservations"
    return rsvRequest<{ message: string; reservation: Reservation }>("POST", path, payload)
  },

  get(id: number): Promise<Reservation> {
    return rsvRequest<Reservation>("GET", `/reservations/${id}`)
  },

  update(
    id: number,
    payload: Partial<Pick<Reservation,
      | "customer_name"
      | "customer_phone"
      | "arrival_datetime"
      | "status"
      | "notes"
    >> & {
      table_ids?: number[]
      items?:     Array<{ id: number; quantity: number }>
    }
  ): Promise<{ message: string; reservation: Reservation }> {
    return rsvRequest<{ message: string; reservation: Reservation }>(
      "POST",
      `/reservations/${id}?_method=PATCH`,
      payload
    )
  },

  updateTableStatus(
    reservationId: number,
    tableIdOrIds:  number | number[],
    action:        "cancel" | "complete"
  ): Promise<{ message: string; reservation: Reservation }> {
    const body = Array.isArray(tableIdOrIds)
      ? { table_ids: tableIdOrIds, action }
      : { table_id:  tableIdOrIds, action }

    if (isInPosContext()) {
      return rsvRequest<{ message: string; reservation: Reservation }>(
        "POST",
        `/pos/reservations/${reservationId}/table-status`,
        body
      )
    }
    return rsvRequest<{ message: string; reservation: Reservation }>(
      "POST",
      `/reservations/${reservationId}/table-status?_method=PATCH`,
      body
    )
  },

  delete(id: number): Promise<{ message: string }> {
    return rsvRequest<{ message: string }>("DELETE", `/reservations/${id}`)
  },

  confirm:  (id: number) => reservationsApi.update(id, { status: "confirmed" }),
  cancel:   (id: number) => reservationsApi.update(id, { status: "cancelled" }),
  complete: (id: number) => reservationsApi.update(id, { status: "completed" }),
}