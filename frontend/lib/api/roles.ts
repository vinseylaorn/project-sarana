// lib/api/roles.ts

import { get, post, put, del }        from "./client"
import type { Role, RolePage, User }  from "@/types"

export const rolesApi = {
  list:   ()           => get<Role[]>("/roles"),
  get:    (id: number) => get<Role>(`/roles/${id}`),

  create: (payload: {
    name:         string
    description?: string
    pages:        RolePage[]
  }) => post<Role>("/roles", payload),

  update: (id: number, payload: {
    name:         string
    description?: string
    pages:        RolePage[]
  }) => put<Role>(`/roles/${id}`, payload),

  delete: (id: number) => del<{ message: string }>(`/roles/${id}`),
  users:  (id: number) => get<User[]>(`/roles/${id}/users`),
}