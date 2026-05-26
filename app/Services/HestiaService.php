<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class HestiaService
{
    private SshService $ssh;
    private string $hestiaAdmin;

    public function __construct(SshService $ssh)
    {
        $this->ssh = $ssh;
        $this->hestiaAdmin = config('hestia.user', 'cpserver');
    }

    /**
     * Exécute une commande HestiaCP CLI via SSH.
     */
    private function run(string $cmd, array $args = []): string
    {
        $escapedArgs = array_map('escapeshellarg', $args);
        $command = 'sudo /usr/local/hestia/bin/' . $cmd . ' ' . implode(' ', $escapedArgs);

        Log::info("HestiaCP SSH [{$cmd}]", ['command' => $command]);

        $output = $this->ssh->exec($command, true);

        Log::info("HestiaCP SSH [{$cmd}] output", ['output' => $output]);

        return $output;
    }

    /**
     * Crée un package HestiaCP avec les limites de stockage et bande passante.
     * v-add-package PACKAGE DISK BW WEB DNS MAIL DB CRON BACKUPS QUOTA SUSPEND
     */
    public function addPackage(string $packageName, int $storageMb, int $bandwidthMb): string
    {
        return $this->run('add-package', [
            $packageName,       // PACKAGE
            (string) $storageMb,   // DISK (MB)
            (string) $bandwidthMb, // BW (MB)
        ]);
    }

    /**
     * Crée un utilisateur sur HestiaCP via l'API REST.
     */
    public function addUser(string $user, string $password, string $email, string $package = 'default'): void
    {
        $host      = config('hestia.host');
        $port      = config('hestia.port', 8083);
        $accessKey = config('hestia.access_key');
        $secretKey = config('hestia.secret_key');

        $response = \Illuminate\Support\Facades\Http::withOptions(['verify' => false])
            ->asForm()
            ->post("https://{$host}:{$port}/api/", [
                'hash' => "{$accessKey}:{$secretKey}",
                'cmd'  => 'v-add-user',
                'arg1' => $user,
                'arg2' => $password,
                'arg3' => $email,
                'arg4' => $package,
            ]);

        $body = trim($response->body());

        if ($response->failed() || ($body !== '' && $body !== '0')) {
            throw new \RuntimeException("HestiaCP API error: {$body}");
        }
    }

    /**
     * Vérifie si un utilisateur existe dans HestiaCP.
     */
    public function userExists(string $user): bool
    {
        try {
            $data = $this->listUser($user);
            return !empty($data);
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Change le mot de passe d'un utilisateur HestiaCP via l'API REST.
     */
    public function changeUserPassword(string $user, string $password): void
    {
        $host      = config('hestia.host');
        $port      = config('hestia.port', 8083);
        $accessKey = config('hestia.access_key');
        $secretKey = config('hestia.secret_key');

        $response = \Illuminate\Support\Facades\Http::withOptions(['verify' => false])
            ->asForm()
            ->post("https://{$host}:{$port}/api/", [
                'hash' => "{$accessKey}:{$secretKey}",
                'cmd'  => 'v-change-user-password',
                'arg1' => $user,
                'arg2' => $password,
            ]);

        $body = trim($response->body());

        if ($response->failed() || ($body !== '' && $body !== '0')) {
            throw new \RuntimeException("HestiaCP API error: {$body}");
        }
    }

    /**
     * Crée un domaine web sur HestiaCP.
     * Returns the HestiaCP user that owns the domain (may fall back to admin if the
     * base domain belongs to a different user — exit 4).
     */
    public function addDomain(string $user, string $domain): string
    {
        try {
            $this->run('v-add-web-domain', [$user, $domain]);
            return $user;
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'belongs to a different user') && $user !== $this->hestiaAdmin) {
                $this->run('v-add-web-domain', [$this->hestiaAdmin, $domain]);
                return $this->hestiaAdmin;
            }
            throw $e;
        }
    }

    /**
     * Crée une base de données sur HestiaCP.
     */
    public function addDatabase(string $user, string $dbName, string $dbUser, string $dbPass): string
    {
        return $this->run('v-add-database', [$user, $dbName, $dbUser, $dbPass]);
    }

    /**
     * Change le mot de passe d'une base de données HestiaCP.
     */
    public function changeDatabasePassword(string $user, string $dbName, string $newPass): string
    {
        return $this->run('v-change-database-password', [$user, $dbName, $newPass]);
    }

    /**
     * Installe un certificat SSL wildcard sur un domaine web.
     * v-add-web-domain-ssl attend un dossier contenant {domain}.crt et {domain}.key.
     * On copie le wildcard cert dans /tmp avec le nom du sous-domaine.
     */
    public function addWebDomainSsl(string $user, string $domain): string
    {
        $baseDomain = config('hestia.base_domain', 'naitech.local');
        $srcCrt = "/usr/local/hestia/ssl/{$baseDomain}.crt";
        $srcKey = "/usr/local/hestia/ssl/{$baseDomain}.key";
        $tmpDir = "/tmp/ssl_" . bin2hex(random_bytes(8));

        // Préparer le dossier temp avec les fichiers nommés d'après le sous-domaine
        $this->ssh->exec("mkdir -p {$tmpDir} && sudo cp {$srcCrt} {$tmpDir}/{$domain}.crt && sudo cp {$srcKey} {$tmpDir}/{$domain}.key", true);

        try {
            $result = $this->run('v-add-web-domain-ssl', [$user, $domain, $tmpDir]);
        } finally {
            $this->ssh->exec("rm -rf {$tmpDir}");
        }

        return $result;
    }

    /**
     * Force l'activation SSL (HTTPS) sur un domaine web.
     */
    public function forceWebDomainSsl(string $user, string $domain): string
    {
        return $this->run('v-add-web-domain-ssl-force', [$user, $domain, 'yes']);
    }

    /**
     * Supprime un domaine web.
     */
    public function deleteDomain(string $user, string $domain): string
    {
        return $this->run('v-delete-domain', [$user, $domain]);
    }

    /**
     * Suspend (désactive) un domaine web.
     */
    public function suspendDomain(string $user, string $domain): string
    {
        return $this->run('v-suspend-web-domain', [$user, $domain]);
    }

    /**
     * Réactive un domaine web suspendu.
     */
    public function unsuspendDomain(string $user, string $domain): string
    {
        $result = $this->run('v-unsuspend-web-domain', [$user, $domain]);
        $this->run('v-rebuild-web-domain', [$user, $domain]);
        return $result;
    }

    /**
     * Liste les domaines web d'un utilisateur.
     */
    public function listDomains(string $user): array
    {
        $output = $this->run('v-list-web-domains', [$user, 'json']);
        return json_decode($output, true) ?? [];
    }

    /**
     * Retourne les informations d'un utilisateur via l'API REST HestiaCP.
     * Champs utiles : U_DISK (MB disque utilisé), U_BANDWIDTH (MB BW utilisée),
     *                 DISK_QUOTA (MB limite disque), BANDWIDTH (MB limite BW).
     * Les valeurs "unlimited" sont normalisées à 0.
     */
    public function listUser(string $user): array
    {
        $host      = config('hestia.host');
        $port      = config('hestia.port', 8083);
        $accessKey = config('hestia.access_key');
        $secretKey = config('hestia.secret_key');

        $response = \Illuminate\Support\Facades\Http::withOptions(['verify' => false])
            ->asForm()
            ->post("https://{$host}:{$port}/api/", [
                'hash' => "{$accessKey}:{$secretKey}",
                'cmd'  => 'v-list-user',
                'arg1' => $user,
                'arg2' => 'json',
            ]);

        $data = $response->json();

        if (!is_array($data) || !isset($data[$user])) {
            Log::warning("Hestia listUser: unexpected response for {$user}", ['body' => $response->body()]);
            return [];
        }

        return $data[$user];
    }
}
