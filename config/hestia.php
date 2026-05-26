<?php

return [
    'enabled'    => env('HESTIA_ENABLED', true),
    'host'       => env('HESTIA_HOST', 'localhost'),
    'port'       => env('HESTIA_PORT', 8083),
    'access_key' => env('HESTIA_ACCESS_KEY'),
    'secret_key' => env('HESTIA_SECRET_KEY'),
    'user'        => env('HESTIA_USER', 'admin'),
    'base_domain' => env('HESTIA_BASE_DOMAIN', 'naitech.local'),
    'ns1'         => env('HESTIA_NS1', 'ns1.naitech.local'),
    'ns2'         => env('HESTIA_NS2', 'ns2.naitech.local'),
];
