<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staff', function (Blueprint $table) {

            if (! Schema::hasColumn('staff', 'can_use_pos')) {
                $table->boolean('can_use_pos')->default(false)->after('date');
            }

            if (! Schema::hasColumn('staff', 'pin_code')) {
                $table->string('pin_code', 6)->nullable()->after('can_use_pos');
            }
        });
    }

    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            if (Schema::hasColumn('staff', 'pin_code')) {
                $table->dropColumn('pin_code');
            }

            if (Schema::hasColumn('staff', 'can_use_pos')) {
                $table->dropColumn('can_use_pos');
            }
        });
    }
};