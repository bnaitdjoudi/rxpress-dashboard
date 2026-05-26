<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WpEvent extends Model
{
    protected $fillable = [
        'event_id',
        'hook',
        'site_url',
        'compte',
        'user_id',
        'args',
        'wp_timestamp',
    ];

    protected $casts = [
        'args'         => 'array',
        'wp_timestamp' => 'datetime',
    ];

    public function scopeForSite($query, string $siteUrl)
    {
        return $query->where('site_url', $siteUrl);
    }

    public function scopeForHook($query, string $hook)
    {
        return $query->where('hook', $hook);
    }

    public function scopeForCompte($query, string $compte)
    {
        return $query->where('compte', $compte);
    }
}
