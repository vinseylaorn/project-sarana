import { authApi }  from "@/lib/api"
import { token }    from "@/lib/auth/token"
import type { User } from "@/types"

export const authService = {
  async restoreSession(): Promise<User | null> {
    if (!token.get()) return null
    try {
      return await authApi.me()
    } catch {
      token.clear()
      return null
    }
  },

  async login(username: string, password: string): Promise<User> {
    const { token: t, user } = await authApi.login(username, password)
    token.set(t)
    return user
  },

  async logout(): Promise<void> {
    try { await authApi.logout() } catch { /* ignore */ }
    token.clear()
  },
}