<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class NbcRateService

{
    private const FRESH_KEY = 'nbc_rate:fresh';
    private const LAST_KEY  = 'nbc_rate:last';

    /**
     * @return array{rate: float, date: string, stale: bool}
     * @throws Throwable when the API fails AND there is no previously cached value
     */
    public function get(bool $force = false): array
    {
        if (! $force && ($cached = Cache::get(self::FRESH_KEY))) {
            return $cached + ['stale' => false];
        }

        try {
            $data = $this->fetch();

            Cache::put(self::FRESH_KEY, $data, (int) config('services.nbc.cache_ttl', 3600));
            Cache::forever(self::LAST_KEY, $data);

            return $data + ['stale' => false];
        } catch (Throwable $e) {
            Log::warning('NBC rate fetch failed: ' . $e->getMessage());

            if ($last = Cache::get(self::LAST_KEY)) {
                return $last + ['stale' => true];
            }

            throw $e;
        }
    }

    /**
     * @return array{rate: float, date: string}
     */
    private function fetch(): array
    {
        $cfg = (array) config('services.nbc', []);

        if (empty($cfg['url'] ?? null)) {
            throw new RuntimeException('NBC_RATE_URL is not configured.');
        }

        $baseUrl = strtok($cfg['url'], '?');
        parse_str((string) parse_url($cfg['url'], PHP_URL_QUERY), $query);

        $request = Http::timeout(8)->retry(2, 200)->acceptJson();

        if (! empty($cfg['api_key'] ?? null)) {
            if (! empty($cfg['api_key_header'] ?? null)) {
                $request = $request->withHeaders([$cfg['api_key_header'] => $cfg['api_key']]);
            }
            if (! empty($cfg['api_key_query'] ?? null)) {
                $query[$cfg['api_key_query']] = $cfg['api_key'];
            }
        }

        $json = $request->get($baseUrl, $query)->throw()->json();

        $raw = data_get($json, ($cfg['path'] ?? null) ?: 'data.average');
        if (is_string($raw)) {
            $raw = str_replace(',', '', $raw);
        }

        $rate = is_numeric($raw) ? (float) $raw : 0.0;

        if ($rate < 1000 || $rate > 10000) {
            throw new RuntimeException("Unexpected NBC rate value: " . json_encode($raw));
        }

        $date = data_get($json, 'data.date')
            ?? data_get($json, 'data.updated_at')
            ?? now()->toDateString();

        return [
            'rate' => $rate,
            'date' => is_string($date) ? substr($date, 0, 10) : now()->toDateString(),
        ];
    }
}