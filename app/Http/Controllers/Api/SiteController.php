<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use Illuminate\Http\Request;

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

    public function store(Request $request)
    {
        // 1. Validation — nom_de_domaine est maintenant le vrai domaine externe du client
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'nom_de_domaine' => 'required|string|max:255|unique:sites,nom_de_domaine',
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

        // 3. Création du site — simple enregistrement, aucun provisioning d'hébergement.
        // hestia_user reprend l'identifiant technique du client (généré pour tout le
        // monde à l'inscription, indépendamment de l'hébergement — voir User model) afin
        // de rester compatible avec le routage existant du dispatcher-worker ET avec le
        // filtrage par client de WpEventController (WHERE compte LIKE '{hestia_user}.%').
        $apiKey = 'rxp_' . bin2hex(random_bytes(24));

        $site = $request->user()->sites()->create([
            'nom' => $validated['nom'],
            'nom_de_domaine' => $validated['nom_de_domaine'],
            'hestia_user' => $request->user()->hestia_user,
            'stat' => 'active',
            'api_key' => $apiKey,
        ]);

        // 4. Incrémenter le compteur sites dans sub_usage_options
        $siteUsage->increment('used');

        return response()->json(array_merge($site->toArray(), [
            'api_key' => $apiKey,
        ]), 201);
    }

    public function updateStat(Request $request, Site $site)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'stat' => 'required|in:active,inactive',
        ]);

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
}
