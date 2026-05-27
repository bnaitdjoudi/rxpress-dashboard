<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Dev-only cleanup — skip on fresh installs where tables are already empty
        if (DB::table('sites')->count() === 0) {
            return;
        }

        DB::table('sites')->delete();

        DB::table('sub_usage_options')
            ->whereIn('plan_usage_option_limit_id', function ($q) {
                $q->select('id')->from('plan_usage_option_limits')->where('limit_name', 'site');
            })
            ->update(['used' => 0]);
    }

    public function down(): void
    {
        // Données de test — pas de rollback
    }
};
