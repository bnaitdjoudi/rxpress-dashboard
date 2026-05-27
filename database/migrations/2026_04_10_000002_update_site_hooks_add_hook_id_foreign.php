<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('site_hooks', function (Blueprint $table) {
            // site_id foreign key already created in create_site_hooks_table
            $existingFKs = collect(DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_hooks' AND CONSTRAINT_TYPE = 'FOREIGN KEY'"))
                ->pluck('CONSTRAINT_NAME')->toArray();

            if (!in_array('site_hooks_site_id_foreign', $existingFKs)) {
                $table->foreign('site_id')->references('id')->on('sites')->cascadeOnDelete();
            }
            if (!in_array('site_hooks_hook_id_foreign', $existingFKs)) {
                $table->foreign('hook_id')->references('id')->on('hooks')->cascadeOnDelete();
            }

            $existingIndexes = collect(DB::select("SHOW INDEX FROM site_hooks WHERE Key_name = 'site_hooks_site_id_hook_id_unique'"));
            if ($existingIndexes->isEmpty()) {
                $table->unique(['site_id', 'hook_id']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('site_hooks', function (Blueprint $table) {
            $table->dropUnique(['site_id', 'hook_id']);
            $table->dropForeign(['hook_id']);
            $table->dropForeign(['site_id']);

            $table->string('hook')->after('site_id');
            $table->unique(['site_id', 'hook']);
            $table->dropColumn('hook_id');
        });
    }
};
