<?php
namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\FinanceCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FinanceCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = FinanceCategory::query();
        if ($request->type && $request->type !== 'all')
            $query->where('type', $request->type);
        if ($request->search)
            $query->where('name', 'like', '%'.$request->search.'%');

        return response()->json(
            $query->orderByDesc('created_at')->get()->map(fn($c) => $this->format($c))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:income,expense',
        ]);

        $cat = FinanceCategory::create([
            'name' => $request->name,
            'type' => $request->type,
        ]);

        return response()->json($this->format($cat), 201);
    }

    public function update(Request $request, FinanceCategory $financeCategory): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:income,expense',
        ]);

        $financeCategory->update([
            'name' => $request->name,
            'type' => $request->type,
        ]);

        return response()->json($this->format($financeCategory));
    }

    public function destroy(FinanceCategory $financeCategory): JsonResponse
    {
        
        \App\Models\Expense::where('category', $financeCategory->name)->delete();
        \App\Models\Income::where('category',  $financeCategory->name)->delete();

        $financeCategory->delete();

        return response()->json(['message' => 'Deleted']);
    }

    private function format(FinanceCategory $c): array
    {
        return [
            'id'         => $c->id,
            'name'       => $c->name,
            'type'       => $c->type,
            'date'       => $c->created_at?->format('Y-m-d'),
            'created_at' => $c->created_at,
            'updated_at' => $c->updated_at,
        ];
    }
}