<?php

namespace App\Services;

use App\Models\Webhook;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class WebhookDispatchService
{
    /**
     * Envoie un événement vers l'URL du webhook avec toutes les sécurités.
     */
    public function send(Webhook $webhook, string $hookName, array $payload): void
    {
        $deliveryId = Str::uuid()->toString();
        $timestamp  = time();

        $body = $this->buildBody($webhook, $hookName, $payload, $deliveryId, $timestamp);
        $headers = $this->buildSecurityHeaders($webhook, $body, $timestamp, $deliveryId);
        $headers = $this->applyAuth($webhook, $headers);

        try {
            $response = Http::withHeaders($headers)
                ->withBody($body, $webhook->content_type ?? 'application/json')
                ->timeout(15)
                ->post($webhook->endpoint_url);

            $webhook->update([
                'last_called_at'    => now(),
                'last_status_code'  => $response->status(),
            ]);
        } catch (\Exception $e) {
            $webhook->update([
                'last_called_at'   => now(),
                'last_status_code' => 0,
            ]);

            throw $e;
        }
    }

    // -------------------------------------------------------------------------
    // Payload
    // -------------------------------------------------------------------------

    private function buildBody(
        Webhook $webhook,
        string $hookName,
        array $payload,
        string $deliveryId,
        int $timestamp
    ): string {
        $data = [
            'hook'        => $hookName,
            'timestamp'   => $timestamp,
            'delivery_id' => $deliveryId,
            'site_id'     => $webhook->site_id,
            'data'        => $payload,
        ];

        if (($webhook->content_type ?? '') === 'application/x-www-form-urlencoded') {
            return http_build_query($data);
        }

        return json_encode($data);
    }

    // -------------------------------------------------------------------------
    // Security headers
    // -------------------------------------------------------------------------

    /**
     * Construit les headers de sécurité RXpress :
     *
     *  X-Rxpress-Delivery   : UUID unique de la livraison
     *  X-Rxpress-Timestamp  : Unix timestamp (pour détecter les replays)
     *  X-Rxpress-Signature  : sha256=HMAC-SHA256(timestamp.body, secret)
     *
     * Vérification côté récepteur :
     *   1. Comparer X-Rxpress-Timestamp avec now() — rejeter si > 300 secondes
     *   2. Recalculer HMAC-SHA256(timestamp + '.' + raw_body, secret)
     *   3. Comparer avec la valeur après "sha256=" (comparaison constante)
     */
    private function buildSecurityHeaders(
        Webhook $webhook,
        string $body,
        int $timestamp,
        string $deliveryId
    ): array {
        $headers = [
            'Content-Type'       => $webhook->content_type ?? 'application/json',
            'User-Agent'         => 'RXpress-Webhook/1.0',
            'X-Rxpress-Delivery' => $deliveryId,
            'X-Rxpress-Timestamp' => (string) $timestamp,
        ];

        if ($webhook->secret) {
            $signaturePayload = $timestamp . '.' . $body;
            $signature = hash_hmac('sha256', $signaturePayload, $webhook->secret);
            $headers['X-Rxpress-Signature'] = 'sha256=' . $signature;
        }

        return $headers;
    }

    // -------------------------------------------------------------------------
    // Auth outgoing
    // -------------------------------------------------------------------------

    private function applyAuth(Webhook $webhook, array $headers): array
    {
        $config = $webhook->auth_config ?? [];

        switch ($webhook->auth_type) {
            case 'basic_auth':
                $headers['Authorization'] = 'Basic ' . base64_encode(
                    ($config['username'] ?? '') . ':' . ($config['password'] ?? '')
                );
                break;

            case 'application_password':
                $headers['Authorization'] = 'Basic ' . base64_encode(
                    ($config['username'] ?? '') . ':' . ($config['app_password'] ?? '')
                );
                break;

            case 'bearer_token':
                $headers['Authorization'] = 'Bearer ' . ($config['token'] ?? '');
                break;

            case 'api_key':
                $headerName = $config['header_name'] ?? 'X-API-Key';
                $headers[$headerName] = $config['api_key'] ?? '';
                break;

            case 'oauth2':
                $token = $this->fetchOAuth2Token($config);
                if ($token) {
                    $headers['Authorization'] = 'Bearer ' . $token;
                }
                break;
        }

        return $headers;
    }

    private function fetchOAuth2Token(array $config): ?string
    {
        $grantType = $config['grant_type'] ?? 'client_credentials';

        $params = [
            'grant_type'    => $grantType,
            'client_id'     => $config['client_id'] ?? '',
            'client_secret' => $config['client_secret'] ?? '',
        ];

        if ($grantType === 'password') {
            $params['username'] = $config['username'] ?? '';
            $params['password'] = $config['password'] ?? '';
        }

        try {
            $response = Http::asForm()->timeout(10)->post($config['token_url'] ?? '', $params);

            return $response->json('access_token');
        } catch (\Exception) {
            return null;
        }
    }
}
