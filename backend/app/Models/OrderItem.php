<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'menu_item_id',
        'name',
        'price',
        'original_price',       
        'quantity',
        'discount_name',        
        'discount_value',       
        'discount_value_type',  
    ];

    protected $casts = [
        'price'          => 'float',
        'original_price' => 'float',   
        'discount_value' => 'float',  
        'quantity'       => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'menu_item_id');
    }
}