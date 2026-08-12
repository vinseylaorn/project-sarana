<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VipTier extends Model
{
    protected $fillable = [
        'name',
        'name_kh',
        'discount',
        'min_visits',
        'max_visits',
        'upgrade_at',
        'monthly_limit',
        'color',
        'bg_from',
        'bg_to',
        'accent_color',
        'icon',
        'is_active',
    ];

    protected $casts = [
        'discount'      => 'integer',
        'min_visits'    => 'integer',
        'max_visits'    => 'integer',
        'upgrade_at'    => 'integer',
        'monthly_limit' => 'integer',
        'is_active'     => 'boolean',
    ];


    public function cards(): HasMany
    {
        return $this->hasMany(VipCard::class, 'tier_id');
    }

    public function toFrontend(): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'nameKh'      => $this->name_kh,
            'discount'    => $this->discount,
            'minVisits'   => $this->min_visits,
            'maxVisits'   => $this->max_visits,
            'upgrade'     => $this->upgrade_at,
            'monthlyLimit'=> $this->monthly_limit,
            'color'       => $this->color,
            'bgFrom'      => $this->bg_from,
            'bgTo'        => $this->bg_to,
            'accentColor' => $this->accent_color,
            'icon'        => $this->icon,
        ];
    }
}