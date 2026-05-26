<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property int $user_id
 * @property string $nom
 * @property string $nom_de_domaine
 * @property string|null $hestia_user
 * @property string|null $db_name
 * @property string|null $db_user
 * @property string $stat
 * @property string|null $cf_record_id
 * @property string|null $custom_domain
 * @property string|null $cf_custom_record_id
 * @property string|null $custom_domain_status
 * @property int $storage_mb
 * @property int $bandwidth_mbps
 */
class Site extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nom',
        'nom_de_domaine',
        'hestia_user',
        'db_name',
        'db_user',
        'stat',
        'cf_record_id',
        'custom_domain',
        'cf_custom_record_id',
        'custom_domain_status',
        'storage_mb',
        'bandwidth_mbps',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }



    public function mqCredential(): HasOne
    {
        return $this->hasOne(MqCredential::class);
    }

    public function webhooks(): HasMany
    {
        return $this->hasMany(Webhook::class);
    }

    public function siteHooks(): HasMany
    {
        return $this->hasMany(SiteHook::class);
    }
}
