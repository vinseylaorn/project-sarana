// lib/api/users.ts

import { get, post, put, del } from "./client"
import type { User }           from "@/types"

export const usersApi = {
  list:   ()           => get<User[]>("/users"),
  get:    (id: number) => get<User>(`/users/${id}`),

  create: (payload: {
    name:      string
    email:     string
    password:  string
    role_id?:  number | null
    status?:   string
    image?:    string | null
  }) => post<User>("/users", payload),

  update: (id: number, payload: Partial<{
    name:     string
    email:    string
    password: string
    role_id:  number | null
    status:   string
    image:    string | null
  }>) => put<User>(`/users/${id}`, payload),

  delete:     (id: number)                            => del<{ message: string }>(`/users/${id}`),
  assignRole: (userId: number, roleId: number | null) =>
    put<User>(`/users/${userId}/assign-role`, { role_id: roleId }),
}