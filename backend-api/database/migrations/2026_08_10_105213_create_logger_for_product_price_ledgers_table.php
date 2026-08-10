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
                CREATE OR REPLACE FUNCTION variant_price_logger()
                RETURNS TRIGGER AS $$
                DECLARE
                    actor_id BIGINT;
                BEGIN
                    BEGIN
                        actor_id := NULLIF(current_setting('app.current_user_id', true), '')::BIGINT;
                    EXCEPTION WHEN OTHERS THEN
                        actor_id := NULL;
                    END;

                    IF (TG_OP = 'INSERT') THEN
                        INSERT INTO product_price_ledgers(action, variant_id, old_price, new_price, changed_by_id)
                        VALUES ('INSERT', NEW.id, NULL, NEW.price, actor_id);
                        RETURN NEW;
                    ELSIF (TG_OP = 'UPDATE') THEN
                        INSERT INTO product_price_ledgers(action, variant_id, old_price, new_price, changed_by_id)
                        VALUES ('UPDATE', NEW.id, OLD.price, NEW.price, actor_id);
                        RETURN NEW;
                    ELSIF (TG_OP = 'DELETE') THEN
                        INSERT INTO product_price_ledgers(action, variant_id, old_price, new_price, changed_by_id)
                        VALUES ('DELETE', OLD.id, OLD.price, NULL, actor_id);
                        RETURN OLD;
                    END IF;

                    RETURN NULL;

                END;
                $$ LANGUAGE plpgsql;
            ");

            DB::unprepared("
                DROP TRIGGER IF EXISTS trigger_variant_price_logger_insert_delete ON variants;
                CREATE TRIGGER trigger_variant_price_logger_insert_delete
                AFTER INSERT OR DELETE ON variants
                FOR EACH ROW
                EXECUTE FUNCTION variant_price_logger();

                DROP TRIGGER IF EXISTS trigger_variant_price_logger_update ON variants;
                CREATE TRIGGER trigger_variant_price_logger_update
                AFTER UPDATE OF price ON variants
                FOR EACH ROW
                WHEN (OLD.price is DISTINCT FROM NEW.price)
                EXECUTE FUNCTION variant_price_logger();
            ");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP TRIGGER IF EXISTS trigger_variant_price_logger_insert_delete ON variants;");
        DB::statement("DROP TRIGGER IF EXISTS trigger_variant_price_logger_update ON variants;");
        DB::statement("DROP FUNCTION IF EXISTS variant_price_logger;");
        Schema::dropIfExists('logger_for_product_price_ledgers');
    }
};
