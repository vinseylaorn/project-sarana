<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkingShift extends Model
{
    protected $fillable = [
        'staff_id',
        'date',
        'shift_type',
        'start_time',
        'end_time',
        'status',
        'shift_status',
        'overtime_hours',
        'note',
        'open_time',
        'open_amount_usd',
        'open_amount_khr',
        'close_time',
        'close_amount_usd',
        'close_amount_khr',
        'total_orders',
        'total_revenue_usd',
        'total_revenue_khr',
        'expected_cash_usd',
        'cash_difference_usd',
    ];

    protected $casts = [
        'date'                => 'date',
        'open_time'           => 'datetime',
        'close_time'          => 'datetime',
        'open_amount_usd'     => 'decimal:2',
        'open_amount_khr'     => 'decimal:0',
        'close_amount_usd'    => 'decimal:2',
        'close_amount_khr'    => 'decimal:0',
        'total_revenue_usd'   => 'decimal:2',
        'total_revenue_khr'   => 'decimal:0',
        'overtime_hours'      => 'decimal:1',
        'total_orders'        => 'integer',
        'expected_cash_usd'   => 'decimal:2',
        'cash_difference_usd' => 'decimal:2',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }
}