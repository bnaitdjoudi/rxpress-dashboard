<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WebhookDelivery;
use Illuminate\Http\Request;
use App\Services\WebhookReplayService;

class WebhookDeliveryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = WebhookDelivery::with('webhook:id,name,endpoint_url,site_id', 'webhook.site:id,nom,nom_de_domaine')
            ->forUser($user->id)
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('webhook_ids')) {
            $ids = explode(',', $request->webhook_ids);
            $query->whereIn('webhook_id', $ids);
        }

        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->to);
        }

        return response()->json($query->paginate($request->integer('per_page', 50)));
    }

    public function stats(Request $request)
    {
        $user = $request->user();

        $base = WebhookDelivery::forUser($user->id);

        $byStatus = (clone $base)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $byWebhook = (clone $base)
            ->selectRaw('webhook_id, status, COUNT(*) as count')
            ->groupBy('webhook_id', 'status')
            ->with('webhook:id,name')
            ->get();

        $perHour = (clone $base)
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m-%d %H:00:00") as hour, status, COUNT(*) as count')
            ->where('created_at', '>=', now()->subHours(24))
            ->groupBy('hour', 'status')
            ->orderBy('hour')
            ->get();

        $avgDuration = (clone $base)
            ->where('status', 'success')
            ->avg('duration_ms');

        return response()->json([
            'total'        => (clone $base)->count(),
            'success'      => $byStatus->get('success')?->count ?? 0,
            'failed'       => $byStatus->get('failed')?->count ?? 0,
            'skipped'      => $byStatus->get('skipped')?->count ?? 0,
            'avg_duration' => round($avgDuration ?? 0),
            'by_webhook'   => $byWebhook,
            'per_hour'     => $perHour,
        ]);
    }

    public function replay(Request $request, int $id)
    {
        $delivery = WebhookDelivery::with('webhook')->forUser($request->user()->id)->findOrFail($id);

        if (!$delivery->request_body) {
            return response()->json(['error' => 'Corps de la requête non disponible pour cette livraison.'], 422);
        }

        try {
            (new WebhookReplayService())->publish($delivery);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('[WebhookDeliveryController] replay AMQP: ' . $e->getMessage());
            return response()->json(['error' => 'Une erreur technique est survenue. Veuillez contacter l\'administrateur.'], 500);
        }

        return response()->json(['queued' => true, 'delivery_id' => $id]);
    }
}
