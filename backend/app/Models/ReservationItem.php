<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReservationItem extends Model
{
    protected $fillable = [
        'reservation_id',
        'menu_item_id',
        'name',
        'price',
        'original_price',  
        'discount_name',   
        'discount_value',  
        'discount_type',  
        'quantity',
    ];

    protected $casts = [
        'price'          => 'decimal:2',
        'original_price' => 'decimal:2',  
        'discount_value' => 'decimal:2',  
        'quantity'       => 'integer',
    ];

    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }
}