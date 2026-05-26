<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('site_hooks', function (Blueprint $table) {
            $table->foreign('site_id')->references('id')->on('sites')->cascadeOnDelete();
            $table->foreign('hook_id')->references('id')->on('hooks')->cascadeOnDelete();
            $table->unique(['site_id', 'hook_id']);
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
