<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->string('cf_record_id')->nullable()->after('stat');
            $table->string('custom_domain')->nullable()->after('cf_record_id');
            $table->string('cf_custom_record_id')->nullable()->after('custom_domain');
            $table->enum('custom_domain_status', ['pending', 'verified', 'failed'])->nullable()->after('cf_custom_record_id');
        });
    }

    public function down(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->dropColumn(['cf_record_id', 'custom_domain', 'cf_custom_record_id', 'custom_domain_status']);
        });
    }
};
