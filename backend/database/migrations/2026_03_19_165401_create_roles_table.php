<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();

            $table->string('page');        
            $table->string('page_key');  
            $table->enum('permission', ['view', 'create', 'edit', 'delete']);
            $table->boolean('granted')->default(false);

            $table->string('label')->nullable();      
            $table->string('label_kh')->nullable();   
            $table->string('section')->nullable();      
            $table->string('section_kh')->nullable(); 
            $table->string('href')->nullable();       

            $table->timestamps();

            $table->unique(['role_id', 'page', 'permission']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('roles');
    }
};