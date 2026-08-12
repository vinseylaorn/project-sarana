<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
       
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'discount_amount')) {
                $table->decimal('discount_amount', 10, 2)
                      ->default(0)
                      ->after('total');
            }
            if (! Schema::hasColumn('orders', 'tax_amount')) {
                $table->decimal('tax_amount', 10, 2)
                      ->default(0)
                      ->after('discount_amount');
            }
            if (! Schema::hasColumn('orders', 'vip_discount_amount')) {
                $table->decimal('vip_discount_amount', 10, 2)
                      ->default(0)
                      ->after('tax_amount');
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            if (! Schema::hasColumn('order_items', 'original_price')) {
                $table->decimal('original_price', 10, 2)
                      ->nullable()
                      ->after('price');
            }
            if (! Schema::hasColumn('order_items', 'discount_name')) {
                $table->string('discount_name')
                      ->nullable()
                      ->after('quantity');
            }
            if (! Schema::hasColumn('order_items', 'discount_value')) {
                $table->decimal('discount_value', 10, 2)
                      ->nullable()
                      ->after('discount_name');
            }
            if (! Schema::hasColumn('order_items', 'discount_value_type')) {
                $table->enum('discount_value_type', ['percentage', 'flat'])
                      ->nullable()
                      ->after('discount_value');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['discount_amount', 'tax_amount', 'vip_discount_amount']);
        });
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn([
                'original_price',
                'discount_name',
                'discount_value',
                'discount_value_type',
            ]);
        });
    }
};