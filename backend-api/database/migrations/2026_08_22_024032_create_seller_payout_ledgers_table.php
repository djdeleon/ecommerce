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
        Schema::create('seller_payout_ledgers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_item_id');
            $table->foreign('order_item_id')
                ->references('id')
                ->on('order_items')
                ->restrictOnDelete();
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
        Schema::dropIfExists('seller_payout_ledgers');
    }
};
