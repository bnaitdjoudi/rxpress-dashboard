<?php

namespace App\Services;

use App\Models\WebhookDelivery;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use Illuminate\Support\Str;

class WebhookReplayService
{
    public function publish(WebhookDelivery $delivery): void
    {
        $webhook = $delivery->webhook;

        $deliveryId = (string) Str::uuid();
        $timestamp  = time();

        $headers = [
            'Content-Type'        => $webhook->content_type ?? 'application/json',
            'User-Agent'          => 'RXpress-Webhook/1.0',
            'X-Rxpress-Delivery'  => $deliveryId,
            'X-Rxpress-Timestamp' => (string) $timestamp,
            'X-Rxpress-Replay'    => '1',
        ];

        if ($webhook->secret) {
            $headers['X-Rxpress-Signature'] = 'sha256=' . hash_hmac(
                'sha256',
                $timestamp . '.' . $delivery->request_body,
                $webhook->secret
            );
        }

        $oauth2Config = null;
        $authConfig   = $webhook->auth_config ?? [];

        match ($webhook->auth_type) {
            'basic_auth'           => $headers['Authorization'] = 'Basic ' . base64_encode(($authConfig['username'] ?? '') . ':' . ($authConfig['password'] ?? '')),
            'application_password' => $headers['Authorization'] = 'Basic ' . base64_encode(($authConfig['username'] ?? '') . ':' . ($authConfig['app_password'] ?? '')),
            'bearer_token'         => $headers['Authorization'] = 'Bearer ' . ($authConfig['token'] ?? ''),
            'api_key'              => $headers[$authConfig['header_name'] ?? 'X-API-Key'] = $authConfig['api_key'] ?? '',
            'oauth2'               => $oauth2Config = [
                'grant_type'    => $authConfig['grant_type'] ?? 'client_credentials',
                'token_url'     => $authConfig['token_url'] ?? '',
                'client_id'     => $authConfig['client_id'] ?? '',
                'client_secret' => $authConfig['client_secret'] ?? '',
                'username'      => $authConfig['username'] ?? '',
                'password'      => $authConfig['password'] ?? '',
            ],
            default => null,
        };

        $sendRequest = [
            'webhook_id'    => $delivery->webhook_id,
            'url'           => $delivery->endpoint_url,
            'method'        => 'POST',
            'headers'       => $headers,
            'body'          => $delivery->request_body,
            'max_attempts'  => 3,
            'oauth2_config' => $oauth2Config,
        ];

        $conn = new AMQPStreamConnection(
            host:     env('LAVINMQ_HOST', '192.168.0.16'),
            port:     (int) env('LAVINMQ_PORT', 30672),
            user:     env('LAVINMQ_USER', 'admin'),
            password: env('LAVINMQ_PASSWORD', 'adminpassword'),
            vhost:    env('LAVINMQ_VHOST', '/'),
        );

        $ch = $conn->channel();
        $ch->exchange_declare(
            exchange: env('LAVINMQ_SENDER_EXCHANGE', 'webhook_sender'),
            type: 'direct',
            durable: true,
        );

        $ch->basic_publish(
            msg: new AMQPMessage(
                body: json_encode($sendRequest),
                properties: ['content_type' => 'application/json', 'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT]
            ),
            exchange: env('LAVINMQ_SENDER_EXCHANGE', 'webhook_sender'),
            routing_key: 'send',
        );

        $ch->close();
        $conn->close();
    }
}
