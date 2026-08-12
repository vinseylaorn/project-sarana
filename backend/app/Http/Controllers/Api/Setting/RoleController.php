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
            return response()->json([
                'id'          => $role->id,
                'name'        => $role->name,
                'description' => $role->description,
                'pages'       => $role->pagesArray(),
                'created_at'  => $role->created_at,  
                'updated_at'  => $role->updated_at,   
            ]);
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

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'                       => 'required|string|max:80|unique:roles,name',
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
        ]);

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
        $data = $request->validate([
            'name'                       => ['required', 'string', 'max:80', Rule::unique('roles', 'name')->ignore($role->id)],
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
        ]);

        DB::beginTransaction();
        try {
            $role->update([
                'name'        => $data['name'],
                'description' => $data['description'] ?? $role->description,
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
                'message' => "Cannot delete role \"{$role->name}\" because {$userCount} user(s) are assigned to it."
            ], 422);
        }

        $role->permissions()->delete();
        $role->delete();
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

    private function syncPermissions(Role $role, array $pages): void
    {
        $hasLabelCols  = Schema::hasColumn('role_permissions', 'label');
        $viewOnlyPages = ['dashboard', 'reports'];
        $rows          = [];

        $grouped = [];
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
                    'href'        => $pg['href']         ?? null,
                    'isDashboard' => $pg['isDashboard']  ?? false,
                    'permissions' => ['view' => false, 'create' => false, 'edit' => false, 'delete' => false],
                ];
            }

            foreach (['view', 'create', 'edit', 'delete'] as $perm) {
                if ($pg['permissions'][$perm] ?? false) {
                    $grouped[$pageKey]['permissions'][$perm] = true;
                }
            }
        }

        foreach ($grouped as $entry) {
            foreach (['view', 'create', 'edit', 'delete'] as $perm) {
                if (in_array($entry['pageKey'], $viewOnlyPages) && $perm !== 'view') continue;

                $row = [
                    'role_id'    => $role->id,
                    'page'       => $entry['page'],
                    'page_key'   => $entry['pageKey'],
                    'permission' => $perm,
                    'granted'    => (bool) $entry['permissions'][$perm],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                if ($hasLabelCols) {
                    $row['label']      = $entry['label']     ?? null;
                    $row['label_kh']   = $entry['labelKh']   ?? null;
                    $row['section']    = $entry['section']   ?? null;
                    $row['section_kh'] = $entry['sectionKh'] ?? null;
                    $row['href']       = $entry['href']      ?? null;
                }

                $rows[] = $row;
            }
        }

        if (!empty($rows)) {
            RolePermission::insert($rows);
        }
    }
}