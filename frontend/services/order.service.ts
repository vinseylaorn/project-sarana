
import { ordersApi, tablesApi } from "@/lib/api"
import type { CartItem }        from "@/store/cart.store"
import type { Order }           from "@/types"

export const orderService = {
  async createFromCart(
    items:       CartItem[],
    table_name?: string,
    order_type = "dine-in",
  ): Promise<Order> {
    return ordersApi.create({
      table_name,
      order_type,
      items: items.map(i => ({
        menu_item_id: i.menu_item_id,
        name:         i.name,
        price:        i.price,
        quantity:     i.quantity,
      })),
    })
  },

  async completeOrder(
    order_id:       number,
    payment_method: string,
    table_id?:      number,
  ): Promise<Order> {
    const order = await ordersApi.complete(order_id, payment_method)

    if (table_id) {
      await tablesApi.updateStatus(table_id, "available")
    }

    return order
  },

  calcTotal(items: CartItem[]): number {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  },
}