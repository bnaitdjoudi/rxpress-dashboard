<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function index(Request $request)
    {
        $query = Plan::with(['prices' => fn($q) => $q->where('active', true)])
            ->where('active', true);

        if ($request->filled('min_grade')) {
            $query->where('grade', '>', (int) $request->min_grade);
        }

        return response()->json($query->orderBy('grade')->get());
    }
}
