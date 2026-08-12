<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vip_upgrade_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('card_id')->constrained('vip_cards')->cascadeOnDelete();
            $table->string('card_code', 20);
            $table->string('old_card_code', 20)->nullable();
            $table->foreignId('from_tier_id')->constrained('vip_tiers')->restrictOnDelete();
            $table->string('from_tier_name');
            $table->foreignId('to_tier_id')->constrained('vip_tiers')->restrictOnDelete();
            $table->string('to_tier_name');
            $table->unsignedInteger('total_visits_at_upgrade');
            $table->timestamp('upgraded_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vip_upgrade_logs');
    }
};