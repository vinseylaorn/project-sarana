<?php
namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockHistory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StockHistoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StockHistory::with('inventory')
            ->orderBy('created_at', 'desc');

        if ($request->type && $request->type !== 'ALL') {
            $query->where('type', $request->type);
        }
        if ($request->search) {
            $query->where('product_name', 'like', '%' . $request->search . '%');
        }
        if ($request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        return response()->json($query->get()->map(fn($h) => [
            'id'          => $h->id,
            'productName' => $h->product_name,
            'type'        => $h->type,
            'qty'         => $h->qty,
            'unit'        => $h->unit,
            'reason'      => $h->reason,
            'timestamp'   => $h->created_at,
        ]));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'inventory_id' => 'required|exists:inventories,id',
            'type'         => 'required|in:IN,OUT',
            'qty'          => 'required|numeric|min:0',
            'reason'       => 'nullable|string',
        ]);

        $inventory = \App\Models\Inventory::findOrFail($request->inventory_id);

        if ($request->type === 'IN') {
            $inventory->increment('stock', $request->qty);
        } else {
            if ($inventory->stock < $request->qty) {
                return response()->json(['message' => 'Insufficient stock'], 422);
            }
            $inventory->decrement('stock', $request->qty);
        }

        $history = StockHistory::create([
            'inventory_id' => $request->inventory_id,
            'product_name' => $inventory->name,
            'type'         => $request->type,
            'qty'          => $request->qty,
            'unit'         => $inventory->unit,
            'reason'       => $request->reason,
        ]);

        return response()->json([
            'id'          => $history->id,
            'productName' => $history->product_name,
            'type'        => $history->type,
            'qty'         => $history->qty,
            'unit'        => $history->unit,
            'reason'      => $history->reason,
            'timestamp'   => $history->created_at,
        ], 201);
    }
}