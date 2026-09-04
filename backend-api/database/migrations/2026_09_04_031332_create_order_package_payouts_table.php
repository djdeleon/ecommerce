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
        Schema::create('order_package_payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_package_id')->constrained()->restrictOnDelete();
            $table->foreignId('vendor_id')->constrained()->restrictOnDelete();
            $table->decimal('gross_amount', 10, 4);
            $table->decimal('platform_commission_fee', 10, 4);
            $table->decimal('net_payout_amount', 10, 4);
            $table->string('status', 20);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_package_payouts');
    }
};
