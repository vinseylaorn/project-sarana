<?php
namespace App\Services;

use App\Models\Inventory;
use App\Models\StockHistory;
use Illuminate\Support\Facades\DB;

class StockService
{
    public function deductByOrder(int $orderId, array $orderItems): void
    {
        foreach ($orderItems as $orderItem) {
            $menuItem = \App\Models\MenuItem::with('recipes.inventory')
                ->find($orderItem['menu_item_id']);

            if (!$menuItem) continue;

            foreach ($menuItem->recipes as $recipe) {
                $inventory = $recipe->inventory;
                if (!$inventory) continue;

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
            }
        }
    }
}