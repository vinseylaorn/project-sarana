<?php

namespace App\Http\Controllers\Api\VipCard;

use App\Http\Controllers\Controller;
use App\Models\VipUpgradeLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VipUpgradeLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = VipUpgradeLog::query();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('card_code', 'like', "%{$search}%")
                  ->orWhere('from_tier_name', 'like', "%{$search}%")
                  ->orWhere('to_tier_name', 'like', "%{$search}%");
            });
        }

        if ($from = $request->query('date_from')) {
            $query->whereDate('upgraded_at', '>=', $from);
        }
        if ($to = $request->query('date_to')) {
            $query->whereDate('upgraded_at', '<=', $to);
        }

        $logs = $query->orderByDesc('upgraded_at')->get();

        return response()->json([
            'data'  => $logs->map(fn($l) => $l->toFrontend()),
            'total' => $logs->count(),
        ]);
    }
}