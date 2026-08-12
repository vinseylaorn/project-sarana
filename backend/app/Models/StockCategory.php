<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockCategory extends Model
{
    use HasFactory;

    protected $table = 'stock_categories';

    protected $fillable = [
        'name',
    ];
    protected $casts = [
    'created_at' => 'datetime',
    'updated_at' => 'datetime',
];
}