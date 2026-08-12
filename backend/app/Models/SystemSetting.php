<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $table    = 'system_settings';
    protected $fillable = ['system_name', 'system_logo'];

    public static function getInstance(): self
    {
        return self::firstOrCreate(
            ['id' => 1],
            ['system_name' => 'My System', 'system_logo' => null]
        );
    }
}