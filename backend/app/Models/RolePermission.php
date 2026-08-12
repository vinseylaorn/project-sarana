<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RolePermission extends Model
{
    protected $fillable = [
        'role_id',
        'page',  
        'page_key', 
        'permission', 
        'granted',
        'label',
        'label_kh',
        'section',
        'section_kh',
        'href',
    ];

    protected $casts = [
        'granted' => 'boolean',
    ];

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }
}