<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // frequence already exists in create_prices_table on fresh installs
        if (Schema::hasColumn('prices', 'frequence')) {
            return;
        }

        Schema::table('prices', function (Blueprint $table) {
            $after = Schema::hasColumn('prices', 'period') ? 'period' : null;
            $col = $table->enum('frequence', ['mensuel', 'annuel', 'unique'])->default('annuel');
            if ($after) {
                $col->after($after);
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('prices', 'frequence')) {
            Schema::table('prices', function (Blueprint $table) {
                $table->dropColumn('frequence');
            });
        }
    }
};
