<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use DateTimeInterface;

class Order extends Model
{
    protected $fillable = [
        'order_ref',
        'table_name',
        'order_type',
        'total',
        'status',
        'payment_method',
        'staff_id',
        'working_shift_id',
        'discount_amount',
        'tax_amount',
        'vip_discount_amount',
    ];

    protected $casts = [
        'total'               => 'float',
        'discount_amount'     => 'float',
        'tax_amount'          => 'float',
        'vip_discount_amount' => 'float',
    ];

    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->toIso8601String();
    }


    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function income(): HasOne
    {
        return $this->hasOne(Income::class);
    }

    public function stockHistories(): HasMany
    {
        return $this->hasMany(StockHistory::class);
    }

    public function workingShift(): BelongsTo
    {
        return $this->belongsTo(WorkingShift::class);
    }
}