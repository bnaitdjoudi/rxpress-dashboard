<?php

return [
    'redis_host'       => env('REACTIVEWP_REDIS_HOST', '127.0.0.1'),
    'redis_port'       => env('REACTIVEWP_REDIS_PORT', '6379'),
    'redis_password'   => env('REACTIVEWP_REDIS_PASSWORD', ''),
    'redis_queue_name' => env('REACTIVEWP_REDIS_QUEUE_NAME', 'wpreactive_exchange'),
    'redis_db'         => env('REACTIVEWP_REDIS_DB', '1'),
];
