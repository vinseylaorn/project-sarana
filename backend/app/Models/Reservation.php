<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reservation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_name',
        'customer_phone',
        'arrival_datetime',   
        'status',
        'total_price',
        'notes',
    ];

    protected $casts = [
        'total_price'      => 'decimal:2',
        'arrival_datetime' => 'datetime',  
    ];

    public function tables()
    {
        return $this->belongsToMany(
            RestaurantTable::class,
            'reservation_tables',
            'reservation_id',
            'table_id'
        )->withPivot('status')->withTimestamps();
    }

    public function items()
    {
        return $this->hasMany(ReservationItem::class);
    }
}