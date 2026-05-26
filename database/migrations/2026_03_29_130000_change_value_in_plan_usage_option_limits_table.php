<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('plan_usage_option_limits', function (Blueprint $table) {
            $table->decimal('value', 10, 2)->change();
        });
    }

    public function down(): void
    {
        Schema::table('plan_usage_option_limits', function (Blueprint $table) {
            $table->unsignedInteger('value')->change();
        });
    }
};
