<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Income;
use App\Models\Expense;
use App\Models\MenuCategory;
use Illuminate\Support\Carbon;

class ReportService
{
    private const DONE = ['completed', 'confirmed'];
    private const TZ   = 'Asia/Phnom_Penh';

    public function dashboard($startDate = null, $endDate = null): array
    {
        $orders = Order::with('items.menuItem')
            ->whereIn('status', self::DONE)
            ->when($startDate, fn($q) => $q->whereRaw(
                "(created_at + INTERVAL 7 HOUR) >= ?",
                [$startDate . ' 00:00:00']
            ))
            ->when($endDate, fn($q) => $q->whereRaw(
                "(created_at + INTERVAL 7 HOUR) <= ?",
                [$endDate . ' 23:59:59']
            ))
            ->get();

        $manualIncomes = Income::where('is_auto_generated', false)
            ->when($startDate, fn($q) => $q->whereDate('date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->whereDate('date', '<=', $endDate))
            ->get();

        $manualIncomeTotal = $manualIncomes->sum('amount');

        $totalExpense = Expense::query()
            ->when($startDate, fn($q) => $q->whereDate('date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->whereDate('date', '<=', $endDate))
            ->sum('amount');

        $sales       = $orders->sum('total');
        $totalOrders = $orders->count();
        $dineIn      = $orders->where('order_type', 'dine_in')->count();
        $takeaway    = $orders->where('order_type', 'takeaway')->count();
        $app         = $orders->where('order_type', 'app')->count();

        $half      = (int) floor($totalOrders / 2);
        $prevRev   = $orders->take($half)->sum('total');
        $currRev   = $orders->skip($half)->sum('total');
        $revChange = $prevRev > 0 ? round((($currRev - $prevRev) / $prevRev) * 100, 1) : 0;

        $now   = Carbon::now(self::TZ);
        $today = Carbon::today(self::TZ);

        // Revenue Trend — last 7 days
        $revenueChart = collect(range(6, 0))->map(function ($i) use ($orders, $manualIncomes, $today) {
            $date       = $today->copy()->subDays($i)->toDateString();
            $orderRev   = $orders->filter(fn($o) => Carbon::parse($o->created_at)->timezone(self::TZ)->toDateString() === $date)->sum('total');
            $incomeRev  = $manualIncomes->filter(fn($inc) => Carbon::parse($inc->date)->toDateString() === $date)->sum('amount');
            $orderCount = $orders->filter(fn($o) => Carbon::parse($o->created_at)->timezone(self::TZ)->toDateString() === $date)->count();
            return ['date' => $date, 'label' => Carbon::parse($date)->format('M j'), 'revenue' => round((float)$orderRev + (float)$incomeRev, 2), 'orders' => $orderCount];
        })->values();

        // Revenue by Day Mon–Sun
        $weekStart = $now->copy()->startOfWeek(Carbon::MONDAY);
        $dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        $revenueByDay = collect(range(0, 6))->map(function ($i) use ($weekStart, $dayLabels, $orders, $manualIncomes) {
            $date      = $weekStart->copy()->addDays($i)->toDateString();
            $orderRev  = $orders->filter(fn($o) => Carbon::parse($o->created_at)->timezone(self::TZ)->toDateString() === $date)->sum('total');
            $incomeRev = $manualIncomes->filter(fn($inc) => Carbon::parse($inc->date)->toDateString() === $date)->sum('amount');
            return ['label' => $dayLabels[$i], 'revenue' => round((float)$orderRev + (float)$incomeRev, 2)];
        })->values();

        // Revenue by Week W1–W4
        $year  = $now->year;
        $month = $now->month;
        $revenueByWeek = collect([
            ['label'=>'W1','start'=>1, 'end'=>7],
            ['label'=>'W2','start'=>8, 'end'=>14],
            ['label'=>'W3','start'=>15,'end'=>21],
            ['label'=>'W4','start'=>22,'end'=>31],
        ])->map(function ($w) use ($orders, $manualIncomes, $year, $month) {
            $orderRev  = $orders->filter(function ($o) use ($w,$year,$month) {
                $d = Carbon::parse($o->created_at)->timezone(self::TZ);
                return $d->year===$year && $d->month===$month && $d->day>=$w['start'] && $d->day<=$w['end'];
            })->sum('total');
            $incomeRev = $manualIncomes->filter(function ($inc) use ($w,$year,$month) {
                $d = Carbon::parse($inc->date)->timezone(self::TZ);
                return $d->year===$year && $d->month===$month && $d->day>=$w['start'] && $d->day<=$w['end'];
            })->sum('amount');
            return ['label' => $w['label'], 'revenue' => round((float)$orderRev + (float)$incomeRev, 2)];
        })->values();

        // Revenue by Month Jan–Dec
        $monthLabels    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        $revenueByMonth = collect(range(1, 12))->map(function ($m) use ($orders, $manualIncomes, $now, $monthLabels) {
            $yr        = $now->year;
            $orderRev  = $orders->filter(function ($o) use ($m,$yr) {
                $d = Carbon::parse($o->created_at)->timezone(self::TZ);
                return $d->year===$yr && $d->month===$m;
            })->sum('total');
            $incomeRev = $manualIncomes->filter(function ($inc) use ($m,$yr) {
                $d = Carbon::parse($inc->date)->timezone(self::TZ);
                return $d->year===$yr && $d->month===$m;
            })->sum('amount');
            return ['label' => $monthLabels[$m-1], 'revenue' => round((float)$orderRev + (float)$incomeRev, 2)];
        })->values();

        // Sales by Category
        $categories = MenuCategory::all()->keyBy('id');
        $catSales   = [];
        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                $catId   = $item->menu_item_id ? optional($item->menuItem)->category_id : null;
                $catName = $catId && isset($categories[$catId]) ? $categories[$catId]->name : ($item->category ?? 'Other');
                if (!isset($catSales[$catName])) $catSales[$catName] = ['name'=>$catName,'count'=>0,'revenue'=>0];
                $catSales[$catName]['count']   += (int)($item->quantity ?? 1);
                $catSales[$catName]['revenue'] += (float)($item->price ?? 0) * (int)($item->quantity ?? 1);
            }
        }
        $totalCatRevenue = array_sum(array_column($catSales, 'revenue'));
        $categoryData    = collect($catSales)->sortByDesc('revenue')->map(function ($cat) use ($totalCatRevenue) {
            $cat['revenue'] = round($cat['revenue'], 2);
            $cat['value']   = $totalCatRevenue > 0 ? (int)round(($cat['revenue']/$totalCatRevenue)*100) : 0;
            return $cat;
        })->values();

        // Top Items
        $itemMap = [];
        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                $name = $item->name ?? optional($item->menuItem)->name ?? 'Unknown';
                if (!isset($itemMap[$name])) $itemMap[$name] = ['name'=>$name,'orders'=>0,'revenue'=>0.0];
                $itemMap[$name]['orders']  += (int)($item->quantity ?? 1);
                $itemMap[$name]['revenue'] += (float)($item->price ?? 0) * (int)($item->quantity ?? 1);
            }
        }
        $topItems = collect($itemMap)->sortByDesc('revenue')->take(5)
            ->map(fn($i) => array_merge($i, ['revenue'=>round($i['revenue'],2)]))->values();

        // Payment Methods
        $paymentData = $orders->where('status','completed')
            ->groupBy(fn($o) => strtolower($o->payment_method ?? 'other'))
            ->filter(fn($g,$method) => $method !== 'other')
            ->map(fn($g,$method) => ['name'=>ucfirst($method),'value'=>$g->count()])
            ->values();

        // Recent — UI display only (10 rows)
        $recent = $orders->sortByDesc('created_at')->take(10)->map(fn($o) => [
            'id'             => $o->id,
            'order_ref'      => $o->order_ref,
            'order_type'     => $o->order_type,
            'table_name'     => $o->table_name ?? null,
            'total'          => (float)$o->total,
            'status'         => $o->status,
            'payment_method' => $o->payment_method ?? null,
            'created_at'     => $o->created_at->toISOString(),
            'items'          => $o->items->map(fn($i) => [
                'name'     => $i->name ?? optional($i->menuItem)->name ?? 'Unknown',
                'price'    => (float)($i->price ?? 0),
                'quantity' => (int)($i->quantity ?? 1),
            ])->values(),
        ])->values();

        return [
            'kpi' => [
                'totalRevenue'  => round($sales + $manualIncomeTotal, 2),
                'salesRevenue'  => round($sales, 2),
                'manualIncome'  => round($manualIncomeTotal, 2),
                'totalOrders'   => $totalOrders,
                'avgOrder'      => $totalOrders > 0 ? round($sales/$totalOrders, 2) : 0.0,
                'totalExpense'  => round($totalExpense, 2),
                'revenueChange' => $revChange,
                'dineIn'        => $dineIn,
                'takeaway'      => $takeaway,
                'app'           => $app,
            ],
            'charts' => [
                'revenueByDay'   => $revenueByDay,
                'revenueByWeek'  => $revenueByWeek,
                'revenueByMonth' => $revenueByMonth,
                'revenueTrend'   => $revenueChart,
                'categoryData'   => $categoryData,
                'topItems'       => $topItems,
                'paymentData'    => $paymentData,
            ],
            'recent' => $recent,
        ];
    }

    public function exportOrders($startDate = null, $endDate = null): array
    {
        $orders = Order::with('items.menuItem')
            ->whereIn('status', self::DONE)
            ->when($startDate, fn($q) => $q->whereRaw(
                "(created_at + INTERVAL 7 HOUR) >= ?",
                [$startDate . ' 00:00:00']
            ))
            ->when($endDate, fn($q) => $q->whereRaw(
                "(created_at + INTERVAL 7 HOUR) <= ?",
                [$endDate . ' 23:59:59']
            ))
            ->orderBy('created_at', 'desc')
            ->get();

        return $orders->map(fn($o) => [
            'order_ref'      => $o->order_ref,
            'order_type'     => $o->order_type,
            'table_name'     => $o->table_name ?? '-',
            'total'          => (float)$o->total,
            'payment_method' => $o->payment_method ?? '-',
            'created_at'     => Carbon::parse($o->created_at)->timezone(self::TZ)->format('Y-m-d H:i:s'),
        ])->values()->toArray();
    }
}