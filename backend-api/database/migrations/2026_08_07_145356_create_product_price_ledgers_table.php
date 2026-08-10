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
        Schema::create('product_price_ledgers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('variant_id');
            $table->foreign('variant_id')
                ->references('id')
                ->on('variants')
                ->onDelete('cascade');
            $table->decimal('old_price', 12, 4)->nullable();
            $table->decimal('new_price', 12, 4);
            $table->unsignedBigInteger('changed_by_id')->nullable();
            $table->foreign('changed_by_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_price_ledgers');
    }
};
