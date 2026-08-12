<?php

namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StockCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = StockCategory::orderBy('created_at', 'desc')->get();
        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:stock_categories,name',
        ]);

        $category = StockCategory::create([
            'name' => trim($request->name),
        ]);

        return response()->json($category, 201);
    }

    public function show(StockCategory $stockCategory): JsonResponse
    {
        return response()->json($stockCategory);
    }
    public function update(Request $request, StockCategory $stockCategory): JsonResponse
    {
        Log::info('🔧 UPDATE called', [
            'id'   => $stockCategory->id,
            'old'  => $stockCategory->name,
            'new'  => $request->name,
            'db'   => DB::connection()->getDatabaseName(),
        ]);

        $request->validate([
            'name' => 'required|string|max:255|unique:stock_categories,name,' . $stockCategory->id,
        ]);

        $updated = $stockCategory->update([
            'name' => trim($request->name),
        ]);

        Log::info('Eloquent update affected rows (boolean): ' . ($updated ? 'true' : 'false'));

        $affected = DB::table('stock_categories')
            ->where('id', $stockCategory->id)
            ->update([
                'name'       => trim($request->name),
                'updated_at' => now(),
            ]);

        Log::info('Direct DB update affected rows: ' . $affected);

        $fresh = StockCategory::find($stockCategory->id);

        Log::info('✅ Fresh record after update:', ['id' => $fresh->id, 'name' => $fresh->name]);

        return response()->json($fresh);
    }

    public function destroy(StockCategory $stockCategory): JsonResponse
    {
        Log::info('🗑️ DELETE called', [
            'id'   => $stockCategory->id,
            'name' => $stockCategory->name,
            'db'   => DB::connection()->getDatabaseName(),
        ]);

        $deleted = $stockCategory->delete();

        Log::info('Eloquent delete returned: ' . ($deleted ? 'true' : 'false'));

        $stillExists = StockCategory::find($stockCategory->id);
        if ($stillExists) {
            Log::error('❌ Record still exists after delete!', ['id' => $stockCategory->id]);
            return response()->json(['message' => 'Delete failed, record still exists'], 500);
        }

        Log::info('✅ Record successfully deleted');

        return response()->json(['message' => 'Category deleted successfully']);
    }
}