
const KEY     = "auth_token"
const POS_KEY = "pos_token"

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export const token = {
  get(): string | null {
    return getCookie(KEY) ?? localStorage.getItem(KEY)
  },

  set(value: string) {
    setCookie(KEY, value)
    localStorage.setItem(KEY, value)
  },

  clear() {
    deleteCookie(KEY)
    deleteCookie("user_data")
    localStorage.removeItem(KEY)
  },

  pos: {
    get(): string | null {
      return getCookie(POS_KEY)
    },
    set(shiftId: string | number): Promise<void> {
      setCookie(POS_KEY, String(shiftId), 1)
      return new Promise<void>((resolve) => {
        const check = (tries = 0) => {
          if (getCookie(POS_KEY)) {
            resolve()
          } else if (tries < 20) {
            setTimeout(() => check(tries + 1), 25)
          } else {
            resolve() // fallback
          }
        }
        setTimeout(() => check(), 20)
      })
    },

    clear() {
      deleteCookie(POS_KEY)
    },
  },
}