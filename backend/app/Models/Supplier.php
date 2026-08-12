<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'contact_name',
        'phone',
        'email',
        'address',
        'category_id',
        'status',
        'note',
    ];

    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    public function category()
    {
        return $this->belongsTo(StockCategory::class, 'category_id');
    }
}