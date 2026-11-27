<?php
namespace App\Http\Controllers\Api\Setting;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SystemSettingController extends Controller
{
    private const DEFAULT_NAME = 'RMS';

    private function payload(SystemSetting $setting): array
    {
        return [
            'system_name'        => $setting->system_name ?: self::DEFAULT_NAME,
            'system_logo'        => $setting->system_logo,
            'exchange_rate'      => (float) $setting->exchange_rate,
            'exchange_rate_mode' => $setting->exchange_rate_mode === 'auto' ? 'auto' : 'manual',
        ];
    }

    public function show()
    {
        return response()->json([
            'success' => true,
            'data'    => $this->payload(SystemSetting::getInstance()),
        ]);
    }

    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'system_name' => 'nullable|string|max:255',
            'system_logo' => [
                'nullable',
                'string',
                function ($attribute, $value, $fail) {
                    if ($value && !preg_match('/^data:image\/(png|jpeg|jpg|gif|webp);base64,/', $value)) {
                        $fail('Logo must be a valid base64 image.');
                    }
                    if ($value && strlen($value) > 2_800_000) {
                        $fail('Logo size must not exceed 2MB.');
                    }
                }
            ],
            // 1 USD = ? KHR (manual rate, also the fallback when NBC is down)
            'exchange_rate'      => 'nullable|numeric|min:1000|max:10000',
            // "auto" = real-time NBC rate, "manual" = exchange_rate above
            'exchange_rate_mode' => 'nullable|in:auto,manual',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $setting = SystemSetting::getInstance();
        $setting->update([
            'system_name' => $request->filled('system_name')
                                ? trim($request->system_name)
                                : ($setting->system_name ?: self::DEFAULT_NAME),
            'system_logo' => $request->has('system_logo')
                                ? $request->system_logo
                                : $setting->system_logo,
            'exchange_rate' => $request->filled('exchange_rate')
                                ? $request->exchange_rate
                                : $setting->exchange_rate,
            'exchange_rate_mode' => $request->filled('exchange_rate_mode')
                                ? $request->exchange_rate_mode
                                : ($setting->exchange_rate_mode ?: 'manual'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully.',
            'data'    => $this->payload($setting->fresh()),
        ]);
    }

    public function removeLogo()
    {
        $setting = SystemSetting::getInstance();
        $setting->update(['system_logo' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Logo removed successfully.',
        ]);
    }
}