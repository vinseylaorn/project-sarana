<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VipUpgradeLog extends Model
{
    protected $fillable = [
        'card_id',
        'card_code',
        'old_card_code',
        'from_tier_id',
        'from_tier_name',
        'to_tier_id',
        'to_tier_name',
        'total_visits_at_upgrade',
        'upgraded_at',
    ];

    protected $casts = [
        'total_visits_at_upgrade' => 'integer',
        'upgraded_at'             => 'datetime',
    ];

    public function card(): BelongsTo
    {
        return $this->belongsTo(VipCard::class, 'card_id');
    }

    public function toFrontend(): array
    {
        return [
            'id'                   => $this->id,
            'cardId'               => $this->card_id,
            'cardCode'             => $this->card_code,
            'oldCardCode'          => $this->old_card_code,
            'fromTierId'           => $this->from_tier_id,
            'fromTierName'         => $this->from_tier_name,
            'toTierId'             => $this->to_tier_id,
            'toTierName'           => $this->to_tier_name,
            'totalVisitsAtUpgrade' => $this->total_visits_at_upgrade,
            'upgradedAt'           => $this->upgraded_at->format('Y-m-d H:i:s'),
        ];
    }
}