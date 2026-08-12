<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\RolePermission;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $role = Role::firstOrCreate(
            ['name' => 'Administrator'],
            ['description' => 'Full system access']
        );
        $pages = [
            // ── MAIN ──────────────────────────────────────────────────────────────────
            ['dashboard',        'dashboard',              '/',                          true],

            // ── OPERATIONS ────────────────────────────────────────────────────────────
            ['pos',              'orders',                 '/pos',                       false],
            ['menulist',         'menu',                   '/menu',                      false],
            ['menucategories',   'menu-categories',        '/menu/categories',           false],
            ['reserved',         'reserved',               '/reserved',                  false],
            ['discount',         'discount',               '/discount',                  false],
            ['tables',           'tables',                 '/tables',                    false],
            ['vip-card',         'vip-card',               '/vip-card',                  false],

            // ── MANAGE — Inventory ────────────────────────────────────────────────────
            ['inventory',        'inventory',              '/inventory',                 false],
            ['inv_categories',   'inventory-categories',   '/inventory/categories',      false],
            ['supplier',         'supplier',               '/inventory/suppliers',       false],
            ['spoilage',         'spoilage',               '/inventory/spoilage',        false],
            ['stockhistory',     'stock-history',          '/inventory/stock-history',   false],

            // ── MANAGE — Sales ────────────────────────────────────────────────────────
            ['transaction',      'transactions',           '/payments',                  false],
            ['orders',           'orders-history',         '/orders',                    false],

            // ── MANAGE — Records ──────────────────────────────────────────────────────
            ['income',           'income',                 '/records/income',            false],
            ['rcategories',      'finance-categories',     '/records/categories',        false],
            ['expense',          'expense',                '/records/expense',           false],

            // ── ANALYTICS — Reports ───────────────────────────────────────────────────
            ['overview-report',  'overview-report',        '/reports',                   false],
            ['shift-report',     'shift-report',            '/reports/shifts',            false],

            // ── SYSTEM — Settings ─────────────────────────────────────────────────────
            ['general',          'general-settings',       '/settings/general',          false],
            ['staff',            'staff',                  '/settings/staff',            false],
            ['users',            'users',                  '/settings/users',            false],
            ['roles',            'roles',                  '/settings/role',             false],
            ['workshifts',       'workshifts',              '/settings/workshifts',       false],
        ];

        $rows = [];

        foreach ($pages as [$page, $pageKey, $href, $isViewOnly]) {
            $permissions = $isViewOnly ? ['view'] : ['view', 'create', 'edit', 'delete'];

            foreach ($permissions as $perm) {
                $rows[] = [
                    'role_id'    => $role->id,
                    'page'       => $page,
                    'page_key'   => $pageKey,
                    'permission' => $perm,
                    'granted'    => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        RolePermission::where('role_id', $role->id)->delete();
        RolePermission::insert($rows);

        User::updateOrCreate(
            ['email' => 'vinseylaorn@gmail.com'],
            [
                'username' => 'supperadmin',
                'password' => bcrypt('password123'),
                'role_id'  => $role->id,
                'status'   => 'Active',
            ]
        );
    }
}