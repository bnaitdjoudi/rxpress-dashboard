<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hook;
use App\Models\WpEvent;
use Carbon\Carbon;
use Illuminate\Http\Request;

class HookController extends Controller
{
    public function index()
    {
        return response()->json(
            Hook::where('listed', true)
                ->orderBy('category')
                ->orderBy('hook')
                ->get(['id', 'hook', 'label', 'category', 'origine'])
        );
    }

    public function mine(Request $request)
    {
        return response()->json(
            Hook::where('user_id', $request->user()->id)
                ->orderBy('hook')
                ->get(['id', 'hook', 'label', 'category', 'origine'])
        );
    }

    public function eventsCount(Request $request)
    {
        $hestiaUser = $request->user()->hestia_user;

        if (!$hestiaUser) {
            return response()->json(['count' => 0]);
        }

        $count = WpEvent::where('created_at', '>=', Carbon::now()->startOfMonth())
            ->where('compte', 'like', $hestiaUser . '.%')
            ->count();

        return response()->json(['count' => $count]);
    }
}
