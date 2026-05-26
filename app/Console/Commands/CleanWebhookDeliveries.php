<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanWebhookDeliveries extends Command
{
    protected $signature = 'webhooks:clean {--days=3 : Nombre de jours de rétention}';
    protected $description = 'Supprime les webhook_deliveries plus anciens que N jours';

    public function handle(): int
    {
        $days = (int) $this->option('days');

        $deleted = DB::table('webhook_deliveries')
            ->where('created_at', '<', now()->subDays($days))
            ->delete();

        $this->info("webhook_deliveries supprimés : {$deleted} (rétention = {$days} jours)");

        return self::SUCCESS;
    }
}
