// lib/api/auth.ts

import { get, post }  from "./client"
import type { User }  from "@/types"

export const authApi = {
  login:  (login: string, password: string) =>
    post<{ token: string; user: User }>("/login", { login, password }),
  logout: () => post<{ message: string }>("/logout", {}),
  me:     () => get<User>("/me"),
}