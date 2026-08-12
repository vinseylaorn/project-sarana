// lib/api/client.ts

import { token } from "@/lib/auth/token"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

function isInPosContext(): boolean {
  if (typeof window === "undefined") return false
  return window.location.pathname.startsWith("/pos")
}

const POS_SHARED_RESOURCES = [
  "/tables",
  "/menu-items",
  "/menu-categories",
  "/discounts",
  "/reservations",
  "/orders",
  "/stock-history",
  "/vip/cards/lookup",
]

function resolvePath(path: string): string {
  if (!isInPosContext()) return path
  const [basePath] = path.split("?")
  const needsPosPrefix = POS_SHARED_RESOURCES.some(
    (resource) => basePath === resource || basePath.startsWith(`${resource}/`)
  )
  if (needsPosPrefix && !path.startsWith("/pos/")) {
    return `/pos${path}`
  }
  return path
}
function getAuthHeader(): Record<string, string> {
  if (isInPosContext()) {
    const posToken = token.pos.get()
    if (posToken) return { Authorization: `Bearer ${posToken}` }
    return {}
  }
  const authToken = token.get()
  if (authToken) return { Authorization: `Bearer ${authToken}` }
  return {}
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const resolvedPath = resolvePath(path)

  const res = await fetch(`${BASE_URL}${resolvedPath}`, {
    method,
    headers: {
      "Content-Type":  "application/json",
      "Accept":        "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma":        "no-cache",
      ...getAuthHeader(),
    },
    body:        body ? JSON.stringify(body) : undefined,
    cache:       "no-store",
    credentials: "include",
  })

  if (res.status === 401) {
    const isPosEndpoint = resolvedPath.startsWith("/pos/")

    if (typeof window !== "undefined") {
      if (isPosEndpoint) {
        console.warn("[POS 401] Unauthorized endpoint:", method, resolvedPath)
        token.pos.clear()

        if (
          window.location.pathname !== "/pos-login" &&
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/forgot-password")
        ) {
          window.location.href = "/pos-login"
        }
      } else {
        token.clear()

        if (
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/forgot-password")
        ) {
          window.location.href = "/login"
        }
      }
    }
    const err = await res.json().catch(() => ({ message: "Unauthenticated" }))
    throw new Error(err.message ?? "Unauthenticated")
  }
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

export const get   = <T>(path: string)                => request<T>("GET",    path)
export const post  = <T>(path: string, body: unknown) => request<T>("POST",   path, body)
export const put   = <T>(path: string, body: unknown) => request<T>("PUT",    path, body)
export const del   = <T>(path: string)                => request<T>("DELETE", path)
export const patch = <T>(path: string, body: unknown) => request<T>("PATCH",  path, body)