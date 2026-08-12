<?php

namespace App\Http\Controllers\Api\Table;

use App\Http\Controllers\Controller;
use App\Models\RestaurantTable;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RestaurantTableController extends Controller
{
    public function index(): JsonResponse
    {
        $tables = RestaurantTable::orderBy('name')->get()->map(fn($t) => $this->format($t));
        return response()->json($tables);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:100|unique:restaurant_tables,name',
            'seats' => 'required|integer|min:1',
            'floor' => 'required|string|max:50',
        ]);

        $table = RestaurantTable::create(array_merge($validated, ['status' => 'available']));

        return response()->json($this->format($table), 201);
    }

    public function show(RestaurantTable $table): JsonResponse
    {
        return response()->json($this->format($table));
    }

    public function update(Request $request, RestaurantTable $table): JsonResponse
    {
        $request->validate([
            'name'         => 'sometimes|string|max:100|unique:restaurant_tables,name,' . $table->id,
            'seats'        => 'sometimes|integer|min:1',
            'floor'        => 'sometimes|string|max:50',
            'status'       => 'sometimes|in:available,occupied,reserved',
            'reserve_time' => 'nullable|string',
        ]);
        $table->update($request->only(['name', 'seats', 'floor', 'status', 'reserve_time']));
        $table->refresh();
        return response()->json($this->format($table));
    }

    public function destroy(RestaurantTable $table): JsonResponse
    {
        if ($table->status !== 'available') {
            return response()->json(['message' => 'Cannot delete occupied or reserved table'], 422);
        }
        $table->delete();
        return response()->json(['message' => 'Table deleted']);
    }

    public function updateStatus(Request $request, RestaurantTable $table): JsonResponse
    {
        $request->validate([
            'status'       => 'required|in:available,occupied,reserved',
            'reserve_time' => 'nullable|string',
        ]);
        DB::table('restaurant_tables')->where('id', $table->id)->update([
            'status'       => $request->status,
            'reserve_time' => $request->reserve_time,
            'updated_at'   => now(),
        ]);
        $updated = RestaurantTable::find($table->id);
        if (!$updated) return response()->json(['message' => 'Table not found'], 404);
        return response()->json($this->format($updated));
    }

    private function format(RestaurantTable $t): array
    {
        $activeReservation = null;
        if ($t->status === 'reserved') {
            $activeReservation = Reservation::whereIn('status', ['pending', 'confirmed'])
                ->whereHas('tables', fn($q) => $q->where('restaurant_tables.id', $t->id))
                ->whereNotNull('arrival_datetime')
                ->orderBy('arrival_datetime')
                ->first();
        }

        return [
            'id'               => $t->id,
            'name'             => $t->name,
            'seats'            => $t->seats,
            'floor'            => $t->floor,
            'status'           => $t->status,
            'reserve_time'     => $t->reserve_time,
            'arrival_datetime' => $activeReservation?->arrival_datetime?->toIso8601String(),
            'created_at'       => $t->created_at,
        ];
    }
}