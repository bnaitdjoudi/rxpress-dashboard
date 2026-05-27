<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $existingFKs = collect(DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_hooks' AND CONSTRAINT_TYPE = 'FOREIGN KEY'"))
            ->pluck('CONSTRAINT_NAME')->toArray();

        // 1. Drop site_id FK first so we can drop the composite unique index it relies on
        if (in_array('site_hooks_site_id_foreign', $existingFKs)) {
            Schema::table('site_hooks', function (Blueprint $table) {
                $table->dropForeign(['site_id']);
            });
        }

        // 2. Drop old unique index and hook column
        if (Schema::hasColumn('site_hooks', 'hook')) {
            Schema::table('site_hooks', function (Blueprint $table) {
                $hasOldUnique = collect(DB::select("SHOW INDEX FROM site_hooks WHERE Key_name = 'site_hooks_site_id_hook_unique'"))->isNotEmpty();
                if ($hasOldUnique) {
                    $table->dropIndex('site_hooks_site_id_hook_unique');
                }
                $table->dropColumn('hook');
            });
        }

        // 3. Add hook_id column
        if (!Schema::hasColumn('site_hooks', 'hook_id')) {
            Schema::table('site_hooks', function (Blueprint $table) {
                $table->unsignedBigInteger('hook_id')->nullable()->after('site_id');
            });
        }

        // 4. Re-add FK constraints and new unique index
        $existingFKs = collect(DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_hooks' AND CONSTRAINT_TYPE = 'FOREIGN KEY'"))
            ->pluck('CONSTRAINT_NAME')->toArray();

        Schema::table('site_hooks', function (Blueprint $table) use ($existingFKs) {
            if (!in_array('site_hooks_site_id_foreign', $existingFKs)) {
                $table->foreign('site_id')->references('id')->on('sites')->cascadeOnDelete();
            }
            if (!in_array('site_hooks_hook_id_foreign', $existingFKs)) {
                $table->foreign('hook_id')->references('id')->on('hooks')->cascadeOnDelete();
            }
            $hasUnique = collect(DB::select("SHOW INDEX FROM site_hooks WHERE Key_name = 'site_hooks_site_id_hook_id_unique'"))->isNotEmpty();
            if (!$hasUnique) {
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
