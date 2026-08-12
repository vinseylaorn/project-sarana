<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('working_shifts', function (Blueprint $table) {
            if (!Schema::hasColumn('working_shifts', 'shift_status')) {
                $table->enum('shift_status', ['Open', 'Closed'])->default('Closed')->after('status');
            }
            if (!Schema::hasColumn('working_shifts', 'open_time')) {
                $table->timestamp('open_time')->nullable()->after('shift_status');
            }
            if (!Schema::hasColumn('working_shifts', 'open_amount_usd')) {
                $table->decimal('open_amount_usd', 12, 2)->default(0)->after('open_time');
            }
            if (!Schema::hasColumn('working_shifts', 'open_amount_khr')) {
                $table->decimal('open_amount_khr', 14, 0)->default(0)->after('open_amount_usd');
            }
            if (!Schema::hasColumn('working_shifts', 'close_time')) {
                $table->timestamp('close_time')->nullable()->after('open_amount_khr');
            }
            if (!Schema::hasColumn('working_shifts', 'close_amount_usd')) {
                $table->decimal('close_amount_usd', 12, 2)->default(0)->after('close_time');
            }
            if (!Schema::hasColumn('working_shifts', 'close_amount_khr')) {
                $table->decimal('close_amount_khr', 14, 0)->default(0)->after('close_amount_usd');
            }
            if (!Schema::hasColumn('working_shifts', 'total_orders')) {
                $table->unsignedInteger('total_orders')->default(0)->after('close_amount_khr');
            }
            if (!Schema::hasColumn('working_shifts', 'total_revenue_usd')) {
                $table->decimal('total_revenue_usd', 12, 2)->default(0)->after('total_orders');
            }
            if (!Schema::hasColumn('working_shifts', 'total_revenue_khr')) {
                $table->decimal('total_revenue_khr', 14, 0)->default(0)->after('total_revenue_usd');
            }
        });

        // Add pin_code to staff table if not exists
        if (Schema::hasTable('staff')) {
            Schema::table('staff', function (Blueprint $table) {
                if (!Schema::hasColumn('staff', 'pin_code')) {
                    $table->string('pin_code', 6)->nullable()->after('status');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('working_shifts', function (Blueprint $table) {
            $table->dropColumn([
                'shift_status', 'open_time',
                'open_amount_usd', 'open_amount_khr',
                'close_time',
                'close_amount_usd', 'close_amount_khr',
                'total_orders',
                'total_revenue_usd', 'total_revenue_khr',
            ]);
        });
        Schema::table('staff', function (Blueprint $table) {
            $table->dropColumn('pin_code');
        });
    }
};