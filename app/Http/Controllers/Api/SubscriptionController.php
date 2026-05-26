<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Webhook;
use App\Models\WpEvent;
use App\Services\HestiaService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    public function __construct(private HestiaService $hestia) {}

    public function index(Request $request)
    {
        $user = $request->user();

        $subscription = $user->subscription()
            ->with(['plan.prices', 'plan.usageOptionLimits', 'usageOptions.planUsageOptionLimit'])
            ->first();

        if ($subscription) {
            $usageMap = $subscription->usageOptions->keyBy(fn($u) => $u->planUsageOptionLimit?->limit_name);

            $storage   = $this->formatUsage($usageMap->get('storage'));
            $bandwidth = $this->formatUsage($usageMap->get('bandwith'));

            // Récupère les valeurs réelles depuis Hestia si activé et si l'utilisateur a un compte Hestia
            if (config('hestia.enabled') && $user->hestia_user) {
                try {
                    $hestiaUser = $this->hestia->listUser($user->hestia_user);

                    if ($storage !== null && isset($hestiaUser['U_DISK'])) {
                        $storage['used'] = round((float) $hestiaUser['U_DISK'] / 1024, 2);
                    }

                    if ($bandwidth !== null && isset($hestiaUser['U_BANDWIDTH'])) {
                        $bandwidth['used'] = round((float) $hestiaUser['U_BANDWIDTH'] / 1024, 2);
                    }
                } catch (\Throwable $e) {
                    Log::warning("Hestia listUser failed for {$user->hestia_user}", ['error' => $e->getMessage()]);
                }
            }

            $price = $subscription->plan?->prices
                ->where('active', true)
                ->first();

            $startDate = Carbon::parse($subscription->getRawOriginal('start_date'));
            $renewalDate = match ($price?->frequence) {
                'mensuel' => Carbon::now()->startOfMonth()->addMonth()->toDateString(),
                'annuel'  => $startDate->copy()->addYear()->toDateString(),
                default   => Carbon::parse($subscription->getRawOriginal('renewal_date'))->toDateString(),
            };

            return response()->json([
                ...$subscription->toArray(),
                'start_date'   => $startDate->toDateString(),
                'renewal_date' => $renewalDate,
                'price'        => $price,
                'storage'      => $storage,
                'bandwidth'    => $bandwidth,
                'visits'       => $this->formatUsage($usageMap->get('visits')),
                'hooks'        => $this->formatHooksUsage($usageMap->get('hooks'), $user->id),
                'sites'        => $this->formatCountUsage($usageMap->get('site'), $user->sites()->count()),
                'ftp'          => $this->formatUsage($usageMap->get('ftp')),
                'queue'        => $this->formatUsage($usageMap->get('queue')),
                'webhooks'     => $this->formatCountUsage($usageMap->get('webhooks'), Webhook::whereIn('site_id', $user->sites()->pluck('id'))->count()),
            ]);
        }

        return response()->json($subscription);
    }

    private function formatUsage(?object $usageOption): ?array
    {
        if (!$usageOption)
            return null;

        $limit = $usageOption->planUsageOptionLimit;

        return [
            'used'  => (float) $usageOption->used,
            'limit' => (float) $limit->value,
            'unit'  => $limit->unit,
        ];
    }

    private function formatCountUsage(?object $usageOption, int $count): ?array
    {
        if (!$usageOption)
            return null;

        $limit = $usageOption->planUsageOptionLimit;

        return [
            'used'  => $count,
            'limit' => (float) $limit->value,
            'unit'  => $limit->unit,
        ];
    }

    private function formatHooksUsage(?object $usageOption, int $userId): ?array
    {
        if (!$usageOption)
            return null;

        $limit = $usageOption->planUsageOptionLimit;

        $hestiaUser = \App\Models\User::find($userId)?->hestia_user;

        $query = WpEvent::where('created_at', '>=', Carbon::now()->startOfMonth());

        if ($hestiaUser) {
            $query->where('compte', 'like', $hestiaUser . '.%');
        } else {
            $query->whereRaw('0 = 1');
        }

        return [
            'used'  => $query->count(),
            'limit' => (float) $limit->value,
            'unit'  => $limit->unit,
        ];
    }
}
