<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'description',
        'active',
        'grade',
        'pkg_hestia_name',
        'stripe_product_id',
    ];

    protected $casts = [
        'active' => 'boolean',
        'grade' => 'integer',
    ];

    public function prices(): BelongsToMany
    {
        return $this->belongsToMany(Price::class)->withTimestamps();
    }

    public function usageOptionLimits(): HasMany
    {
        return $this->hasMany(PlanUsageOptionLimit::class);
    }
}
