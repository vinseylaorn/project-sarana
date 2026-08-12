"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ShoppingCart, UtensilsCrossed, ChevronRight } from "lucide-react"
import { useRole } from "@/lib/role-context"
import { useSettings } from "@/lib/settings-context"
import { cn } from "@/lib/utils"
import { AdminLoginScreen } from "@/components/screens/AdminLoginScreen"
import { PosFlow, type Screen } from "@/components/posflowlogin"
import { useTranslation } from "react-i18next"

const SCREEN_KEY = "login_screen"

const VALID_SCREENS: Screen[] = [
  "choose", "admin-login", "pos-staff", "pos-pin", "pos-shift", "pos-ready",
]

const saveScreen = (s: Screen) => {
  try { sessionStorage.setItem(SCREEN_KEY, s) } catch {}
}

const loadScreen = (): Screen => {
  try {
    const s = sessionStorage.getItem(SCREEN_KEY) as Screen
    return VALID_SCREENS.includes(s) ? s : "choose"
  } catch {
    return "choose"
  }
}

const BACK_MAP: Record<Screen, Screen> = {
  "choose":      "choose",
  "admin-login": "choose",
  "pos-staff":   "choose",
  "pos-pin":     "pos-staff",
  "pos-shift":   "pos-pin",
  "pos-ready":   "choose",
}

const POS_SCREENS: Screen[] = [
  "pos-staff", "pos-pin", "pos-shift", "pos-ready",
]

export default function LoginPage() {
  const { login }                  = useRole()
  const { systemName, systemLogo } = useSettings()
  const { i18n }                   = useTranslation("common")
  const isKh                       = i18n.language === "kh"

  const [screen, setScreen]     = useState<Screen>("choose")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [adminErr, setAdminErr] = useState("")

  useEffect(() => {
    try { sessionStorage.removeItem(SCREEN_KEY) } catch {}
    setScreen("choose")
  }, [])

  const goTo = useCallback((s: Screen) => {
    saveScreen(s)
    setScreen(s)
  }, [])

  const goBack = useCallback(() => {
    goTo(BACK_MAP[screen])
  }, [screen, goTo])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdminErr("")
    if (!username.trim() || !password) {
      setAdminErr(isKh ? "សូមបញ្ចូលឈ្មោះ និងលេខសម្ងាត់" : "Please enter both fields.")
      return
    }
    try {
      await login(username, password, false)
    } catch (err: any) {
      setAdminErr(
        err?.message || (isKh ? "ឈ្មោះ ឬលេខសម្ងាត់មិនត្រឹមត្រូវ" : "Invalid credentials")
      )
    }
  }

  const isPosScreen = POS_SCREENS.includes(screen)

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#F7F7FB] dark:bg-[#0D0F1A] p-6 transition-colors duration-300"
      style={{ fontFamily: "var(--font-kantumruy), sans-serif" }}
    >
      {/* Ambient background system */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35] dark:opacity-100"
        style={{
          backgroundImage:
            "linear-gradient(rgba(24,87,216,0.05) 1px,transparent 1px)," +
            "linear-gradient(90deg,rgba(24,87,216,0.05) 1px,transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
        }}
      />
      <div className="pointer-events-none fixed -top-28 -right-28 w-[26rem] h-[26rem] rounded-full bg-[#1857D8]/20 dark:bg-[#1857D8]/[0.12] blur-[110px]" />
      <div className="pointer-events-none fixed -bottom-28 -left-28 w-[20rem] h-[20rem] rounded-full bg-[#03624C]/[0.16] dark:bg-[#03624C]/[0.1] blur-[100px]" />

      <div className="w-full max-w-lg relative z-10">
        <AnimatePresence mode="wait">
          {screen === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative bg-white/70 dark:bg-[#161927]/70 backdrop-blur-2xl border border-white/60 dark:border-white/[0.08] rounded-2xl shadow-[0_16px_50px_-15px_rgba(24,87,216,0.2)] dark:shadow-[0_16px_50px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Signature top edge: soft gradient beam instead of a flat bar */}
                <div className="h-[3px] w-full bg-[linear-gradient(90deg,#03624C_0%,#1857D8_50%,#03624C_100%)] bg-[length:200%_100%] animate-[shimmer_6s_linear_infinite]" />

                <div className="flex items-center gap-4 px-7 pt-7 pb-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1857D8]/10 to-[#03624C]/10 border border-white/70 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-sm backdrop-blur-sm">
                    {systemLogo
                      ? <img src={systemLogo} alt="" className="w-full h-full object-cover" />
                      : <UtensilsCrossed className="w-6 h-6 text-[#1857D8] dark:text-[#4d8cf5]" strokeWidth={1.75} />
                    }
                  </div>
                  <div>
                    <h1 className="text-[18px] font-bold tracking-tight text-gray-900 dark:text-white/90 leading-tight">
                      {systemName}
                    </h1>
                    <p suppressHydrationWarning className="text-[13px] text-gray-400 dark:text-white/35 mt-0.5">
                      {isKh ? "ជ្រើសរើសប្រព័ន្ធដើម្បីបន្ត" : "Select a system to continue"}
                    </p>
                  </div>
                </div>

                <div className="mx-7 mt-5 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/[0.08] to-transparent" />

                <div className="p-6 grid grid-cols-2 gap-3.5">
                  {[
                    {
                      id:     "admin-login" as Screen,
                      label:  "Admin System",
                      sub:    isKh ? "គ្រប់គ្រងទូទៅ" : "Full management",
                      accent: "green",
                      delay:  0.1,
                    },
                    {
                      id:     "pos-staff" as Screen,
                      label:  "POS System",
                      sub:    isKh ? "ចំណុចលក់" : "Point of Sale",
                      accent: "blue",
                      delay:  0.17,
                    },
                  ].map(item => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: item.delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => goTo(item.id)}
                      className={cn(
                        "group relative w-full overflow-hidden text-left rounded-2xl p-5",
                        "backdrop-blur-md border transition-all duration-200 ease-out",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#161927]",
                        item.accent === "green"
                          ? "bg-[#03624C]/[0.07] dark:bg-[#03624C]/[0.08] border-[#03624C]/20 dark:border-[#03624C]/25 hover:bg-[#03624C]/[0.12] hover:border-[#03624C]/40 hover:shadow-xl hover:shadow-[#03624C]/20 dark:hover:shadow-none focus-visible:ring-[#03624C]"
                          : "bg-[#1857D8]/[0.07] dark:bg-[#1857D8]/[0.08] border-[#1857D8]/20 dark:border-[#1857D8]/25 hover:bg-[#1857D8]/[0.12] hover:border-[#1857D8]/40 hover:shadow-xl hover:shadow-[#1857D8]/20 dark:hover:shadow-none focus-visible:ring-[#1857D8]"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0 left-0 right-0 h-[3px] scale-x-75 group-hover:scale-x-100 transition-transform duration-300 origin-left",
                        item.accent === "green"
                          ? "bg-gradient-to-r from-[#03624C] to-[#0a8a6c]"
                          : "bg-gradient-to-r from-[#1857D8] to-[#4d8cf5]"
                      )} />

                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 shadow-sm",
                            item.accent === "green"
                              ? "bg-[#03624C] text-white group-hover:shadow-lg group-hover:shadow-[#03624C]/40"
                              : "bg-[#1857D8] text-white group-hover:shadow-lg group-hover:shadow-[#1857D8]/40"
                          )}>
                            {item.accent === "green"
                              ? (
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"
                                  stroke="currentColor" strokeWidth={1.75}
                                  strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                                  <path d="M8 21h8M12 17v4"/>
                                </svg>
                              )
                              : <ShoppingCart className="w-5 h-5" strokeWidth={1.75} />
                            }
                          </div>
                          <ChevronRight className={cn(
                            "w-4 h-4 shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200",
                            item.accent === "green" ? "text-[#03624C]" : "text-[#1857D8]"
                          )} />
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                            {item.label}
                          </p>
                          <p className="text-[12px] text-gray-400 dark:text-white/35 mt-0.5">
                            {item.sub}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <p className="text-center text-[10.5px] text-gray-400 dark:text-white/20 font-medium pb-6">
                  &copy; 2026 {systemName}. All rights reserved.
                </p>
              </div>
            </motion.div>
          )}
          {screen === "admin-login" && (
            <AdminLoginScreen
              isKh={isKh}
              systemName={systemName}
              onBack={goBack}
              onSubmit={handleAdminLogin}
              username={username}   setUsername={setUsername}
              password={password}   setPassword={setPassword}
              showPass={showPass}   setShowPass={setShowPass}
              adminErr={adminErr}   setAdminErr={setAdminErr}
            />
          )}
          {isPosScreen && (
            <PosFlow
              screen={screen}
              isKh={isKh}
              goTo={goTo}
              onBack={goBack}
            />
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0%   { background-position: 0% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}