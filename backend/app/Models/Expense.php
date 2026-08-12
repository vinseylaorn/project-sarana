<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = ['title', 'amount', 'category', 'date', 'is_auto'];

    protected function casts(): array
    {
        return [
            'amount'  => 'decimal:2',
            'date'    => 'date:Y-m-d',
            'is_auto' => 'boolean',
        ];
    }
}