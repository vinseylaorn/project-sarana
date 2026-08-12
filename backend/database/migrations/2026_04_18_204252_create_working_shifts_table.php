<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('working_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
            $table->date('date');
            $table->enum('shift_type', ['Morning', 'Afternoon', 'Night', 'Full Day']);
            $table->time('start_time');
            $table->time('end_time');
            $table->enum('status', ['Present', 'Absent', 'Late', 'Leave'])->default('Present');
            $table->decimal('overtime_hours', 4, 1)->default(0);
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('working_shifts');
    }
};