<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Income extends Model
{
    protected $fillable = [
        'income_ref',
        'title',
        'amount',
        'date',
        'category',
        'is_auto_generated',
        'order_id',
        'payment_method',
        'description',
    ];

    protected $casts = [
        'date'              => 'date',
        'is_auto_generated' => 'boolean',
        'amount'            => 'decimal:2',
    ];


    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public static function generateReference(): string
    {
        $date   = now('Asia/Phnom_Penh')->format('Ymd');
        $random = strtoupper(substr(uniqid(), -4));
        return "INC-{$date}-{$random}";
    }
}