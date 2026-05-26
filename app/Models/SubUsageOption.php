<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubUsageOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'subscription_id',
        'plan_usage_option_limit_id',
        'used',
    ];

    protected $casts = [
        'used' => 'decimal:2',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function planUsageOptionLimit(): BelongsTo
    {
        return $this->belongsTo(PlanUsageOptionLimit::class);
    }
}
