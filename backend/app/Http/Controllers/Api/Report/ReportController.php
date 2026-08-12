<?php

namespace App\Http\Controllers\Api\Report;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\ReportService;

class ReportController extends Controller
{
    public function dashboard(Request $request, ReportService $service)
{
    $validated = $request->validate([
        'start_date' => ['nullable', 'date_format:Y-m-d'],
        'end_date'   => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
    ]);

    \Log::info('Dashboard params', [
        'start_date' => $validated['start_date'] ?? null,
        'end_date'   => $validated['end_date']   ?? null,
    ]);

    $data = $service->dashboard(
        $validated['start_date'] ?? null,
        $validated['end_date']   ?? null,
    );

    return response()->json($data);
}

    public function export(Request $request, ReportService $service)
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date'   => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ]);

        $data = $service->exportOrders(
            $validated['start_date'] ?? null,
            $validated['end_date']   ?? null,
        );

        return response()->json($data);
    }
}