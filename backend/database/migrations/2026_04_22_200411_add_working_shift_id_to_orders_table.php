<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
 public function up(): void
{
    Schema::table('orders', function (Blueprint $table) {
        $table->foreignId('working_shift_id')
              ->nullable()
              ->constrained('working_shifts')
              ->nullOnDelete();
    });
}

public function down(): void
{
    Schema::table('orders', function (Blueprint $table) {
        $table->dropForeign(['working_shift_id']);
        $table->dropColumn('working_shift_id');
    });
}
};
