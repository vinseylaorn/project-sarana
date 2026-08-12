<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\Income;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class IncomeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Income::with('order')
                ->orderBy('date', 'desc')
                ->orderBy('created_at', 'desc');

            if ($request->start_date) {
                $query->whereDate('date', '>=', $request->start_date);
            }
            if ($request->end_date) {
                $query->whereDate('date', '<=', $request->end_date);
            }
            if ($request->category && $request->category !== 'all') {
                $query->where('category', $request->category);
            }
            if ($request->search) {
                $query->where(function ($q) use ($request) {
                    $q->where('title', 'like', "%{$request->search}%")
                      ->orWhere('income_ref', 'like', "%{$request->search}%")
                      ->orWhere('description', 'like', "%{$request->search}%");
                });
            }

            $perPage = $request->per_page ?? 20;
            $incomes = $query->paginate($perPage);

            $formattedData = $incomes->getCollection()->map(
                fn($income) => $this->formatIncome($income)
            );

            $summaryQuery = Income::query();
            if ($request->start_date) {
                $summaryQuery->whereDate('date', '>=', $request->start_date);
            }
            if ($request->end_date) {
                $summaryQuery->whereDate('date', '<=', $request->end_date);
            }
            if ($request->category && $request->category !== 'all') {
                $summaryQuery->where('category', $request->category);
            }
            if ($request->search) {
                $summaryQuery->where(function ($q) use ($request) {
                    $q->where('title', 'like', "%{$request->search}%")
                      ->orWhere('income_ref', 'like', "%{$request->search}%")
                      ->orWhere('description', 'like', "%{$request->search}%");
                });
            }

            $summary = [
                'total'         => (float) (clone $summaryQuery)->sum('amount'),
                'order_income'  => (float) (clone $summaryQuery)->where('is_auto_generated', true)->sum('amount'),
                'manual_income' => (float) (clone $summaryQuery)->where('is_auto_generated', false)->sum('amount'),
            ];

            return response()->json([
                'data' => [
                    'data'         => $formattedData,
                    'total'        => $incomes->total(),
                    'current_page' => $incomes->currentPage(),
                    'last_page'    => $incomes->lastPage(),
                    'per_page'     => $incomes->perPage(),
                ],
                'summary' => $summary,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ], 500);
        }
    }

    public function show(string $incomeRef): JsonResponse
    {
        try {
            $income = Income::where('income_ref', $incomeRef)->with('order')->firstOrFail();
            return response()->json($this->formatIncome($income));
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function storeManual(Request $request): JsonResponse
    {
        $request->validate([
            'title'          => 'required|string|max:255',
            'amount'         => 'required|numeric|min:0.01',
            'date'           => 'nullable|date',
            'category'       => 'nullable|string|max:100',
            'payment_method' => 'nullable|string|in:cash,card,mobile',
            'description'    => 'nullable|string|max:500',
        ]);

        try {
            $income = Income::create([
                'income_ref'        => Income::generateReference(),
                'title'             => $request->title,
                'amount'            => $request->amount,
                'date'              => $request->date ?? now('Asia/Phnom_Penh')->format('Y-m-d'),
                'category'          => $request->category ?? 'Other',
                'is_auto_generated' => false,
                'payment_method'    => $request->payment_method,
                'description'       => $request->description,
            ]);
            return response()->json($this->formatIncome($income), 201);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, string $incomeRef): JsonResponse
    {
        try {
            $income = Income::where('income_ref', $incomeRef)->firstOrFail();

            if ($income->is_auto_generated) {
                return response()->json(['message' => 'Cannot update auto-generated income'], 403);
            }

            $request->validate([
                'title'          => 'sometimes|string|max:255',
                'amount'         => 'sometimes|numeric|min:0.01',
                'date'           => 'sometimes|date',
                'category'       => 'sometimes|string|max:100',
                'payment_method' => 'sometimes|string|in:cash,card,mobile',
                'description'    => 'nullable|string|max:500',
            ]);

            $income->update(
                $request->only(['title', 'amount', 'date', 'category', 'payment_method', 'description'])
            );

            return response()->json($this->formatIncome($income->fresh()));
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $incomeRef): JsonResponse
    {
        try {
            $income = Income::where('income_ref', $incomeRef)->firstOrFail();

            if ($income->is_auto_generated) {
                return response()->json(['message' => 'Cannot delete auto-generated income'], 403);
            }

            $income->delete();
            return response()->json(['message' => 'Income deleted successfully']);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function summary(Request $request): JsonResponse
    {
        try {
            $query = Income::query();
            if ($request->start_date) {
                $query->whereDate('date', '>=', $request->start_date);
            }
            if ($request->end_date) {
                $query->whereDate('date', '<=', $request->end_date);
            }

            $incomes = $query->get();

            return response()->json([
                'period' => [
                    'start_date' => $request->start_date ?? null,
                    'end_date'   => $request->end_date   ?? null,
                ],
                'total'         => (float) $incomes->sum('amount'),
                'order_income'  => (float) $incomes->where('is_auto_generated', true)->sum('amount'),
                'manual_income' => (float) $incomes->where('is_auto_generated', false)->sum('amount'),
                'by_payment_method' => [
                    'cash'   => (float) $incomes->where('payment_method', 'cash')->sum('amount'),
                    'card'   => (float) $incomes->where('payment_method', 'card')->sum('amount'),
                    'mobile' => (float) $incomes->where('payment_method', 'mobile')->sum('amount'),
                ],
                'by_category' => $incomes->where('is_auto_generated', false)
                    ->groupBy('category')
                    ->map(fn($g) => ['total' => (float) $g->sum('amount'), 'count' => $g->count()]),
            ]);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    private function formatIncome(Income $income): array
    {
        return [
            'id'              => $income->income_ref,
            'title'           => $income->title,
            'amount'          => (float) $income->amount,
            'date'            => $income->date->format('Y-m-d'),
            'category'        => $income->category ?? 'Other',
            'isAutoGenerated' => (bool) $income->is_auto_generated,
            'payment_method'  => $income->payment_method ?? '',
            'description'     => $income->description ?? '',
            'order'           => $income->relationLoaded('order') && $income->order ? [
                'id'         => $income->order->id,
                'order_ref'  => $income->order->order_ref,
                'table_name' => $income->order->table_name,
                'total'      => $income->order->total,
            ] : null,
        ];
    }
}