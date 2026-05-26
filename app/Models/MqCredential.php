<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MqCredential extends Model
{
    protected $fillable = [
        'site_id',
        'host',
        'port',
        'vhost',
        'queue',
        'username',
        'password',
    ];

    protected $hidden = ['password'];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }
}
