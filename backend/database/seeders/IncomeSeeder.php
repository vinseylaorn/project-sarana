<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\Income;

class IncomeSeeder extends Seeder
{
    public function run(): void
    {
        $orders = Order::where('status', 'completed')
            ->whereDoesntHave('income')
            ->get();

        foreach ($orders as $order) {
            Income::create([
                'income_ref'        => Income::generateReference(),
                'title'             => 'ការលក់ពី ' . ($order->table_name ?? $order->order_type),
                'amount'            => $order->total,
                'date'              => $order->created_at->format('Y-m-d'),
                'category'          => 'Sales',
                'is_auto_generated' => true,
                'order_id'          => $order->id,
                'payment_method'    => $order->payment_method,
                'description'       => 'Income from order ' . $order->order_ref,
            ]);
        }

        $this->command->info("✅ Created {$orders->count()} income records.");
    }
}