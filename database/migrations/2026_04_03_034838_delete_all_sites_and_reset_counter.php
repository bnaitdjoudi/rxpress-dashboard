<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('sites')->delete();

        DB::table('sub_usage_options')
            ->whereIn('plan_usage_option_limit_id', function ($q) {
                $q->select('id')->from('plan_usage_option_limits')->where('limit_name', 'site');
            })
            ->update(['used' => 0]);
    }

    public function down(): void {}
};
