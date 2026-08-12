<?php
namespace App\Http\Controllers\Api\Setting;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SystemSettingController extends Controller
{
    public function show()
    {
        $setting = SystemSetting::getInstance();

        return response()->json([
            'success' => true,
            'data' => [
                'system_name' => $setting->system_name,
                'system_logo' => $setting->system_logo,
            ]
        ]);
    }

    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'system_name' => 'required|string|max:255',
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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $setting = SystemSetting::getInstance();
        $setting->update([
            'system_name' => $request->system_name,
            'system_logo' => $request->has('system_logo')
                                ? $request->system_logo
                                : $setting->system_logo,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully.',
            'data'    => [
                'system_name' => $setting->system_name,
                'system_logo' => $setting->system_logo,
            ]
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