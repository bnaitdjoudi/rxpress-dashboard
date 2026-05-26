<?php

namespace App\Jobs;

use App\Models\Webhook;
use App\Services\WebhookDispatchService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DispatchWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Nombre de tentatives avant abandon.
     * Backoff exponentiel : 1 min → 5 min → 30 min
     */
    public int $tries = 3;

    public array $backoff = [60, 300, 1800];

    public function __construct(
        public readonly Webhook $webhook,
        public readonly string $hookName,
        public readonly array $payload = [],
    ) {}

    public function handle(WebhookDispatchService $service): void
    {
        if (!$this->webhook->active) {
            return;
        }

        $service->send($this->webhook, $this->hookName, $this->payload);
    }

    public function failed(\Throwable $e): void
    {
        $this->webhook->update([
            'last_called_at'   => now(),
            'last_status_code' => 0,
        ]);
    }
}
