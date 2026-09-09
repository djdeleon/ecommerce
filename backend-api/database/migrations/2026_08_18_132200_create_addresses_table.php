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
        Schema::create('regions', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->autoIncrement()->primary();
            $table->string('code', 10)->unique();
            $table->string('correspondence_code', 10);
            $table->string('name');
            $table->string('slug', 15)->nullable();
            $table->string('zone', 15)->nullable();
            $table->timestamps();
        });

        Schema::create('provinces', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->autoIncrement()->primary();
            $table->string('code', 10)->unique();
            $table->string('correspondence_code', 10);
            $table->string('name');
            $table->unsignedTinyInteger('region_id');
            $table->foreign('region_id')
                ->references('id')
                ->on('regions')
                ->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('cities', function (Blueprint $table) {
            $table->unsignedSmallInteger('id')->autoIncrement()->primary();
            $table->string('code', 10)->unique();
            $table->string('correspondence_code', 10);
            $table->string('name');
            $table->unsignedTinyInteger('province_id')->nullable()->index();;
            $table->foreign('province_id')
                ->references('id')
                ->on('provinces')
                ->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('barangays', function (Blueprint $table) {
            $table->unsignedMediumInteger('id')->autoIncrement()->primary();
            $table->string('code', 10)->unique();
            $table->string('correspondence_code', 10);
            $table->string('name');
            $table->unsignedSmallInteger('city_id')->index();
            $table->foreign('city_id')
                ->references('id')
                ->on('cities')
                ->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('regions');
        Schema::dropIfExists('provinces');
        Schema::dropIfExists('cities');
        Schema::dropIfExists('barangays');
    }
};
