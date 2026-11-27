<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            // 1 USD = ? KHR. Defaults to the rate that was previously
            // hardcoded in PosShiftController so existing shifts keep
            // reconciling the same way right after this migration runs.
            $table->decimal('exchange_rate', 10, 2)->default(4100)->after('system_logo');
        });
    }

    public function down(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            $table->dropColumn('exchange_rate');
        });
    }
};