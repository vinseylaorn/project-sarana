<?php

namespace App\Http\Middleware;

use App\Models\RolePermission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Routes:
 *   ->middleware('permission:income')        // auto: GET=view, POST=create, PUT/PATCH=edit, DELETE=delete
 *   ->middleware('permission:expense')
 *   ->middleware('permission:reports,view')  // បង្ខំ permission ជាក់លាក់
 */
class CheckPermission
{
    private const ADMIN_ROLES = ['administrator', 'admin'];

    /**
     * page ក្នុង route => key ទាំងឡាយក្នុង DB ដែលទទួលយក
     * income/expense ទទួលយកទាំង key ផ្ទាល់ និង "finance" (បើ nav ប្រើ key មួយណាក៏បាន)
     */
    private array $pageAliases = [
        'finance'    => ['finance', 'income', 'expense', 'finance-categories', 'transactions'],
        'income'     => ['income', 'finance'],
        'expense'    => ['expense', 'finance'],
        'finance-categories' => ['finance-categories', 'finance'],
        'transactions'       => ['transactions', 'finance'],
        'inventory'  => ['inventory', 'inventory-categories', 'supplier', 'spoilage', 'stock-history'],
        'settings'   => ['settings', 'general-settings'],
        'orders'     => ['orders', 'orders-history'],
        'reports'    => ['reports', 'shift-report'],
        'workshifts' => ['workshifts', 'working-shifts'],
        'menu'       => ['menu', 'menu-categories'],
        'reserved'   => ['reserved', 'reservations'],
        'tables'     => ['tables'],
        'discount'   => ['discount', 'discounts'],
        'vip-card'   => ['vip-card'],
        'staff'      => ['staff'],
        'users'      => ['users'],
        'roles'      => ['roles'],
        'dashboard'  => ['dashboard'],
    ];

    public function handle(
        Request $request,
        Closure $next,
        string $page,
        string $permission = 'auto'
    ): Response {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (in_array(strtolower($user->role?->name ?? ''), self::ADMIN_ROLES, true)) {
            return $next($request);
        }

        if (!$user->role) {
            return response()->json([
                'message'    => 'Forbidden. No role assigned.',
                'page'       => $page,
                'permission' => $permission,
            ], 403);
        }

        $permission   = $this->resolvePermission($request, $permission);
        $pagesToCheck = $this->pageAliases[$page] ?? [$page];

        $granted = RolePermission::where('role_id', $user->role->id)
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

    private function resolvePermission(Request $request, string $permission): string
    {
        if ($permission !== 'auto') {
            return $permission;
        }

        return match (strtoupper($request->method())) {
            'POST'         => 'create',
            'PUT', 'PATCH' => 'edit',
            'DELETE'       => 'delete',
            default        => 'view',
        };
    }
}