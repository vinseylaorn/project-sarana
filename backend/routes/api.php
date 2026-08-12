<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\POS\OrderController;
use App\Http\Controllers\Api\POS\PosShiftController;
use App\Http\Controllers\Api\Menu\MenuCategoryController;
use App\Http\Controllers\Api\Menu\MenuItemController;
use App\Http\Controllers\Api\Table\RestaurantTableController;
use App\Http\Controllers\Api\Reservation\ReservationController;
use App\Http\Controllers\Api\Discount\DiscountController;
use App\Http\Controllers\Api\VipCard\VipTierController;
use App\Http\Controllers\Api\VipCard\VipCardController;
use App\Http\Controllers\Api\VipCard\VipUpgradeLogController;
use App\Http\Controllers\Api\Inventory\InventoryController;
use App\Http\Controllers\Api\Inventory\StockCategoryController;
use App\Http\Controllers\Api\Inventory\SpoilageController;
use App\Http\Controllers\Api\Inventory\SupplierController;
use App\Http\Controllers\Api\Inventory\StockHistoryController;
use App\Http\Controllers\Api\Finance\FinanceCategoryController;
use App\Http\Controllers\Api\Finance\ExpenseController;
use App\Http\Controllers\Api\Finance\IncomeController;
use App\Http\Controllers\Api\Report\ReportController;
use App\Http\Controllers\Api\Setting\RoleController;
use App\Http\Controllers\Api\Setting\UserController;
use App\Http\Controllers\Api\Setting\StaffController;
use App\Http\Controllers\Api\Setting\SystemsettingController;
use App\Http\Controllers\Api\Setting\PrinterController;
use App\Http\Controllers\Api\Setting\WorkingShiftController;
use Illuminate\Support\Facades\Route;

// ── Public Routes ─────────────────────────────────────────────────
Route::post('/login',                    [AuthController::class, 'login']);
Route::post('/forgot-password/send-otp', [AuthController::class, 'sendOtp']);
Route::post('/forgot-password/verify',   [AuthController::class, 'verifyOtp']);
Route::post('/forgot-password/reset',    [AuthController::class, 'resetPassword']);

// ── POS Public — no token needed ──────────────────────────────────
Route::get ('/pos/staff-list', [PosShiftController::class, 'staffList']);
Route::post('/pos/verify-pin', [PosShiftController::class, 'verifyPin']);
Route::post('/pos/open-shift', [PosShiftController::class, 'openShift']);

// ── POS Protected — pos_token cookie ─────────────────────────────
Route::prefix('pos')->middleware('pos.auth')->group(function () {
    Route::get ('/tables',                                  [RestaurantTableController::class, 'index']);
    Route::put ('/tables/{table}/status',                   [RestaurantTableController::class, 'updateStatus']);
    Route::get ('/menu-items',                              [MenuItemController::class,        'index']);
    Route::get ('/menu-categories',                         [MenuCategoryController::class,    'index']);
    Route::get ('/discounts',                               [DiscountController::class,        'index']);
    Route::get ('/reservations',                            [ReservationController::class,     'index']);
    Route::post('/reservations',                            [ReservationController::class,     'store']);
    Route::post('/reservations/{reservation}/table-status', [ReservationController::class,     'updateTableStatus']);
    Route::post('/orders',                                  [OrderController::class,           'store']);
    Route::put ('/orders/{order}/items',                    [OrderController::class,           'updateItems']);
    Route::put ('/orders/{order}/complete',                 [OrderController::class,           'complete']);
    Route::post('/stock-history',                           [StockHistoryController::class,    'store']);
    Route::post('/close-shift/{shift}',                     [PosShiftController::class,        'closeShift']);
    Route::get ('/vip/cards/lookup',                        [VipCardController::class,         'lookup']);
});

// ── Protected Routes (auth:sanctum) ───────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // ── Dashboard ─────────────────────────────────────────────────
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('permission:dashboard,view');

    // ── Auth ──────────────────────────────────────────────────────
    Route::post('/logout',               [AuthController::class, 'logout']);
    Route::get ('/me',                   [UserController::class, 'me']);
    Route::put ('/auth/change-password', [AuthController::class, 'changePassword']);

    // ── Roles ─────────────────────────────────────────────────────
    Route::get   ('/roles',              [RoleController::class, 'index'])  ->middleware('permission:roles,view');
    Route::post  ('/roles',              [RoleController::class, 'store'])  ->middleware('permission:roles,create');
    Route::get   ('/roles/{role}',       [RoleController::class, 'show'])   ->middleware('permission:roles,view');
    Route::put   ('/roles/{role}',       [RoleController::class, 'update']) ->middleware('permission:roles,edit');
    Route::delete('/roles/{role}',       [RoleController::class, 'destroy'])->middleware('permission:roles,delete');
    Route::get   ('/roles/{role}/users', [RoleController::class, 'users'])  ->middleware('permission:roles,view');

    // ── Users ─────────────────────────────────────────────────────
    Route::get   ('/users',                    [UserController::class, 'index'])     ->middleware('permission:users,view');
    Route::post  ('/users',                    [UserController::class, 'store'])     ->middleware('permission:users,create');
    Route::get   ('/users/{user}',             [UserController::class, 'show'])      ->middleware('permission:users,view');
    Route::put   ('/users/{user}',             [UserController::class, 'update'])    ->middleware('permission:users,edit');
    Route::delete('/users/{user}',             [UserController::class, 'destroy'])   ->middleware('permission:users,delete');
    Route::put   ('/users/{user}/assign-role', [UserController::class, 'assignRole'])->middleware('permission:users,edit');

    // ── Staff ─────────────────────────────────────────────────────
    Route::get   ('/staff',         [StaffController::class, 'index'])  ->middleware('permission:staff,view');
    Route::post  ('/staff',         [StaffController::class, 'store'])  ->middleware('permission:staff,create');
    Route::get   ('/staff/{staff}', [StaffController::class, 'show'])   ->middleware('permission:staff,view');
    Route::put   ('/staff/{staff}', [StaffController::class, 'update']) ->middleware('permission:staff,edit');
    Route::delete('/staff/{staff}', [StaffController::class, 'destroy'])->middleware('permission:staff,delete');

    // ── Inventory: Stock Categories ───────────────────────────────
    Route::get   ('/stock-categories',                 [StockCategoryController::class, 'index'])  ->middleware('permission:inventory,view');
    Route::post  ('/stock-categories',                 [StockCategoryController::class, 'store'])  ->middleware('permission:inventory,create');
    Route::get   ('/stock-categories/{stockCategory}', [StockCategoryController::class, 'show'])   ->middleware('permission:inventory,view');
    Route::put   ('/stock-categories/{stockCategory}', [StockCategoryController::class, 'update']) ->middleware('permission:inventory,edit');
    Route::delete('/stock-categories/{stockCategory}', [StockCategoryController::class, 'destroy'])->middleware('permission:inventory,delete');

    // ── Inventory: Stock ──────────────────────────────────────────
    Route::get   ('/inventories',             [InventoryController::class, 'index'])  ->middleware('permission:inventory,view');
    Route::post  ('/inventories',             [InventoryController::class, 'store'])  ->middleware('permission:inventory,create');
    Route::get   ('/inventories/{inventory}', [InventoryController::class, 'show'])   ->middleware('permission:inventory,view');
    Route::put   ('/inventories/{inventory}', [InventoryController::class, 'update']) ->middleware('permission:inventory,edit');
    Route::delete('/inventories/{inventory}', [InventoryController::class, 'destroy'])->middleware('permission:inventory,delete');

    // ── Inventory: Stock History ──────────────────────────────────
    Route::get ('/stock-history', [StockHistoryController::class, 'index'])->middleware('permission:inventory,view');
    Route::post('/stock-history', [StockHistoryController::class, 'store'])->middleware('permission:inventory,create');

    // ── Inventory: Spoilage ───────────────────────────────────────
    Route::get   ('/spoilages',            [SpoilageController::class, 'index'])  ->middleware('permission:inventory,view');
    Route::post  ('/spoilages',            [SpoilageController::class, 'store'])  ->middleware('permission:inventory,create');
    Route::get   ('/spoilages/{spoilage}', [SpoilageController::class, 'show'])   ->middleware('permission:inventory,view');
    Route::put   ('/spoilages/{spoilage}', [SpoilageController::class, 'update']) ->middleware('permission:inventory,edit');
    Route::delete('/spoilages/{spoilage}', [SpoilageController::class, 'destroy'])->middleware('permission:inventory,delete');

    // ── Inventory: Suppliers ──────────────────────────────────────
    Route::get   ('/suppliers',            [SupplierController::class, 'index'])  ->middleware('permission:inventory,view');
    Route::post  ('/suppliers',            [SupplierController::class, 'store'])  ->middleware('permission:inventory,create');
    Route::get   ('/suppliers/{supplier}', [SupplierController::class, 'show'])   ->middleware('permission:inventory,view');
    Route::put   ('/suppliers/{supplier}', [SupplierController::class, 'update']) ->middleware('permission:inventory,edit');
    Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy'])->middleware('permission:inventory,delete');

    // ── Menu Categories ───────────────────────────────────────────
    Route::get   ('/menu-categories',                [MenuCategoryController::class, 'index'])  ->middleware('permission:menu,view');
    Route::post  ('/menu-categories',                [MenuCategoryController::class, 'store'])  ->middleware('permission:menu,create');
    Route::get   ('/menu-categories/{menuCategory}', [MenuCategoryController::class, 'show'])   ->middleware('permission:menu,view');
    Route::put   ('/menu-categories/{menuCategory}', [MenuCategoryController::class, 'update']) ->middleware('permission:menu,edit');
    Route::delete('/menu-categories/{menuCategory}', [MenuCategoryController::class, 'destroy'])->middleware('permission:menu,delete');

    // ── Menu Items ────────────────────────────────────────────────
    Route::get   ('/menu-items',            [MenuItemController::class, 'index'])  ->middleware('permission:menu,view');
    Route::post  ('/menu-items',            [MenuItemController::class, 'store'])  ->middleware('permission:menu,create');
    Route::get   ('/menu-items/{menuItem}', [MenuItemController::class, 'show'])   ->middleware('permission:menu,view');
    Route::put   ('/menu-items/{menuItem}', [MenuItemController::class, 'update']) ->middleware('permission:menu,edit');
    Route::delete('/menu-items/{menuItem}', [MenuItemController::class, 'destroy'])->middleware('permission:menu,delete');

    // ── Tables ────────────────────────────────────────────────────
    Route::get   ('/tables',              [RestaurantTableController::class, 'index'])       ->middleware('permission:tables,view');
    Route::post  ('/tables',              [RestaurantTableController::class, 'store'])       ->middleware('permission:tables,create');
    Route::get   ('/tables/{table}',      [RestaurantTableController::class, 'show'])        ->middleware('permission:tables,view');
    Route::put   ('/tables/{table}',      [RestaurantTableController::class, 'update'])      ->middleware('permission:tables,edit');
    Route::delete('/tables/{table}',      [RestaurantTableController::class, 'destroy'])     ->middleware('permission:tables,delete');
    Route::put   ('/tables/{table}/status',[RestaurantTableController::class, 'updateStatus'])->middleware('permission:tables,edit');

    // ── Orders ────────────────────────────────────────────────────
    Route::get ('/orders',                  [OrderController::class, 'index'])      ->middleware('permission:orders,view');
    Route::post('/orders',                  [OrderController::class, 'store'])      ->middleware('permission:orders,create');
    Route::get ('/orders/{order}',          [OrderController::class, 'show'])       ->middleware('permission:orders,view');
    Route::put ('/orders/{order}/items',    [OrderController::class, 'updateItems'])->middleware('permission:orders,edit');
    Route::put ('/orders/{order}/complete', [OrderController::class, 'complete'])   ->middleware('permission:orders,edit');

    // ── Discounts ─────────────────────────────────────────────────
    Route::get   ('/discounts',            [DiscountController::class, 'index'])  ->middleware('permission:discount,view');
    Route::post  ('/discounts',            [DiscountController::class, 'store'])  ->middleware('permission:discount,create');
    Route::get   ('/discounts/{discount}', [DiscountController::class, 'show'])   ->middleware('permission:discount,view');
    Route::put   ('/discounts/{discount}', [DiscountController::class, 'update']) ->middleware('permission:discount,edit');
    Route::delete('/discounts/{discount}', [DiscountController::class, 'destroy'])->middleware('permission:discount,delete');

    // ── Finance: Categories ───────────────────────────────────────
    Route::get   ('/finance-categories',                   [FinanceCategoryController::class, 'index'])  ->middleware('permission:finance,view');
    Route::post  ('/finance-categories',                   [FinanceCategoryController::class, 'store'])  ->middleware('permission:finance,create');
    Route::get   ('/finance-categories/{financeCategory}', [FinanceCategoryController::class, 'show'])   ->middleware('permission:finance,view');
    Route::put   ('/finance-categories/{financeCategory}', [FinanceCategoryController::class, 'update']) ->middleware('permission:finance,edit');
    Route::delete('/finance-categories/{financeCategory}', [FinanceCategoryController::class, 'destroy'])->middleware('permission:finance,delete');

    // ── Finance: Expenses ─────────────────────────────────────────
    Route::get   ('/expenses',           [ExpenseController::class, 'index'])  ->middleware('permission:finance,view');
    Route::post  ('/expenses',           [ExpenseController::class, 'store'])  ->middleware('permission:finance,create');
    Route::get   ('/expenses/{expense}', [ExpenseController::class, 'show'])   ->middleware('permission:finance,view');
    Route::put   ('/expenses/{expense}', [ExpenseController::class, 'update']) ->middleware('permission:finance,edit');
    Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy'])->middleware('permission:finance,delete');

    // ── Finance: Incomes ──────────────────────────────────────────
    Route::prefix('incomes')->group(function () {
        Route::get   ('/',            [IncomeController::class, 'index'])      ->middleware('permission:finance,view');
        Route::post  ('/manual',      [IncomeController::class, 'storeManual'])->middleware('permission:finance,create');
        Route::get   ('/summary',     [IncomeController::class, 'summary'])    ->middleware('permission:finance,view');
        Route::get   ('/{incomeRef}', [IncomeController::class, 'show'])       ->middleware('permission:finance,view');
        Route::put   ('/{incomeRef}', [IncomeController::class, 'update'])     ->middleware('permission:finance,edit');
        Route::delete('/{incomeRef}', [IncomeController::class, 'destroy'])    ->middleware('permission:finance,delete');
    });

    // ── Reports ───────────────────────────────────────────────────
    Route::get('/reports/dashboard', [ReportController::class, 'dashboard'])->middleware('permission:reports,view');
    Route::get('/reports/export',    [ReportController::class, 'export'])    ->middleware('permission:reports,view');
    Route::get('/reports/shifts',    [ReportController::class, 'shifts'])    ->middleware('permission:reports,view');

    // ── Working Shifts ────────────────────────────────────────────
    Route::prefix('working-shifts')->group(function () {
        Route::get   ('/',               [WorkingShiftController::class, 'index'])  ->middleware('permission:workshifts,view');
        Route::post  ('/',               [WorkingShiftController::class, 'store'])  ->middleware('permission:workshifts,create');
        Route::get   ('/summary',        [WorkingShiftController::class, 'summary'])->middleware('permission:workshifts,view');
        Route::get   ('/{workingShift}', [WorkingShiftController::class, 'show'])   ->middleware('permission:workshifts,view');
        Route::put   ('/{workingShift}', [WorkingShiftController::class, 'update']) ->middleware('permission:workshifts,edit');
        Route::delete('/{workingShift}', [WorkingShiftController::class, 'destroy'])->middleware('permission:workshifts,delete');
    });

    // ── Reservations ──────────────────────────────────────────────
    Route::get   ('/reservations',                             [ReservationController::class, 'index'])           ->middleware('permission:reserved,view');
    Route::post  ('/reservations',                             [ReservationController::class, 'store'])           ->middleware('permission:reserved,create');
    Route::get   ('/reservations/{reservation}',               [ReservationController::class, 'show'])            ->middleware('permission:reserved,view');
    Route::patch ('/reservations/{reservation}',               [ReservationController::class, 'update'])          ->middleware('permission:reserved,edit');
    Route::delete('/reservations/{reservation}',               [ReservationController::class, 'destroy'])         ->middleware('permission:reserved,delete');
    Route::patch ('/reservations/{reservation}/table-status',  [ReservationController::class, 'updateTableStatus'])->middleware('permission:reserved,edit');

    // ── System Settings ───────────────────────────────────────────
    Route::get   ('/system-settings',      [SystemsettingController::class, 'show'])      ->middleware('permission:settings,view');
    Route::put   ('/system-settings',      [SystemsettingController::class, 'update'])    ->middleware('permission:settings,edit');
    Route::delete('/system-settings/logo', [SystemsettingController::class, 'removeLogo'])->middleware('permission:settings,edit');

    // ── VIP Card Management ───────────────────────────────────────
    Route::prefix('vip')->group(function () {
        Route::get   ('tiers',                   [VipTierController::class,    'index'])   ->middleware('permission:vip-card,view');
        Route::post  ('tiers/bulk',              [VipTierController::class,    'bulkSave'])->middleware('permission:vip-card,edit');
        Route::post  ('tiers',                   [VipTierController::class,    'store'])   ->middleware('permission:vip-card,create');
        Route::put   ('tiers/{tier}',            [VipTierController::class,    'update'])  ->middleware('permission:vip-card,edit');
        Route::delete('tiers/{tier}',            [VipTierController::class,    'destroy']) ->middleware('permission:vip-card,delete');
        Route::get   ('cards/stats',             [VipCardController::class,    'stats'])   ->middleware('permission:vip-card,view');
        Route::get   ('cards/lookup',            [VipCardController::class,    'lookup'])  ->middleware('permission:vip-card,view');
        Route::get   ('cards',                   [VipCardController::class,    'index'])   ->middleware('permission:vip-card,view');
        Route::post  ('cards',                   [VipCardController::class,    'store'])   ->middleware('permission:vip-card,create');
        Route::get   ('cards/{vipCard}',         [VipCardController::class,    'show'])    ->middleware('permission:vip-card,view');
        Route::patch ('cards/{vipCard}/toggle',  [VipCardController::class,    'toggle'])  ->middleware('permission:vip-card,edit');
        Route::patch ('cards/{vipCard}/extend',  [VipCardController::class,    'extend'])  ->middleware('permission:vip-card,edit');
        Route::patch ('cards/{vipCard}/upgrade', [VipCardController::class,    'upgrade']) ->middleware('permission:vip-card,edit');
        Route::delete('cards/{vipCard}',         [VipCardController::class,    'destroy']) ->middleware('permission:vip-card,delete');
        Route::get   ('upgrade-logs',            [VipUpgradeLogController::class, 'index'])->middleware('permission:vip-card,view');
    });

    // ── Printers ──────────────────────────────────────────────────
    Route::prefix('printers')->group(function () {
        Route::get   ('/',               [PrinterController::class, 'index'])         ->middleware('permission:settings,view');
        Route::post  ('/',               [PrinterController::class, 'store'])         ->middleware('permission:settings,create');
        Route::put   ('/{printer}',      [PrinterController::class, 'update'])        ->middleware('permission:settings,edit');
        Route::delete('/{printer}',      [PrinterController::class, 'destroy'])       ->middleware('permission:settings,delete');
        Route::post  ('/scan',           [PrinterController::class, 'scan'])          ->middleware('permission:settings,view');
        Route::post  ('/scan/save',      [PrinterController::class, 'saveScanResult'])->middleware('permission:settings,edit');
        Route::post  ('/{printer}/ping', [PrinterController::class, 'ping'])          ->middleware('permission:settings,view');
    });
});