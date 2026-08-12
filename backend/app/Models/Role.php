<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;

class Role extends Model
{
    protected $fillable = ['name', 'description'];

    public function permissions(): HasMany
    {
        return $this->hasMany(RolePermission::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

public function permissionsMap(): array
{
    $map = [];
    foreach ($this->permissions as $perm) {
        $key = $perm->page;
        if (!isset($map[$key])) {
            $map[$key] = ['view' => false, 'create' => false, 'edit' => false, 'delete' => false];
        }
        if ($perm->granted) {
            $map[$key][$perm->permission] = true;
        }
    }
    return $map;
}
    public function pagesArray(): array
    {
        $hasLabelCols = Schema::hasColumn('role_permissions', 'label');

        $grouped = $this->permissions->groupBy('page');
        $pages   = [];

        foreach ($grouped as $page => $perms) {
            $first = $perms->first();

            $entry = [
                'page'        => $page,
                'pageKey'     => $first->page_key,
                'label'       => $hasLabelCols ? ($first->label    ?? $page) : $page,
                'labelKh'     => $hasLabelCols ? ($first->label_kh ?? $page) : $page,
                'section'     => $hasLabelCols ? $first->section    : null,
                'sectionKh'   => $hasLabelCols ? $first->section_kh : null,
                'href'        => $hasLabelCols ? $first->href        : null,
                'isDashboard' => $page === 'dashboard',
                'permissions' => ['view' => false, 'create' => false, 'edit' => false, 'delete' => false],
            ];

            foreach ($perms as $perm) {
                $entry['permissions'][$perm->permission] = (bool) $perm->granted;
            }

            $pages[] = $entry;
        }

        return $pages;
    }
}