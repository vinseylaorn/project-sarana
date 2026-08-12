<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Expense::query();

            if ($request->search)
                $query->where('title', 'like', '%' . $request->search . '%');
            if ($request->category && $request->category !== 'all')
                $query->where('category', $request->category);
            if ($request->start_date)
                $query->where('date', '>=', $request->start_date);
            if ($request->end_date)
                $query->where('date', '<=', $request->end_date);

            $expenses = $query->orderByDesc('date')->orderByDesc('created_at')->get()
                ->map(fn($e) => $this->format($e));

            return response()->json($expenses);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'    => 'required|string|max:200',
            'amount'   => 'required|numeric|min:0',
            'category' => 'nullable|string|max:100',
            'date'     => 'nullable|date',
            'is_auto'  => 'nullable|boolean',
        ]);

        try {
            $expense = Expense::create([
                'title'    => $data['title'],
                'amount'   => $data['amount'],
                'category' => $data['category'] ?? null,
                'date'     => $data['date'] ?? now()->format('Y-m-d'),
                'is_auto'  => $data['is_auto'] ?? false,
            ]);

            return response()->json($this->format($expense), 201);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $data = $request->validate([
            'title'    => 'sometimes|string|max:200',
            'amount'   => 'sometimes|numeric|min:0',
            'category' => 'nullable|string|max:100',
            'date'     => 'nullable|date',
        ]);

        try {
            $expense->update($data);
            return response()->json($this->format($expense));
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Expense $expense): JsonResponse
    {
        try {
            if ($expense->is_auto) {
                return response()->json(['message' => 'Cannot delete auto-generated expense.'], 403);
            }
            $expense->delete();
            return response()->json(['message' => 'Deleted']);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    private function format(Expense $e): array
    {
        return [
            'id'         => $e->id,
            'title'      => $e->title,
            'amount'     => (string) $e->amount,
            'category'   => $e->category,
            'date'       => $e->date?->format('Y-m-d'),
            'is_auto'    => $e->is_auto,
            'isAuto'     => $e->is_auto,
            'created_at' => $e->created_at?->toISOString(),
        ];
    }
}