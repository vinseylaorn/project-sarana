<?php

namespace App\Http\Controllers\Api\Setting;

use App\Http\Controllers\Controller;
use App\Services\NbcRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class NbcRateController extends Controller
{
    /**
     * GET /api/system-settings/nbc-rate[?refresh=1]
     * Response: { success: true, data: { rate, date, stale } }
     */
    public function show(Request $request, NbcRateService $nbc): JsonResponse
    {
        try {
            $data = $nbc->get($request->boolean('refresh'));

            return response()->json([
                'success' => true,
                'data'    => $data,
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Unable to fetch the NBC exchange rate.',
            ], 502);
        }
    }
}