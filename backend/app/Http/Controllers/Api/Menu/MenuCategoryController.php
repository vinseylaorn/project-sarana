<?php
namespace App\Http\Controllers\Api\Menu;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use App\Models\MenuCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MenuCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $now = now()->toDateString();
        $discounts = Discount::where('scope', 'category')
            ->where('status', 'active')
            ->where(fn($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', $now))
            ->where(fn($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', $now))
            ->get();

        $categories = MenuCategory::orderBy('name')->get()
            ->map(function ($cat) use ($discounts) {
                $catDiscounts = $discounts
                    ->filter(fn($d) => in_array($cat->id, $d->target_ids ?? []))
                    ->map(fn($d) => [
                        'id'         => $d->id,
                        'name'       => $d->name,
                        'value_type' => $d->value_type,
                        'value'      => $d->value,
                    ])
                    ->values();

                return [
                    'id'         => $cat->id,
                    'name'       => $cat->name,
                    'discounts'  => $catDiscounts,
                    'created_at' => $cat->created_at?->toDateTimeString(),
                    'updated_at' => $cat->updated_at?->toDateTimeString(), // ✅ បន្ថែម
                ];
            });

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:menu_categories,name'
        ]);

        $cat = MenuCategory::create(['name' => trim($request->name)]);

        return response()->json($this->format($cat), 201);
    }

    public function show(MenuCategory $menuCategory): JsonResponse
    {
        return response()->json($this->format($menuCategory));
    }

    public function update(Request $request, MenuCategory $menuCategory): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:menu_categories,name,' . $menuCategory->id
        ]);

        $menuCategory->update(['name' => trim($request->name)]);

        return response()->json($this->format($menuCategory->fresh()));
    }

    public function destroy(MenuCategory $menuCategory): JsonResponse
    {
        $menuCategory->delete();
        return response()->json(['message' => 'Deleted']);
    }

    private function format(MenuCategory $cat): array
    {
        $now = now()->toDateString();
        $discounts = Discount::where('scope', 'category')
            ->where('status', 'active')
            ->where(fn($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', $now))
            ->where(fn($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', $now))
            ->get()
            ->filter(fn($d) => in_array($cat->id, $d->target_ids ?? []))
            ->map(fn($d) => [
                'id'         => $d->id,
                'name'       => $d->name,
                'value_type' => $d->value_type,
                'value'      => $d->value,
            ])
            ->values();

        return [
            'id'         => $cat->id,
            'name'       => $cat->name,
            'discounts'  => $discounts,
            'created_at' => $cat->created_at?->toDateTimeString(),
            'updated_at' => $cat->updated_at?->toDateTimeString(),
        ];
    }
}