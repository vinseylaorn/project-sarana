<?php

namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\StockHistory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Inventory::with(['category', 'supplier'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($item) => $this->format($item));

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'category_id' => 'required|exists:stock_categories,id',
            'name'        => 'required|string|max:255',
            'unit'        => 'required|string|max:50',
            'size'        => 'required|in:Small,Normal,Large',
            'stock'       => 'required|numeric|min:0',
            'min_stock'   => 'required|numeric|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        DB::beginTransaction();
        try {
            $item = Inventory::create($request->only([
                'category_id', 'name', 'unit', 'size',
                'stock', 'min_stock', 'supplier_id',
            ]));

            if ($request->stock > 0) {
                StockHistory::create([
                    'inventory_id' => $item->id,
                    'product_name' => $item->name,
                    'type'         => 'IN',
                    'qty'          => $request->stock,
                    'unit'         => $item->unit,
                    'reason'       => 'Initial stock',
                ]);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }

        return response()->json($this->format($item->load(['category', 'supplier'])), 201);
    }

    public function show(Inventory $inventory): JsonResponse
    {
        return response()->json($this->format($inventory->load(['category', 'supplier'])));
    }

    public function update(Request $request, Inventory $inventory): JsonResponse
    {
        $request->validate([
            'category_id' => 'sometimes|exists:stock_categories,id',
            'name'        => 'sometimes|string|max:255',
            'unit'        => 'sometimes|string|max:50',
            'size'        => 'sometimes|in:Small,Normal,Large',
            'stock'       => 'sometimes|numeric|min:0',
            'min_stock'   => 'sometimes|numeric|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        DB::beginTransaction();
        try {
            $oldStock = $inventory->stock;
            $newStock = $request->has('stock') ? floatval($request->stock) : $oldStock;
            $diff     = $newStock - $oldStock;

            $inventory->update($request->only([
                'category_id', 'name', 'unit', 'size',
                'stock', 'min_stock', 'supplier_id',
            ]));

            if ($diff != 0) {
                StockHistory::create([
                    'inventory_id' => $inventory->id,
                    'product_name' => $inventory->name,
                    'type'         => $diff > 0 ? 'IN' : 'OUT',
                    'qty'          => abs($diff),
                    'unit'         => $inventory->unit,
                    'reason'       => $diff > 0 ? 'Stock added' : 'Stock reduced',
                ]);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }

        return response()->json($this->format($inventory->load(['category', 'supplier'])));
    }

    public function destroy(Inventory $inventory): JsonResponse
    {
        DB::beginTransaction();
        try {
            if ($inventory->stock > 0) {
                StockHistory::create([
                    'inventory_id' => $inventory->id,
                    'product_name' => $inventory->name,
                    'type'         => 'OUT',
                    'qty'          => $inventory->stock,
                    'unit'         => $inventory->unit,
                    'reason'       => 'Item deleted',
                ]);
            }

            $inventory->delete();
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }

        return response()->json(['message' => 'Inventory item deleted successfully']);
    }

    private function format(Inventory $item): array
    {
        return [
            'id'          => $item->id,
            'category_id' => $item->category_id,
            'category'    => $item->category?->name,
            'name'        => $item->name,
            'unit'        => $item->unit,
            'size'        => $item->size,
            'stock'       => $item->stock,
            'min_stock'   => $item->min_stock,
            'supplier_id' => $item->supplier_id,
            'created_at'  => $item->created_at,
            'updated_at'  => $item->updated_at,  
        ];
    }
}