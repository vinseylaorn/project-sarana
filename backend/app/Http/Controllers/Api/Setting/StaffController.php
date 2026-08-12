<?php

namespace App\Http\Controllers\Api\Setting;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StaffController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $staff = Staff::with('user:id,username,email')
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($s) => $this->format($s));

            return response()->json($staff);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function show(Staff $staff): JsonResponse
    {
        $staff->load('user:id,username,email');

        return response()->json($this->format($staff));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:120',
            'gender'      => 'nullable|in:Male,Female',
            'phone'       => 'required|string|max:30',
            'email'       => 'nullable|email|max:255',
            'position'    => 'nullable|string|max:100',
            'salary'      => 'nullable|numeric|min:0',
            'status'      => 'nullable|in:Active,Inactive',
            'image'       => 'nullable|string',
            'date'        => 'nullable|date',
            'can_use_pos' => 'boolean',       
            'pin_code'    => [
                'nullable',
                'string',
                'size:6',
                'regex:/^\d{6}$/',
                'required_if:can_use_pos,true',
            ],
        ]);

        try {
            $data['image']       = $this->saveImage($data['image'] ?? null);
            $data['date']        = $data['date'] ?? now()->format('Y-m-d');
            $data['can_use_pos'] = $data['can_use_pos'] ?? false;

            // If not POS-enabled, clear pin
            if (! $data['can_use_pos']) {
                $data['pin_code'] = null;
            }

            $staff = Staff::create($data);
            $staff->load('user:id,username,email');

            return response()->json($this->format($staff), 201);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, Staff $staff): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:120',
            'gender'      => 'nullable|in:Male,Female',
            'phone'       => 'sometimes|string|max:30',
            'email'       => 'nullable|email|max:255',
            'position'    => 'nullable|string|max:100',
            'salary'      => 'nullable|numeric|min:0',
            'status'      => 'nullable|in:Active,Inactive',
            'image'       => 'nullable|string',
            'date'        => 'nullable|date',
            'can_use_pos' => 'boolean',               
            'pin_code'    => 'nullable|string|size:6|regex:/^\d{6}$/',
        ]);

        try {
            if (array_key_exists('image', $data)) {
                $data['image'] = $this->saveImage($data['image'], $staff->image);
            }

            if (isset($data['can_use_pos']) && ! $data['can_use_pos']) {
                $data['pin_code'] = null;
            }

            if (empty($data['pin_code'])) {
                unset($data['pin_code']);
            }

            $staff->update($data);
            $staff->load('user:id,username,email');

            return response()->json($this->format($staff));
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Staff $staff): JsonResponse
    {
        try {
            if ($staff->image && ! str_starts_with($staff->image, 'http')) {
                Storage::disk('public')->delete($staff->image);
            }

            $staff->delete();

            return response()->json(['message' => 'Staff deleted']);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
    public function posStaffList(): JsonResponse
    {
        try {
            $staff = Staff::where('status', 'Active')
                ->where('can_use_pos', true)
                ->whereNotNull('pin_code')
                ->orderBy('name')
                ->get()
                ->map(fn ($s) => [
                    'id'           => $s->id,
                    'name'         => $s->name,
                    'position'     => $s->position,
                    'image'        => $this->imageUrl($s->image),
                    'has_pin'      => true,
                    'open_shift_id' => optional($s->workingShifts()
                        ->whereNull('end_time')
                        ->latest()
                        ->first())->id,
                ]);

            return response()->json($staff);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    private function format(Staff $staff): array
    {
        return [
            'id'          => $staff->id,
            'user_email'  => $staff->user?->email,
            'name'        => $staff->name,
            'gender'      => $staff->gender,
            'phone'       => $staff->phone,
            'email'       => $staff->email,
            'position'    => $staff->position,
            'salary'      => (string) $staff->salary,
            'status'      => $staff->status,
            'image'       => $this->imageUrl($staff->image),
            'date'        => $staff->date?->format('Y-m-d'),
            'can_use_pos' => (bool) $staff->can_use_pos,          
            'pin_code'    => $staff->pin_code ? '••••••' : null,
            'has_pin'     => ! empty($staff->pin_code),
            'created_at'  => $staff->created_at?->toISOString(),
        ];
    }

    private function imageUrl(?string $path): ?string
    {
        if (! $path) return null;
        if (str_starts_with($path, 'http') || str_starts_with($path, 'data:')) return $path;

        return rtrim(config('app.url'), '/') . '/storage/' . $path;
    }

    private function saveImage(?string $base64, ?string $oldPath = null): ?string
    {
        if (empty($base64)) return $oldPath;
        if (! str_starts_with($base64, 'data:')) return $base64;

        try {
            if ($oldPath && ! str_starts_with($oldPath, 'http') && ! str_starts_with($oldPath, 'data:')) {
                Storage::disk('public')->delete($oldPath);
            }

            [$meta, $data] = explode(',', $base64, 2);
            preg_match('/image\/(\w+)/', $meta, $matches);
            $ext      = $matches[1] === 'jpeg' ? 'jpg' : ($matches[1] ?? 'jpg');
            $filename = 'avatars/staff_' . uniqid('', true) . '.' . $ext;

            Storage::disk('public')->put($filename, base64_decode($data));

            return $filename;
        } catch (\Throwable $e) {
            return $oldPath;
        }
    }
}