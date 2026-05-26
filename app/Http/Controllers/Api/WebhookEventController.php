<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use App\Models\Webhook;
use App\Models\WebhookEvent;
use Illuminate\Http\Request;

class WebhookEventController extends Controller
{
    public function index(Request $request, Site $site, Webhook $webhook)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($webhook->site_id !== $site->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($webhook->events()->orderBy('hook')->get());
    }

    public function store(Request $request, Site $site, Webhook $webhook)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($webhook->site_id !== $site->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'hook' => 'required|string|max:255',
            'active' => 'boolean',
        ]);

        $event = $webhook->events()->updateOrCreate(
            ['hook' => $validated['hook']],
            ['active' => $validated['active'] ?? true]
        );

        return response()->json($event, 201);
    }

    public function update(Request $request, Site $site, Webhook $webhook, WebhookEvent $event)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($webhook->site_id !== $site->id || $event->webhook_id !== $webhook->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'hook' => 'sometimes|string|max:255',
            'active' => 'sometimes|boolean',
        ]);

        $event->update($validated);

        return response()->json($event);
    }

    public function destroy(Request $request, Site $site, Webhook $webhook, WebhookEvent $event)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($webhook->site_id !== $site->id || $event->webhook_id !== $webhook->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $event->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
