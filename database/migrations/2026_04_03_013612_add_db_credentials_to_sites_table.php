<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->string('db_name')->nullable()->after('hestia_user');
            $table->string('db_user')->nullable()->after('db_name');
            $table->string('db_pass')->nullable()->after('db_user');
        });
    }

    public function down(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->dropColumn(['db_name', 'db_user', 'db_pass']);
        });
    }
};
