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
        Schema::create('customer_addresses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->restrictOnDelete();
            $table->string('recipient_name')->nullable();
            $table->string('phone_number');
            $table->unsignedTinyInteger('region_id');
            $table->foreign('region_id')
                ->references('id')
                ->on('regions');
            $table->unsignedTinyInteger('province_id')->nullable();
            $table->foreign('province_id')
                ->references('id')
                ->on('provinces');
            $table->unsignedSmallInteger('city_id');
            $table->foreign('city_id')
                ->references('id')
                ->on('cities');
            $table->unsignedMediumInteger('barangay_id');
            $table->foreign('barangay_id')
                ->references('id')
                ->on('barangays');
            $table->string('street_address');
            $table->string('zip_code')->nullable();
            $table->boolean('is_default')->default(false);
            $table->string('label')->default('home');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_addresses');
    }
};
