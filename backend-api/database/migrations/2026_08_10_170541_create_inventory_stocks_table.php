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
        Schema::create('inventory_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('variant_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->morphs('inventorable');
            $table->unsignedSmallInteger('quantity_available')->default(0);
            $table->unsignedSmallInteger('quantity_reserved')->default(0);
            $table->timestamps();
            
            $table->unique(['variant_id', 'inventorable_type', 'inventorable_id'], 'variant_facility_unique');
        });

        DB::statement('ALTER TABLE inventory_stocks ADD CONSTRAINT check_quantity_available_non_negative CHECK (quantity_available >= 0)');
        DB::statement('ALTER TABLE inventory_stocks ADD CONSTRAINT check_quantity_reserved_non_negative CHECK (quantity_reserved >= 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_stocks');
    }
};
