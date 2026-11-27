<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use DateTimeInterface;

class Order extends Model
{
    protected $fillable = [
        'order_ref',
        'table_name',
        'order_type',
        'total',
        'status',
        'payment_method',
        'staff_id',
        'working_shift_id',
        'merged_into_order_id',
        'discount_amount',
        'tax_amount',
        'vip_discount_amount',
    ];

    protected $casts = [
        'total'               => 'float',
        'discount_amount'     => 'float',
        'tax_amount'          => 'float',
        'vip_discount_amount' => 'float',
    ];

    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->toIso8601String();
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function income(): HasOne
    {
        return $this->hasOne(Income::class);
    }

    public function stockHistories(): HasMany
    {
        return $this->hasMany(StockHistory::class);
    }

    public function workingShift(): BelongsTo
    {
        return $this->belongsTo(WorkingShift::class);
    }

    /** All tables of a merged order (empty for a normal order). */
    public function tables(): BelongsToMany
    {
        return $this->belongsToMany(RestaurantTable::class, 'order_tables', 'order_id', 'table_id')
            ->withTimestamps();
    }

    /**
     * ដោះលែងតុទាំងអស់របស់ order នេះ (តុដើម + តុដែល merge ចូល) ឱ្យទៅ available
     * ហៅក្រោយ complete() ឬ cancel()
     */
    public function releaseTables(): void
    {
        $ids = $this->tables()->pluck('restaurant_tables.id')->all();

        RestaurantTable::where(function ($q) use ($ids) {
            $q->where('name', $this->table_name);
            if (!empty($ids)) {
                $q->orWhereIn('id', $ids);
            }
        })->update([
            'status'       => 'available',
            'reserve_time' => null,
        ]);
    }
}