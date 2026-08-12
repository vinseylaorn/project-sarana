<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Discount extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'scope',
        'value_type',
        'value',
        'target_ids',
        'start_date',
        'end_date',
        'status',
        'min_order_amount',
        'description',
    ];

    protected $casts = [
        'target_ids'       => 'array',
        'value'            => 'float',
        'min_order_amount' => 'float',
        'start_date'       => 'datetime',
        'end_date'         => 'datetime',
    ];
}