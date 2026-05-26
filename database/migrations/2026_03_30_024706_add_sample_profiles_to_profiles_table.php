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
        // Ajout de profils exemples
        DB::table('profiles')->insert([
            [
                'user_id' => 1,
                'phone' => '+33612345678',
                'avatar' => null,
                'bio' => 'Développeuse web passionnée',
                'address' => '12 rue de Paris',
                'city' => 'Paris',
                'country' => 'France',
                'postal_code' => '75001',
                'company' => 'WebTech',
                'website' => 'https://alice.dev',
                'created_at' => now(),
                'updated_at' => now(),
            ],

        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            //
        });
    }
};
