<?php

namespace App\Http\Controllers\Api\Reservation;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\RestaurantTable;
use App\Models\Reservation;
use App\Models\Discount;
use App\Services\TelegramService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ReservationController extends Controller
{
    private const LOCK_WINDOW_MINUTES = 30;

    private const MIN_GAP_MINUTES = 90;

    protected TelegramService $telegram;

    public function __construct(TelegramService $telegram)
    {
        $this->telegram = $telegram;
    }

    private function getActiveDiscounts(): \Illuminate\Support\Collection
    {
        $today = now()->toDateString();
        return Discount::where('status', 'active')
            ->where(fn($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', $today))
            ->where(fn($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', $today))
            ->get();
    }

    private function resolvePrice(MenuItem $item, \Illuminate\Support\Collection $discounts): array
    {
        $originalPrice = (float) $item->price;

        $productDisc = $discounts
            ->where('scope', 'product')
            ->first(fn($d) => in_array($item->id, $d->target_ids ?? []));

        $categoryDisc = !$productDisc
            ? $discounts
                ->where('scope', 'category')
                ->first(fn($d) => in_array($item->category_id, $d->target_ids ?? []))
            : null;

        $disc = $productDisc ?? $categoryDisc;

        if (!$disc) {
            return [
                'price'          => $originalPrice,
                'original_price' => $originalPrice,
                'discount'       => null,
            ];
        }

        $discountedPrice = $disc->value_type === 'percentage'
            ? round($originalPrice * (1 - $disc->value / 100), 2)
            : round(max(0, $originalPrice - $disc->value), 2);

        return [
            'price'          => $discountedPrice,
            'original_price' => $originalPrice,
            'discount'       => [
                'id'         => $disc->id,
                'name'       => $disc->name,
                'value'      => $disc->value,
                'value_type' => $disc->value_type,
                'scope'      => $disc->scope,
            ],
        ];
    }

    private function isWithinLockWindow(?string $arrivalDatetime): bool
    {
        if (!$arrivalDatetime) {
            return true;
        }

        $minutesUntilArrival = (Carbon::parse($arrivalDatetime)->timestamp - now()->timestamp) / 60;

        return $minutesUntilArrival <= self::LOCK_WINDOW_MINUTES;
    }

    private function normalizePhone(?string $phone): ?string
    {
        return $phone === null ? null : preg_replace('/\D/', '', $phone);
    }

    private function findSchedulingConflicts(array $tableIds, ?string $arrivalDatetime, ?int $excludeReservationId = null): \Illuminate\Support\Collection
    {
        $requestedTime = $arrivalDatetime ? Carbon::parse($arrivalDatetime) : Carbon::now();
        $windowStart   = $requestedTime->copy()->subMinutes(self::MIN_GAP_MINUTES);
        $windowEnd     = $requestedTime->copy()->addMinutes(self::MIN_GAP_MINUTES);

        $conflicts = Reservation::whereIn('status', ['pending', 'confirmed'])
            ->when($excludeReservationId, fn($q) => $q->where('id', '!=', $excludeReservationId))
            ->whereNotNull('arrival_datetime')
            ->whereBetween('arrival_datetime', [$windowStart, $windowEnd])
            ->whereHas('tables', function ($q) use ($tableIds) {
                $q->whereIn('restaurant_tables.id', $tableIds)
                  ->where('reservation_tables.status', 'reserved');
            })
            ->with(['tables' => fn($q) => $q->whereIn('restaurant_tables.id', $tableIds)])
            ->get();

        return $conflicts
            ->flatMap(fn($r) => $r->tables->pluck('name'))
            ->unique()
            ->values();
    }

    public function index(Request $request): JsonResponse
    {
        $query = Reservation::with(['tables', 'items'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $reservations = $query->paginate($request->get('per_page', 20));

        return response()->json($reservations);
    }

    public function store(Request $request): JsonResponse
    {
        $request->merge([
            'customer_phone' => $this->normalizePhone($request->input('customer_phone')),
        ]);

        $validated = $request->validate([
            'customer_name'    => 'required|string|max:100',
            'customer_phone'   => 'required|digits_between:8,10',
            'arrival_datetime' => [
                'nullable',
                'date',
                'after:'  . now()->addMinutes(10)->toDateTimeString(),
                'before:' . now()->addDays(30)->toDateTimeString(),
            ],
            'table_ids'        => 'required|array|min:1',
            'table_ids.*'      => 'required|integer|exists:restaurant_tables,id',
            'notes'            => 'nullable|string|max:500',
            'items'            => 'nullable|array',
            'items.*.id'       => 'required|integer|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1|max:999',
        ]);

        $conflictTables = $this->findSchedulingConflicts(
            $validated['table_ids'],
            $validated['arrival_datetime'] ?? null
        );
        if ($conflictTables->isNotEmpty()) {
            return response()->json([
                'message'            => 'Some tables already have a reservation within 1.5 hours of this time.',
                'unavailable_tables' => $conflictTables,
            ], 422);
        }

        DB::beginTransaction();
        try {
            $tables = RestaurantTable::whereIn('id', $validated['table_ids'])
                ->lockForUpdate()
                ->get();

            $unavailable = $tables->where('status', '!=', 'available');
            if ($unavailable->isNotEmpty()) {
                DB::rollBack();
                return response()->json([
                    'message'            => 'Some tables are not available.',
                    'unavailable_tables' => $unavailable->pluck('name'),
                ], 422);
            }

            $discounts     = $this->getActiveDiscounts();
            $totalPrice    = 0;
            $resolvedItems = [];

            foreach ($validated['items'] ?? [] as $itemInput) {
                $menuItem  = MenuItem::findOrFail($itemInput['id']);
                $resolved  = $this->resolvePrice($menuItem, $discounts);
                $totalPrice += $resolved['price'] * $itemInput['quantity'];
                $resolvedItems[] = [
                    'menu_item_id'   => $menuItem->id,
                    'name'           => $menuItem->name,
                    'price'          => $resolved['price'],
                    'original_price' => $resolved['original_price'],
                    'discount_name'  => $resolved['discount']['name']       ?? null,
                    'discount_value' => $resolved['discount']['value']      ?? null,
                    'discount_type'  => $resolved['discount']['value_type'] ?? null,
                    'quantity'       => $itemInput['quantity'],
                ];
            }

            $reservation = Reservation::create([
                'customer_name'    => $validated['customer_name'],
                'customer_phone'   => $validated['customer_phone'],
                'arrival_datetime' => $validated['arrival_datetime'] ?? null,
                'status'           => 'pending',
                'total_price'      => $totalPrice,
                'notes'            => $validated['notes'] ?? null,
            ]);

            $reservation->tables()->attach(
                collect($validated['table_ids'])
                    ->mapWithKeys(fn($id) => [$id => ['status' => 'reserved']])
                    ->toArray()
            );

            if ($this->isWithinLockWindow($validated['arrival_datetime'] ?? null)) {
                $newTableStatus = empty($validated['arrival_datetime']) ? 'occupied' : 'reserved';
                RestaurantTable::whereIn('id', $validated['table_ids'])
                    ->update(['status' => $newTableStatus]);
            }

            if (!empty($resolvedItems)) {
                $reservation->items()->createMany($resolvedItems);
            }

            DB::commit();

            // ✅ Telegram alert — sent after commit so a slow/failed HTTP
            // call to Telegram never rolls back or blocks the DB transaction.
            $this->telegram->sendReservationNotification($reservation->load(['tables', 'items']));

            return response()->json([
                'message'     => 'Reservation created successfully.',
                'reservation' => $reservation->load(['tables', 'items']),
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create reservation.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Reservation $reservation): JsonResponse
    {
        return response()->json($reservation->load(['tables', 'items']));
    }

    public function update(Request $request, Reservation $reservation): JsonResponse
    {
        if ($request->has('customer_phone')) {
            $request->merge([
                'customer_phone' => $this->normalizePhone($request->input('customer_phone')),
            ]);
        }

        $validated = $request->validate([
            'customer_name'    => 'sometimes|string|max:100',
            'customer_phone'   => 'sometimes|digits_between:8,10',
            'arrival_datetime' => [
                'nullable',
                'date',
                'after:'  . now()->addMinutes(10)->toDateTimeString(),
                'before:' . now()->addDays(30)->toDateTimeString(),
            ],
            'status'           => ['sometimes', Rule::in(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])],
            'notes'            => 'nullable|string|max:500',
        ]);
        if (!$request->has('status') && !in_array($reservation->status, ['cancelled', 'completed'])) {
            $validated['status'] = 'pending';
        }

        $effectiveArrival  = $validated['arrival_datetime'] ?? $reservation->arrival_datetime;
        $effectiveTableIds = $request->input('table_ids', $reservation->tables->pluck('id')->toArray());

        $conflictTables = $this->findSchedulingConflicts(
            $effectiveTableIds,
            $effectiveArrival,
            $reservation->id
        );
        if ($conflictTables->isNotEmpty()) {
            return response()->json([
                'message'            => 'Some tables already have a reservation within 1.5 hours of this time.',
                'unavailable_tables' => $conflictTables,
            ], 422);
        }

        if ($request->has('table_ids')) {
            $request->validate([
                'table_ids'   => 'array|min:1',
                'table_ids.*' => 'integer|exists:restaurant_tables,id',
            ]);

            DB::beginTransaction();
            try {
                $newTableIds = $request->table_ids;
                $oldTableIds = $reservation->tables->pluck('id')->toArray();

                $toFreeIds    = array_diff($oldTableIds, $newTableIds);
                $toReserveIds = array_diff($newTableIds, $oldTableIds);

                if (!empty($toReserveIds)) {
                    $newTables = RestaurantTable::whereIn('id', $toReserveIds)
                        ->lockForUpdate()
                        ->get();

                    $unavailable = $newTables->where('status', '!=', 'available');
                    if ($unavailable->isNotEmpty()) {
                        DB::rollBack();
                        return response()->json([
                            'message'            => 'Some tables are not available.',
                            'unavailable_tables' => $unavailable->pluck('name'),
                        ], 422);
                    }

                    if ($this->isWithinLockWindow($effectiveArrival)) {
                        $newStatus = empty($effectiveArrival) ? 'occupied' : 'reserved';
                        RestaurantTable::whereIn('id', $toReserveIds)->update(['status' => $newStatus]);
                    }

                    $reservation->tables()->attach(
                        collect($toReserveIds)
                            ->mapWithKeys(fn($id) => [$id => ['status' => 'reserved']])
                            ->toArray()
                    );
                }

                if (!empty($toFreeIds)) {
                    RestaurantTable::whereIn('id', $toFreeIds)
                        ->update(['status' => 'available', 'reserve_time' => null]);
                    $reservation->tables()->detach($toFreeIds);
                }

                $reservation->update($validated);
                DB::commit();

            } catch (\Throwable $e) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Failed to update reservation.',
                    'error'   => $e->getMessage(),
                ], 500);
            }
        } else {
            $reservation->update($validated);
        }

        if (($validated['status'] ?? null) === 'cancelled') {
            $tableIds = $reservation->tables->pluck('id')->toArray();
            RestaurantTable::whereIn('id', $tableIds)
                ->update(['status' => 'available', 'reserve_time' => null]);
            foreach ($tableIds as $tid) {
                $reservation->tables()->updateExistingPivot($tid, ['status' => 'cancelled']);
            }
        }

        return response()->json([
            'message'     => 'Reservation updated.',
            'reservation' => $reservation->fresh(['tables', 'items']),
        ]);
    }

    public function destroy(Reservation $reservation): JsonResponse
    {
        DB::transaction(function () use ($reservation) {
            RestaurantTable::whereIn('id', $reservation->tables->pluck('id'))
                ->update(['status' => 'available', 'reserve_time' => null]);
            $reservation->delete();
        });

        return response()->json(['message' => 'Reservation deleted.']);
    }

    public function updateTableStatus(Request $request, Reservation $reservation): JsonResponse
    {
        $validated = $request->validate([
            'table_ids'   => 'required_without:table_id|array|min:1',
            'table_ids.*' => 'integer|exists:restaurant_tables,id',
            'table_id'    => 'required_without:table_ids|integer|exists:restaurant_tables,id',
            'action'      => 'required|in:cancel,complete',
        ]);

        $action   = $validated['action'];
        $tableIds = $validated['table_ids'] ?? [$validated['table_id']];

        $belongIds = $reservation->tables()->pluck('restaurant_tables.id')->toArray();
        foreach ($tableIds as $id) {
            if (!in_array($id, $belongIds)) {
                return response()->json([
                    'message' => "Table {$id} does not belong to this reservation."
                ], 422);
            }
        }

        DB::transaction(function () use ($reservation, $tableIds, $action) {
            if ($action === 'cancel') {
                RestaurantTable::whereIn('id', $tableIds)
                    ->update(['status' => 'available', 'reserve_time' => null]);
                foreach ($tableIds as $id) {
                    $reservation->tables()->updateExistingPivot($id, ['status' => 'cancelled']);
                }
                $auditRecord = Reservation::create([
                    'customer_name'    => $reservation->customer_name,
                    'customer_phone'   => $reservation->customer_phone,
                    'arrival_datetime' => $reservation->arrival_datetime,
                    'status'           => 'cancelled',
                    'total_price'      => 0,
                    'notes'            => trim(($reservation->notes ?? '') . ' [partial cancel audit]'),
                ]);
                $auditRecord->tables()->attach(
                    collect($tableIds)->mapWithKeys(fn($id) => [$id => ['status' => 'cancelled']])->toArray()
                );
            } else {
                RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'occupied']);
                foreach ($tableIds as $id) {
                    $reservation->tables()->updateExistingPivot($id, ['status' => 'completed']);
                }
            }

            $pivotStatuses = DB::table('reservation_tables')
                ->where('reservation_id', $reservation->id)
                ->pluck('status');

            $allCancelled = $pivotStatuses->every(fn($s) => $s === 'cancelled');
            $allCompleted = $pivotStatuses->every(fn($s) => $s === 'completed');
            $allDone      = $pivotStatuses->every(fn($s) => in_array($s, ['cancelled', 'completed']));
            $anyCompleted = $pivotStatuses->contains('completed');

            if ($allCancelled)                 $reservation->update(['status' => 'cancelled']);
            elseif ($allCompleted || $allDone) $reservation->update(['status' => 'completed']);
            elseif ($anyCompleted)             $reservation->update(['status' => 'confirmed']);
        });

        return response()->json([
            'message'     => 'Table status updated.',
            'reservation' => $reservation->fresh(['tables', 'items']),
        ]);
    }
}