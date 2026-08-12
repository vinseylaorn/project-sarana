<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VipCard extends Model
{
    protected $fillable = [
        'code',
        'tier_id',
        'total_visits',
        'used_this_month',
        'monthly_limit',
        'issued_at',
        'expires_at',
        'is_active',
        'note',
    ];

    protected $casts = [
        'total_visits'    => 'integer',
        'used_this_month' => 'integer',
        'monthly_limit'   => 'integer',
        'issued_at'       => 'date:Y-m-d',
        'expires_at'      => 'date:Y-m-d',
        'is_active'       => 'boolean',
    ];


    public function tier(): BelongsTo
    {
        return $this->belongsTo(VipTier::class, 'tier_id');
    }

    public function upgradeLogs(): HasMany
    {
        return $this->hasMany(VipUpgradeLog::class, 'card_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public static function generateCode(): string
    {
        $last = self::latest('id')->value('code');
        $seq  = 1;
        if ($last) {
            $seq = (int) str_replace('-', '', substr($last, -3)) + 1;
        }
        return sprintf('%03d-%03d-%03d', 0, 0, $seq);
    }

    public function toFrontend(): array
    {
        return [
            'id'            => $this->id,
            'code'          => $this->code,
            'tierId'        => $this->tier_id,
            'totalVisits'   => $this->total_visits,
            'usedThisMonth' => $this->used_this_month,
            'monthlyLimit'  => $this->monthly_limit,
            'issuedAt'      => $this->issued_at?->format('Y-m-d'),
            'expiresAt'     => $this->expires_at?->format('Y-m-d'),
            'isActive'      => $this->is_active,
            'note'          => $this->note,
        ];
    }
}