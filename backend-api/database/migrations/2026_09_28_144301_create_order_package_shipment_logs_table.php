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
        Schema::create('order_package_shipment_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_package_id')->constrained()->restrictOnDelete();
            $table->string('tracking_number')->unique();
            $table->string('logistics_status')->default('pending_pickup');
            $table->string('sorting_code_cache');
            $table->string('routing_pipeline_cache');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_package_shipment_logs');
    }
};
