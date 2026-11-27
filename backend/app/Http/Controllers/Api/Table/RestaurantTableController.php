<?php

namespace App\Http\Controllers\Api\Table;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\RestaurantTable;
use App\Models\Reservation;
use App\Models\TableTransfer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RestaurantTableController extends Controller
{
    /** status របស់ order ដែលបានបិទរួច (មិនត្រូវប៉ះពាល់) */
    private const CLOSED_ORDER_STATUSES = ['completed', 'paid', 'cancelled', 'canceled', 'merged'];

    // ───────────────────────────────────────────────────────────────
    // CRUD
    // ───────────────────────────────────────────────────────────────

    public function index(): JsonResponse
    {
        $tables = RestaurantTable::orderBy('name')->get();

        // ទាញ order សកម្មម្ដងតែមួយ ដើម្បីជៀស N+1
        $orders = Order::whereNotIn('status', self::CLOSED_ORDER_STATUSES)
            ->whereNull('merged_into_order_id')
            ->with('tables')
            ->get();

        $byName = [];
        $byId   = [];
        foreach ($orders as $o) {
            $byName[$o->table_name] = $o;
            foreach ($o->tables as $t) {
                $byId[$t->id] = $o;
            }
        }

        $result = $tables->map(function ($t) use ($byId, $byName) {
            $order = $t->status === 'occupied'
                ? ($byId[$t->id] ?? $byName[$t->name] ?? null)
                : null;
            return $this->format($t, $order);
        });

        return response()->json($result);
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
        $order = $table->status === 'occupied' ? $this->activeOrderForTable($table) : null;
        return response()->json($this->format($table, $order));
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

    // ───────────────────────────────────────────────────────────────
    // GET /pos/tables/{table}/order
    // តុ A, B, C ដែល merge គ្នា ទទួលបាន order តែមួយជាមួយ items ទាំងអស់
    // ───────────────────────────────────────────────────────────────
    public function order(RestaurantTable $table): JsonResponse
    {
        $order = $this->activeOrderForTable($table);

        if (!$order) {
            return response()->json(['message' => 'No active order'], 404);
        }

        $order->load(['items', 'tables']);

        return response()->json([
            'order'              => $order,
            'merged_table_ids'   => $order->tables->pluck('id')->values(),
            'merged_table_names' => $order->tables->pluck('name')->values(),
        ]);
    }

    // ───────────────────────────────────────────────────────────────
    // POST /pos/tables/transfer — ផ្ទេរ order ទៅតុទំនេរ
    // ───────────────────────────────────────────────────────────────
    public function transfer(Request $request): JsonResponse
    {
        $this->normalizeTablePayload($request);

        $data = $request->validate([
            'from_table_id' => 'required|integer|exists:restaurant_tables,id',
            'to_table_id'   => 'required|integer|exists:restaurant_tables,id|different:from_table_id',
        ]);

        return DB::transaction(function () use ($data, $request) {
            $from = RestaurantTable::lockForUpdate()->findOrFail($data['from_table_id']);
            $to   = RestaurantTable::lockForUpdate()->findOrFail($data['to_table_id']);

            if ($to->status !== 'available') {
                return response()->json(['message' => 'Destination table is not available'], 422);
            }

            // order អាចមិនទាន់មាន (មានតែ draft ក្នុង browser) → មិនចាំបាច់ 422
            $order = $this->activeOrderForTable($from);

            if ($order) {
                if ($order->table_name === $from->name) {
                    $order->update(['table_name' => $to->name]);
                }
                if ($order->tables()->where('restaurant_tables.id', $from->id)->exists()) {
                    $order->tables()->detach($from->id);
                    $order->tables()->syncWithoutDetaching([$to->id]);
                }
            }

            $to->update(['status' => 'occupied', 'reserve_time' => null]);
            $from->update(['status' => 'available', 'reserve_time' => null]);

            TableTransfer::create([
                'type'          => 'transfer',
                'order_id'      => $order?->id,
                'from_table_id' => $from->id,
                'to_table_id'   => $to->id,
                'staff_id'      => $this->currentStaffId($request, $order),
            ]);

            $order?->load('tables');

            return response()->json([
                'message'    => 'Table transferred successfully',
                'order_id'   => $order?->id,
                'order_ref'  => $order?->order_ref,
                'from_table' => ['id' => $from->id, 'name' => $from->name, 'status' => 'available'],
                'to_table'   => ['id' => $to->id,   'name' => $to->name,   'status' => 'occupied'],
                'from'       => $this->format($from->fresh()),
                'to'         => $this->format($to->fresh(), $order),
            ]);
        });
    }

    // ───────────────────────────────────────────────────────────────
    // POST /pos/tables/merge — bill តែមួយ, តុទាំងអស់នៅ OCCUPIED
    // payload: from_table_id (source) + to_table_id (target)
    // ───────────────────────────────────────────────────────────────
    public function merge(Request $request): JsonResponse
    {
        $this->normalizeTablePayload($request);

        $data = $request->validate([
            'from_table_id' => 'required|integer|exists:restaurant_tables,id',
            'to_table_id'   => 'required|integer|exists:restaurant_tables,id|different:from_table_id',
        ]);

        return DB::transaction(function () use ($data, $request) {
            $from = RestaurantTable::lockForUpdate()->findOrFail($data['from_table_id']);
            $to   = RestaurantTable::lockForUpdate()->findOrFail($data['to_table_id']);

            $source = $this->activeOrderForTable($from);
            $target = $this->activeOrderForTable($to);

            if ($source && $target && $source->id === $target->id) {
                return response()->json(['message' => 'Tables already share the same bill'], 422);
            }

            // order ដែលនៅរស់ (primary)
            $primary = $target ?? $source;

            // តុទាំងអស់ដែលត្រូវនៅក្នុង bill នេះ
            $ids = [$from->id, $to->id];
            if ($source) $ids = array_merge($ids, $source->tables()->pluck('restaurant_tables.id')->all());
            if ($target) $ids = array_merge($ids, $target->tables()->pluck('restaurant_tables.id')->all());
            $ids = array_values(array_unique($ids));

            if ($primary) {
                if ($source && $target) {
                    // ផ្លាស់ items ពី source → target
                    $source->items()->update(['order_id' => $target->id]);
                    $source->tables()->detach();
                    $source->update([
                        'status'               => 'merged',
                        'merged_into_order_id' => $target->id,
                        'total'                => 0,
                    ]);
                }
                $primary->tables()->syncWithoutDetaching($ids);
                $this->recalculateOrder($primary);
            }

            // តុទាំងអស់ OCCUPIED
            RestaurantTable::whereIn('id', $ids)
                ->update(['status' => 'occupied', 'reserve_time' => null]);

            TableTransfer::create([
                'type'          => 'merge',
                'order_id'      => $primary?->id,
                'from_table_id' => $from->id,
                'to_table_id'   => $to->id,
                'staff_id'      => $this->currentStaffId($request, $primary),
            ]);

            $primary?->load(['items', 'tables']);

            return response()->json([
                'message'       => 'Tables merged successfully',
                'order_id'      => $primary?->id,
                'order_ref'     => $primary?->order_ref,
                'total'         => (float) ($primary?->total ?? 0),
                'primary_table' => $primary?->table_name ?? $to->name,
                'tables'        => $primary ? $primary->tables->pluck('name')->values() : [$from->name, $to->name],
                'order'         => $primary,
                'from'          => $this->format($from->fresh(), $primary),
                'to'            => $this->format($to->fresh(), $primary),
            ]);
        });
    }

    // ───────────────────────────────────────────────────────────────
    // Helpers
    // ───────────────────────────────────────────────────────────────

    /** ទទួលឈ្មោះ field ច្រើនបែបពី frontend */
    private function normalizeTablePayload(Request $request): void
    {
        $request->merge([
            'from_table_id' => $request->input('from_table_id',
                                $request->input('source_table_id',
                                $request->input('from_table',
                                $request->input('source_table_ids.0')))),
            'to_table_id'   => $request->input('to_table_id',
                                $request->input('target_table_id',
                                $request->input('to_table'))),
        ]);
    }

    /** order សកម្មលើតុ (រួមទាំងតុដែលជាផ្នែកនៃ merged order) */
    private function activeOrderForTable(RestaurantTable $table): ?Order
    {
        return Order::where(function ($q) use ($table) {
                $q->where('table_name', $table->name)
                  ->orWhereHas('tables', fn($t) => $t->where('restaurant_tables.id', $table->id));
            })
            ->whereNotIn('status', self::CLOSED_ORDER_STATUSES)
            ->whereNull('merged_into_order_id')
            ->with('tables')
            ->latest('id')
            ->first();
    }

    /**
     * ⚠️ កែតាមរូបមន្តរបស់ OrderController ប្រសិនបើខុសគ្នា
     */
    private function recalculateOrder(Order $order): void
    {
        $subtotal = (float) $order->items()
            ->selectRaw('COALESCE(SUM(price * quantity), 0) as s')
            ->value('s');

        $order->update([
            'total' => max(0, $subtotal
                - (float) $order->discount_amount
                - (float) $order->vip_discount_amount
                + (float) $order->tax_amount),
        ]);
    }

    private function currentStaffId(Request $request, ?Order $order): ?int
    {
        return $request->user()?->id
            ?? $request->input('staff_id')
            ?? $order?->staff_id;
    }

    private function format(RestaurantTable $t, ?Order $order = null): array
    {
        $activeReservation = null;
        if ($t->status === 'reserved') {
            $activeReservation = Reservation::whereIn('status', ['pending', 'confirmed'])
                ->whereHas('tables', fn($q) => $q->where('restaurant_tables.id', $t->id))
                ->whereNotNull('arrival_datetime')
                ->orderBy('arrival_datetime')
                ->first();
        }

        $mergedIds   = [];
        $mergedNames = [];
        if ($order && $order->relationLoaded('tables') && $order->tables->count() > 1) {
            $mergedIds   = $order->tables->pluck('id')->values()->all();
            $mergedNames = $order->tables->pluck('name')->values()->all();
        }

        return [
            'id'                 => $t->id,
            'name'               => $t->name,
            'seats'              => $t->seats,
            'floor'              => $t->floor,
            'status'             => $t->status,
            'reserve_time'       => $t->reserve_time,
            'arrival_datetime'   => $activeReservation?->arrival_datetime?->toIso8601String(),
            'created_at'         => $t->created_at,
            // សម្រាប់ frontend បើក bill តែមួយពីតុ merged ណាមួយ
            'order_id'           => $order?->id,
            'merged_table_ids'   => $mergedIds,
            'merged_table_names' => $mergedNames,
        ];
    }
}