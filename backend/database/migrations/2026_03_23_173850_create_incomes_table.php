<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('incomes', function (Blueprint $table) {
            $table->id();
            $table->string('income_ref')->unique();
            $table->string('title');
            $table->decimal('amount', 10, 2);
            $table->date('date');
            $table->string('category')->nullable();
            $table->boolean('is_auto_generated')->default(false);
            $table->foreignId('order_id')->nullable()->constrained('orders')->onDelete('set null');
            $table->string('payment_method')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
            
            // Indexes for faster queries
            $table->index(['date', 'category']);
            $table->index('is_auto_generated');
        });
    }
    public function down(): void { Schema::dropIfExists('incomes'); }
};