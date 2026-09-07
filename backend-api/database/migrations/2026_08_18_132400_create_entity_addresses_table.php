<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('entity_addresses', function (Blueprint $table) {
            $table->id();
            $table->morphs('addressable');
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
            $table->string('street_address')->nullable();
            $table->string('zip_code')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamps();
        });

        DB::statement("
            CREATE UNIQUE INDEX unique_warehouse_address
            ON entity_addresses (addressable_type, addressable_id)
            WHERE addressable_type = 'App\\Models\\Warehouse';
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entity_addresses');
    }
};
