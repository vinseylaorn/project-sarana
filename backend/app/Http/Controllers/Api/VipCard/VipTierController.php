<?php

namespace App\Http\Controllers\Api\VipCard;

use App\Http\Controllers\Controller;
use App\Models\VipTier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VipTierController extends Controller
{
    public function index(): JsonResponse
    {
        $tiers = VipTier::where('is_active', true)
            ->orderBy('min_visits')
            ->get()
            ->map(fn($t) => $t->toFrontend());

        return response()->json(['data' => $tiers]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:60',
            'nameKh'       => 'required|string|max:60',
            'discount'     => 'required|integer|min:1|max:50',
            'minVisits'    => 'sometimes|integer|min:0',
            'maxVisits'    => 'nullable|integer|min:1',
            'monthlyLimit' => 'sometimes|integer|min:0|max:99',
            'color'        => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'bgFrom'       => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'bgTo'         => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'accentColor'  => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'icon'         => ['required', Rule::in(['star', 'gem', 'crown'])],
        ]);

        $tier = VipTier::create([
            'name'          => $data['name'],
            'name_kh'       => $data['nameKh'],
            'discount'      => $data['discount'],
            'min_visits'    => $data['minVisits']    ?? 0,
            'max_visits'    => $data['maxVisits']    ?? null,
            'upgrade_at'    => $data['maxVisits']    ?? null,
            'monthly_limit' => $data['monthlyLimit'] ?? 0,
            'color'         => $data['color'],
            'bg_from'       => $data['bgFrom'],
            'bg_to'         => $data['bgTo'],
            'accent_color'  => $data['accentColor'],
            'icon'          => $data['icon'],
        ]);

        return response()->json(['data' => $tier->toFrontend()], 201);
    }

    public function update(Request $request, VipTier $tier): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'sometimes|string|max:60',
            'nameKh'       => 'sometimes|string|max:60',
            'discount'     => 'sometimes|integer|min:1|max:50',
            'minVisits'    => 'sometimes|integer|min:0',
            'maxVisits'    => 'nullable|integer|min:1',
            'monthlyLimit' => 'sometimes|integer|min:0|max:99',
            'color'        => ['sometimes', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'bgFrom'       => ['sometimes', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'bgTo'         => ['sometimes', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'accentColor'  => ['sometimes', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'icon'         => ['sometimes', Rule::in(['star', 'gem', 'crown'])],
        ]);

        $newMaxVisits = array_key_exists('maxVisits', $data) ? $data['maxVisits'] : $tier->max_visits;

        $tier->update([
            'name'          => $data['name']         ?? $tier->name,
            'name_kh'       => $data['nameKh']       ?? $tier->name_kh,
            'discount'      => $data['discount']     ?? $tier->discount,
            'min_visits'    => $data['minVisits']    ?? $tier->min_visits,
            'max_visits'    => $newMaxVisits,         
            'upgrade_at'    => $newMaxVisits,      
            'monthly_limit' => $data['monthlyLimit'] ?? $tier->monthly_limit,
            'color'         => $data['color']        ?? $tier->color,
            'bg_from'       => $data['bgFrom']       ?? $tier->bg_from,
            'bg_to'         => $data['bgTo']         ?? $tier->bg_to,
            'accent_color'  => $data['accentColor']  ?? $tier->accent_color,
            'icon'          => $data['icon']         ?? $tier->icon,
        ]);

        return response()->json(['data' => $tier->fresh()->toFrontend()]);
    }

    public function destroy(VipTier $tier): JsonResponse
    {
        if ($tier->cards()->exists()) {
            $tier->update(['is_active' => false]);
            return response()->json(['message' => 'Tier disabled (has linked cards)']);
        }

        $tier->delete();
        return response()->json(['message' => 'Tier deleted']);
    }

    public function bulkSave(Request $request): JsonResponse
    {
        $request->validate([
            'tiers'                => 'required|array|min:1',
            'tiers.*.id'           => 'nullable|integer',
            'tiers.*.name'         => 'required|string|max:60',
            'tiers.*.nameKh'       => 'required|string|max:60',
            'tiers.*.discount'     => 'required|integer|min:1|max:50',
            'tiers.*.minVisits'    => 'sometimes|integer|min:0',
            'tiers.*.maxVisits'    => 'nullable|integer|min:1',
            'tiers.*.monthlyLimit' => 'sometimes|integer|min:0|max:99',
            'tiers.*.color'        => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'tiers.*.bgFrom'       => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'tiers.*.bgTo'         => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'tiers.*.accentColor'  => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'tiers.*.icon'         => ['required', Rule::in(['star', 'gem', 'crown'])],
        ]);

        $incomingIds = collect($request->tiers)
            ->pluck('id')
            ->filter()
            ->values();

        VipTier::whereNotIn('id', $incomingIds)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        $saved = [];
        foreach ($request->tiers as $t) {
            $maxVisits = $t['maxVisits'] ?? null; 

            $payload = [
                'name'          => $t['name'],
                'name_kh'       => $t['nameKh'],
                'discount'      => $t['discount'],
                'min_visits'    => $t['minVisits']    ?? 0,
                'max_visits'    => $maxVisits,         
                'upgrade_at'    => $maxVisits,         
                'monthly_limit' => $t['monthlyLimit'] ?? 0,
                'color'         => $t['color'],
                'bg_from'       => $t['bgFrom'],
                'bg_to'         => $t['bgTo'],
                'accent_color'  => $t['accentColor'],
                'icon'          => $t['icon'],
                'is_active'     => true,
            ];

            $tier = isset($t['id']) && $t['id']
                ? VipTier::find($t['id'])
                : null;

            if ($tier) {
                $tier->update($payload);
            } else {
                $tier = VipTier::create($payload);
            }

            $saved[] = $tier->fresh()->toFrontend();
        }

        return response()->json(['data' => $saved]);
    }
}