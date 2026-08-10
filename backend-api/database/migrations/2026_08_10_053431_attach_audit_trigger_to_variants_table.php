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
            DROP TRIGGER IF EXISTS audit_variants_price_change ON variants;
            CREATE TRIGGER audit_variants_price_change
            AFTER UPDATE OF price OR INSERT OR DELETE ON variants
            FOR EACH ROW
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
