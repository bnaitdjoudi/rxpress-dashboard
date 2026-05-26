<?php

namespace App\Services;

use phpseclib3\Net\SSH2;
use phpseclib3\Crypt\PublicKeyLoader;
use Illuminate\Support\Facades\Log;

class SshService
{
    private string $host;
    private int $port;
    private string $username;
    private ?string $privateKeyPath;
    private ?string $privateKeyPassphrase;
    private ?string $password;

    public function __construct()
    {
        $this->host                = config('ssh.host');
        $this->port                = config('ssh.port');
        $this->username            = config('ssh.username');
        $this->privateKeyPath      = config('ssh.private_key_path');
        $this->privateKeyPassphrase = config('ssh.private_key_passphrase');
        $this->password            = config('ssh.password');
    }

    private function connect(): SSH2
    {
        $ssh = new SSH2($this->host, $this->port);

        if ($this->privateKeyPath) {
            $keyContent = file_get_contents($this->privateKeyPath);
            if ($keyContent === false) {
                throw new \Exception("SSH: Impossible de lire la clé privée : {$this->privateKeyPath}");
            }
            $key = PublicKeyLoader::load($keyContent, $this->privateKeyPassphrase ?? false);
            $ok  = $ssh->login($this->username, $key);
        } else {
            // Fallback mot de passe — à migrer vers clé RSA
            Log::warning("SSH: auth par mot de passe active pour {$this->username}@{$this->host} — migrer vers SSH_PRIVATE_KEY_PATH");
            $ok = $ssh->login($this->username, $this->password);
        }

        if (!$ok) {
            throw new \Exception("SSH: Authentification échouée pour {$this->username}@{$this->host}");
        }

        return $ssh;
    }

    private static array $secretFlags = [
        '--dbpass',
        '--admin_password',
        '--user_pass',
        '--password',
    ];

    // WP-CLI "config set KEY VALUE" patterns where the value follows the key positionally
    private static array $secretConfigKeys = [
        'DB_PASSWORD',
    ];

    private function redactSecrets(string $command): string
    {
        $flagPattern = '/(' . implode('|', array_map('preg_quote', self::$secretFlags)) . ')=\S+/i';
        $command = preg_replace($flagPattern, '$1=[REDACTED]', $command);

        $configPattern = '/\b(' . implode('|', self::$secretConfigKeys) . ')\s+\S+/';
        $command = preg_replace($configPattern, '$1 [REDACTED]', $command);

        return $command;
    }

    /**
     * Exécute une commande SSH et retourne la sortie.
     *
     * @throws \Exception si la connexion ou la commande échoue
     */
    public function exec(string $command, bool $throwOnError = false): string
    {
        $ssh = $this->connect();

        $safe = $this->redactSecrets($command);
        Log::info("SSH exec: {$safe}");

        $output = $ssh->exec($command);
        $exit   = $ssh->getExitStatus();

        Log::info("SSH output", ['cmd' => $safe, 'output' => trim($output), 'exit' => $exit]);

        $ssh->disconnect();

        if ($throwOnError && $exit !== 0) {
            throw new \Exception("Commande échouée (exit {$exit}): " . trim($output));
        }

        return $output;
    }

    /**
     * Exécute plusieurs commandes en séquence dans la même connexion.
     *
     * @param string[] $commands
     * @return string[] sorties indexées par commande
     */
    public function execMany(array $commands): array
    {
        $ssh = $this->connect();
        $results = [];

        foreach ($commands as $command) {
            $safe = $this->redactSecrets($command);
            Log::info("SSH exec: {$safe}");
            $output = $ssh->exec($command);
            Log::info("SSH output", [
                'cmd'    => $safe,
                'output' => trim($output),
                'exit'   => $ssh->getExitStatus(),
            ]);
            $results[$command] = $output;
        }

        $ssh->disconnect();

        return $results;
    }
}
