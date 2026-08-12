<?php

namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SupplierController extends Controller
{
    public function index(): JsonResponse
{
    $suppliers = Supplier::with('category')->orderBy('created_at', 'desc')->get();
    return response()->json($suppliers);
}

public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'name'         => 'required|string|max:255',
        'contact_name' => 'nullable|string|max:255',
        'phone'        => 'required|string|max:20',
        'email'        => 'nullable|email|max:255',
        'address'      => 'nullable|string',
        'category_id'  => 'required|exists:stock_categories,id',
        'status'       => 'required|in:Active,Inactive',
        'note'         => 'nullable|string',
    ]);

    $supplier = Supplier::create($validated);
    $supplier->load('category');
    return response()->json($supplier, 201);
}

public function show(Supplier $supplier): JsonResponse
{
    return response()->json($supplier->load('category'));
}

public function update(Request $request, Supplier $supplier): JsonResponse
{
    $validated = $request->validate([
        'name'         => 'sometimes|string|max:255',
        'contact_name' => 'nullable|string|max:255',
        'phone'        => 'sometimes|string|max:20',
        'email'        => 'nullable|email|max:255',
        'address'      => 'nullable|string',
        'category_id'  => 'sometimes|exists:stock_categories,id',
        'status'       => 'sometimes|in:Active,Inactive',
        'note'         => 'nullable|string',
    ]);

    $supplier->update($validated);
    $supplier->load('category');
    return response()->json($supplier);
}

    public function destroy(Supplier $supplier): JsonResponse
    {
        $supplier->delete();

        return response()->json(['message' => 'Supplier deleted successfully']);
    }
}