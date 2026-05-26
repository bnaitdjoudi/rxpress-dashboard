<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WpEvent;
use Illuminate\Http\Request;

class WpEventController extends Controller
{
    public function index(Request $request)
    {
        $user        = $request->user();
        $hestiaUser  = $user->hestia_user;

        if (!$hestiaUser) {
            return response()->json(['data' => [], 'total' => 0]);
        }

        $query = WpEvent::query()
            ->where('compte', 'like', $hestiaUser . '.%')
            ->orderBy('created_at', 'desc');

        if ($request->filled('hook')) {
            $query->where('hook', $request->hook);
        }

        if ($request->filled('site_urls')) {
            $urls = explode(',', $request->site_urls);
            $query->where(function ($q) use ($urls) {
                foreach ($urls as $url) {
                    $q->orWhere('site_url', 'like', '%' . trim($url) . '%');
                }
            });
        }

        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->to);
        }

        $events = $query->paginate($request->integer('per_page', 50));

        return response()->json($events);
    }

    public function stats(Request $request)
    {
        $user       = $request->user();
        $hestiaUser = $user->hestia_user;

        if (!$hestiaUser) {
            return response()->json(['total' => 0, 'by_hook' => [], 'by_site' => [], 'per_hour' => []]);
        }

        $base = WpEvent::query()->where('compte', 'like', $hestiaUser . '.%');

        $byHook = (clone $base)
            ->selectRaw('hook, COUNT(*) as count')
            ->groupBy('hook')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        $bySite = (clone $base)
            ->selectRaw('site_url, COUNT(*) as count')
            ->groupBy('site_url')
            ->orderByDesc('count')
            ->get();

        $perHour = (clone $base)
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m-%d %H:00:00") as hour, COUNT(*) as count')
            ->where('created_at', '>=', now()->subHours(24))
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        return response()->json([
            'total'    => (clone $base)->count(),
            'by_hook'  => $byHook,
            'by_site'  => $bySite,
            'per_hour' => $perHour,
        ]);
    }
}
