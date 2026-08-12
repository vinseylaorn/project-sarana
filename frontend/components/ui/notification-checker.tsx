"use client"

import { useEffect, useRef } from "react"
import { useNotifications } from "@/lib/notification-context"
import { inventoryApi } from "@/lib/api"
import { token } from "@/lib/auth/token"

export function NotificationChecker() {
  const { addNotification, hasNotification } = useNotifications()
  const checked = useRef(false)

  useEffect(() => {
    // Small delay to allow token to hydrate from localStorage
    const timer = setTimeout(async () => {
      // ── Guard: skip if no token ──────────────────────────────
      if (!token.get()) return
      if (checked.current) return
      checked.current = true

      try {
        const items = await inventoryApi.list()
        items.forEach((item) => {
          if (item.stock <= item.min_stock) {
            const id = `low_stock_${item.id}`
            if (!hasNotification(id)) {
              addNotification({
                id,
                type: "warning",
                title: "Low Stock Alert",
                message: `${item.name} has only ${item.stock} ${item.unit} left — please restock`,
              })
            }
          }
        })
      } catch (err: any) {
        // 401 redirect already handled in client.ts
        // reset flag so it retries after re-login
        if (err?.message === "Unauthenticated") {
          checked.current = false
        }
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  return null
}