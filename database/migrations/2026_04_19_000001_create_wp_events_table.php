<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wp_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_id', 36)->nullable()->index();
            $table->string('hook', 100)->index();
            $table->string('site_url', 255)->index();
            $table->string('compte', 100)->nullable()->index();
            $table->unsignedInteger('user_id')->default(0);
            $table->json('args')->nullable();
            $table->timestamp('wp_timestamp')->nullable();
            $table->timestamps();

            $table->index('created_at');
            $table->index(['site_url', 'hook']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wp_events');
    }
};
