<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\WorkingShift;

class PosAuthenticate
{
    public function handle(Request $request, Closure $next)
    {
        $shiftId = $request->cookie('pos_token');

        if (!$shiftId) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $shift = WorkingShift::where('id', $shiftId)
            ->where('shift_status', 'Open')
            ->first();

        if (!$shift) {
            return response()->json(['message' => 'POS session expired.'], 401);
        }

        $request->attributes->set('pos_shift', $shift);

        return $next($request);
    }
}