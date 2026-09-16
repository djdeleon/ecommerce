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
            $table->string('changed_by_id');
            $table->string('status', 20);
            $table->text('notes');
            $table->timestamps();

            $table->unique(['order_package_id', 'status'], 'order_package_status_unique');
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
