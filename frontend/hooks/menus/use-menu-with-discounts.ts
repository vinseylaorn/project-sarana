import { useMemo } from "react"
import { useMenuItems } from "@/hooks/discount/use-menu-data"
import { useDiscounts } from "@/hooks/discount/use-discounts"
import type { MenuItem } from "@/types"

export function useMenuItemsWithDiscounts() {
  const { data: rawItems = [], isLoading: loadingItems, ...itemsRest } = useMenuItems()
  const { data: discounts = [], isLoading: loadingDiscounts } = useDiscounts()

  const items = useMemo<MenuItem[]>(() => {
    if (rawItems.length === 0) return rawItems

    const today = new Date().toISOString().slice(0, 10)

    const activeDiscounts = discounts.filter((d: any) => {
      if (d.status !== "active") return false
      if (d.start_date && d.start_date > today) return false
      if (d.end_date && d.end_date < today) return false
      return true
    })

    return rawItems.map((item) => {
      if (item.discounted_price != null) return item

      const catDiscount = activeDiscounts.find((d: any) => {
        if (d.scope !== "category") return false
        const ids: number[] = Array.isArray(d.target_ids)
          ? d.target_ids
          : d.target_id ? [d.target_id] : []
        return ids.includes(Number(item.category_id))
      })

      if (!catDiscount) return item

      const discounted_price =
        catDiscount.value_type === "percentage"
          ? parseFloat((item.price * (1 - catDiscount.value / 100)).toFixed(2))
          : parseFloat((item.price - catDiscount.value).toFixed(2))

      return {
        ...item,
        discount: {
          id: catDiscount.id,
          name: catDiscount.name,
          value: catDiscount.value,
          value_type: catDiscount.value_type,
        },
        discounted_price: Math.max(0, discounted_price),
      }
    })
  }, [rawItems, discounts])

  return {
    ...itemsRest,
    data: items,
    isLoading: loadingItems || loadingDiscounts,
  }
}