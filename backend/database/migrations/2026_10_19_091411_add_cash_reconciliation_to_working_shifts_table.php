<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('working_shifts', function (Blueprint $t) {
            if (! Schema::hasColumn('working_shifts', 'expected_cash_usd')) {
                $t->decimal('expected_cash_usd', 12, 2)->nullable();
            }
            if (! Schema::hasColumn('working_shifts', 'cash_difference_usd')) {
                $t->decimal('cash_difference_usd', 12, 2)->nullable();
            }
            if (! Schema::hasColumn('working_shifts', 'note')) {
                $t->string('note', 500)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('working_shifts', function (Blueprint $t) {
            $t->dropColumn(['expected_cash_usd', 'cash_difference_usd']);
        });
    }
};