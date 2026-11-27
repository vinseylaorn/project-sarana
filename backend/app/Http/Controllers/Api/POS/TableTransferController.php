<?php

namespace App\Http\Controllers\Api\POS;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\RestaurantTable;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TableTransferController extends Controller
{
    private const CLOSED = ['completed', 'cancelled'];

    /** Move a customer (and their order) to an EMPTY table. */
    public function transfer(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from_table_id' => 'required|integer|exists:restaurant_tables,id',
            'to_table_id'   => 'required|integer|different:from_table_id|exists:restaurant_tables,id',
        ]);

        try {
            $result = DB::transaction(function () use ($data) {
                [$from, $to] = $this->lockTables($data['from_table_id'], $data['to_table_id']);

                if ($from->status !== 'occupied') {
                    throw new \DomainException('The source table has no active customer.');
                }
                if ($to->status !== 'available') {
                    throw new \DomainException('The target table must be available.');
                }

                $order = $this->resolveOrder($from);

                if ($order && DB::table('order_tables')->where('order_id', $order->id)->exists()) {
                    throw new \DomainException('This table is merged with other tables. Check out the merged bill first.');
                }

                // Order not sent to kitchen yet (draft only) => $order is null, only table status moves.
                if ($order) {
                    $order->update(['table_name' => $to->name]);
                }

                $from->update(['status' => 'available', 'reserve_time' => null]);
                $to->update(['status' => 'occupied', 'reserve_time' => null]);

                $this->log('transfer', $order?->id, $from->id, $to->id);

                return [
                    'message'    => "Transferred {$from->name} → {$to->name}",
                    'order_id'   => $order?->id,
                    'order_ref'  => $order?->order_ref,
                    'from_table' => ['id' => $from->id, 'name' => $from->name, 'status' => 'available'],
                    'to_table'   => ['id' => $to->id,   'name' => $to->name,   'status' => 'occupied'],
                ];
            });

            return response()->json($result);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Combine two occupied tables into ONE bill.
     * The TARGET order is kept; the SOURCE order's items move into it.
     * Both tables stay "occupied" until the merged order is paid/cancelled.
     */
    public function merge(Request $request): JsonResponse
    {
        $data = $request->validate([
            'source_table_id' => 'required|integer|exists:restaurant_tables,id',
            'target_table_id' => 'required|integer|different:source_table_id|exists:restaurant_tables,id',
        ]);

        try {
            $result = DB::transaction(function () use ($data) {
                [$source, $target] = $this->lockTables($data['source_table_id'], $data['target_table_id']);

                if ($source->status !== 'occupied' || $target->status !== 'occupied') {
                    throw new \DomainException('Both tables must have customers to merge.');
                }

                $srcOrder = $this->resolveOrder($source);
                $tgtOrder = $this->resolveOrder($target);

                if (! $srcOrder || ! $tgtOrder) {
                    throw new \DomainException('Both tables need a confirmed order (send to kitchen first).');
                }
                if ($srcOrder->id === $tgtOrder->id) {
                    throw new \DomainException('These tables are already merged.');
                }

                // 1) Move items (same item + same price/discount => add quantity)
                $tgtItems = $tgtOrder->items()->get();
                foreach ($srcOrder->items()->get() as $item) {
                    $match = $tgtItems->first(fn ($t) =>
                        $t->menu_item_id == $item->menu_item_id
                        && (float) $t->price == (float) $item->price
                        && ($t->discount_name ?? null) === ($item->discount_name ?? null)
                        && (float) ($t->discount_value ?? 0) == (float) ($item->discount_value ?? 0)
                        && ($t->discount_value_type ?? null) === ($item->discount_value_type ?? null)
                    );

                    if ($match) {
                        $match->increment('quantity', $item->quantity);
                        $item->delete();
                    } else {
                        $item->update(['order_id' => $tgtOrder->id]);
                    }
                }

                // 2) Recalculate total (same formula as OrderController::store)
                $total = $tgtOrder->items()->get()->sum(fn ($i) => $i->price * $i->quantity);
                $tgtOrder->update(['total' => $total]);

                // 3) Link all tables of both orders to the target order
                $tableIds = DB::table('order_tables')->where('order_id', $srcOrder->id)->pluck('table_id')->all();
                DB::table('order_tables')->where('order_id', $srcOrder->id)->delete();

                $tableIds[] = $source->id;
                $tableIds[] = $target->id;
                $tableIds[] = RestaurantTable::where('name', $tgtOrder->table_name)->value('id');
                $tableIds[] = RestaurantTable::where('name', $srcOrder->table_name)->value('id');

                foreach (array_unique(array_filter($tableIds)) as $tid) {
                    DB::table('order_tables')->insertOrIgnore([
                        'order_id'   => $tgtOrder->id,
                        'table_id'   => $tid,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // 4) Retire the source order (items already moved).
                //    'cancelled' keeps it out of reports/active lists without touching an unknown status enum.
                $srcOrder->update([
                    'status'               => 'cancelled',
                    'total'                => 0,
                    'merged_into_order_id' => $tgtOrder->id,
                ]);

                $this->log('merge', $tgtOrder->id, $source->id, $target->id);

                $names = RestaurantTable::whereIn('id', DB::table('order_tables')
                    ->where('order_id', $tgtOrder->id)->pluck('table_id'))->pluck('name')->all();

                return [
                    'message'   => 'Merged into ' . $tgtOrder->order_ref,
                    'order_id'  => $tgtOrder->id,
                    'order_ref' => $tgtOrder->order_ref,
                    'total'     => (float) $total,
                    'primary_table' => $tgtOrder->table_name,
                    'tables'    => $names,
                ];
            });

            return response()->json($result);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // ── helpers ──────────────────────────────────────────────

    /** Lock both rows in id order so two cashiers cannot collide. */
    private function lockTables(int $a, int $b): array
    {
        $rows = RestaurantTable::whereIn('id', [$a, $b])->orderBy('id')->lockForUpdate()->get()->keyBy('id');
        return [$rows[$a], $rows[$b]];
    }

    /** Active order of a table: by table_name, or through a merge link. */
    private function resolveOrder(RestaurantTable $table): ?Order
    {
        $order = Order::where('table_name', $table->name)
            ->whereNotIn('status', self::CLOSED)
            ->latest('id')->lockForUpdate()->first();

        if ($order) return $order;

        $orderId = DB::table('order_tables as ot')
            ->join('orders as o', 'o.id', '=', 'ot.order_id')
            ->where('ot.table_id', $table->id)
            ->whereNotIn('o.status', self::CLOSED)
            ->orderByDesc('o.id')
            ->value('o.id');

        return $orderId ? Order::lockForUpdate()->find($orderId) : null;
    }

    private function log(string $type, ?int $orderId, int $from, int $to): void
    {
        DB::table('table_transfers')->insert([
            'type'          => $type,
            'order_id'      => $orderId,
            'from_table_id' => $from,
            'to_table_id'   => $to,
            'staff_id'      => Staff::where('user_id', auth()->id())->value('id'),
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);
    }
}