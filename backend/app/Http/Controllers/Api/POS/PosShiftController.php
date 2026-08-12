<?php

namespace App\Http\Controllers\Api\POS;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Staff;
use App\Models\WorkingShift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PosShiftController extends Controller
{

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
            'open_amount_khr'   => $data['open_amount_khr'] ?? round($data['open_amount_usd'] * 4100),
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

        $orders      = Order::where('working_shift_id', $shift->id)
                           ->where('status', 'completed')
                           ->get();
        $totalOrders = $orders->count();
        $totalRevUsd = (float) $orders->sum('total');
        $totalRevKhr = (float) ($totalRevUsd * 4100);

        $shift->update([
            'end_time'          => $now->format('H:i'),
            'shift_status'      => 'Closed',
            'close_time'        => $now,
            'close_amount_usd'  => $data['close_amount_usd'],
            'close_amount_khr'  => $data['close_amount_khr'] ?? round($data['close_amount_usd'] * 4100),
            'total_orders'      => $totalOrders,
            'total_revenue_usd' => $totalRevUsd,
            'total_revenue_khr' => $totalRevKhr,
            'overtime_hours'    => $overtime,
            'note'              => $data['note'] ?? null,
        ]);

        $shift->load('staff:id,name,position,image');

        return response()->json($this->formatShift($shift->fresh()));
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
            'Full Day'  => '23:59',
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