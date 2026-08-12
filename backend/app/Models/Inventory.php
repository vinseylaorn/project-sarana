<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventories';

    protected $fillable = [
        'category_id',
        'name',
        'unit',
        'size',
        'stock',
        'min_stock',
        'supplier_id',
    ];

    protected $casts = [
        'stock'     => 'float',
        'min_stock' => 'float',
    ];

    public function category()
    {
        return $this->belongsTo(StockCategory::class, 'category_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}