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
            DB::statement("CREATE SCHEMA IF NOT EXISTS audit_trail;");
            
            DB::statement("
                CREATE TABLE IF NOT EXISTS audit_trail.history_logs (
                    id BIGSERIAL PRIMARY KEY,
                    table_name VARCHAR(100) NOT NULL,
                    action VARCHAR(10) NOT NULL,
                    record_id BIGINT NOT NULL,
                    old_data JSONB,
                    new_data JSONB,
                    changed_by_id BIGINT,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            ");

            DB::statement("
                CREATE OR REPLACE FUNCTION process_audit()
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
                        INSERT INTO audit_trail.history_logs(table_name, action, record_id, old_data, new_data, changed_by_id)
                        VALUES (TG_TABLE_NAME::text, 'INSERT', NEW.id, NULL, to_jsonb(NEW), actor_id);
                        RETURN NEW;
                    ELSIF (TG_OP = 'UPDATE') THEN
                        INSERT INTO audit_trail.history_logs(table_name, action, record_id, old_data, new_data, changed_by_id)
                        VALUES (TG_TABLE_NAME::text, 'UPDATE', NEW.id, to_jsonb(OLD), to_jsonb(NEW), actor_id);
                        RETURN NEW;
                    ELSIF (TG_OP = 'DELETE') THEN
                        INSERT INTO audit_trail.history_logs(table_name, action, record_id, old_data, new_data, changed_by_id)
                        VALUES (TG_TABLE_NAME::text, 'DELETE', OLD.id, to_jsonb(OLD), NULL, actor_id);
                        RETURN OLD;
                    END IF;

                    RETURN NULL;

                END;
                $$ LANGUAGE plpgsql;
            ");

            // Immutability Trigger on history_logs
            DB::statement("
                CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
                RETURNS TRIGGER AS $$
                BEGIN
                    RAISE EXCEPTION 'Audit trail log entries are strictly immutable.';
                END;
                $$ LANGUAGE plpgsql;
            ");

            DB::unprepared("
                DROP TRIGGER IF EXISTS prevent_history_log_mutation ON audit_trail.history_logs;
                CREATE TRIGGER prevent_history_log_mutation
                BEFORE UPDATE OR DELETE ON audit_trail.history_logs
                FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
            ");

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP TRIGGER IF EXISTS prevent_history_log_mutation ON audit_trail.history_logs;");
        DB::statement("DROP FUNCTION IF EXISTS prevent_audit_log_mutation CASCADE;");
        DB::statement("DROP SCHEMA IF EXISTS audit_trail CASCADE;");
    }
};
