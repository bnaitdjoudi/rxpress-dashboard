<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use App\Models\Webhook;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    private const ALLOWED_AUTH_TYPES = [
        'none',
        'application_password',
        'basic_auth',
        'bearer_token',
        'api_key',
        'oauth2',
    ];

    public function index(Request $request, Site $site)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $webhooks = $site->webhooks()
            ->withCount('events')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($webhook) {
                $webhook->has_auth = !empty($webhook->auth_config);
                return $webhook;
            });

        return response()->json($webhooks);
    }

    public function store(Request $request, Site $site)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name'         => 'nullable|string|max:255',
            'endpoint_url' => ['required', 'url', 'max:2048', 'regex:/^https:\/\//i'],
            'auth_type'    => 'required|string|in:' . implode(',', self::ALLOWED_AUTH_TYPES),
            'auth_config'  => 'nullable|array',
            'content_type' => 'nullable|string|in:application/json,application/x-www-form-urlencoded',
            'active'       => 'boolean',
        ], [
            'endpoint_url.regex' => 'L\'URL du webhook doit utiliser HTTPS.',
        ]);

        $secret = bin2hex(random_bytes(32));
        $validated['secret'] = $secret;

        $webhook = $site->webhooks()->create($validated);

        return response()->json([
            'webhook' => $webhook,
            'secret'  => $secret,
        ], 201);
    }

    public function update(Request $request, Site $site, Webhook $webhook)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($webhook->site_id !== $site->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'name'         => 'sometimes|nullable|string|max:255',
            'endpoint_url' => ['sometimes', 'url', 'max:2048', 'regex:/^https:\/\//i'],
            'auth_type'    => 'sometimes|string|in:' . implode(',', self::ALLOWED_AUTH_TYPES),
            'auth_config'  => 'sometimes|nullable|array',
            'content_type' => 'sometimes|nullable|string|in:application/json,application/x-www-form-urlencoded',
            'active'       => 'sometimes|boolean',
        ], [
            'endpoint_url.regex' => 'L\'URL du webhook doit utiliser HTTPS.',
        ]);

        // Réactivation manuelle → reset du circuit breaker
        if (isset($validated['active']) && $validated['active'] === true) {
            $validated['consecutive_failures'] = 0;
            $validated['auto_disabled_at'] = null;
        }

        $webhook->update($validated);

        return response()->json($webhook);
    }

    public function regenerateSecret(Request $request, Site $site, Webhook $webhook)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($webhook->site_id !== $site->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $secret = bin2hex(random_bytes(32));
        $webhook->update(['secret' => $secret]);

        return response()->json(['secret' => $secret]);
    }

    public function destroy(Request $request, Site $site, Webhook $webhook)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($webhook->site_id !== $site->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $webhook->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
