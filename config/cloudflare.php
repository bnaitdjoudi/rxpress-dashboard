<?php

return [
    'api_token'   => env('CLOUDFLARE_API_TOKEN'),
    'zone_id'     => env('CLOUDFLARE_ZONE_ID'),
    'base_domain' => env('CLOUDFLARE_BASE_DOMAIN', 'rxpress.io'),
    'server_ip'   => env('CLOUDFLARE_SERVER_IP'),
    'proxied'     => env('CLOUDFLARE_PROXIED', true),
];
