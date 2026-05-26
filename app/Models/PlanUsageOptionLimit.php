<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlanUsageOptionLimit extends Model
{
    use HasFactory;

    protected $fillable = [
        'plan_id',
        'limit_name',
        'unit',
        'value',
    ];

    protected $casts = [
        'value' => 'decimal:2',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function subUsageOptions(): HasMany
    {
        return $this->hasMany(SubUsageOption::class);
    }
}
