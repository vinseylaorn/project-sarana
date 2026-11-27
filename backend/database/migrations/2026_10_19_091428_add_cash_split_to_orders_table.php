<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $t) {
            if (! Schema::hasColumn('orders', 'cash_amount')) {
                // Cash actually kept in the drawer for this order (change already deducted)
                $t->decimal('cash_amount', 12, 2)->nullable();
            }
            if (! Schema::hasColumn('orders', 'non_cash_amount')) {
                // Card / QR portion
                $t->decimal('non_cash_amount', 12, 2)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $t) {
            $t->dropColumn(['cash_amount', 'non_cash_amount']);
        });
    }
};