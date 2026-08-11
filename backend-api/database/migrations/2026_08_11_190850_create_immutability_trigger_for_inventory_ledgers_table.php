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
                CREATE OR REPLACE FUNCTION inventoryLedgerImmutability()
                RETURNS TRIGGER AS $$
                BEGIN
                    RAISE EXCEPTION 'Inventory ledger records are strictly immutable at the database level.';
                END;
                $$ LANGUAGE plpgsql;
            ");

            DB::unprepared("
                DROP TRIGGER IF EXISTS trigger_inventory_ledger_immutability ON inventory_ledgers;
                CREATE TRIGGER trigger_inventory_ledger_immutability
                BEFORE UPDATE OR DELETE ON inventory_ledgers
                FOR EACH ROW EXECUTE FUNCTION inventoryLedgerImmutability();
            ");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP TRIGGER IF EXISTS trigger_inventory_ledger_immutability ON inventory_ledgers;");
        DB::statement("DROP FUNCTION IF EXISTS inventoryLedgerImmutability CASCADE;");
        Schema::dropIfExists('immutability_trigger_for_inventory_ledgers');
    }
};
