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
        DB::transaction(function () {
            DB::statement("
                CREATE OR REPLACE FUNCTION immutability()
                RETURNS TRIGGER AS $$
                BEGIN
                    RAISE EXCEPTION 'Audit trail log entries are strictly immutable.';
                END;
                $$ LANGUAGE plpgsql;
            ");

            DB::unprepared("
                DROP TRIGGER IF EXISTS trigger_immutability ON product_price_ledgers;
                CREATE TRIGGER trigger_immutability
                BEFORE UPDATE OR DELETE ON product_price_ledgers
                FOR EACH ROW EXECUTE FUNCTION immutability();
            ");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP TRIGGER IF EXISTS trigger_immutability ON product_price_ledgers;");
        DB::statement("DROP FUNCTION IF EXISTS immutability CASCADE;");
        Schema::dropIfExists('immutability_trigger_for_product_price_ledgers');
    }
};
