<?php

namespace App\Http\Controllers\Api\Menu;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\MenuRecipe;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MenuItemController extends Controller
{
    public function index(): JsonResponse
    {
        $now = now();

        $productDiscounts = \App\Models\Discount::where('scope', 'product')
            ->where('status', 'active')
            ->where(fn($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', $now))
            ->where(fn($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', $now))
            ->get();

        $categoryDiscounts = \App\Models\Discount::where('scope', 'category')
            ->where('status', 'active')
            ->where(fn($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', $now))
            ->where(fn($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', $now))
            ->get();

        $itemDiscountMap = [];
        foreach ($productDiscounts as $discount) {
            foreach ($discount->target_ids as $itemId) {
                $itemDiscountMap[(int) $itemId] = $discount;
            }
        }

        $items = MenuItem::with(['category', 'recipes.inventory'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) use ($itemDiscountMap, $categoryDiscounts) {
                $formatted = $this->format($item);

                $discount = $itemDiscountMap[(int) $item->id] ?? null;

                if (!$discount) {
                    $discount = $categoryDiscounts->first(function ($d) use ($item) {
                        return in_array((int) $item->category_id, $d->target_ids ?? []);
                    });
                }

                $discountedPrice = null;
                if ($discount) {
                    $discountedPrice = $discount->value_type === 'percentage'
                        ? round($item->price * (1 - $discount->value / 100), 2)
                        : round(max(0, $item->price - $discount->value), 2);
                }

                $formatted['discount'] = $discount ? [
                    'id'         => $discount->id,
                    'name'       => $discount->name,
                    'value'      => $discount->value,
                    'value_type' => $discount->value_type,
                    'scope'      => $discount->scope,
                ] : null;
                $formatted['discounted_price'] = $discountedPrice;

                return $formatted;
            });

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'category_id'           => 'required|exists:menu_categories,id',
            'name'                  => 'required|string|max:255',
            'price'                 => 'required|numeric|min:0',
            'image'                 => 'nullable|string',
            'available'             => 'boolean',
            'recipe'                => 'nullable|array',
            'recipe.*.inventory_id' => 'required|exists:inventories,id',
            'recipe.*.deduct_qty'   => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $item = MenuItem::create([
                'category_id' => $request->category_id,
                'name'        => $request->name,
                'price'       => $request->price,
                'image'       => $this->saveImage($request->image),
                'available'   => $request->boolean('available', true),
            ]);
            $this->syncRecipe($item->id, $request->recipe ?? []);
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }

        return response()->json($this->format($item->load(['category', 'recipes.inventory'])), 201);
    }

    public function show(MenuItem $menuItem): JsonResponse
    {
        return response()->json($this->format($menuItem->load(['category', 'recipes.inventory'])));
    }

    public function update(Request $request, MenuItem $menuItem): JsonResponse
    {
        $request->validate([
            'category_id'           => 'sometimes|exists:menu_categories,id',
            'name'                  => 'sometimes|string|max:255',
            'price'                 => 'sometimes|numeric|min:0',
            'image'                 => 'nullable|string',
            'available'             => 'boolean',
            'recipe'                => 'nullable|array',
            'recipe.*.inventory_id' => 'required_with:recipe|exists:inventories,id',
            'recipe.*.deduct_qty'   => 'required_with:recipe|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $data = $request->only(['category_id', 'name', 'price', 'available']);

            if ($request->has('image')) {
                $data['image'] = $this->saveImage($request->image, $menuItem->image);
            }

            $menuItem->update($data);

            if ($request->has('recipe')) {
                $this->syncRecipe($menuItem->id, $request->recipe ?? []);
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }

        return response()->json($this->format($menuItem->load(['category', 'recipes.inventory'])));
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        if ($menuItem->image && !str_starts_with($menuItem->image, 'http')) {
            Storage::disk('public')->delete($menuItem->image);
        }
        $menuItem->delete();
        return response()->json(['message' => 'Deleted']);
    }

    private function saveImage(?string $base64, ?string $oldPath = null): ?string
    {
        if (empty($base64)) return $oldPath;
        if (!str_starts_with($base64, 'data:')) return $base64;

        try {
            if ($oldPath && !str_starts_with($oldPath, 'http') && !str_starts_with($oldPath, 'data:')) {
                Storage::disk('public')->delete($oldPath);
            }

            [$meta, $data] = explode(',', $base64, 2);
            preg_match('/image\/(\w+)/', $meta, $matches);
            $ext      = ($matches[1] ?? 'jpg') === 'jpeg' ? 'jpg' : ($matches[1] ?? 'jpg');
            $filename = 'menu/' . uniqid('item_', true) . '.' . $ext;

            Storage::disk('public')->put($filename, base64_decode($data));
            return $filename;
        } catch (\Throwable $e) {
            return $oldPath;
        }
    }

    private function imageUrl(?string $path): ?string
    {
        if (!$path) return null;
        if (str_starts_with($path, 'http') || str_starts_with($path, 'data:')) return $path;
        return rtrim(config('app.url'), '/') . '/storage/' . $path;
    }

    private function syncRecipe(int $menuItemId, array $recipe): void
    {
        MenuRecipe::where('menu_item_id', $menuItemId)->delete();
        foreach ($recipe as $r) {
            MenuRecipe::create([
                'menu_item_id' => $menuItemId,
                'inventory_id' => $r['inventory_id'],
                'deduct_qty'   => $r['deduct_qty'],
            ]);
        }
    }

    private function format(MenuItem $item): array
    {
        return [
            'id'          => $item->id,
            'category_id' => $item->category_id,
            'category'    => $item->category?->name,
            'name'        => $item->name,
            'price'       => $item->price,
            'image'       => $this->imageUrl($item->image),
            'available'   => $item->available,
            'recipe'      => $item->recipes->map(fn($r) => [
                'inventory_id'   => $r->inventory_id,
                'inventory_name' => $r->inventory?->name,
                'unit'           => $r->inventory?->unit,
                'deduct_qty'     => $r->deduct_qty,
            ]),
        ];
    }
}