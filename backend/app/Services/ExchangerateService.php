<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Resolves the USD/KHR rate according to System Settings.
 *   manual -> manual rate saved in Settings
 *   auto   -> NBC rate (falls back to the manual rate if NBC is down)
 * This class NEVER throws, so the POS can always close a shift.
 */
class ExchangeRateService
{
    public const DEFAULT_RATE = 4100.0;

    private const COL_MODE   = 'exchange_rate_mode';
    private const COL_MANUAL = 'exchange_rate';

    public function __construct(private NbcRateService $nbc) {}

    /** @return array{rate: float, mode: string, source: string, date: ?string, stale: bool} */
    public function current(): array
    {
        $settings = $this->settings();
        $mode     = strtolower((string) ($settings[self::COL_MODE] ?? 'manual'));
        $manual   = (float) ($settings[self::COL_MANUAL] ?? 0);

        if ($manual < 1000 || $manual > 10000) {
            $manual = self::DEFAULT_RATE;
        }

        if ($mode === 'auto') {
            try {
                $n = $this->nbc->get();

                return [
                    'rate'   => (float) $n['rate'],
                    'mode'   => 'auto',
                    'source' => 'nbc',
                    'date'   => $n['date'] ?? null,
                    'stale'  => (bool) ($n['stale'] ?? false),
                ];
            } catch (Throwable $e) {
                Log::warning('ExchangeRateService: NBC failed, using manual rate: ' . $e->getMessage());

                return ['rate' => $manual, 'mode' => 'auto', 'source' => 'manual-fallback', 'date' => null, 'stale' => true];
            }
        }

        return ['rate' => $manual, 'mode' => 'manual', 'source' => 'manual', 'date' => null, 'stale' => false];
    }

    private function settings(): array
    {
        try {
            foreach (['App\Models\SystemSetting', 'App\Models\Systemsetting'] as $cls) {
                if (class_exists($cls)) {
                    $row = $cls::query()->first();
                    return $row ? $row->toArray() : [];
                }
            }

            foreach (['system_settings', 'systemsettings', 'settings'] as $t) {
                if (Schema::hasTable($t) && Schema::hasColumn($t, self::COL_MODE)) {
                    $row = DB::table($t)->first();
                    return $row ? (array) $row : [];
                }
            }
        } catch (Throwable $e) {
            Log::warning('ExchangeRateService: cannot read settings: ' . $e->getMessage());
        }

        return [];
    }
}