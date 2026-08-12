<?php

namespace App\Http\Controllers\Api\POS;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Income;
use App\Models\Staff;
use App\Models\WorkingShift;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    private function formatOrder(Order $order): array
    {
        if (! $order->relationLoaded('items'))        $order->load('items');
        if (! $order->relationLoaded('workingShift')) $order->load('workingShift');

        return [
            'id'               => $order->id,
            'order_ref'        => $order->order_ref,
            'table_name'       => $order->table_name,
            'order_type'       => $order->order_type,
            'total'            => (float) $order->total,
            'status'           => $order->status,
            'payment_method'   => $order->payment_method,
            'discount_amount'     => (float) ($order->discount_amount     ?? 0),
            'tax_amount'          => (float) ($order->tax_amount           ?? 0),
            'vip_discount_amount' => (float) ($order->vip_discount_amount  ?? 0),
            'created_at'       => $order->created_at,
            'staff_id'         => $order->staff_id,
            'working_shift_id' => $order->working_shift_id,

            'workingShift' => $order->workingShift ? [
                'id'             => $order->workingShift->id,
                'staff_name'     => $order->workingShift->staff_name,
                'staff_position' => $order->workingShift->staff_position,
                'staff_image'    => $order->workingShift->staff_image,
                'shift_type'     => $order->workingShift->shift_type,
                'start_time'     => $order->workingShift->start_time,
                'end_time'       => $order->workingShift->end_time,
            ] : null,

            'items' => $order->items->map(fn($i) => [
                'id'             => $i->id,
                'menu_item_id'   => $i->menu_item_id,
                'name'           => $i->name,
                'price'          => (float) $i->price,
                'original_price' => $i->original_price ? (float) $i->original_price : null,
                'quantity'       => (int) $i->quantity,
                'discount'       => $i->discount_name ? [
                    'name'       => $i->discount_name,
                    'value'      => (float) $i->discount_value,
                    'value_type' => $i->discount_value_type,
                ] : null,
            ])->toArray(),
        ];
    }

    public function index(): JsonResponse
    {
        $orders = Order::with(['items', 'workingShift'])
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($o) => $this->formatOrder($o));

        return response()->json($orders);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'table_name'                    => 'nullable|string',
            'order_type'                    => 'nullable|string',
            'items'                         => 'required|array|min:1',
            'items.*.menu_item_id'          => 'required|exists:menu_items,id',
            'items.*.name'                  => 'required|string',
            'items.*.price'                 => 'required|numeric|min:0',
            'items.*.original_price'        => 'nullable|numeric|min:0',
            'items.*.quantity'              => 'required|integer|min:1',
            'items.*.discount_name'         => 'nullable|string',
            'items.*.discount_value'        => 'nullable|numeric|min:0',
            'items.*.discount_value_type'   => 'nullable|in:percentage,flat',
            'staff_id'                      => 'nullable|exists:staff,id',
        ]);

        DB::beginTransaction();
        try {
            $total = collect($request->items)
                ->sum(fn($i) => $i['price'] * $i['quantity']);

            $staffId = $request->staff_id;
            if (!$staffId) {
                $staffId = Staff::where('user_id', auth()->id())
                    ->where('status', 'Active')
                    ->value('id');
            }

            $shiftId = null;
            if ($staffId) {
                $shiftId = WorkingShift::where('staff_id', $staffId)
                    ->where('shift_status', 'Open')
                    ->whereDate('date', today())
                    ->value('id');
            }

            $order = Order::create([
                'order_ref'        => 'TEMP',
                'table_name'       => $request->table_name,
                'order_type'       => $request->order_type ?? 'dine_in',
                'total'            => $total,
                'status'           => 'confirmed',
                'staff_id'         => $staffId,
                'working_shift_id' => $shiftId,
                'payment_method'   => null,
            ]);

            // ✅ ប្រើ id ពិតប្រាកដ — 100% unique, មិន race condition
            $order->update([
                'order_ref' => 'ORD-' . str_pad($order->id, 6, '0', STR_PAD_LEFT),
            ]);

            foreach ($request->items as $item) {
                $order->items()->create([
                    'menu_item_id'        => $item['menu_item_id'],
                    'name'                => $item['name'],
                    'price'               => $item['price'],
                    'original_price'      => $item['original_price'] ?? null,
                    'quantity'            => $item['quantity'],
                    'discount_name'       => $item['discount_name'] ?? null,
                    'discount_value'      => $item['discount_value'] ?? null,
                    'discount_value_type' => $item['discount_value_type'] ?? null,
                ]);
            }

            app(StockService::class)->deductByOrder($order->id, $request->items);
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }

        return response()->json($this->formatOrder($order->fresh()), 201);
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json($this->formatOrder($order));
    }

    public function updateItems(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'items'                         => 'required|array|min:1',
            'items.*.menu_item_id'          => 'required|integer',
            'items.*.name'                  => 'required|string',
            'items.*.price'                 => 'required|numeric',
            'items.*.original_price'        => 'nullable|numeric|min:0',
            'items.*.quantity'              => 'required|integer|min:1',
            'items.*.discount_name'         => 'nullable|string',
            'items.*.discount_value'        => 'nullable|numeric|min:0',
            'items.*.discount_value_type'   => 'nullable|in:percentage,flat',
        ]);

        DB::beginTransaction();
        try {
            $total = collect($request->items)
                ->sum(fn($i) => $i['price'] * $i['quantity']);

            $order->items()->delete();

            foreach ($request->items as $item) {
                $order->items()->create([
                    'menu_item_id'        => $item['menu_item_id'],
                    'name'                => $item['name'],
                    'price'               => $item['price'],
                    'original_price'      => $item['original_price'] ?? null,
                    'quantity'            => $item['quantity'],
                    'discount_name'       => $item['discount_name'] ?? null,
                    'discount_value'      => $item['discount_value'] ?? null,
                    'discount_value_type' => $item['discount_value_type'] ?? null,
                ]);
            }

            $order->update(['total' => $total]);

            if ($order->income) {
                $order->income->update(['amount' => $total]);
            }

            DB::commit();
            return response()->json($this->formatOrder($order->fresh()));
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function complete(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'payment_method' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    $allowed = ['cash', 'card', 'mobile', 'khqr', 'aba', 'wing', 'online'];
                    $parts   = explode('+', strtolower($value));
                    foreach ($parts as $part) {
                        if (! in_array(trim($part), $allowed)) {
                            $fail("Payment method '{$part}' is not valid.");
                        }
                    }
                },
            ],
            'vip_card_id'         => 'nullable|integer|exists:vip_cards,id',
            'discount_amount'     => 'nullable|numeric|min:0',
            'tax_amount'          => 'nullable|numeric|min:0',
            'vip_discount_amount' => 'nullable|numeric|min:0',
            'final_total'         => 'nullable|numeric|min:0',
        ]);

        if ($order->status === 'completed') {
            return response()->json([
                'order'   => $this->formatOrder($order),
                'message' => 'Already completed',
            ]);
        }

        DB::beginTransaction();
        try {
            $finalTotal = $request->final_total ?? $order->total;

            $order->update([
                'payment_method'      => $request->payment_method,
                'status'              => 'completed',
                'discount_amount'     => $request->discount_amount     ?? 0,
                'tax_amount'          => $request->tax_amount           ?? 0,
                'vip_discount_amount' => $request->vip_discount_amount  ?? 0,
                'total'               => $finalTotal,
            ]);

            if ($request->vip_card_id) {
                $vipCard = \App\Models\VipCard::find($request->vip_card_id);
                if ($vipCard && $vipCard->is_active && ! $vipCard->isExpired()) {
                    $vipCard->increment('total_visits');
                    $vipCard->increment('used_this_month');
                }
            }

            $staffId = $order->staff_id;
            if (!$staffId) {
                $staffId = Staff::where('user_id', auth()->id())
                    ->where('status', 'Active')
                    ->value('id');
            }

            if ($staffId) {
                $activeShift = WorkingShift::where('staff_id', $staffId)
                    ->where('shift_status', 'Open')
                    ->whereDate('date', today())
                    ->latest()
                    ->first();

                if ($activeShift) {
                    $order->update([
                        'staff_id'         => $staffId,
                        'working_shift_id' => $activeShift->id,
                    ]);
                    $activeShift->increment('total_orders', 1);
                    $activeShift->increment('total_revenue_usd', $finalTotal);
                    $activeShift->increment('total_revenue_khr', round($finalTotal * 4100));
                }
            }

            $income = Income::create([
                'income_ref'        => Income::generateReference(),
                'title'             => "Order From" . ($order->table_name ?? $order->order_type),
                'amount'            => $finalTotal,
                'date'              => now()->format('Y-m-d'),
                'category'          => 'Sales',
                'is_auto_generated' => true,
                'order_id'          => $order->id,
                'payment_method'    => $request->payment_method,
                'description'       => "Income from order {$order->order_ref}",
            ]);

            DB::commit();

            return response()->json([
                'order'  => $this->formatOrder($order->fresh()),
                'income' => [
                    'id'              => $income->income_ref,
                    'title'           => $income->title,
                    'amount'          => (float) $income->amount,
                    'date'            => $income->date->format('Y-m-d'),
                    'category'        => $income->category,
                    'isAutoGenerated' => true,
                    'payment_method'  => $income->payment_method,
                ],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}