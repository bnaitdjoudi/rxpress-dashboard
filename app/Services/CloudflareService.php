<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CloudflareService
{
    private string $apiToken;
    private string $zoneId;
    private string $baseDomain;
    private string $serverIp;
    private bool   $proxied;

    private const BASE_URL = 'https://api.cloudflare.com/client/v4';

    public function __construct()
    {
        $this->apiToken   = config('cloudflare.api_token');
        $this->zoneId     = config('cloudflare.zone_id');
        $this->baseDomain = config('cloudflare.base_domain');
        $this->serverIp   = config('cloudflare.server_ip');
        $this->proxied    = (bool) config('cloudflare.proxied', true);
    }

    // ── Sous-domaine automatique ──────────────────────────────────────────────

    /**
     * Crée un enregistrement A pour un sous-domaine de la plateforme.
     * Ex: u0000005-s0000008.rxpress.io → server_ip
     * Retourne le record_id Cloudflare.
     */
    public function createSubdomain(string $subdomain): string
    {
        $name = "{$subdomain}.{$this->baseDomain}";

        $response = $this->request('POST', "zones/{$this->zoneId}/dns_records", [
            'type'    => 'A',
            'name'    => $name,
            'content' => $this->serverIp,
            'ttl'     => 1,
            'proxied' => $this->proxied,
        ]);

        Log::info("Cloudflare: A record created for {$name}", ['id' => $response['id']]);

        return $response['id'];
    }

    /**
     * Supprime un enregistrement DNS par son record_id.
     */
    public function deleteRecord(string $recordId): void
    {
        $this->request('DELETE', "zones/{$this->zoneId}/dns_records/{$recordId}");
        Log::info("Cloudflare: record {$recordId} deleted");
    }

    /**
     * Active ou désactive le proxy Cloudflare sur un enregistrement.
     */
    public function setProxy(string $recordId, bool $proxied): void
    {
        $this->request('PATCH', "zones/{$this->zoneId}/dns_records/{$recordId}", [
            'proxied' => $proxied,
        ]);
    }

    // ── Domaine custom du client ──────────────────────────────────────────────

    /**
     * Crée un enregistrement CNAME pour le domaine custom d'un client.
     * Ex: www.client.com → u0000005-s0000008.rxpress.io
     * Retourne le record_id Cloudflare.
     *
     * NOTE : fonctionne uniquement si le domaine client est dans la même zone Cloudflare.
     * Pour un domaine externe, le client doit ajouter le CNAME lui-même.
     */
    public function createCustomCname(string $customDomain, string $targetSubdomain): string
    {
        $response = $this->request('POST', "zones/{$this->zoneId}/dns_records", [
            'type'    => 'CNAME',
            'name'    => $customDomain,
            'content' => "{$targetSubdomain}.{$this->baseDomain}",
            'ttl'     => 1,
            'proxied' => $this->proxied,
        ]);

        Log::info("Cloudflare: CNAME created {$customDomain} → {$targetSubdomain}.{$this->baseDomain}");

        return $response['id'];
    }

    /**
     * Vérifie qu'un domaine externe résout bien vers la plateforme.
     * Retourne true si le CNAME ou A record pointe vers notre IP/domaine.
     */
    public function verifyCustomDomain(string $customDomain, string $expectedTarget): bool
    {
        $records = dns_get_record($customDomain, DNS_CNAME | DNS_A);

        foreach ($records as $record) {
            if (isset($record['target']) && str_contains($record['target'], $expectedTarget)) {
                return true;
            }
            if (isset($record['ip']) && $record['ip'] === $this->serverIp) {
                return true;
            }
        }

        return false;
    }

    /**
     * Retourne les informations d'un enregistrement DNS.
     */
    public function getRecord(string $recordId): array
    {
        return $this->request('GET', "zones/{$this->zoneId}/dns_records/{$recordId}");
    }

    // ── HTTP helper ───────────────────────────────────────────────────────────

    private function request(string $method, string $endpoint, array $body = []): array
    {
        $request = Http::withToken($this->apiToken)
            ->acceptJson();

        $url = self::BASE_URL . '/' . $endpoint;

        $response = match (strtoupper($method)) {
            'GET'    => $request->get($url),
            'POST'   => $request->post($url, $body),
            'PATCH'  => $request->patch($url, $body),
            'DELETE' => $request->delete($url),
            default  => throw new \InvalidArgumentException("Unsupported method: {$method}"),
        };

        if ($response->failed()) {
            $errors = $response->json('errors', []);
            $msg    = collect($errors)->pluck('message')->implode(', ') ?: $response->body();
            Log::error("Cloudflare API error [{$method} {$endpoint}]", ['errors' => $errors]);
            throw new \RuntimeException("Cloudflare API error: {$msg}");
        }

        return $response->json('result', []);
    }
}
