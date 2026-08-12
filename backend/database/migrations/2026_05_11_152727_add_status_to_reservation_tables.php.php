<?php
// database/migrations/xxxx_add_status_to_reservation_tables.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservation_tables', function (Blueprint $table) {
            $table->enum('status', ['reserved', 'cancelled', 'completed'])
                  ->default('reserved')
                  ->after('table_id');
        });
    }

    public function down(): void
    {
        Schema::table('reservation_tables', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};