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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->restrictOnDelete();
            $table->unsignedBigInteger('variant_id');
            $table->foreign('variant_id')
                ->references('id')
                ->on('variants')
                ->restrictOnDelete();
            $table->unsignedInteger('vendor_id');
            $table->foreign('vendor_id')
                ->references('id')
                ->on('vendors')
                ->restrictOnDelete();
            $table->unsignedSmallInteger('quantity_ordered');
            $table->decimal('price_at_purchased', 12, 4);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
