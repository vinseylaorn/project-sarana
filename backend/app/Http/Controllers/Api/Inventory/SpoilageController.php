<?php
namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Spoilage;
use App\Models\Inventory;
use App\Models\StockHistory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SpoilageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Spoilage::with('category');

        if ($request->search)
            $query->where('product_name', 'like', '%'.$request->search.'%');
        if ($request->category_id)
            $query->where('category_id', $request->category_id);
        if ($request->start_date)
            $query->whereDate('date', '>=', $request->start_date);
        if ($request->end_date)
            $query->whereDate('date', '<=', $request->end_date);

        return response()->json(
            $query->orderByDesc('date')->orderByDesc('id')
                  ->get()->map(fn($s) => $this->format($s))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'inventory_id' => 'required|exists:inventories,id',
            'qty'          => 'required|numeric|min:0.01',
            'date'         => 'required|date',
            'description'  => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($request, &$spoilage) {
            $inventory = Inventory::findOrFail($request->inventory_id);

            if ($inventory->stock < $request->qty) {
                abort(422, 'Insufficient stock');
            }

            $spoilage = Spoilage::create([
                'inventory_id' => $inventory->id,
                'category_id'  => $inventory->category_id,
                'product_name' => $inventory->name,
                'unit'         => $inventory->unit,
                'qty'          => $request->qty,
                'description'  => $request->description,
                'date'         => $request->date,
            ]);

            $inventory->decrement('stock', $request->qty);

            StockHistory::create([
                'inventory_id' => $inventory->id,
                'product_name' => $inventory->name,
                'type'         => 'OUT',
                'qty'          => $request->qty,
                'unit'         => $inventory->unit,
                'reason'       => 'Spoilage: ' . ($request->description ?? 'No reason'),
            ]);
        });

        return response()->json($this->format($spoilage->load('category')), 201);
    }

    public function update(Request $request, Spoilage $spoilage): JsonResponse
    {
        $request->validate([
            'qty'         => 'required|numeric|min:0.01',
            'date'        => 'required|date',
            'description' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($request, $spoilage) {
            $inventory = Inventory::findOrFail($spoilage->inventory_id);
            $oldQty    = (float) $spoilage->qty;
            $newQty    = (float) $request->qty;
            $diff      = $newQty - $oldQty;

            if ($diff > 0 && $inventory->stock < $diff) {
                abort(422, 'Insufficient stock');
            }

            if ($diff != 0) {
                $inventory->decrement('stock', $diff);
                StockHistory::create([
                    'inventory_id' => $inventory->id,
                    'product_name' => $inventory->name,
                    'type'         => $diff > 0 ? 'OUT' : 'IN',
                    'qty'          => abs($diff),
                    'unit'         => $inventory->unit,
                    'reason'       => 'Spoilage update: ' . ($request->description ?? 'No reason'),
                ]);
            }

            $spoilage->update([
                'qty'         => $newQty,
                'date'        => $request->date,
                'description' => $request->description,
            ]);
        });

        return response()->json($this->format($spoilage->fresh()->load('category')));
    }

    public function destroy(Spoilage $spoilage): JsonResponse
    {
        DB::transaction(function () use ($spoilage) {
            $inventory = Inventory::find($spoilage->inventory_id);
            if ($inventory) {
                $inventory->increment('stock', $spoilage->qty);
                StockHistory::create([
                    'inventory_id' => $inventory->id,
                    'product_name' => $inventory->name,
                    'type'         => 'IN',
                    'qty'          => $spoilage->qty,
                    'unit'         => $inventory->unit,
                    'reason'       => 'Spoilage deleted - stock restored',
                ]);
            }
            $spoilage->delete();
        });

        return response()->json(['message' => 'Deleted']);
    }

    private function format(Spoilage $s): array
    {
        return [
            'id'            => $s->id,
            'inventory_id'  => $s->inventory_id,
            'category_id'   => $s->category_id,
            'category_name' => $s->category?->name ?? '',
            'product_name'  => $s->product_name,
            'unit'          => $s->unit,
            'qty'           => (float) $s->qty,
            'description'   => $s->description,
            'date'          => $s->date instanceof \Carbon\Carbon
                ? $s->date->format('Y-m-d')
                : (string) $s->date,
            'created_at'    => $s->created_at,
        ];
    }
}