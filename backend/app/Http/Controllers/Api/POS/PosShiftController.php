<?php

namespace App\Http\Controllers\Api\POS;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Staff;
use App\Models\WorkingShift;
use App\Services\ExchangeRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Throwable;

class PosShiftController extends Controller
{
    /** Resolved once per request. */
    private ?array $fxCache = null;

    public function __construct(private ExchangeRateService $rates) {}

    /** Exchange-rate info following System Settings. Never throws. */
    private function fx(): array
    {
        if ($this->fxCache !== null) {
            return $this->fxCache;
        }

        try {
            $fx = $this->rates->current();
            if (empty($fx['rate']) || (float) $fx['rate'] <= 0) {
                throw new \RuntimeException('Invalid rate returned');
            }
            return $this->fxCache = $fx;
        } catch (Throwable $e) {
            Log::error('POS exchange rate failed, using fallback: ' . $e->getMessage());

            return $this->fxCache = [
                'rate'   => ExchangeRateService::DEFAULT_RATE,
                'mode'   => 'manual',
                'source' => 'fallback',
                'date'   => null,
                'stale'  => true,
            ];
        }
    }

    /** 1 USD = ? KHR */
    private function exchangeRate(): float
    {
        return (float) $this->fx()['rate'];
    }

    /**
     * GET /api/pos/exchange-rate  (pos.auth)
     * Rate for the Checkout dialog (USD -> KHR), following System Settings.
     */
    public function currentRate(): JsonResponse
    {
        $fx = $this->fx();

        return response()->json([
            'rate'  => (float) $fx['rate'],
            'mode'  => $fx['mode'],
            'date'  => $fx['date'] ?? null,
            'stale' => (bool) ($fx['stale'] ?? false),
        ]);
    }

    /**
     * PUT /api/pos/orders/{order}/payment-split  (pos.auth)
     * Saves how much of a completed order was CASH (kept in the drawer, change
     * already deducted) and how much was card/QR, so Close Shift can count the
     * cash part of split payments ("cash+card") correctly.
     */
    public function savePaymentSplit(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate([
            'cash_amount'     => 'required|numeric|min:0',
            'non_cash_amount' => 'required|numeric|min:0',
        ]);

        if ($order->status !== 'completed') {
            return response()->json(['message' => 'Order is not completed yet.'], 409);
        }

        // Query update on purpose: works even if the columns are not in Order::$fillable.
        Order::whereKey($order->id)->update([
            'cash_amount'     => round((float) $data['cash_amount'], 2),
            'non_cash_amount' => round((float) $data['non_cash_amount'], 2),
        ]);

        return response()->json([
            'success'         => true,
            'cash_amount'     => round((float) $data['cash_amount'], 2),
            'non_cash_amount' => round((float) $data['non_cash_amount'], 2),
        ]);
    }

    public function staffList(): JsonResponse
    {
        $staff = Staff::where('status', 'Active')
            ->where('can_use_pos', true)
            ->orderBy('name')
            ->get()
            ->map(fn ($s) => [
                'id'            => $s->id,
                'name'          => $s->name,
                'position'      => $s->position,
                'image'         => $this->imageUrl($s->image),
                'has_pin'       => ! empty($s->pin_code),
                'open_shift_id' => WorkingShift::where('staff_id', $s->id)
                    ->where('shift_status', 'Open')
                    ->whereDate('date', today())
                    ->value('id'),
            ]);

        return response()->json($staff);
    }

    public function verifyPin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'staff_id' => 'required|exists:staff,id',
            'pin_code' => 'required|string|size:6',
        ]);

        $staff = Staff::find($data['staff_id']);

        if (empty($staff->pin_code) || $staff->pin_code !== $data['pin_code']) {
            return response()->json(['message' => 'Incorrect PIN. Please try again.'], 422);
        }

        $openShift = WorkingShift::where('staff_id', $staff->id)
            ->where('shift_status', 'Open')
            ->whereDate('date', today())
            ->first();

        return response()->json([
            'staff' => [
                'id'       => $staff->id,
                'name'     => $staff->name,
                'position' => $staff->position,
                'image'    => $this->imageUrl($staff->image),
            ],
            'open_shift' => $openShift
                ? $this->formatShift($openShift->load('staff'))
                : null,
        ]);
    }

    public function openShift(Request $request): JsonResponse
    {
        $data = $request->validate([
            'staff_id'        => 'required|exists:staff,id',
            'open_amount_usd' => 'required|numeric|min:0',
            'open_amount_khr' => 'nullable|numeric|min:0',
            'shift_type'      => 'nullable|in:Morning,Afternoon,Night,Full Day',
        ]);

        $existing = WorkingShift::where('staff_id', $data['staff_id'])
            ->where('shift_status', 'Open')
            ->whereDate('date', today())
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Staff already has an open shift today.',
                'shift'   => $this->formatShift($existing->load('staff')),
            ], 409);
        }

        $now       = now();
        $shiftType = $data['shift_type'] ?? $this->guessShiftType($now->hour);

        $shift = WorkingShift::create([
            'staff_id'          => $data['staff_id'],
            'date'              => $now->format('Y-m-d'),
            'shift_type'        => $shiftType,
            'start_time'        => $now->format('H:i'),
            'end_time'          => $this->guessEndTime($shiftType),
            'status'            => 'Present',
            'shift_status'      => 'Open',
            'open_time'         => $now,
            'open_amount_usd'   => $data['open_amount_usd'],
            'open_amount_khr'   => $data['open_amount_khr'] ?? round($data['open_amount_usd'] * $this->exchangeRate()),
            'close_time'        => null,
            'close_amount_usd'  => 0,
            'close_amount_khr'  => 0,
            'total_orders'      => 0,
            'total_revenue_usd' => 0,
            'total_revenue_khr' => 0,
            'overtime_hours'    => 0,
        ]);

        $shift->load('staff:id,name,position,image');

        return response()->json($this->formatShift($shift), 201);
    }

    /** Preview expected cash BEFORE closing (polled by the Close Shift dialog). */
    public function closeShiftPreview(WorkingShift $shift): JsonResponse
    {
        return response()->json($this->calculateCashBreakdown($shift));
    }

    public function closeShift(Request $request, WorkingShift $shift): JsonResponse
    {
        if ($shift->shift_status === 'Closed') {
            return response()->json(['message' => 'This shift is already closed.'], 409);
        }

        $data = $request->validate([
            'close_amount_usd' => 'required|numeric|min:0',
            'close_amount_khr' => 'nullable|numeric|min:0',
            'note'             => 'nullable|string|max:500',
        ]);

        $now      = now();
        $openTime = $shift->open_time ?? $shift->created_at;
        $hours    = $openTime->diffInMinutes($now) / 60;
        $overtime = max(0, round($hours - 8, 1));

        $breakdown = $this->calculateCashBreakdown($shift);
        $rate      = $this->exchangeRate();

        $closeUsd = (float) $data['close_amount_usd'];
        $closeKhr = (float) ($data['close_amount_khr'] ?? 0);

        // Actual cash counted as one USD-equivalent total.
        $actualTotalUsd = round($closeUsd + ($closeKhr / $rate), 2);

        // Negative = money missing, positive = extra money in the drawer.
        $differenceUsd = round($actualTotalUsd - $breakdown['expected_cash_usd'], 2);

        $shift->update([
            'end_time'            => $now->format('H:i'),
            'shift_status'        => 'Closed',
            'close_time'          => $now,
            'close_amount_usd'    => $closeUsd,
            'close_amount_khr'    => $closeKhr,
            'total_orders'        => $breakdown['total_orders'],
            'total_revenue_usd'   => $breakdown['total_revenue_usd'],
            'total_revenue_khr'   => $breakdown['total_revenue_khr'],
            'overtime_hours'      => $overtime,
            'expected_cash_usd'   => $breakdown['expected_cash_usd'],
            'cash_difference_usd' => $differenceUsd,
            'note'                => $data['note'] ?? null,
        ]);

        $shift->load('staff:id,name,position,image');

        return response()->json(array_merge(
            $this->formatShift($shift->fresh()),
            [
                'expected_cash_usd'          => $breakdown['expected_cash_usd'],
                'actual_cash_usd_equivalent' => $actualTotalUsd,
                'cash_sales_usd'             => $breakdown['cash_sales_usd'],
                'non_cash_sales_usd'         => $breakdown['non_cash_sales_usd'],
                'split_payment_count'        => $breakdown['split_payment_count'],
                'cash_difference_usd'        => $differenceUsd,
                'exchange_rate'              => $rate,
                'exchange_rate_mode'         => $this->fx()['mode'],
            ]
        ));
    }

    /**
     * Expected drawer cash (one USD-equivalent number):
     *   opening USD + (opening KHR / rate) + CASH actually received on sales.
     *
     * Cash per order comes from orders.cash_amount (saved at checkout, so the
     * cash part of a split payment such as "cash+card" is counted too).
     * Older orders without cash_amount fall back to payment_method:
     *   "cash"        -> whole total is cash
     *   card / qr     -> whole total is non-cash
     *   "cash+card"   -> cannot be separated -> flagged in split_payment_count
     */
    private function calculateCashBreakdown(WorkingShift $shift): array
    {
        $orders = Order::where('working_shift_id', $shift->id)
            ->where('status', 'completed')
            ->get();

        $hasCols = Schema::hasColumn('orders', 'cash_amount');

        $cashSalesUsd    = 0.0;
        $nonCashSalesUsd = 0.0;
        $unresolved      = 0;

        foreach ($orders as $o) {
            $total = (float) $o->total;

            if ($hasCols && $o->cash_amount !== null) {
                $cashSalesUsd    += (float) $o->cash_amount;
                $nonCashSalesUsd += (float) ($o->non_cash_amount ?? 0);
                continue;
            }

            // Legacy orders (no cash_amount saved)
            $method = strtolower(trim((string) ($o->payment_method ?? '')));
            $parts  = array_filter(array_map('trim', explode('+', $method)));

            if ($method === 'cash') {
                $cashSalesUsd += $total;
            } elseif (count($parts) > 1 && in_array('cash', $parts, true)) {
                $unresolved++;               // mixed cash + non-cash, unknown split
            } elseif ($method !== '') {
                $nonCashSalesUsd += $total;  // card / qr / card+qr
            }
        }

        $totalRevUsd = (float) $orders->sum('total');

        $fx      = $this->fx();
        $rate    = (float) $fx['rate'];
        $openUsd = (float) $shift->open_amount_usd;
        $openKhr = (float) $shift->open_amount_khr;

        $expectedCashUsd = $openUsd + ($openKhr / $rate) + $cashSalesUsd;

        return [
            'total_orders'        => $orders->count(),
            'total_revenue_usd'   => $totalRevUsd,
            'total_revenue_khr'   => $totalRevUsd * $rate,
            'cash_sales_usd'      => round($cashSalesUsd, 2),
            'non_cash_sales_usd'  => round($nonCashSalesUsd, 2),
            'split_payment_count' => $unresolved,
            'open_amount_usd'     => $openUsd,
            'open_amount_khr'     => $openKhr,
            'expected_cash_usd'   => round($expectedCashUsd, 2),
            'exchange_rate'       => $rate,
            'exchange_rate_mode'  => $fx['mode'],
        ];
    }

    private function guessShiftType(int $hour): string
    {
        return match (true) {
            $hour >= 6  && $hour < 14 => 'Morning',
            $hour >= 14 && $hour < 22 => 'Afternoon',
            default                   => 'Night',
        };
    }

    private function guessEndTime(string $shiftType): string
    {
        return match ($shiftType) {
            'Morning'   => '14:00',
            'Afternoon' => '22:00',
            'Night'     => '06:00',
            default     => '23:59',
        };
    }

    private function formatShift(WorkingShift $shift): array
    {
        return [
            'id'                => $shift->id,
            'staff_id'          => $shift->staff_id,
            'staff_name'        => $shift->staff?->name,
            'staff_position'    => $shift->staff?->position,
            'staff_image'       => $this->imageUrl($shift->staff?->image),
            'date'              => $shift->date?->format('Y-m-d'),
            'shift_type'        => $shift->shift_type,
            'shift_status'      => $shift->shift_status,
            'start_time'        => $shift->start_time,
            'end_time'          => $shift->end_time,
            'status'            => $shift->status,
            'open_time'         => $shift->open_time?->format('d/m/Y H:i A'),
            'open_amount_usd'   => (float) $shift->open_amount_usd,
            'open_amount_khr'   => (float) $shift->open_amount_khr,
            'close_time'        => $shift->close_time?->format('d/m/Y H:i A'),
            'close_amount_usd'  => (float) $shift->close_amount_usd,
            'close_amount_khr'  => (float) $shift->close_amount_khr,
            'total_orders'      => (int)   $shift->total_orders,
            'total_revenue_usd' => (float) $shift->total_revenue_usd,
            'total_revenue_khr' => (float) $shift->total_revenue_khr,
            'overtime_hours'    => (float) $shift->overtime_hours,
            'note'              => $shift->note,
        ];
    }

    private function imageUrl(?string $path): ?string
    {
        if (! $path) return null;
        if (str_starts_with($path, 'http')) return $path;
        return rtrim(config('app.url'), '/') . '/storage/' . $path;
    }
}