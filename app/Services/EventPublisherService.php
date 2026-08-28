<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;

/**
 * Publie les événements reçus du plugin ReactiveWP (via l'API REST) dans le même
 * Redis Stream que consommait auparavant directement le plugin — préserve tout le
 * pipeline aval (worker-redis-mpq -> LavinMQ -> dispatcher-worker -> sender-worker)
 * sans modification.
 */
class EventPublisherService
{
    public function publish(array $eventData): void
    {
        $queue = config('reactivewp.redis_queue_name', 'wpreactive_exchange');
        $json = json_encode($eventData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        // executeRaw envoie la commande telle quelle au serveur Redis, ce qui évite
        // les divergences de signature de la méthode xadd() entre les clients
        // phpredis et predis (ce dernier étant celui configuré via REDIS_CLIENT).
        Redis::executeRaw([
            'XADD', "{$queue}:stream", 'MAXLEN', '~', '10000', '*', 'data', $json,
        ]);
    }
}
