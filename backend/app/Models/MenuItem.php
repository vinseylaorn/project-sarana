<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    protected $fillable = ['category_id', 'name', 'price', 'image', 'available'];

    protected $casts = [
        'price'     => 'float',
        'available' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function recipes()
    {
        return $this->hasMany(MenuRecipe::class, 'menu_item_id');
    }
}