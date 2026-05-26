<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteHook extends Model
{
    protected $fillable = [
        'site_id',
        'hook_id',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function hook(): BelongsTo
    {
        return $this->belongsTo(Hook::class);
    }
}
