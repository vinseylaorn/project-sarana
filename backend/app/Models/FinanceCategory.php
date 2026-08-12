<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinanceCategory extends Model
{
    protected $table    = 'finance_categories';
    protected $fillable = ['name', 'type'];

    protected $casts = [
    'created_at' => 'datetime',
    'updated_at' => 'datetime',
];
    
}