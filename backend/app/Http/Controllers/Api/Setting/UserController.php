<?php

namespace App\Http\Controllers\Api\Setting;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $users = User::with(['role:id,name'])
                ->select('id', 'username', 'email', 'role_id', 'status', 'image', 'created_at', 'updated_at')
                ->get()
                ->map(fn($u) => $this->format($u));
            return response()->json($users);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function show(User $user): JsonResponse
    {
        try {
            $user->load(['role.permissions']);
            return response()->json($this->format($user, withPermissions: true));
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:80',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role_id'  => 'nullable|exists:roles,id',
            'status'   => 'nullable|in:Active,Inactive',
            'image'    => 'nullable|string',
        ]);

        try {
            $user = User::create([
                'username' => $data['name'],
                'email'    => $data['email'],
                'password' => Hash::make($data['password']),
                'role_id'  => $data['role_id'] ?? null,
                'status'   => $data['status'] ?? 'Active',
                'image'    => $this->saveImage($data['image'] ?? null),
            ]);
            $user->load(['role:id,name']);
            return response()->json($this->format($user), 201);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'sometimes|string|max:80',
            'email'    => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'sometimes|nullable|string|min:6',
            'role_id'  => 'nullable|exists:roles,id',
            'status'   => 'nullable|in:Active,Inactive',
            'image'    => 'nullable|string',
        ]);

        try {
            if (isset($data['name'])) {
                $data['username'] = $data['name'];
                unset($data['name']);
            }

            if (isset($data['password']) && !empty($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            } else {
                unset($data['password']);
            }

            if (array_key_exists('image', $data)) {
                $data['image'] = $this->saveImage($data['image'], $user->getRawOriginal('image'));
            }

            $user->update($data);
            $user->load(['role:id,name']);
            return response()->json($this->format($user));
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function destroy(User $user): JsonResponse
    {
        try {
            $user->delete();
            return response()->json(['message' => 'User deleted']);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function assignRole(Request $request, User $user): JsonResponse
    {
        $data = $request->validate(['role_id' => 'nullable|exists:roles,id']);
        try {
            $user->update(['role_id' => $data['role_id']]);
            $user->load(['role:id,name']);
            return response()->json($this->format($user));
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function me(Request $request): JsonResponse
    {
        try {
            $user = $request->user()->load(['role.permissions']);
            return response()->json([
                'id'          => $user->id,
                'username'    => $user->username,
                'email'       => $user->email,
                'role'        => $user->role?->name ?? 'staff',
                'status'      => $user->status,
                'image'       => $user->image,
                'permissions' => $user->role?->permissionsMap() ?? [],
            ]);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    private function format(User $user, bool $withPermissions = false): array
    {
        $out = [
            'id'         => $user->id,
            'username'   => $user->username,
            'email'      => $user->email,
            'role'       => $user->role?->name ?? null,
            'role_id'    => $user->role_id,
            'status'     => $user->status,
            'image'      => $user->image,
            'created_at' => $user->created_at?->toISOString(),
            'updated_at' => $user->updated_at?->toISOString(),
        ];

        if ($withPermissions && $user->role) {
            $out['permissions'] = $user->role->permissionsMap();
        }

        return $out;
    }

    private function saveImage(?string $base64, ?string $oldPath = null): ?string
    {
        if (empty($base64)) return $oldPath;
        if (!str_starts_with($base64, 'data:')) return $base64;

        try {
            if ($oldPath && !str_starts_with($oldPath, 'http') && !str_starts_with($oldPath, 'data:')) {
                \Storage::disk('public')->delete($oldPath);
            }
            [$meta, $data] = explode(',', $base64, 2);
            preg_match('/image\/(\w+)/', $meta, $matches);
            $ext      = $matches[1] ?? 'jpg';
            $ext      = $ext === 'jpeg' ? 'jpg' : $ext;
            $filename = 'avatars/' . uniqid('user_', true) . '.' . $ext;

            \Storage::disk('public')->put($filename, base64_decode($data));
            return $filename;
        } catch (\Throwable $e) {
            return $oldPath;
        }
    }
}