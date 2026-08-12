<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vip_cards', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();  
            $table->foreignId('tier_id')->constrained('vip_tiers')->restrictOnDelete();
            $table->unsignedInteger('total_visits')->default(0);
            $table->unsignedTinyInteger('used_this_month')->default(0);
            $table->unsignedTinyInteger('monthly_limit')->default(0); 
            $table->date('issued_at');
            $table->date('expires_at')->nullable(); 
            $table->boolean('is_active')->default(true);
            $table->string('note')->default('');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vip_cards');
    }
};