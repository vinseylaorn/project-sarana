<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\StockHistory;
use Illuminate\Support\Facades\DB;

class StockService
{
    protected TelegramService $telegram;

    public function __construct(TelegramService $telegram)
    {
        $this->telegram = $telegram;
    }

    public function deductByOrder(int $orderId, array $orderItems): void
    {
        // Tracks inventory IDs already notified in this call, to avoid
        // sending duplicate Telegram alerts when multiple order items
        // share the same inventory ingredient.
        $notifiedIds = [];

        foreach ($orderItems as $orderItem) {
            $menuItem = \App\Models\MenuItem::with('recipes.inventory')
                ->find($orderItem['menu_item_id']);

            if (!$menuItem) {
                continue;
            }

            foreach ($menuItem->recipes as $recipe) {
                $inventory = $recipe->inventory;
                if (!$inventory) {
                    continue;
                }

                $deductTotal = $recipe->deduct_qty * $orderItem['quantity'];

                $inventory->decrement('stock', $deductTotal);

                StockHistory::create([
                    'inventory_id' => $inventory->id,
                    'product_name' => $inventory->name,
                    'type'         => 'OUT',
                    'qty'          => $deductTotal,
                    'unit'         => $inventory->unit,
                    'reason'       => 'Order #' . $orderId . ' - ' . $orderItem['name'],
                    'order_id'     => $orderId,
                ]);

                // Refresh to get the true DB value (protects against
                // concurrent orders deducting the same item at once).
                $inventory->refresh();
                $currentStock = (float) $inventory->stock;

                if (in_array($inventory->id, $notifiedIds, true)) {
                    continue;
                }

                if ($currentStock <= 0) {
                    $this->telegram->sendOutOfStockNotification($inventory);
                    $notifiedIds[] = $inventory->id;
                } elseif ($currentStock <= $inventory->min_stock) {
                    $this->telegram->sendLowStockNotification($inventory, $currentStock);
                    $notifiedIds[] = $inventory->id;
                }
            }
        }
    }
}