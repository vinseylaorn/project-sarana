<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_ref')->unique();
            $table->string('table_name')->nullable();
            $table->string('order_type')->default('dine_in');
            $table->decimal('total', 10, 2)->default(0);
            $table->string('status')->default('pending');
            $table->foreignId('staff_id')->nullable()
                  ->constrained('staff')->nullOnDelete();
            $table->string('payment_method')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('orders'); }
};