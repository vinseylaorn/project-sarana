<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Income;
use App\Models\Inventory;
use App\Models\RestaurantTable;
use Carbon\Carbon;

class DashboardController extends Controller
{
    private const DONE   = ['completed', 'confirmed'];
    private const ACTIVE = ['new', 'preparing', 'ready', 'confirmed'];
    private const TZ     = 'Asia/Phnom_Penh';

    public function index()
    {
        $today     = Carbon::today(self::TZ);
        $yesterday = Carbon::yesterday(self::TZ);
        $now       = Carbon::now(self::TZ);

        // ── Orders ──────────────────────────────────────────────────────────
        $todayOrders = Order::with('items')
            ->whereIn('status', self::DONE)
            ->whereDate('created_at', $today)
            ->get();

        $yesterdayOrders = Order::whereIn('status', self::DONE)
            ->whereDate('created_at', $yesterday)
            ->get();

        // ── Manual Incomes ───────────────────────────────────────────────────
        $allManualIncomes = Income::where('is_auto_generated', false)->get();

        $todayManual = $allManualIncomes->filter(
            fn($i) => Carbon::parse($i->date)->toDateString() === $today->toDateString()
        )->sum('amount');

        $yesterdayManual = $allManualIncomes->filter(
            fn($i) => Carbon::parse($i->date)->toDateString() === $yesterday->toDateString()
        )->sum('amount');

        // ── Revenue ──────────────────────────────────────────────────────────
        $todayOrderRevenue     = round($todayOrders->sum('total'), 2);
        $yesterdayOrderRevenue = round($yesterdayOrders->sum('total'), 2);

        $todayRevenue     = round($todayOrderRevenue + $todayManual, 2);
        $yesterdayRevenue = round($yesterdayOrderRevenue + $yesterdayManual, 2);

        // ── Order counts ─────────────────────────────────────────────────────
        $ordersToday     = $todayOrders->count();
        $ordersYesterday = $yesterdayOrders->count();

        $avgOrder = $ordersToday > 0
            ? round($todayOrderRevenue / $ordersToday, 2)
            : 0.0;

        $avgYesterday = $ordersYesterday > 0
            ? round($yesterdayOrders->sum('total') / $ordersYesterday, 2)
            : 0.0;

        $pct = fn($cur, $prev) => $prev > 0
            ? round((($cur - $prev) / $prev) * 100, 1)
            : 0.0;

        $pendingOrders = Order::whereDate('created_at', $today)
            ->whereIn('status', ['confirmed'])
            ->count();

        $completedOrders  = $ordersToday;
        $totalToday       = Order::whereDate('created_at', $today)->count();
        $completedPercent = $totalToday > 0
            ? round(($completedOrders / $totalToday) * 100, 1)
            : 0.0;

        // ── Tables ───────────────────────────────────────────────────────────
        $allTables = RestaurantTable::all();

        // ✅ FIX: គណនា occupied ពី active orders មិនមែនពី DB column
        $occupiedTableNames = Order::whereIn('status', self::ACTIVE)
            ->pluck('table_name')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        // ✅ FIX: tablesOccupied គណនាពី active orders
        $tablesOccupied = count($occupiedTableNames);

        // ── Revenue chart helpers ─────────────────────────────────────────────
        $revenueOnDate = function (string $date) use ($allManualIncomes): float {
            $orderRev = Order::whereIn('status', self::DONE)
                ->whereDate('created_at', $date)
                ->sum('total');

            $incomeRev = $allManualIncomes->filter(
                fn($i) => Carbon::parse($i->date)->toDateString() === $date
            )->sum('amount');

            return round((float) $orderRev + (float) $incomeRev, 2);
        };

        // Week data
        $weekStart = $now->copy()->startOfWeek(Carbon::MONDAY);
        $dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $weekData  = collect(range(0, 6))->map(function ($i) use ($weekStart, $dayLabels, $revenueOnDate) {
            $date = $weekStart->copy()->addDays($i)->toDateString();
            return ['label' => $dayLabels[$i], 'revenue' => $revenueOnDate($date)];
        });

        // Month data
        $monthData = collect([
            ['label' => 'Week 1', 'start' => 1,  'end' => 7],
            ['label' => 'Week 2', 'start' => 8,  'end' => 14],
            ['label' => 'Week 3', 'start' => 15, 'end' => 21],
            ['label' => 'Week 4', 'start' => 22, 'end' => 31],
        ])->map(function ($w) use ($now, $allManualIncomes) {
            $orderRev = Order::whereIn('status', self::DONE)
                ->whereYear('created_at', $now->year)
                ->whereMonth('created_at', $now->month)
                ->whereDay('created_at', '>=', $w['start'])
                ->whereDay('created_at', '<=', $w['end'])
                ->sum('total');

            $incomeRev = $allManualIncomes->filter(function ($i) use ($w, $now) {
                $d = Carbon::parse($i->date);
                return $d->year === $now->year
                    && $d->month === $now->month
                    && $d->day >= $w['start']
                    && $d->day <= $w['end'];
            })->sum('amount');

            return ['label' => $w['label'], 'revenue' => round((float) $orderRev + (float) $incomeRev, 2)];
        });

        // Year data
        $months   = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $yearData = collect(range(1, 12))->map(function ($m) use ($now, $months, $allManualIncomes) {
            $orderRev = Order::whereIn('status', self::DONE)
                ->whereYear('created_at', $now->year)
                ->whereMonth('created_at', $m)
                ->sum('total');

            $incomeRev = $allManualIncomes->filter(function ($i) use ($m, $now) {
                $d = Carbon::parse($i->date);
                return $d->year === $now->year && $d->month === $m;
            })->sum('amount');

            return ['label' => $months[$m - 1], 'revenue' => round((float) $orderRev + (float) $incomeRev, 2)];
        });

        // ── Active Orders (for RecentOrders widget) ───────────────────────────
        $activeOrders = Order::with('items')
            ->whereIn('status', self::ACTIVE)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($o) {
                $mins = (int) Carbon::parse($o->created_at)->diffInMinutes(now());
                return [
                    'id'          => $o->id,
                    'order_ref'   => $o->order_ref,
                    'table'       => $o->table_name ?? ('Order #' . $o->order_ref),
                    'status'      => $o->status,
                    'items_count' => $o->items->count(),
                    'time'        => $mins . 'm ago',
                    'total'       => (float) $o->total,
                ];
            });

        // ── Inventory Alerts ─────────────────────────────────────────────────
        $alerts = Inventory::whereColumn('stock', '<=', 'min_stock')
            ->orderBy('stock')
            ->get()
            ->map(function ($item) {
                return [
                    'id'     => $item->id,
                    'name'   => $item->name,
                    'stock'  => (float) $item->stock,
                    'unit'   => $item->unit,
                    'status' => ($item->stock <= 0 || $item->stock <= ($item->min_stock * 0.5))
                        ? 'critical'
                        : 'low',
                ];
            });

        $tables = $allTables->map(fn($t) => [
            'id'     => $t->name,
            'seats'  => (int) $t->seats,
            'floor'  => $t->floor ?? 'main',
            'status' => in_array($t->name, $occupiedTableNames)
                            ? 'occupied'
                            : $t->status,
        ]);

        return response()->json([
            'stats' => [
                'todayRevenue'          => $todayRevenue,
                'ordersToday'           => $ordersToday,
                'avgOrderValue'         => $avgOrder,
                'tablesOccupied'        => $tablesOccupied,
                'totalTables'           => $allTables->count(),
                'pendingOrders'         => $pendingOrders,
                'completedOrders'       => $completedOrders,
                'revenueChangePercent'  => $pct($todayRevenue, $yesterdayRevenue),
                'ordersChangePercent'   => $pct($ordersToday, $ordersYesterday),
                'avgOrderChangePercent' => $pct($avgOrder, $avgYesterday),
                'completedPercent'      => $completedPercent,
            ],
            'revenue' => [
                'week'  => $weekData->values(),
                'month' => $monthData->values(),
                'year'  => $yearData->values(),
            ],
            'orders' => $activeOrders->values(),
            'alerts' => $alerts->values(),
            'tables' => $tables->values(),
        ]);
    }
}