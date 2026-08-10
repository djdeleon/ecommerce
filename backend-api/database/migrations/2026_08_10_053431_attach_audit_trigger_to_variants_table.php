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
        DB::unprepared("
            DROP TRIGGER IF EXISTS audit_variants_insert_delete ON variants;
            CREATE TRIGGER audit_variants_insert_delete
            AFTER INSERT OR DELETE ON variants
            FOR EACH ROW
            EXECUTE FUNCTION process_audit();

            DROP TRIGGER IF EXISTS audit_variants_price_update ON variants;
            CREATE TRIGGER audit_variants_price_update
            AFTER UPDATE OF price ON variants
            FOR EACH ROW
            WHEN (OLD.price IS DISTINCT FROM NEW.price)
            EXECUTE FUNCTION process_audit();
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP TRIGGER IF EXISTS audit_variants_price_change ON variants;");
    }
};
