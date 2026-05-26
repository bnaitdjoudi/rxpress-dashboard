<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hook extends Model
{
    protected $fillable = [
        'user_id',
        'hook',
        'label',
        'category',
        'origine',
        'listed',
    ];

    protected $casts = [
        'listed' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function siteHooks(): HasMany
    {
        return $this->hasMany(SiteHook::class);
    }
}
