<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('working_shifts', function (Blueprint $table) {
            $table->decimal('expected_cash_usd', 10, 2)->default(0)->after('close_amount_khr');
            $table->decimal('cash_difference_usd', 10, 2)->default(0)->after('expected_cash_usd');
        });
    }

    public function down(): void
    {
        Schema::table('working_shifts', function (Blueprint $table) {
            $table->dropColumn(['expected_cash_usd', 'cash_difference_usd']);
        });
    }
};