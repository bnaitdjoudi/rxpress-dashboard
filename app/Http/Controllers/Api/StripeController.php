<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Price;
use App\Models\SubUsageOption;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Stripe\Checkout\Session;
use Stripe\Stripe;
use Stripe\Webhook;

class StripeController extends Controller
{
    public function createCheckoutSession(Request $request)
    {
        $validated = $request->validate([
            'plan_id'        => 'required|exists:plans,id',
            'price_id'       => 'required|exists:prices,id',
            'prorata_credit' => 'nullable|numeric|min:0',
        ]);

        $plan  = Plan::findOrFail($validated['plan_id']);
        $price = Price::findOrFail($validated['price_id']);

        $annualTotal   = floatval($price->montant) * 12;
        $prorataCredit = floatval($validated['prorata_credit'] ?? 0);
        $finalAmount   = max(0, $annualTotal - $prorataCredit);
        $amountCents   = (int) round($finalAmount * 100);

        Stripe::setApiKey(config('services.stripe.secret'));

        $frontendUrl = config('services.stripe.frontend_url');

        $session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency'     => strtolower($price->devise),
                    'unit_amount'  => $amountCents,
                    'product_data' => [
                        'name'        => $plan->nom . ' — Abonnement annuel',
                        'description' => $plan->description,
                    ],
                ],
                'quantity' => 1,
            ]],
            'mode'        => 'payment',
            'success_url' => $frontendUrl . '/payment/success?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url'  => $frontendUrl . '/payment/cancel',
            'metadata'    => [
                'user_id'  => $request->user()->id,
                'plan_id'  => $plan->id,
                'price_id' => $price->id,
            ],
        ]);

        return response()->json(['url' => $session->url]);
    }

    public function webhook(Request $request)
    {
        $payload       = $request->getContent();
        $sigHeader     = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('[StripeController] webhook signature invalid: ' . $e->getMessage());
            return response()->json(['error' => 'Webhook signature invalide.'], 400);
        }

        if ($event->type === 'checkout.session.completed') {
            $session = $event->data->object;
            $userId  = $session->metadata->user_id;
            $planId  = $session->metadata->plan_id;
            $priceId = $session->metadata->price_id;

            $price        = Price::find($priceId);
            $newPlan      = Plan::with('usageOptionLimits')->find($planId);
            $subscription = Subscription::with('usageOptions.planUsageOptionLimit')->where('user_id', $userId)->first();

            if ($subscription && $price && $newPlan) {
                // Conserver les valeurs "used" par limit_name avant suppression
                $previousUsed = $subscription->usageOptions
                    ->mapWithKeys(fn($u) => [
                        $u->planUsageOptionLimit?->limit_name => (float) $u->used
                    ])
                    ->filter(fn($_, $key) => $key !== null);

                // Supprimer les anciennes options d'usage
                $subscription->usageOptions()->delete();

                // Mettre à jour l'abonnement
                $subscription->update([
                    'plan_id'      => $planId,
                    'start_date'   => Carbon::now(),
                    'renewal_date' => $price->frequence === 'mensuel'
                        ? Carbon::now()->addMonth()
                        : Carbon::now()->addYear(),
                    'status'       => 'active',
                ]);

                // Recréer les options d'usage du nouveau plan
                foreach ($newPlan->usageOptionLimits as $limit) {
                    SubUsageOption::create([
                        'subscription_id'           => $subscription->id,
                        'plan_usage_option_limit_id' => $limit->id,
                        'used'                      => $previousUsed[$limit->limit_name] ?? 0,
                    ]);
                }
            }
        }

        return response()->json(['status' => 'ok']);
    }
}
