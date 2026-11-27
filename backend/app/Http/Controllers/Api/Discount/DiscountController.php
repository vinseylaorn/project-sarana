<?php

namespace App\Http\Controllers\Api\Discount;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class DiscountController extends Controller
{
    private const TZ = 'Asia/Phnom_Penh';

    public function index(): JsonResponse
    {
        $discounts = Discount::orderBy('created_at', 'desc')
            ->get()
            ->map(fn($d) => $this->format($d));

        return response()->json($discounts);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'             => 'required|string|max:255',
            'scope'            => 'required|in:category,product',
            'value_type'       => 'required|in:percentage,amount',
            'value'            => 'required|numeric|min:0',
            'target_ids'       => 'required|array|min:1',
            'target_ids.*'     => 'required|integer|min:1',
            'start_date'       => 'nullable|date',
            'end_date'         => 'nullable|date|after_or_equal:start_date',
            'status'           => 'in:active,inactive,scheduled',
            'min_order_amount' => 'nullable|numeric|min:0',
            'description'      => 'nullable|string|max:500',
        ]);

        if ($request->value_type === 'percentage' && $request->value > 100) {
            return response()->json(['message' => 'Percentage cannot exceed 100%'], 422);
        }

        $discount = Discount::create([
            'name'             => trim($request->name),
            'scope'            => $request->scope,
            'value_type'       => $request->value_type,
            'value'            => $request->value,
            'target_ids'       => $request->target_ids,
            'start_date'       => $this->parseStart($request->start_date),
            'end_date'         => $this->parseEnd($request->end_date),
            'status'           => $request->input('status', 'active'),
            'min_order_amount' => $request->min_order_amount,
            'description'      => $request->description,
        ]);

        return response()->json($this->format($discount), 201);
    }

    public function show(Discount $discount): JsonResponse
    {
        return response()->json($this->format($discount));
    }

    public function update(Request $request, Discount $discount): JsonResponse
    {
        $request->validate([
            'name'             => 'sometimes|string|max:255',
            'scope'            => 'sometimes|in:category,product',
            'value_type'       => 'sometimes|in:percentage,amount',
            'value'            => 'sometimes|numeric|min:0',
            'target_ids'       => 'sometimes|array|min:1',
            'target_ids.*'     => 'required_with:target_ids|integer|min:1',
            'start_date'       => 'nullable|date',
            'end_date'         => 'nullable|date',
            'status'           => 'sometimes|in:active,inactive,scheduled,expired',
            'min_order_amount' => 'nullable|numeric|min:0',
            'description'      => 'nullable|string|max:500',
        ]);

        if ($request->has('value') && $request->has('value_type')) {
            if ($request->value_type === 'percentage' && $request->value > 100) {
                return response()->json(['message' => 'Percentage cannot exceed 100%'], 422);
            }
        }

        $updateData = $request->only([
            'name', 'scope', 'value_type', 'value',
            'target_ids', 'status', 'min_order_amount', 'description',
        ]);

        if ($request->has('start_date')) {
            $updateData['start_date'] = $this->parseStart($request->start_date);
        }

        if ($request->has('end_date')) {
            $updateData['end_date'] = $this->parseEnd($request->end_date);
        }
        $effectiveStart = $request->has('start_date') ? $updateData['start_date'] : $discount->start_date;
        $effectiveEnd   = $request->has('end_date')   ? $updateData['end_date']   : $discount->end_date;

        if ($effectiveStart && $effectiveEnd && $effectiveEnd->lt($effectiveStart)) {
            return response()->json([
                'message' => 'End date/time must be after start date/time',
            ], 422);
        }

        $discount->update($updateData);

        $fresh = $discount->fresh();

        if ($fresh->end_date && $fresh->end_date->isPast()) {
            $fresh->update(['status' => 'expired']);
        }

        return response()->json($this->format($fresh->fresh()));
    }

    public function destroy(Discount $discount): JsonResponse
    {
        $discount->delete();
        return response()->json(['message' => 'Deleted']);
    }

    private function parseStart(?string $value): ?Carbon
    {
        if (!$value) return null;

        $c = Carbon::parse($value, self::TZ);

        if (strlen($value) <= 10) {
            $c->startOfDay();
        }

        return $c->timezone(self::TZ);
    }

    private function parseEnd(?string $value): ?Carbon
    {
        if (!$value) return null;

        $c = Carbon::parse($value, self::TZ);

        if (strlen($value) <= 10) {
            $c->endOfDay();
        }

        return $c->timezone(self::TZ);
    }

    private function format(Discount $d): array
    {
        return [
            'id'               => $d->id,
            'name'             => $d->name,
            'scope'            => $d->scope,
            'value_type'       => $d->value_type,
            'value'            => $d->value,
            'target_ids'       => $d->target_ids ?? [],
            'start_date'       => $d->start_date?->toIso8601String(),
            'end_date'         => $d->end_date?->toIso8601String(),
            'status'           => $d->status,
            'min_order_amount' => $d->min_order_amount,
            'description'      => $d->description,
            'created_at'       => $d->created_at?->toDateTimeString(),
            'updated_at'       => $d->updated_at?->toDateTimeString(),
        ];
    }
}