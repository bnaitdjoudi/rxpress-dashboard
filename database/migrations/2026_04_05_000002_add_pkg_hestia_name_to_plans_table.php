<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->string('pkg_hestia_name')->nullable()->after('id');
        });

        // Remplir la valeur pour les plans existants
        DB::table('plans')->get()->each(function ($plan) {
            DB::table('plans')
                ->where('id', $plan->id)
                ->update(['pkg_hestia_name' => 'plan-client-plan-' . $plan->id]);
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn('pkg_hestia_name');
        });
    }
};
