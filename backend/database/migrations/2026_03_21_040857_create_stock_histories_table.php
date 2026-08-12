<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('stock_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')->constrained('inventories')->onDelete('cascade');
            $table->string('product_name');
            $table->enum('type', ['IN', 'OUT']);
            $table->decimal('qty', 10, 3);
            $table->string('unit');
            $table->string('reason')->nullable();
            $table->unsignedBigInteger('order_id')->nullable(); // ✅ មិនមាន foreign key
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('stock_histories'); }
};