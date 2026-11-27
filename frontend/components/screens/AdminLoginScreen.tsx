"use client"

import React, { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Lock, User, Eye, EyeOff, ChevronLeft, UtensilsCrossed, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/settings-context"

const iCls = [
  "w-full h-11 px-3 text-[14px] rounded-lg outline-none transition-all duration-200",
  "bg-white border border-gray-200",
  "text-gray-900 placeholder:text-gray-400",
  "shadow-sm",
  "dark:bg-[#13151f] dark:border-white/[0.10]",
  "dark:text-white dark:placeholder:text-white/25",
  "dark:shadow-none",
  "focus:border-[#03624C] focus:ring-2 focus:ring-[#03624C]/15",
  "dark:focus:border-[#03624C] dark:focus:ring-[#03624C]/25",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ")

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24, filter: "blur(3px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.3, ease: "easeOut" } }}
      exit={{ opacity: 0, x: -20, filter: "blur(3px)", transition: { duration: 0.2, ease: "easeIn" } }}
      className="w-full" >
      <div className="relative bg-white/70 dark:bg-[#161927]/70 backdrop-blur-2xl border border-white/60 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_16px_50px_-15px_rgba(24,87,216,0.2)] dark:shadow-[0_16px_50px_-15px_rgba(0,0,0,0.5)] transition-colors duration-300">
        <div className="h-[3px] w-full bg-[linear-gradient(90deg,#03624C_0%,#1857D8_50%,#03624C_100%)] bg-[length:200%_100%] animate-[shimmer_6s_linear_infinite]" />
        <div className="px-7 py-6">
          {children}
        </div>
      </div>
      <style jsx global>{`
        @keyframes shimmer {
          0%   { background-position: 0% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </motion.div>
  )
}

function BackBtn({ onBack, label, disabled }: { onBack: () => void; label: string; disabled?: boolean }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}
      onClick={onBack}
      disabled={disabled}
      className="flex items-center gap-1 text-[13px]  text-gray-400 dark:text-white/30 hover:text-[#1857D8] dark:hover:text-[#4d8cf5] transition-colors mb-5 disabled:opacity-40 disabled:cursor-not-allowed" >
      <ChevronLeft className="w-3.5 h-3.5" /> {label}
    </motion.button>
  )
}
function Logo() {
  const { systemLogo } = useSettings()
  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1857D8] to-[#03624C] flex items-center justify-center shadow-lg shadow-[#1857D8]/30 overflow-hidden shrink-0">
      {systemLogo
        ? <img src={systemLogo} alt="" className="w-full h-full object-cover" />
        : <UtensilsCrossed className="w-5 h-5 text-white" />
      }
    </div>
  )
}
interface Props {
  systemName: string
  isKh: boolean
  onBack: () => void
  onSubmit: (e: React.FormEvent) => Promise<void> | void
  username: string
  setUsername: (v: string) => void
  password: string
  setPassword: (v: string) => void
  showPass: boolean
  setShowPass: (v: boolean) => void
  adminErr: string
  setAdminErr: (v: string) => void
  isLoading?: boolean
}

export function AdminLoginScreen({
  systemName, isKh, onBack, onSubmit,
  username, setUsername, password, setPassword,
  showPass, setShowPass, adminErr, setAdminErr,
  isLoading: externalLoading,
}: Props) {
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [internalLoading, setInternalLoading] = useState(false)
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading

  useEffect(() => { setTimeout(() => usernameRef.current?.focus(), 350) }, [])

  useEffect(() => {
    if (adminErr && externalLoading === undefined) setInternalLoading(false)
  }, [adminErr, externalLoading])

  const t = {
    back: isKh ? "ត្រឡប់" : "Back",
    userLbl: isKh ? "ឈ្មោះអ្នកប្រើ ឬអ៊ីម៉ែល" : "Username or Email",
    userPh: isKh ? "បញ្ចូលឈ្មោះ ឬអ៊ីម៉ែល" : "Enter username or email",
    passLbl: isKh ? "លេខសម្ងាត់" : "Password",
    passPh: isKh ? "បញ្ចូលលេខសម្ងាត់" : "Enter password",
    forgot: isKh ? "ភ្លេចលេខសម្ងាត់?" : "Forgot password?",
    signin: isKh ? "ចូលប្រព័ន្ធ" : "Sign in",
    signingIn: isKh ? "កំពុងចូល..." : "Signing in...",
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    if (externalLoading === undefined) {
      setInternalLoading(true)
      try {
        await onSubmit(e)
      } catch (err) {
        setInternalLoading(false)
        throw err
      }
    } else {
      onSubmit(e)
    }
  }

  return (
    <Shell>
      <BackBtn onBack={onBack} label={t.back} disabled={isLoading} />
      <div className="flex items-center justify-center gap-3.5 mb-6">
        <Logo />
        <div>
          <p className="text-[16px] font-bold text-gray-900 dark:text-white">Admin Login</p>
          <p className="text-[12px] text-gray-500 dark:text-white/30">{systemName}</p>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {adminErr && (
          <motion.div
            key="err"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden" >
            <div className="flex items-center gap-2.5 px-4 py-3 mb-4 rounded-xl
              bg-rose-50 dark:bg-rose-500/10
              border border-rose-200 dark:border-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <p className="text-[13px] font-semibold text-rose-600 dark:text-rose-400 leading-snug">
                {adminErr}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
        <div className="space-y-1.5">
          <label className="text-[14px] font-medium text-gray-600 dark:text-white/30 block">
            {t.userLbl}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-white/20 
            pointer-events-none" />
            <input
              ref={usernameRef} name="username" autoComplete="username"
              className={cn(iCls, "pl-10")} placeholder={t.userPh} value={username}
              disabled={isLoading}
              onChange={e => { setUsername(e.target.value); setAdminErr("") }}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); passwordRef.current?.focus() } }}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[14px] font-medium text-gray-600 dark:text-white/30 block">
            {t.passLbl}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-white/20 
            pointer-events-none" />
            <input
              ref={passwordRef} name="password"
              type={showPass ? "text" : "password"} autoComplete="current-password"
              className={cn(iCls, "pl-10 pr-11")} placeholder={t.passPh} value={password}
              disabled={isLoading}
              onChange={e => { setPassword(e.target.value); setAdminErr("") }}
            />
            <button
              type="button" tabIndex={-1}
              disabled={isLoading}
              onMouseDown={e => e.preventDefault()}
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors disabled:opacity-40" >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-end pt-0.5">
            <Link href="/forgot-password" tabIndex={-1}
              className="text-[13px] text-blue-500 dark:text-white/30 hover:text-[#1857D8] dark:hover:text-[#4d8cf5] transition-colors">
              {t.forgot}
            </Link>
          </div>
        </div>
        <motion.button
          type="submit"
          disabled={isLoading}
          whileTap={isLoading ? {} : { scale: 0.98 }}
          className="w-full h-11 rounded-lg text-[16px] font-semibold transition-all
            bg-[#03624C] hover:bg-[#03624C]/80 text-white shadow-md shadow-[#03624C]/25
            dark:bg-[#03624C]/20 dark:hover:bg-[#03624C]/30 dark:text-[#8fb3f0]
            dark:border dark:border-[#03624C]/30 dark:shadow-none
            flex items-center justify-center gap-2
            disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-[#03624C] dark:disabled:hover:bg-[#03624C]/20" >
          <AnimatePresence mode="wait" initial={false}>
            {isLoading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2" >
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.signingIn}
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2" >
                <Lock className="w-4 h-4" />
                {t.signin}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </form>
    </Shell>
  )
}