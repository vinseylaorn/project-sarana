<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            
            $table->datetime('arrival_datetime')->nullable()->after('customer_phone');
           
            $table->dropColumn('arrival_time');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->time('arrival_time')->nullable()->after('customer_phone');
            $table->dropColumn('arrival_datetime');
        });
    }
};