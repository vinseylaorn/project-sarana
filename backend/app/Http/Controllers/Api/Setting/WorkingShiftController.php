<?php

namespace App\Http\Controllers\Api\Setting;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\WorkingShift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkingShiftController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = WorkingShift::with('staff:id,name,position,image');

            if ($request->filled('start_date')) {
                $query->whereDate('date', '>=', $request->start_date);
            }
            if ($request->filled('end_date')) {
                $query->whereDate('date', '<=', $request->end_date);
            }
            if ($request->filled('staff_id')) {
                $query->where('staff_id', $request->staff_id);
            }
            if ($request->filled('shift_status')) {
                $query->where('shift_status', $request->shift_status);
            }

            $shifts = $query->orderByDesc('created_at')->get()->map(fn($s) => $this->format($s));
            return response()->json($shifts);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function show(WorkingShift $workingShift): JsonResponse
    {
        $workingShift->load('staff:id,name,position,image');
        return response()->json($this->format($workingShift));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'staff_id'       => 'required|exists:staff,id',
            'date'           => 'required|date',
            'shift_type'     => 'required|in:Morning,Afternoon,Night,Full Day',
            'start_time'     => 'required|string',
            'end_time'       => 'required|string',
            'status'         => 'required|in:Present,Absent,Late,Leave',
            'overtime_hours' => 'nullable|numeric|min:0',
            'note'           => 'nullable|string|max:500',
        ]);

        try {
            $shift = WorkingShift::create(array_merge($data, [
                'shift_status' => 'Closed',
            ]));
            $shift->load('staff:id,name,position,image');
            return response()->json($this->format($shift), 201);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, WorkingShift $workingShift): JsonResponse
    {
        $data = $request->validate([
            'staff_id'       => 'sometimes|exists:staff,id',
            'date'           => 'sometimes|date',
            'shift_type'     => 'sometimes|in:Morning,Afternoon,Night,Full Day',
            'start_time'     => 'sometimes|string',
            'end_time'       => 'sometimes|string',
            'status'         => 'sometimes|in:Present,Absent,Late,Leave',
            'overtime_hours' => 'nullable|numeric|min:0',
            'note'           => 'nullable|string|max:500',
        ]);

        try {
            $workingShift->update($data);
            $workingShift->load('staff:id,name,position,image');
            return response()->json($this->format($workingShift));
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function closeShift(Request $request, WorkingShift $workingShift): JsonResponse
    {
        $data = $request->validate([
            'close_amount_usd' => 'nullable|numeric|min:0',
            'close_amount_khr' => 'nullable|numeric|min:0',
            'note'             => 'nullable|string|max:500',
        ]);

        try {
            // គណនា orders ពី database ផ្ទាល់ — column: working_shift_id
            $orders = Order::where('working_shift_id', $workingShift->id)
                        ->where('status', 'completed')
                        ->get();

            $totalUsd = (float) $orders->sum('total');
            $totalKhr = (float) ($totalUsd * 4100);

            $workingShift->update([
                'close_amount_usd'  => $data['close_amount_usd'] ?? 0,
                'close_amount_khr'  => $data['close_amount_khr'] ?? 0,
                'close_time'        => now(),
                'shift_status'      => 'Closed',
                'total_orders'      => $orders->count(),
                'total_revenue_usd' => $totalUsd,
                'total_revenue_khr' => $totalKhr,
                'note'              => $data['note'] ?? $workingShift->note,
            ]);

            $workingShift->load('staff:id,name,position,image');
            return response()->json($this->format($workingShift));
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function destroy(WorkingShift $workingShift): JsonResponse
    {
        try {
            $workingShift->delete();
            return response()->json(['message' => 'Shift record deleted']);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function summary(Request $request): JsonResponse
    {
        try {
            $query = WorkingShift::query();
            if ($request->filled('start_date')) $query->whereDate('date', '>=', $request->start_date);
            if ($request->filled('end_date'))   $query->whereDate('date', '<=', $request->end_date);

            $shifts = $query->get();

            return response()->json([
                'total'             => $shifts->count(),
                'open'              => $shifts->where('shift_status', 'Open')->count(),
                'closed'            => $shifts->where('shift_status', 'Closed')->count(),
                'present'           => $shifts->where('status', 'Present')->count(),
                'absent'            => $shifts->where('status', 'Absent')->count(),
                'total_orders'      => $shifts->sum('total_orders'),
                'total_revenue_usd' => (float) $shifts->sum('total_revenue_usd'),
                'total_revenue_khr' => (float) $shifts->sum('total_revenue_khr'),
                'overtime'          => (float) $shifts->sum('overtime_hours'),
            ]);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    private function format(WorkingShift $shift): array
    {
        $staff = $shift->staff;
        return [
            'id'                 => $shift->id,
            'staff_id'           => $shift->staff_id,
            'staff_name'         => $staff?->name,
            'staff_position'     => $staff?->position,
            'staff_image'        => $this->imageUrl($staff?->image),
            'date'               => $shift->date?->format('Y-m-d'),
            'shift_type'         => $shift->shift_type,
            'start_time'         => $shift->start_time,
            'end_time'           => $shift->end_time,
            'status'             => $shift->status,
            'shift_status'       => $shift->shift_status ?? 'Closed',
            'open_time'          => $shift->open_time?->format('d/m/Y H:i A'),
            'open_time_raw'      => $shift->open_time?->toISOString(),
            'open_amount_usd'    => (float) $shift->open_amount_usd,
            'open_amount_khr'    => (float) $shift->open_amount_khr,
            'close_time'         => $shift->close_time?->format('d/m/Y H:i A'),
            'close_time_raw'     => $shift->close_time?->toISOString(),
            'close_amount_usd'   => (float) $shift->close_amount_usd,
            'close_amount_khr'   => (float) $shift->close_amount_khr,
            'total_orders'       => (int) $shift->total_orders,
            'total_revenue_usd'  => (float) $shift->total_revenue_usd,
            'total_revenue_khr'  => (float) $shift->total_revenue_khr,
            'overtime_hours'     => (float) $shift->overtime_hours,
            'note'               => $shift->note,
            'created_at'         => $shift->created_at?->toISOString(),
        ];
    }

    private function imageUrl(?string $path): ?string
    {
        if (!$path) return null;
        if (str_starts_with($path, 'http')) return $path;
        return rtrim(config('app.url'), '/') . '/storage/' . $path;
    }
}