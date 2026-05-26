<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use App\Models\SubUsageOption;
use App\Services\CloudflareService;
use App\Services\HestiaService;
use App\Services\SshService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SiteController extends Controller
{
    public function index(Request $request)
    {
        $sites = $request->user()->sites()->get();

        $sites->transform(function ($site) {
            $site->storage = round(mt_rand(50, 1000) / 100, 1) . ' GB';
            return $site;
        });

        return response()->json($sites);
    }

    public function store(Request $request, HestiaService $hestia, SshService $ssh, CloudflareService $cloudflare)
    {
        // 1. Validation + vérification unicité en BD
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
        ]);

        // 2. Vérification de la limite de sites via sub_usage_options
        $subscription = $request->user()->subscription()
            ->with(['usageOptions.planUsageOptionLimit'])
            ->first();

        if (!$subscription) {
            return response()->json(['message' => 'Aucun abonnement actif.'], 403);
        }

        $siteUsage = $subscription->usageOptions
            ->first(fn($u) => $u->planUsageOptionLimit?->limit_name === 'site');

        if (!$siteUsage) {
            return response()->json(['message' => 'Option sites introuvable dans votre abonnement.'], 403);
        }

        if ($siteUsage->used >= $siteUsage->planUsageOptionLimit->value) {
            return response()->json([
                'message' => 'Limite de sites atteinte (' . (int) $siteUsage->planUsageOptionLimit->value . ' max).',
            ], 403);
        }

        // 4. Récupération du hestia_user depuis le user connecté
        $hestiaUser = $request->user()->hestia_user;

        if (!$hestiaUser) {
            return response()->json(['message' => 'Aucun utilisateur HestiaCP associé à ce compte.'], 403);
        }

        // 5. Génération du package HestiaCP avec le vrai ID du site (après création)
        $site = $request->user()->sites()->create([
            'nom' => $validated['nom'],
            'nom_de_domaine' => 'placeholder',
            'stat' => 'active',
        ]);

        // Génération automatique du domaine : {hestiaUser}-{siteId}.naitech.local
        $baseDomain = config('hestia.base_domain', 'naitech.local');
        $domain = "{$hestiaUser}-s" . str_pad($site->id, 7, '0', STR_PAD_LEFT) . ".{$baseDomain}";

        $site->update(['nom_de_domaine' => $domain]);

        // HestiaCP préfixe automatiquement avec le username (nom court max 8 chars)
        $dbShortName = 's' . $site->id;
        $dbPass = bin2hex(random_bytes(8));
        $wpAdminPass = bin2hex(random_bytes(8));

        // $domainOwner may differ from $hestiaUser if the base domain belongs to admin
        $domainOwner = $hestiaUser;

        if (config('hestia.enabled')) {
            // 6. Création du domaine web — rollback BD si échec
            // addDomain falls back to the hestia admin user if the base domain belongs to
            // a different HestiaCP user (exit 4), and returns the effective owner.
            try {
                $domainOwner = $hestia->addDomain($hestiaUser, $domain);
            } catch (\Exception $e) {
                $site->delete();
                return $this->serverError($e, 'addDomain');
            }

            // 7. Rebuild pour corriger les permissions et créer la structure public_html
            $ssh->exec("sudo /usr/local/hestia/bin/v-rebuild-web-domain {$domainOwner} {$domain}");

            // 8. Installation du certificat SSL wildcard
            try {
                $hestia->addWebDomainSsl($domainOwner, $domain);
                $hestia->forceWebDomainSsl($domainOwner, $domain);
                $ssh->exec("sudo /usr/local/hestia/bin/v-restart-web");
            } catch (\Exception $e) {
                $site->delete();
                return $this->serverError($e, 'addWebDomainSsl');
            }

        }

        $dbName = "{$domainOwner}_{$dbShortName}";
        $dbUser = "{$domainOwner}_{$dbShortName}";

        // 9. Mise à jour du hestia_user et credentials BD sur le site
        $site->update([
            'hestia_user' => $domainOwner,
            'db_name'     => $dbName,
            'db_user'     => $dbUser,
        ]);

        // 9b. Création du DNS Cloudflare — sous-domaine automatique avec proxy
        if (config('cloudflare.api_token')) {
            $subdomain = "{$hestiaUser}-s" . str_pad($site->id, 7, '0', STR_PAD_LEFT);
            try {
                $cfRecordId = $cloudflare->createSubdomain($subdomain);
                $site->update(['cf_record_id' => $cfRecordId]);
            } catch (\Exception $e) {
                Log::warning("[SiteController] Cloudflare DNS creation failed (non-blocking): " . $e->getMessage());
            }
        }

        // 10. Création BD MySQL + installation WordPress via SSH
        if (config('hestia.enabled')) {
            $publicHtml = "/home/{$domainOwner}/web/{$domain}/public_html";
            $sudoSite = "sudo -u {$domainOwner}";

            // Création de la base de données via HestiaCP CLI
            try {
                $hestia->addDatabase($domainOwner, $dbShortName, $dbShortName, $dbPass);
            } catch (\Exception $e) {
                $site->delete();
                return $this->serverError($e, 'addDatabase');
            }

            // Nettoyage du public_html avant installation WordPress
            $ssh->exec("sudo rm -f {$publicHtml}/index.html");

            // Installation WordPress via WP-CLI
            $wp = config('ssh.wp_cli');
            try {
                $ssh->exec("{$sudoSite} {$wp} core download --path={$publicHtml}", true);
                $ssh->exec("{$sudoSite} {$wp} config create --path={$publicHtml} --dbname={$dbName} --dbuser={$dbUser} --dbpass={$dbPass} --dbhost=localhost --force --skip-check", true);
                $ssh->exec("{$sudoSite} {$wp} config set FORCE_SSL_ADMIN false --raw --type=constant --path={$publicHtml}");

                // Injection de la configuration ReactiveWP Redis dans wp-config.php
                $rwp = config('ssh.reactivewp');
                $rwpCompte = $hestiaUser . '.s' . str_pad($site->id, 7, '0', STR_PAD_LEFT);
                $redisBlock = "\n// ReactiveWP - Configuration Redis\n"
                    . "putenv('REACTIVEWP_COMPTE={$rwpCompte}');\n"
                    . "putenv('REACTIVEWP_USE_OUTBOX=true');\n"
                    . "putenv('REDIS_HOST={$rwp['redis_host']}');\n"
                    . "putenv('REDIS_PORT={$rwp['redis_port']}');\n"
                    . "putenv('REDIS_PASSWORD={$rwp['redis_password']}');\n"
                    . "putenv('REDIS_QUEUE_NAME={$rwp['redis_queue_name']}');\n"
                    . "putenv('REDIS_DB={$rwp['redis_db']}');\n";
                $tmpFile = "/tmp/rwp_config_" . bin2hex(random_bytes(8)) . ".php";
                $ssh->exec('echo ' . base64_encode($redisBlock) . " | base64 -d > {$tmpFile}");
                $ssh->exec("{$sudoSite} bash -c 'cat {$tmpFile} >> {$publicHtml}/wp-config.php'");
                $ssh->exec("rm -f {$tmpFile}");
                $ssh->exec("{$sudoSite} {$wp} core install --path={$publicHtml} --url=https://{$domain} --title=\"{$validated['nom']}\" --admin_user=admin --admin_password={$wpAdminPass} --admin_email={$request->user()->email}", true);
            } catch (\Exception $e) {
                $site->delete();
                return $this->serverError($e, 'wpInstall');
            }

            // Installation et activation du plugin propriétaire ReactiveWP
            $pluginZip  = config('ssh.plugin_zip_dir') . '/reaction_hook.zip';
            $pluginsDir = "{$publicHtml}/wp-content/plugins";
            $pluginSlug = "reaction_hook";

            $ssh->exec("{$sudoSite} {$wp} plugin install {$pluginZip} --path={$publicHtml}");

            // Renommer le dossier extrait en reaction_hook si nécessaire
            $ssh->exec("{$sudoSite} bash -c 'cd {$pluginsDir} && for d in reaction*; do [ \"\$d\" != \"{$pluginSlug}\" ] && mv \"\$d\" {$pluginSlug}; done'");

            // Activer le plugin
            $ssh->exec("{$sudoSite} {$wp} plugin activate {$pluginSlug} --path={$publicHtml}");
        }

        // 10. Incrémenter le compteur sites dans sub_usage_options
        $siteUsage->increment('used');

        return response()->json(array_merge($site->toArray(), [
            'db_pass_plain' => $dbPass,
            'wp_admin_pass' => $wpAdminPass,
        ]), 201);
    }

    public function updateStat(Request $request, Site $site, HestiaService $hestia)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'stat' => 'required|in:active,inactive',
        ]);

        if (config('hestia.enabled') && $site->hestia_user && $site->nom_de_domaine) {
            try {
                if ($validated['stat'] === 'active') {
                    $hestia->unsuspendDomain($site->hestia_user, $site->nom_de_domaine);
                    $hestia->forceWebDomainSsl($site->hestia_user, $site->nom_de_domaine);
                } else {
                    $hestia->suspendDomain($site->hestia_user, $site->nom_de_domaine);
                }
            } catch (\Exception $e) {
                return $this->serverError($e, 'updateStat');
            }
        }

        $site->update(['stat' => $validated['stat']]);

        return response()->json($site);
    }

    public function show(Request $request, Site $site)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $site->load('mqCredential');
        return response()->json($site);
    }

    public function update(Request $request, Site $site)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'nom_de_domaine' => 'required|string|max:255|unique:sites,nom_de_domaine,' . $site->id,
        ]);

        $site->update($validated);

        return response()->json($site);
    }

    public function showMqPassword(Request $request, Site $site)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $mq = $site->mqCredential;
        if (!$mq) {
            return response()->json(['message' => 'No MQ credentials'], 404);
        }

        return response()->json(['password' => $mq->password]);
    }

    public function regenerateMqPassword(Request $request, Site $site)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $mq = $site->mqCredential;
        if (!$mq) {
            return response()->json(['message' => 'No MQ credentials'], 404);
        }

        $newPassword = bin2hex(random_bytes(16));
        $mq->update(['password' => $newPassword]);

        return response()->json(['password' => $newPassword]);
    }

    public function regenerateDbPassword(Request $request, Site $site, SshService $ssh, HestiaService $hestia)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!$site->hestia_user || !$site->db_user) {
            return response()->json(['message' => 'Credentials BD introuvables.'], 404);
        }

        $newPass = bin2hex(random_bytes(8));

        try {
            $hestia->changeDatabasePassword($site->hestia_user, $site->db_name, $newPass);
            $publicHtml = "/home/{$site->hestia_user}/web/{$site->nom_de_domaine}/public_html";
            $wp = config('ssh.wp_cli');
            $ssh->exec("sudo -u {$site->hestia_user} {$wp} config set DB_PASSWORD {$newPass} --path={$publicHtml}");
        } catch (\Exception $e) {
            return $this->serverError($e, 'regenerateDbPassword');
        }

        return response()->json(['db_pass' => $newPass]);
    }

    public function regenerateWpPassword(Request $request, Site $site, SshService $ssh)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!$site->hestia_user) {
            return response()->json(['message' => 'Serveur introuvable.'], 404);
        }

        $newPass = bin2hex(random_bytes(8));

        try {
            $publicHtml = "/home/{$site->hestia_user}/web/{$site->nom_de_domaine}/public_html";
            $wp = config('ssh.wp_cli');
            $ssh->exec("sudo -u {$site->hestia_user} {$wp} user update admin --user_pass={$newPass} --path={$publicHtml}", true);
        } catch (\Exception $e) {
            return $this->serverError($e, 'regenerateWpPassword');
        }

        return response()->json(['wp_admin_pass' => $newPass]);
    }

    // ── Domaine custom ────────────────────────────────────────────────────────

    /**
     * Ajoute un domaine custom pour un site.
     * Si le domaine est dans la zone Cloudflare du compte, le CNAME est créé automatiquement.
     * Sinon, on retourne les instructions pour que le client configure son DNS lui-même.
     */
    public function addCustomDomain(Request $request, Site $site, CloudflareService $cloudflare): JsonResponse
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'custom_domain' => 'required|string|max:255',
        ]);

        $customDomain = strtolower(trim($validated['custom_domain']));
        $subdomain    = $site->hestia_user . '-s' . str_pad($site->id, 7, '0', STR_PAD_LEFT);
        $target       = $subdomain . '.' . config('cloudflare.base_domain');

        $cfCustomRecordId = null;

        // Tentative de création automatique du CNAME dans Cloudflare
        try {
            $cfCustomRecordId = $cloudflare->createCustomCname($customDomain, $subdomain);
            $status = 'verified';
        } catch (\Exception) {
            // Le domaine n'est pas dans la zone Cloudflare — le client doit configurer manuellement
            $status = 'pending';
        }

        $site->update([
            'custom_domain'        => $customDomain,
            'cf_custom_record_id'  => $cfCustomRecordId,
            'custom_domain_status' => $status,
        ]);

        return response()->json([
            'custom_domain'        => $customDomain,
            'custom_domain_status' => $status,
            'cname_target'         => $target,
            'instructions'         => $status === 'pending'
                ? "Ajoutez un enregistrement CNAME : {$customDomain} → {$target}"
                : null,
        ]);
    }

    /**
     * Vérifie que le DNS du domaine custom pointe bien vers la plateforme.
     */
    public function verifyCustomDomain(Request $request, Site $site, CloudflareService $cloudflare): JsonResponse
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!$site->custom_domain) {
            return response()->json(['message' => 'Aucun domaine custom configuré.'], 404);
        }

        $subdomain = $site->hestia_user . '-s' . str_pad($site->id, 7, '0', STR_PAD_LEFT);
        $verified  = $cloudflare->verifyCustomDomain($site->custom_domain, $subdomain);

        $site->update([
            'custom_domain_status' => $verified ? 'verified' : 'pending',
        ]);

        return response()->json([
            'custom_domain'        => $site->custom_domain,
            'custom_domain_status' => $verified ? 'verified' : 'pending',
        ]);
    }

    /**
     * Supprime le domaine custom d'un site.
     */
    public function removeCustomDomain(Request $request, Site $site, CloudflareService $cloudflare): JsonResponse
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($site->cf_custom_record_id) {
            try {
                $cloudflare->deleteRecord($site->cf_custom_record_id);
            } catch (\Exception $e) {
                Log::warning("[SiteController] Cloudflare custom domain deletion failed: " . $e->getMessage());
            }
        }

        $site->update([
            'custom_domain'        => null,
            'cf_custom_record_id'  => null,
            'custom_domain_status' => null,
        ]);

        return response()->json(['message' => 'Domaine custom supprimé.']);
    }

    private function serverError(\Throwable $e, string $context): JsonResponse
    {
        Log::error("[SiteController] {$context}: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
        return response()->json(['message' => 'Une erreur technique est survenue. Veuillez contacter l\'administrateur.'], 502);
    }

    private function runWpPhp(SshService $ssh, string $hestiaUser, string $wp, string $publicHtml, string $phpCode): string
    {
        $encoded = base64_encode("<?php\n" . $phpCode);
        $tmp     = '/tmp/rxwc_' . bin2hex(random_bytes(8)) . '.php';
        return $ssh->exec(
            "echo '{$encoded}' | base64 -d > {$tmp} && chmod 644 {$tmp} && sudo -u {$hestiaUser} {$wp} eval-file {$tmp} --path={$publicHtml} 2>/dev/null; rm -f {$tmp}"
        );
    }

    public function listWcApiKeys(Request $request, Site $site, SshService $ssh)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!$site->hestia_user) {
            return response()->json(['message' => 'Serveur introuvable.'], 404);
        }

        try {
            $publicHtml = "/home/{$site->hestia_user}/web/{$site->nom_de_domaine}/public_html";
            $wp         = config('ssh.wp_cli');

            $phpCode = <<<'PHP'
global $wpdb;
$keys = $wpdb->get_results(
    "SELECT k.key_id, k.user_id, k.description, k.permissions, k.truncated_key, k.last_access,
            u.user_login, u.display_name
     FROM {$wpdb->prefix}woocommerce_api_keys k
     LEFT JOIN {$wpdb->users} u ON u.ID = k.user_id
     ORDER BY k.key_id DESC",
    ARRAY_A
);
foreach ($keys as &$key) {
    $user = get_userdata((int) $key['user_id']);
    $key['roles'] = $user ? $user->roles : [];
}
echo json_encode($keys ?: []);
PHP;

            $output = $this->runWpPhp($ssh, $site->hestia_user, $wp, $publicHtml, $phpCode);
            $keys   = json_decode(trim($output), true) ?? [];

            return response()->json($keys);
        } catch (\Exception $e) {
            return $this->serverError($e, 'ssh');
        }
    }

    public function createWcApiKey(Request $request, Site $site, SshService $ssh)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!$site->hestia_user) {
            return response()->json(['message' => 'Serveur introuvable.'], 404);
        }

        $validated = $request->validate([
            'user_id'     => 'required|integer',
            'description' => 'nullable|string|max:255',
            'permissions' => 'nullable|string|in:read,write,read_write',
        ]);

        try {
            $publicHtml  = "/home/{$site->hestia_user}/web/{$site->nom_de_domaine}/public_html";
            $wp          = config('ssh.wp_cli');
            $userId      = (int) $validated['user_id'];
            $description = addslashes($validated['description'] ?? 'RXpress Dashboard');
            $permissions = $validated['permissions'] ?? 'read_write';

            $phpCode = str_replace(
                ['{{USER_ID}}', '{{DESCRIPTION}}', '{{PERMISSIONS}}'],
                [$userId, $description, $permissions],
                <<<'PHP'
global $wpdb;
$ck = 'ck_' . bin2hex(random_bytes(20));
$cs = 'cs_' . bin2hex(random_bytes(20));
$wpdb->insert(
    $wpdb->prefix . 'woocommerce_api_keys',
    [
        'user_id'         => {{USER_ID}},
        'description'     => '{{DESCRIPTION}}',
        'permissions'     => '{{PERMISSIONS}}',
        'consumer_key'    => hash_hmac('sha256', $ck, 'wc-api'),
        'consumer_secret' => $cs,
        'truncated_key'   => substr($ck, -7),
    ]
);
$user = get_userdata({{USER_ID}});
echo json_encode([
    'key_id'          => $wpdb->insert_id,
    'user_id'         => {{USER_ID}},
    'user_login'      => $user ? $user->user_login : null,
    'display_name'    => $user ? $user->display_name : null,
    'roles'           => $user ? $user->roles : [],
    'description'     => '{{DESCRIPTION}}',
    'permissions'     => '{{PERMISSIONS}}',
    'consumer_key'    => $ck,
    'consumer_secret' => $cs,
    'truncated_key'   => substr($ck, -7),
    'last_access'     => null,
]);
PHP
            );

            $output = $this->runWpPhp($ssh, $site->hestia_user, $wp, $publicHtml, $phpCode);
            $key    = json_decode(trim($output), true);

            if (!$key || !isset($key['consumer_key'])) {
                return response()->json(['message' => 'Création échouée.', 'raw' => $output], 502);
            }

            return response()->json($key);
        } catch (\Exception $e) {
            return $this->serverError($e, 'ssh');
        }
    }

    public function deleteWcApiKey(Request $request, Site $site, SshService $ssh, int $keyId)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!$site->hestia_user) {
            return response()->json(['message' => 'Serveur introuvable.'], 404);
        }

        try {
            $publicHtml = "/home/{$site->hestia_user}/web/{$site->nom_de_domaine}/public_html";
            $wp         = config('ssh.wp_cli');

            $phpCode = str_replace('{{KEY_ID}}', $keyId, <<<'PHP'
global $wpdb;
$wpdb->delete($wpdb->prefix . 'woocommerce_api_keys', ['key_id' => {{KEY_ID}}]);
echo json_encode(['deleted' => true, 'affected' => $wpdb->rows_affected]);
PHP
            );

            $this->runWpPhp($ssh, $site->hestia_user, $wp, $publicHtml, $phpCode);

            return response()->json(['message' => 'Clé supprimée']);
        } catch (\Exception $e) {
            return $this->serverError($e, 'ssh');
        }
    }

    public function regenerateWcApiKey(Request $request, Site $site, SshService $ssh, int $keyId)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!$site->hestia_user) {
            return response()->json(['message' => 'Serveur introuvable.'], 404);
        }

        try {
            $publicHtml = "/home/{$site->hestia_user}/web/{$site->nom_de_domaine}/public_html";
            $wp         = config('ssh.wp_cli');

            $phpCode = str_replace('{{KEY_ID}}', $keyId, <<<'PHP'
global $wpdb;
$existing = $wpdb->get_row(
    $wpdb->prepare("SELECT * FROM {$wpdb->prefix}woocommerce_api_keys WHERE key_id = %d", {{KEY_ID}}),
    ARRAY_A
);
if (!$existing) {
    echo json_encode(['error' => 'not_found']);
    exit;
}
$wpdb->delete($wpdb->prefix . 'woocommerce_api_keys', ['key_id' => {{KEY_ID}}]);
$ck = 'ck_' . bin2hex(random_bytes(20));
$cs = 'cs_' . bin2hex(random_bytes(20));
$wpdb->insert(
    $wpdb->prefix . 'woocommerce_api_keys',
    [
        'user_id'         => $existing['user_id'],
        'description'     => $existing['description'],
        'permissions'     => $existing['permissions'],
        'consumer_key'    => hash_hmac('sha256', $ck, 'wc-api'),
        'consumer_secret' => $cs,
        'truncated_key'   => substr($ck, -7),
    ]
);
$user = get_userdata((int) $existing['user_id']);
echo json_encode([
    'key_id'          => $wpdb->insert_id,
    'user_id'         => (int) $existing['user_id'],
    'user_login'      => $user ? $user->user_login : null,
    'display_name'    => $user ? $user->display_name : null,
    'roles'           => $user ? $user->roles : [],
    'description'     => $existing['description'],
    'permissions'     => $existing['permissions'],
    'consumer_key'    => $ck,
    'consumer_secret' => $cs,
    'truncated_key'   => substr($ck, -7),
    'last_access'     => null,
]);
PHP
            );

            $output = $this->runWpPhp($ssh, $site->hestia_user, $wp, $publicHtml, $phpCode);
            $newKey = json_decode(trim($output), true);

            if (!$newKey || isset($newKey['error']) || !isset($newKey['consumer_key'])) {
                return response()->json(['message' => 'Régénération échouée.', 'raw' => $output], 502);
            }

            return response()->json($newKey);
        } catch (\Exception $e) {
            return $this->serverError($e, 'ssh');
        }
    }
}
