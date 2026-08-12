<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('reservations', 'arrival_time') && !Schema::hasColumn('reservations', 'arrival_datetime')) {
            Schema::table('reservations', function ($table) {
                $table->dateTime('arrival_datetime')->nullable()->after('customer_phone');
            });

            DB::statement("UPDATE reservations SET arrival_datetime = CONCAT(CURDATE(), ' ', arrival_time) WHERE arrival_time IS NOT NULL");

            Schema::table('reservations', function ($table) {
                $table->dropColumn('arrival_time');
            });
        }
        DB::statement("ALTER TABLE reservations MODIFY status ENUM('pending','confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE reservations MODIFY status ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending'");
    }
};