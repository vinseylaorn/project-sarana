<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $table    = 'system_settings';
    protected $fillable = [
        'system_name',
        'system_logo',
        'exchange_rate',
        'exchange_rate_mode',
    ];

    public static function getInstance(): self
    {
        return self::firstOrCreate(
            ['id' => 1],
            [
                'system_name'        => 'My System',
                'system_logo'        => null,
                'exchange_rate_mode' => 'manual',
            ]
        );
    }
}