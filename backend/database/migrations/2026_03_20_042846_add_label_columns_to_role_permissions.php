<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('role_permissions', function (Blueprint $table) {
            if (!Schema::hasColumn('role_permissions', 'label')) {
                $table->string('label')->nullable()->after('granted');
            }
            if (!Schema::hasColumn('role_permissions', 'label_kh')) {
                $table->string('label_kh')->nullable()->after('label');
            }
            if (!Schema::hasColumn('role_permissions', 'section')) {
                $table->string('section')->nullable()->after('label_kh');
            }
            if (!Schema::hasColumn('role_permissions', 'section_kh')) {
                $table->string('section_kh')->nullable()->after('section');
            }
            if (!Schema::hasColumn('role_permissions', 'href')) {
                $table->string('href')->nullable()->after('section_kh');
            }
        });
    }

    public function down(): void
    {
        Schema::table('role_permissions', function (Blueprint $table) {
            $table->dropColumn(['label', 'label_kh', 'section', 'section_kh', 'href']);
        });
    }
};