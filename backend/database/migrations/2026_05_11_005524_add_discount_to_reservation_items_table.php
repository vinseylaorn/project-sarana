<?php
// database/migrations/xxxx_add_discount_to_reservation_items_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservation_items', function (Blueprint $table) {
            $table->decimal('original_price', 10, 2)->nullable()->after('price');
            $table->string('discount_name')->nullable()->after('original_price');
            $table->decimal('discount_value', 10, 2)->nullable()->after('discount_name');
            $table->string('discount_type')->nullable()->after('discount_value');
        });
    }

    public function down(): void
    {
        Schema::table('reservation_items', function (Blueprint $table) {
            $table->dropColumn([
                'original_price',
                'discount_name',
                'discount_value',
                'discount_type',
            ]);
        });
    }
};