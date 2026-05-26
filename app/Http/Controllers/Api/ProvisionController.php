<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\SubUsageOption;
use App\Models\Subscription;
use App\Models\User;
use App\Services\HestiaService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class ProvisionController extends Controller
{
    public function __construct(private HestiaService $hestia) {}

    public function provision(Request $request)
    {
        $secret = config('services.provision.secret');
        if (!$secret || $request->header('X-Provision-Secret') !== $secret) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $request->validate([
            'email'             => 'required|email',
            'password'          => 'required|string|min:8',
            'stripe_product_id' => 'nullable|string',
            'plan_name'         => 'nullable|string',
        ]);

        $email           = $request->input('email');
        $password        = $request->input('password');
        $stripeProductId = $request->input('stripe_product_id');
        $planName        = $request->input('plan_name');

        // ── Create or update user in DB ───────────────────────────────────────
        $name = ucfirst(str_replace(['.', '_', '-'], ' ', explode('@', $email)[0]));

        $isNew = false;
        $user  = User::where('email', $email)->first();

        if ($user) {
            $user->update(['password' => Hash::make($password)]);
        } else {
            $user = User::create([
                'name'     => $name,
                'email'    => $email,
                'password' => Hash::make($password),
            ]);
            $isNew = true;
        }

        // ── Resolve plan ──────────────────────────────────────────────────────
        $plan = null;

        if ($stripeProductId) {
            $plan = Plan::where('stripe_product_id', $stripeProductId)->first();
        }

        if (!$plan && $planName) {
            $plan = Plan::where('nom', 'like', '%' . $planName . '%')
                ->orderBy('grade')
                ->first();
        }

        // ── Create or update subscription ─────────────────────────────────────
        if ($plan) {
            $subscription = Subscription::where('user_id', $user->id)->first();

            if ($subscription) {
                $subscription->usageOptions()->delete();
                $subscription->update([
                    'plan_id'      => $plan->id,
                    'start_date'   => Carbon::today(),
                    'renewal_date' => Carbon::today()->addMonth(),
                    'status'       => 'active',
                ]);
            } else {
                $subscription = Subscription::create([
                    'user_id'      => $user->id,
                    'plan_id'      => $plan->id,
                    'start_date'   => Carbon::today(),
                    'renewal_date' => Carbon::today()->addMonth(),
                    'status'       => 'active',
                ]);
            }

            $plan->load('usageOptionLimits');
            foreach ($plan->usageOptionLimits as $limit) {
                SubUsageOption::create([
                    'subscription_id'            => $subscription->id,
                    'plan_usage_option_limit_id' => $limit->id,
                    'used'                       => 0,
                ]);
            }
        }

        // ── Create HestiaCP account (new users only) ──────────────────────────
        $hestiaUser = $user->hestia_user;
        $package    = $plan?->pkg_hestia_name ?? 'default';

        if ($isNew && $hestiaUser) {
            try {
                $this->hestia->addUser($hestiaUser, $password, $email, $package);
                Log::info("[provision] HestiaCP user created: {$hestiaUser} (package: {$package})");
            } catch (\Throwable $e) {
                // Non-blocking: log and continue — the DB account is still valid
                Log::error("[provision] HestiaCP user creation failed for {$hestiaUser}: " . $e->getMessage());
            }
        }

        $user->tokens()->delete();
        $token = $user->createToken('saas-provision')->plainTextToken;

        return response()->json([
            'user'  => $user->only('id', 'name', 'email', 'hestia_user'),
            'plan'  => $plan ? $plan->only('id', 'nom', 'grade', 'pkg_hestia_name') : null,
            'token' => $token,
        ], 201);
    }
}
