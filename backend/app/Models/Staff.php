<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Staff extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'gender',
        'phone',
        'email',
        'position',
        'salary',
        'status',
        'image',
        'date',
        'can_use_pos', 
        'pin_code',
    ];

    protected $hidden = [
        'pin_code',
    ];

    protected $casts = [
        'date'        => 'date',
        'salary'      => 'decimal:2',
        'can_use_pos' => 'boolean', 
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function workingShifts(): HasMany
    {
        return $this->hasMany(WorkingShift::class);
    }

    public function verifyPin(string $pin): bool
    {
        return $this->pin_code === $pin;
    }
}