<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('webhooks', function (Blueprint $table) {
            $table->string('name')->nullable()->after('site_id');
            $table->string('auth_type')->default('none')->after('event');
            $table->text('auth_config')->nullable()->after('auth_type');
            $table->string('content_type')->default('application/json')->after('auth_config');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('webhooks', function (Blueprint $table) {
            $table->dropColumn(['name', 'auth_type', 'auth_config', 'content_type']);
        });
    }
};
