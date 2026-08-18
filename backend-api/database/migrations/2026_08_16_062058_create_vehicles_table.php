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
        Schema::create('vehicles', function (Blueprint $table) {
            $table->unsignedSmallInteger('id')->autoIncrement()->primary();
            $table->unsignedSmallInteger('driver_id');
            $table->foreign('driver_id')
                ->references('id')
                ->on('drivers')
                ->restrictOnDelete();
            $table->string('plate_number', 20)->unique();
            $table->string('type');
            $table->timestamps();

            $table->unique(['driver_id', 'plate_number', 'type'], 'driver_vehicle_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
