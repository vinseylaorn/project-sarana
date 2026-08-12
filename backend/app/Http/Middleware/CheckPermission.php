<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    private array $pageAliases = [
        'finance'    => [
            'finance', 'income', 'expense',
            'finance-categories', 'transactions',
        ],
        'inventory'  => [
            'inventory', 'inventory-categories',
            'supplier', 'spoilage', 'stock-history',
        ],
        'settings'   => [
            'settings', 'general-settings',
        ],
        'orders'     => [
            'orders', 'orders-history', 'shift-report',
        ],
        'reports'    => [
            'reports', 'shift-report',
        ],
        'workshifts' => [
            'workshifts', 'working-shifts', 'shift-report',
        ],
        'menu'       => [
            'menu', 'menu-categories',
        ],
        'reserved'   => [
            'reserved', 'reservations',
        ],
        'tables'     => [
            'tables',
        ],
        'discount'   => [
            'discount', 'discounts',
        ],
        'vip-card'   => [
            'vip-card',
        ],
        'staff'      => [
            'staff',
        ],
        'users'      => [
            'users',
        ],
        'roles'      => [
            'roles',
        ],
        'dashboard'  => [
            'dashboard',
        ],
    ];

    public function handle(
        Request $request,
        Closure $next,
        string  $page,
        string  $permission = 'view'
    ): Response {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (strtolower($user->role?->name ?? '') === 'administrator') {
            return $next($request);
        }

        if (!$user->role) {
            return response()->json([
                'message'    => 'Forbidden. No role assigned.',
                'page'       => $page,
                'permission' => $permission,
            ], 403);
        }

        $pagesToCheck = $this->pageAliases[$page] ?? [$page];

        $granted = \App\Models\RolePermission::where('role_id', $user->role->id)
            ->whereIn('page', $pagesToCheck)
            ->where('permission', $permission)
            ->where('granted', true)
            ->exists();

        if (!$granted) {
            return response()->json([
                'message'    => 'Forbidden. You do not have permission.',
                'page'       => $page,
                'permission' => $permission,
                'checked'    => $pagesToCheck,
            ], 403);
        }

        return $next($request);
    }
}