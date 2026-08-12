<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Reservation;
use App\Models\RestaurantTable;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class UpdateReservationStatuses extends Command
{
    protected $signature   = 'reservations:update-statuses';
    protected $description = 'Auto-update table status based on arrival_datetime';

    private const LOCK_WINDOW_MINUTES = 30;

    private const NO_SHOW_GRACE_MINUTES = 90;

    public function handle(): void
    {
        $now             = Carbon::now();
        $lockWindowAhead = $now->copy()->addMinutes(self::LOCK_WINDOW_MINUTES);
        $noShowThreshold = $now->copy()->subMinutes(self::NO_SHOW_GRACE_MINUTES);

        $upcoming = Reservation::whereIn('status', ['pending', 'confirmed'])
            ->whereNotNull('arrival_datetime')
            ->where('arrival_datetime', '<=', $lockWindowAhead)
            ->where('arrival_datetime', '>', $now)
            ->with('tables')
            ->get();

        foreach ($upcoming as $reservation) {
            $tableIds = $reservation->tables
                ->where('pivot.status', 'reserved')
                ->pluck('id')
                ->toArray();

            if (empty($tableIds)) continue;

            DB::transaction(function () use ($reservation, $tableIds) {
                $updatedCount = RestaurantTable::whereIn('id', $tableIds)
                    ->where('status', 'available')
                    ->update(['status' => 'reserved']);

                if ($reservation->status === 'pending') {
                    $reservation->update(['status' => 'confirmed']);
                }

                if ($updatedCount > 0) {
                    $this->info("✅ Reservation #{$reservation->id} → table locked to reserved (tables: " . implode(',', $tableIds) . ")");
                }
            });
        }

        $noShows = Reservation::whereIn('status', ['pending', 'confirmed'])
            ->whereNotNull('arrival_datetime')
            ->where('arrival_datetime', '<', $noShowThreshold)
            ->with('tables')
            ->get();

        foreach ($noShows as $reservation) {
            $tableIds = $reservation->tables
                ->where('pivot.status', 'reserved')
                ->pluck('id')
                ->toArray();

            $occupiedIds   = RestaurantTable::whereIn('id', $tableIds)
                ->where('status', 'occupied')
                ->pluck('id')
                ->toArray();
            $releasableIds = array_diff($tableIds, $occupiedIds);

            DB::transaction(function () use ($reservation, $releasableIds) {
                if (!empty($releasableIds)) {
                    RestaurantTable::whereIn('id', $releasableIds)
                        ->update(['status' => 'available', 'reserve_time' => null]);
                }

                $reservation->update(['status' => 'no_show']);
            });

            $tablesLog = empty($releasableIds) ? 'none (already occupied)' : implode(',', $releasableIds);
            $this->info("⏰ Reservation #{$reservation->id} → no_show → tables released ({$tablesLog})");
        }

        $this->info('Done at ' . $now->toDateTimeString());
    }
}