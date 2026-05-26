<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookDelivery extends Model
{
    protected $fillable = [
        'webhook_id', 'endpoint_url', 'request_body', 'status', 'http_status_code',
        'attempts', 'duration_ms', 'error_message',
    ];

    protected $casts = [
        'http_status_code' => 'integer',
        'attempts'         => 'integer',
        'duration_ms'      => 'integer',
    ];

    public function webhook()
    {
        return $this->belongsTo(Webhook::class);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->whereHas('webhook.site', fn ($q) => $q->where('user_id', $userId));
    }
}
