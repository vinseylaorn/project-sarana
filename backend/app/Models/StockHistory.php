<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockHistory extends Model
{
    protected $fillable = [
        'inventory_id', 'product_name', 'type',
        'qty', 'unit', 'reason', 'order_id'
    ];

    protected $casts = ['qty' => 'float'];

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }
}