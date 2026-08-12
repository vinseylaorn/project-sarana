<?php

namespace App\Http\Controllers\Api\VipCard;

use App\Http\Controllers\Controller;
use App\Models\VipCard;
use App\Models\VipTier;
use App\Models\VipUpgradeLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VipCardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = VipCard::with('tier');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('note', 'like', "%{$search}%");
            });
        }

        if ($tierId = $request->query('tier_id')) {
            $query->where('tier_id', $tierId);
        }

        $sortKey = $request->query('sort', 'id');
        $sortDir = $request->query('direction', 'asc');
        $allowed = ['code', 'total_visits', 'used_this_month', 'expires_at', 'issued_at'];
        if (in_array($sortKey, $allowed)) {
            $query->orderBy($sortKey, $sortDir === 'desc' ? 'desc' : 'asc');
        } else {
            $query->orderByDesc('id');
        }

        $perPage = (int) $request->query('per_page', 12);
        $cards   = $query->paginate($perPage);

        return response()->json([
            'data' => $cards->map(fn($c) => $c->toFrontend()),
            'meta' => [
                'total'        => $cards->total(),
                'per_page'     => $cards->perPage(),
                'current_page' => $cards->currentPage(),
                'last_page'    => $cards->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tierId'       => 'required|integer|exists:vip_tiers,id',
            'expiresAt'    => 'nullable|date_format:Y-m-d|after:today',
            'monthlyLimit' => 'sometimes|integer|min:0|max:99',
            'note'         => 'nullable|string|max:255',
        ]);

        $tier = VipTier::findOrFail($data['tierId']);

        $card = DB::transaction(function () use ($data, $tier) {
            return VipCard::create([
                'code'          => VipCard::generateCode(),
                'tier_id'       => $tier->id,
                'monthly_limit' => $data['monthlyLimit'] ?? $tier->monthly_limit,
                'expires_at'    => $data['expiresAt']    ?? null,
                'issued_at'     => now()->toDateString(),
                'note'          => $data['note']         ?? '',
                'is_active'     => true,
            ]);
        });

        return response()->json(['data' => $card->toFrontend()], 201);
    }

    public function stats(): JsonResponse
    {
        $all     = VipCard::all();
        $total   = $all->count();
        $active  = $all->filter(fn($c) => $c->is_active && !$c->isExpired())->count();
        $expired = $all->filter(fn($c) => $c->isExpired())->count();
        $paused  = $all->filter(fn($c) => !$c->is_active)->count();

        return response()->json([
            'data' => compact('total', 'active', 'expired', 'paused'),
        ]);
    }

    public function lookup(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $card = VipCard::with('tier')
            ->where('code', strtoupper(trim($request->code)))
            ->first();

        if (!$card) {
            return response()->json(['message' => 'Card not found'], 404);
        }

        $expired = $card->isExpired();

        return response()->json([
            'data' => [
                'card'     => $card->toFrontend(),
                'tier'     => $card->tier->toFrontend(),
                'isActive' => (bool) $card->is_active,
                'expired'  => $expired,
            ],
        ]);
    }

    public function show(VipCard $vipCard): JsonResponse
    {
        $vipCard->load('tier');
        return response()->json(['data' => $vipCard->toFrontend()]);
    }

    public function toggle(VipCard $vipCard): JsonResponse
    {
        $vipCard->update(['is_active' => !$vipCard->is_active]);
        return response()->json(['data' => $vipCard->fresh()->toFrontend()]);
    }

    public function extend(Request $request, VipCard $vipCard): JsonResponse
    {
        $data = $request->validate([
            'expiresAt'    => 'nullable|date_format:Y-m-d',
            'monthlyLimit' => 'required|integer|min:0|max:99',
        ]);

        $vipCard->update([
            'expires_at'    => $data['expiresAt'] ?? null,
            'monthly_limit' => $data['monthlyLimit'],
            'is_active'     => true,
        ]);

        return response()->json(['data' => $vipCard->fresh()->toFrontend()]);
    }

    public function upgrade(Request $request, VipCard $vipCard): JsonResponse
{
    $data = $request->validate([
        'toTierId' => 'required|integer|exists:vip_tiers,id',
    ]);

    $fromTier = $vipCard->tier;
    $toTier   = VipTier::findOrFail($data['toTierId']);

    if ($fromTier->id === $toTier->id) {
        return response()->json(['message' => 'Card is already on this tier'], 422);
    }

    if ($fromTier->max_visits !== null && $vipCard->total_visits < $fromTier->max_visits) {
        return response()->json([
            'message' => "Card needs {$fromTier->max_visits} visits to upgrade (current: {$vipCard->total_visits})"
        ], 422);
    }

    $newCard = DB::transaction(function () use ($vipCard, $fromTier, $toTier) {
        $vipCard->update(['is_active' => false]);

        $newCard = VipCard::create([
            'code'          => VipCard::generateCode(),
            'tier_id'       => $toTier->id,
            'monthly_limit' => $toTier->monthly_limit,
            'expires_at'    => $vipCard->expires_at, 
            'issued_at'     => now()->toDateString(),
            'note'          => $vipCard->note,
            'is_active'     => true,
            'total_visits'  => 0,
        ]);

        VipUpgradeLog::create([
            'card_id'                 => $newCard->id,
            'card_code'               => $newCard->code,
            'from_tier_id'            => $fromTier->id,
            'from_tier_name'          => $fromTier->name,
            'to_tier_id'              => $toTier->id,
            'to_tier_name'            => $toTier->name,
            'total_visits_at_upgrade' => $vipCard->total_visits,
            'upgraded_at'             => now(),
            'old_card_code'           => $vipCard->code, 
        ]);

        return $newCard;
    });

    return response()->json([
        'data' => [
            'newCard'  => $newCard->load('tier')->toFrontend(),
            'oldCard'  => $vipCard->fresh()->toFrontend(),
        ]
    ], 201);
}

    // ─── DELETE /api/vip/cards/{id} ─────────────────────────────
    public function destroy(VipCard $vipCard): JsonResponse
    {
        $vipCard->delete();
        return response()->json(['message' => 'Card deleted']);
    }
}