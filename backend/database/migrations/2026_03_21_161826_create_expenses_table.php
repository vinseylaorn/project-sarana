<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('category')->nullable();
            $table->date('date')->nullable();
            $table->boolean('is_auto')->default(false); // auto from stock purchase
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('expenses'); }
};