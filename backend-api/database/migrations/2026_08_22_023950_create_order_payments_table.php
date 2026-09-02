<?php

use App\Enums\OrderPaymentStatus;
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
        Schema::create('order_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->restrictOnDelete();
            $table->string('payment_method');
            $table->string('transaction_reference');
            $table->decimal('amount_paid', 10, 4);
            $table->string('gateway_reference');

            $table->decimal('transaction_fee', 10, 4)->default(0.000);
            $table->decimal('net_amount', 10, 4)->default(0.000);
            $table->jsonb('gateway_response')->nullable();

            $table->string('status', 20)->default(OrderPaymentStatus::PENDING);
            $table->timestamps();

            $table->unique(['id', 'order_id', 'gateway_reference'], 'gateway_ref_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_payments');
    }
};
