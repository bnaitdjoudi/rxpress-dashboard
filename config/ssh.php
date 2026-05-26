<?php

return [
    'wp_cli'         => env('WP_CLI_PATH', '/usr/local/bin/wp'),
    'plugin_zip_dir' => env('PLUGIN_ZIP_DIR', '/srv/jail/cpserver/data/plugins'),
    'host'     => env('SSH_HOST', 'localhost'),
    'port'     => (int) env('SSH_PORT', 22),
    'username' => env('SSH_USERNAME'),

    // Authentification par clé RSA (recommandé)
    // Générer : ssh-keygen -t ed25519 -f /etc/rxpress/ssh_id -C "rxpress-dashboard"
    // Déployer : ssh-copy-id -i /etc/rxpress/ssh_id.pub rxpress-deploy@<hestia-host>
    'private_key_path'       => env('SSH_PRIVATE_KEY_PATH'),       // ex: /etc/rxpress/ssh_id
    'private_key_passphrase' => env('SSH_PRIVATE_KEY_PASSPHRASE'), // null si pas de passphrase

    // Fallback mot de passe (déprécié — retirer SSH_PASSWORD du .env après migration)
    'password' => env('SSH_PASSWORD'),

    'db_server' => [
        'type'      => env('DB_SERVER_TYPE', 'mariadb'),
        'root_user' => env('DB_SERVER_ROOT_USER', 'root'),
        'root_pass' => env('DB_SERVER_ROOT_PASS', ''),
    ],

    'reactivewp' => [
        'redis_host'       => env('REACTIVEWP_REDIS_HOST', '127.0.0.1'),
        'redis_port'       => env('REACTIVEWP_REDIS_PORT', '6379'),
        'redis_password'   => env('REACTIVEWP_REDIS_PASSWORD', ''),
        'redis_queue_name' => env('REACTIVEWP_REDIS_QUEUE_NAME', 'wpreactive_exchange'),
        'redis_db'         => env('REACTIVEWP_REDIS_DB', '1'),
    ],
];
