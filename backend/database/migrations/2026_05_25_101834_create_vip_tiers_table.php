<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vip_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('name');           
            $table->string('name_kh');        
            $table->unsignedTinyInteger('discount');        
            $table->unsignedInteger('min_visits')->default(0);
            $table->unsignedInteger('max_visits')->nullable();
            $table->unsignedInteger('upgrade_at')->nullable(); 
            $table->unsignedTinyInteger('monthly_limit')->default(0); 
            $table->string('color', 20)->default('#F0B429');
            $table->string('bg_from', 20)->default('#1C1A0E');
            $table->string('bg_to', 20)->default('#2A2410');
            $table->string('accent_color', 20)->default('#F0B429');
            $table->enum('icon', ['star', 'gem', 'crown'])->default('star');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vip_tiers');
    }
};