<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use App\Services\EventPublisherService;
use Illuminate\Http\Request;

/**
 * Point d'entrée public appelé par le plugin ReactiveWP (WordPress) pour envoyer
 * ses événements — remplace l'écriture directe du plugin dans Redis/Dragonfly.
 * Authentification par clé API de site (pas de session Sanctum ici : le plugin
 * n'est pas un utilisateur du dashboard).
 */
class EventIngestController extends Controller
{
    public function store(Request $request, EventPublisherService $publisher)
    {
        $key = $request->header('X-RXpress-Key')
            ?? str_replace('Bearer ', '', (string) $request->header('Authorization'));

        if (!$key) {
            return response()->json(['message' => 'Clé API manquante.'], 401);
        }

        $site = Site::where('api_key', $key)->where('stat', 'active')->first();

        if (!$site) {
            return response()->json(['message' => 'Clé API invalide.'], 401);
        }

        $payload = $request->json()->all();
        $events = array_is_list($payload) ? $payload : [$payload];

        if (empty($events)) {
            return response()->json(['message' => 'Aucun événement fourni.'], 422);
        }

        // Le "compte" est recalculé côté serveur à partir du site authentifié — on ne
        // fait jamais confiance à une valeur envoyée par le client. Le format
        // "{hestia_user}.s{id}" est celui attendu par dispatcher-worker (parseCompte)
        // et par WpEventController (filtrage par client) — hestia_user est ici un simple
        // identifiant technique par client, plus un vrai compte HestiaCP hébergé.
        $compte = $site->hestia_user . '.s' . str_pad((string) $site->id, 7, '0', STR_PAD_LEFT);

        foreach ($events as $event) {
            if (!is_array($event) || empty($event['hook'])) {
                continue;
            }

            $event['compte'] = $compte;
            $publisher->publish($event);
        }

        return response()->json(['received' => true], 202);
    }
}
