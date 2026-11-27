<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestaurantTable extends Model
{
    protected $table = 'restaurant_tables';

    protected $fillable = [
        'name', 'seats', 'floor', 'status', 'reserve_time',
    ];

    /** order ធម្មតា (ភ្ជាប់តាម table_name) */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'table_name', 'name');
    }

    /** order ដែលតុនេះត្រូវបាន merge ចូល (តាម pivot order_tables) */
    public function mergedOrders(): BelongsToMany
    {
        return $this->belongsToMany(Order::class, 'order_tables', 'table_id', 'order_id')
            ->withTimestamps();
    }
}