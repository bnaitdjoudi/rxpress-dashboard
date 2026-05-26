<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Webhook extends Model
{
    protected $fillable = [
        'site_id',
        'name',
        'endpoint_url',
        'event',
        'auth_type',
        'auth_config',
        'content_type',
        'secret',
        'active',
        'consecutive_failures',
        'auto_disabled_at',
        'last_called_at',
        'last_status_code',
    ];

    protected $hidden = ['secret', 'auth_config'];

    protected $casts = [
        'active' => 'boolean',
        'consecutive_failures' => 'integer',
        'auto_disabled_at' => 'datetime',
        'last_called_at' => 'datetime',
        'auth_config' => 'encrypted:array',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(WebhookEvent::class);
    }
}
