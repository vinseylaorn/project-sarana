<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('restaurant_tables', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->integer('seats')->default(4);
            $table->string('floor')->default('main');
            $table->enum('status', ['available', 'occupied', 'reserved'])->default('available');
            $table->string('reserve_time')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('restaurant_tables'); }
};