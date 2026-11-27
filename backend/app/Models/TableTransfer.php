<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TableTransfer extends Model
{
    protected $fillable = [
        'type', 'order_id', 'from_table_id', 'to_table_id', 'staff_id',
    ];
}