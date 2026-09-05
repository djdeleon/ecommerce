<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('order_package_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_package_id')->constrained()->restrictOnDelete();
            $table->foreignId('changed_by_id')->constrained('users')->restrictOnDelete();
            $table->string('status', 20);
            $table->text('notes');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_package_statuses');
    }
};
