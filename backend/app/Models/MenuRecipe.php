<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuRecipe extends Model
{
    protected $fillable = ['menu_item_id', 'inventory_id', 'deduct_qty'];

    protected $casts = ['deduct_qty' => 'float'];

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }
}