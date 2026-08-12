<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spoilages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')
                  ->constrained('inventories')
                  ->onDelete('cascade');
            // ✅ category_id FK ជំនួស category string
            $table->foreignId('category_id')
                  ->nullable()
                  ->constrained('stock_categories')
                  ->onDelete('set null');
            $table->string('product_name');
            $table->string('unit')->nullable();
            $table->decimal('qty', 10, 2);
            $table->string('description')->nullable();
            $table->date('date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spoilages');
    }
};