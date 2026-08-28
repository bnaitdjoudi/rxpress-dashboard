<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hook;
use App\Models\Site;
use App\Models\SiteHook;
use Illuminate\Http\Request;

class SiteHookController extends Controller
{
    public function index(Request $request, Site $site)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $siteHooks = $site->siteHooks()->with('hook')->orderBy('id')->get();

        return response()->json($siteHooks->map(fn($sh) => $this->format($sh)));
    }

    public function store(Request $request, Site $site)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate([
            'hook_id' => 'required_without:hook|nullable|integer|exists:hooks,id',
            'hook'    => 'required_without:hook_id|nullable|string|max:255',
        ]);

        if ($request->filled('hook_id')) {
            $hook = Hook::findOrFail($request->hook_id);
        } else {
            $hook = Hook::updateOrCreate(
                ['user_id' => $request->user()->id, 'hook' => $request->hook],
                ['origine' => 'externe', 'listed' => false]
            );
        }

        $siteHook = $site->siteHooks()->updateOrCreate(
            ['hook_id' => $hook->id],
            ['active' => true]
        );

        $siteHook->load('hook');

        return response()->json($this->format($siteHook), 201);
    }

    public function update(Request $request, Site $site, SiteHook $siteHook)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($siteHook->site_id !== $site->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate(['active' => 'required|boolean']);
        $siteHook->update($validated);
        $siteHook->load('hook');

        return response()->json($this->format($siteHook));
    }

    public function destroy(Request $request, Site $site, SiteHook $siteHook)
    {
        if ($site->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($siteHook->site_id !== $site->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $siteHook->delete();

        return response()->json(['message' => 'Deleted']);
    }

    private function format(SiteHook $siteHook): array
    {
        return [
            'id'         => $siteHook->id,
            'site_id'    => $siteHook->site_id,
            'hook_id'    => $siteHook->hook_id,
            'hook'       => $siteHook->hook?->hook,
            'label'      => $siteHook->hook?->label,
            'category'   => $siteHook->hook?->category,
            'active'     => $siteHook->active,
            'created_at' => $siteHook->created_at,
        ];
    }
}
