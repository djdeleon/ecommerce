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
        Schema::create('order_item_statuses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_item_id');
            $table->foreign('order_item_id')
                ->references('id')
                ->on('order_items')
                ->restrictOnDelete();
            $table->string('status', 20);
            $table->unsignedBigInteger('changed_by_id')->nullable();
            $table->foreign('changed_by_id')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->text('notes');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_item_statuses');
    }
};
