<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'plan_id',
        'start_date',
        'renewal_date',
        'status',
    ];
    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    protected $casts = [
        'start_date' => 'date',
        'renewal_date' => 'date',
    ];


    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function usageOptions(): HasMany
    {
        return $this->hasMany(SubUsageOption::class);
    }
}
