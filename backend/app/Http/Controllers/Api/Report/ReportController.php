<?php

namespace App\Http\Controllers\Api\Report;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(private ReportService $reportService) {}

    public function dashboard(Request $request): JsonResponse
    {
        $data = $this->reportService->dashboard(
            $request->query('start_date'),
            $request->query('end_date'),
        );

        return response()->json($data);
    }

    public function export(Request $request): JsonResponse
    {
        $data = $this->reportService->exportOrders(
            $request->query('start_date'),
            $request->query('end_date'),
        );

        return response()->json($data);
    }

    public function shifts(Request $request): JsonResponse
    {
        $data = $this->reportService->shifts(
            $request->query('start_date'),
            $request->query('end_date'),
        );

        return response()->json($data);
    }

    public function inventory(Request $request): JsonResponse
    {
        $data = $this->reportService->inventoryReport(
            $request->query('start_date'),
            $request->query('end_date'),
        );

        return response()->json($data);
    }
}