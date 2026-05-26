<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('sites')->where('user_id', 2)->delete();
    }

    public function down(): void
    {
        // Données de test — pas de rollback
    }
};
