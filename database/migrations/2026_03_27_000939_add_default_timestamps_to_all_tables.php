<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private array $tables = ['users', 'sites', 'plans', 'prices', 'plan_price', 'plan_properties', 'personal_access_tokens'];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasColumn($table, 'created_at')) {
                DB::statement("ALTER TABLE `{$table}` ALTER COLUMN `created_at` SET DEFAULT CURRENT_TIMESTAMP");
            }
            if (Schema::hasColumn($table, 'updated_at')) {
                DB::statement("ALTER TABLE `{$table}` ALTER COLUMN `updated_at` SET DEFAULT CURRENT_TIMESTAMP");
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasColumn($table, 'created_at')) {
                DB::statement("ALTER TABLE `{$table}` ALTER COLUMN `created_at` DROP DEFAULT");
            }
            if (Schema::hasColumn($table, 'updated_at')) {
                DB::statement("ALTER TABLE `{$table}` ALTER COLUMN `updated_at` DROP DEFAULT");
            }
        }
    }
};
