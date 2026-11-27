<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    // CHANGE this if your settings table has a different name.
    private string $table = 'system_settings';

    public function up(): void
    {
        Schema::table($this->table, function (Blueprint $t) {
            if (! Schema::hasColumn($this->table, 'exchange_rate_mode')) {
                $t->string('exchange_rate_mode', 10)->default('manual');
            }
        });
    }

    public function down(): void
    {
        Schema::table($this->table, function (Blueprint $t) {
            if (Schema::hasColumn($this->table, 'exchange_rate_mode')) {
                $t->dropColumn('exchange_rate_mode');
            }
        });
    }
};