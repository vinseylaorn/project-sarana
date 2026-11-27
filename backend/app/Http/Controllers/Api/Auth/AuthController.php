<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'login'    => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $request->login)
                    ->orWhere('email', $request->login)
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Username/email or password is incorrect.'],
            ]);
        }

        if ($user->status !== 'Active') {
            return response()->json([
                'message' => 'Your account is inactive. Contact administrator.',
            ], 403);
        }

        $user->load('role.permissions');

        return response()->json([
            'token' => $user->createToken('auth_token')->plainTextToken,
            'user'  => [
                'id'          => $user->id,
                'username'    => $user->username,
                'email'       => $user->email,
                'role'        => $user->role?->name ?? 'staff',
                'status'      => $user->status,
                'image'       => $user->image,
                'permissions' => $user->role?->permissionsMap() ?? [],
            ],
        ]);
    }

    public function sendOtp(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'If this email exists, an OTP has been sent.']);
        }

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        \Cache::put('otp_' . $request->email, [
            'otp'        => $otp,
            'verified'   => false,
            'created_at' => now(),
        ], now()->addMinutes(5));

        \Mail::send([], [], function ($mail) use ($request, $otp, $user) {
            $mail->to($request->email)
                ->subject('Your OTP Code — Password Reset')
                ->html("
                    <div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;'>
                        <h2 style='color:#4f46e5;margin-bottom:8px;'>Password Reset OTP</h2>
                        <p style='color:#6b7280;font-size:14px;'>Hello <strong>{$user->username}</strong>,</p>
                        <p style='color:#6b7280;font-size:14px;'>Your OTP code for password reset is:</p>
                        <div style='background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin:24px 0;'>
                            <span style='font-size:40px;font-weight:900;letter-spacing:12px;color:#4f46e5;'>{$otp}</span>
                        </div>
                        <p style='color:#9ca3af;font-size:12px;'>This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
                        <hr style='border:none;border-top:1px solid #e5e7eb;margin:24px 0;'/>
                        <p style='color:#d1d5db;font-size:11px;'>If you did not request this, please ignore this email.</p>
                    </div>
                ");
        });

        return response()->json(['message' => 'If this email exists, an OTP has been sent.']);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|string|size:6',
        ]);

        $cached = \Cache::get('otp_' . $request->email);

        if (!$cached || $cached['otp'] !== $request->otp) {
            return response()->json([
                'message' => 'Invalid or expired OTP.',
                'errors'  => ['otp' => ['Invalid or expired OTP.']],
            ], 422);
        }

        \Cache::put('otp_' . $request->email, [
            ...$cached,
            'verified' => true,
        ], now()->addMinutes(10));

        return response()->json(['message' => 'OTP verified successfully.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email'                     => 'required|email',
            'otp'                       => 'required|string|size:6',
            'new_password'              => ['required', 'string', $this->strongPassword()],
            'new_password_confirmation' => 'required|same:new_password',
        ]);

        $cached = \Cache::get('otp_' . $request->email);

        if (!$cached || $cached['otp'] !== $request->otp || !$cached['verified']) {
            return response()->json([
                'message' => 'OTP verification required.',
                'errors'  => ['otp' => ['Please verify your OTP first.']],
            ], 422);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        $user->tokens()->delete();

        \Cache::forget('otp_' . $request->email);

        return response()->json(['message' => 'Password reset successfully.']);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password'          => 'required|string',
            'new_password'              => ['required', 'string', 'different:current_password', $this->strongPassword()],
            'new_password_confirmation' => 'required|same:new_password',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'The current password is incorrect.',
                'errors'  => ['current_password' => ['The current password is incorrect.']],
            ], 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        $user->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

        return response()->json(['message' => 'Password changed successfully.']);
    }

    private function strongPassword(): Password
    {
        return Password::min(8)
            ->letters()
            ->mixedCase()
            ->numbers()
            ->symbols();
    }
}