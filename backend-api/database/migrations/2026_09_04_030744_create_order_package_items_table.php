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
        Schema::create('order_package_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_package_id')->constrained()->restrictOnDelete();
            $table->foreignId('variant_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('ordered_quantity');
            $table->decimal('price_at_purchased', 10, 4);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_package_items');
    }
};
