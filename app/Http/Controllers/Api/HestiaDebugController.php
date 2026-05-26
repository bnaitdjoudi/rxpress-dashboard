<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HestiaService;
use Illuminate\Http\Request;

class HestiaDebugController extends Controller
{
    public function __construct(private HestiaService $hestia) {}

    public function user(Request $request)
    {
        $hestiaUser = $request->user()->hestia_user;

        if (!$hestiaUser) {
            return response()->json(['error' => 'Aucun hestia_user sur ce compte'], 404);
        }

        try {
            $data = $this->hestia->listUser($hestiaUser);
            return response()->json([
                'hestia_user' => $hestiaUser,
                'raw'         => $data,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('[HestiaDebug] listUser failed for ' . $hestiaUser . ': ' . $e->getMessage());
            return response()->json([
                'hestia_user' => $hestiaUser,
                'error'       => 'Une erreur technique est survenue. Veuillez contacter l\'administrateur.',
            ], 500);
        }
    }
}
