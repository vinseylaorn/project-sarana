<?php

namespace App\Http\Controllers\Api\Setting;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\RolePermission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    private const PERMS          = ['view', 'create', 'edit', 'delete'];
    private const VIEW_ONLY_PAGES = ['dashboard', 'reports'];

    public function index(): JsonResponse
    {
        try {
            $roles = Role::withCount('users')->get()->map(fn($role) => [
                'id'          => $role->id,
                'name'        => $role->name,
                'description' => $role->description,
                'users_count' => $role->users_count,
                'created_at'  => $role->created_at,
                'updated_at'  => $role->updated_at,
            ]);
            return response()->json($roles);
        } catch (\Throwable $e) {
            // FIX: កូដចាស់ប្រើ $role ដែលមិនមាននៅទីនេះ
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function show(Role $role): JsonResponse
    {
        try {
            $role->load('permissions', 'users');
            return response()->json([
                'id'          => $role->id,
                'name'        => $role->name,
                'description' => $role->description,
                'pages'       => $role->pagesArray(),
                'users'       => $role->users->map(fn($u) => [
                    'id'       => $u->id,
                    'username' => $u->username,
                    'email'    => $u->email,
                    'status'   => $u->status,
                    'image'    => $u->image,
                    'role'     => $role->name,
                ]),
            ]);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    private function rules(?Role $role = null): array
    {
        $nameRule = $role
            ? ['required', 'string', 'max:80', Rule::unique('roles', 'name')->ignore($role->id)]
            : 'required|string|max:80|unique:roles,name';

        return [
            'name'                       => $nameRule,
            'description'                => 'nullable|string|max:255',
            'pages'                      => 'required|array',
            'pages.*.page'               => 'required|string',
            'pages.*.pageKey'            => 'required|string',
            'pages.*.label'              => 'nullable|string',
            'pages.*.labelKh'            => 'nullable|string',
            'pages.*.section'            => 'nullable|string',
            'pages.*.sectionKh'          => 'nullable|string',
            'pages.*.href'               => 'nullable|string',
            'pages.*.isDashboard'        => 'nullable|boolean',
            'pages.*.permissions.view'   => 'nullable|boolean',
            'pages.*.permissions.create' => 'nullable|boolean',
            'pages.*.permissions.edit'   => 'nullable|boolean',
            'pages.*.permissions.delete' => 'nullable|boolean',
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        DB::beginTransaction();
        try {
            $role = Role::create([
                'name'        => $data['name'],
                'description' => $data['description'] ?? null,
            ]);
            $this->syncPermissions($role, $data['pages']);
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }

        $role->load('permissions');
        return response()->json([
            'id'          => $role->id,
            'name'        => $role->name,
            'description' => $role->description,
            'pages'       => $role->pagesArray(),
        ], 201);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $data = $request->validate($this->rules($role));

        DB::beginTransaction();
        try {
            $role->update([
                'name'        => $data['name'],
                'description' => $data['description'] ?? null,
            ]);
            $role->permissions()->delete();
            $this->syncPermissions($role, $data['pages']);
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }

        $role->load('permissions');
        return response()->json([
            'id'          => $role->id,
            'name'        => $role->name,
            'description' => $role->description,
            'pages'       => $role->pagesArray(),
        ]);
    }

    public function destroy(Role $role): JsonResponse
    {
        try {
            $userCount = User::where('role_id', $role->id)->count();
            if ($userCount > 0) {
                return response()->json([
                    'message' => "Cannot delete role \"{$role->name}\" because {$userCount} user(s) are assigned to it.",
                ], 422);
            }

            DB::transaction(function () use ($role) {
                $role->permissions()->delete();
                $role->delete();
            });

            return response()->json(['message' => 'Role deleted']);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function users(Role $role): JsonResponse
    {
        $users = $role->users()
            ->select('id', 'username', 'email', 'status', 'image')
            ->get()
            ->map(fn($u) => [
                'id'       => $u->id,
                'username' => $u->username,
                'email'    => $u->email,
                'status'   => $u->status,
                'image'    => $u->image,
                'role'     => $role->name,
            ]);
        return response()->json($users);
    }

    /**
     * រក្សាទុក permission ដោយ **ឯករាជ្យ** ពីគ្នា។
     * មិនបង្ខំ view ពេល edit/create/delete ទៀតទេ។
     */
    private function syncPermissions(Role $role, array $pages): void
    {
        $hasLabelCols = Schema::hasColumn('role_permissions', 'label');
        $rows         = [];
        $grouped      = [];

        foreach ($pages as $pg) {
            $pageKey = $pg['pageKey'];

            if (!isset($grouped[$pageKey])) {
                $grouped[$pageKey] = [
                    'pageKey'     => $pageKey,
                    'page'        => $pageKey,
                    'label'       => $pg['label']       ?? $pageKey,
                    'labelKh'     => $pg['labelKh']     ?? $pageKey,
                    'section'     => $pg['section']     ?? null,
                    'sectionKh'   => $pg['sectionKh']   ?? null,
                    'href'        => $pg['href']        ?? null,
                    'isDashboard' => $pg['isDashboard'] ?? false,
                    'permissions' => array_fill_keys(self::PERMS, false),
                ];
            }

            foreach (self::PERMS as $perm) {
                if (!empty($pg['permissions'][$perm])) {
                    $grouped[$pageKey]['permissions'][$perm] = true;
                }
            }
        }

        $now = now();
        foreach ($grouped as $entry) {
            foreach (self::PERMS as $perm) {
                $isViewOnly = in_array($entry['pageKey'], self::VIEW_ONLY_PAGES, true);

                $row = [
                    'role_id'    => $role->id,
                    'page'       => $entry['page'],
                    'page_key'   => $entry['pageKey'],
                    'permission' => $perm,
                    // dashboard/reports មានតែ view
                    'granted'    => ($isViewOnly && $perm !== 'view')
                        ? false
                        : (bool) $entry['permissions'][$perm],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if ($hasLabelCols) {
                    $row['label']      = $entry['label'];
                    $row['label_kh']   = $entry['labelKh'];
                    $row['section']    = $entry['section'];
                    $row['section_kh'] = $entry['sectionKh'];
                    $row['href']       = $entry['href'];
                }

                $rows[] = $row;
            }
        }

        if (!empty($rows)) {
            RolePermission::insert($rows);
        }
    }
}