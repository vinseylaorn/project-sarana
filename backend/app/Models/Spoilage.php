<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Spoilage extends Model
{
    protected $fillable = [
        'inventory_id',
        'category_id',
        'product_name',
        'unit',
        'qty',
        'description',
        'date',
    ];

    protected $casts = ['date' => 'date'];

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }

    public function category()
    {
        return $this->belongsTo(StockCategory::class, 'category_id');
    }
}