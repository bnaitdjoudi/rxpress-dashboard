<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->unsignedInteger('storage_mb')->default(1024)->after('stat');
            $table->unsignedInteger('bandwidth_mbps')->default(10)->after('storage_mb');
        });
    }

    public function down(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->dropColumn(['storage_mb', 'bandwidth_mbps']);
        });
    }
};
