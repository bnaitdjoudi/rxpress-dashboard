<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SiteController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\StripeController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\WebhookEventController;
use App\Http\Controllers\Api\HookController;
use App\Http\Controllers\Api\SiteHookController;
use App\Http\Controllers\Api\WpEventController;
use App\Http\Controllers\Api\WebhookDeliveryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Routes publiques (sans authentification)
Route::post('/login', [AuthController::class, 'login']);

// Account provisioning from SaaS checkout (protected by shared secret)
Route::post('/provision', [\App\Http\Controllers\Api\ProvisionController::class, 'provision']);

// Routes protégées (avec authentification Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/sites', [SiteController::class, 'index']);
    Route::post('/sites', [SiteController::class, 'store']);
    Route::get('/sites/{site}', [SiteController::class, 'show']);
    Route::put('/sites/{site}', [SiteController::class, 'update']);
    Route::patch('/sites/{site}/stat', [SiteController::class, 'updateStat']);
    Route::get('/sites/{site}/mq-password', [SiteController::class, 'showMqPassword']);
    Route::post('/sites/{site}/mq-password/regenerate', [SiteController::class, 'regenerateMqPassword']);
    Route::post('/sites/{site}/db-password/regenerate', [SiteController::class, 'regenerateDbPassword']);
    Route::post('/sites/{site}/wp-password/regenerate', [SiteController::class, 'regenerateWpPassword']);

    // Domaine custom (Cloudflare)
    Route::post('/sites/{site}/custom-domain', [SiteController::class, 'addCustomDomain']);
    Route::post('/sites/{site}/custom-domain/verify', [SiteController::class, 'verifyCustomDomain']);
    Route::delete('/sites/{site}/custom-domain', [SiteController::class, 'removeCustomDomain']);

    // WooCommerce API Keys
    Route::get('/sites/{site}/wc-keys', [SiteController::class, 'listWcApiKeys']);
    Route::post('/sites/{site}/wc-keys', [SiteController::class, 'createWcApiKey']);
    Route::delete('/sites/{site}/wc-keys/{keyId}', [SiteController::class, 'deleteWcApiKey']);
    Route::post('/sites/{site}/wc-keys/{keyId}/regenerate', [SiteController::class, 'regenerateWcApiKey']);

    // Webhooks
    Route::get('/sites/{site}/webhooks', [WebhookController::class, 'index']);
    Route::post('/sites/{site}/webhooks', [WebhookController::class, 'store']);
    Route::put('/sites/{site}/webhooks/{webhook}', [WebhookController::class, 'update']);
    Route::post('/sites/{site}/webhooks/{webhook}/regenerate-secret', [WebhookController::class, 'regenerateSecret']);
    Route::delete('/sites/{site}/webhooks/{webhook}', [WebhookController::class, 'destroy']);

    // Webhook Events
    Route::get('/sites/{site}/webhooks/{webhook}/events', [WebhookEventController::class, 'index']);
    Route::post('/sites/{site}/webhooks/{webhook}/events', [WebhookEventController::class, 'store']);
    Route::put('/sites/{site}/webhooks/{webhook}/events/{event}', [WebhookEventController::class, 'update']);
    Route::delete('/sites/{site}/webhooks/{webhook}/events/{event}', [WebhookEventController::class, 'destroy']);

    // Hooks catalogue (hooks listed=true)
    Route::get('/hooks', [HookController::class, 'index']);
    Route::get('/hooks/mine', [HookController::class, 'mine']);
    Route::get('/hooks/events-count', [HookController::class, 'eventsCount']);

    // Site Hooks (WP hooks listeners)
    Route::get('/sites/{site}/hooks', [SiteHookController::class, 'index']);
    Route::post('/sites/{site}/hooks', [SiteHookController::class, 'store']);
    Route::put('/sites/{site}/hooks/{siteHook}', [SiteHookController::class, 'update']);
    Route::delete('/sites/{site}/hooks/{siteHook}', [SiteHookController::class, 'destroy']);
    Route::get('/subscriptions', [SubscriptionController::class, 'index']);

    // WP Events (monitoring)
    Route::get('/wp-events', [WpEventController::class, 'index']);
    Route::get('/wp-events/stats', [WpEventController::class, 'stats']);

    // Webhook Deliveries (monitoring sortant)
    Route::get('/webhook-deliveries', [WebhookDeliveryController::class, 'index']);
    Route::get('/webhook-deliveries/stats', [WebhookDeliveryController::class, 'stats']);
    Route::post('/webhook-deliveries/{delivery}/replay', [WebhookDeliveryController::class, 'replay']);

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/hestia-password', [ProfileController::class, 'setHestiaPassword']);

    // Debug Hestia (temporaire)
    Route::get('/hestia/debug/user', [\App\Http\Controllers\Api\HestiaDebugController::class, 'user']);

    // Stripe Checkout
    Route::post('/stripe/checkout', [StripeController::class, 'createCheckoutSession']);
});

// Plans & Prices
Route::get('/plans', [\App\Http\Controllers\Api\PlanController::class, 'index']);
Route::get('/prices', [\App\Http\Controllers\Api\PriceController::class, 'index']);

// Stripe Webhook (public — Stripe signe la requête)
Route::post('/stripe/webhook', [StripeController::class, 'webhook']);
