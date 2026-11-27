<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tables that belong to one (merged) order
        Schema::create('order_tables', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('order_id')->index();
            $t->unsignedBigInteger('table_id')->index();
            $t->timestamps();
            $t->unique(['order_id', 'table_id']);
        });

        // Audit log of every transfer / merge
        Schema::create('table_transfers', function (Blueprint $t) {
            $t->id();
            $t->string('type', 10);                       // transfer | merge
            $t->unsignedBigInteger('order_id')->nullable()->index();
            $t->unsignedBigInteger('from_table_id');
            $t->unsignedBigInteger('to_table_id');
            $t->unsignedBigInteger('staff_id')->nullable();
            $t->timestamps();
        });

        Schema::table('orders', function (Blueprint $t) {
            $t->unsignedBigInteger('merged_into_order_id')->nullable()->after('working_shift_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', fn (Blueprint $t) => $t->dropColumn('merged_into_order_id'));
        Schema::dropIfExists('table_transfers');
        Schema::dropIfExists('order_tables');
    }
};