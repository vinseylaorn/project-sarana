"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, ArrowLeft, Loader2, KeyRound, Send, Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/settings-context"
import { useTranslation } from "react-i18next"

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

const inputCls = [
  "w-full h-11 px-3 text-[14px] font-medium rounded-lg outline-none transition-colors",
  "bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.10]",
  "text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25",
  "focus:border-[#1857D8]/50 dark:focus:border-[#1857D8]/50 shadow-sm dark:shadow-none",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ")

const inputErrCls = "border-rose-400 dark:border-rose-500/50 focus:border-rose-400 dark:focus:border-rose-500/50"

const stepAnim = {
  initial: { opacity: 0, x: 24, filter: "blur(3px)" },
  animate: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: { opacity: 0, x: -20, filter: "blur(3px)" },
  transition: { duration: 0.28, ease: "easeOut" as const },
}

// Banner error (used for general / step 1 & 2 errors)
const ErrMsg = ({ msg }: { msg: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20"
  >
    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
    <p className="text-[12px] font-semibold text-rose-600 dark:text-rose-300">{msg}</p>
  </motion.div>
)

// Inline error shown directly under a field
const FieldErr = ({ msg }: { msg: string }) => (
  <motion.p
    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.18 }}
    className="flex items-center gap-1 text-[12px] text-rose-500 dark:text-rose-400 mt-1 font-medium"
  >
    <AlertTriangle className="w-3 h-3 shrink-0" />{msg}
  </motion.p>
)

const btnCls = [
  "w-full h-11 rounded-lg text-[13px] font-semibold transition-all",
  "bg-[#1857D8] hover:bg-[#1449b8] text-white shadow-md shadow-[#1857D8]/25",
  "dark:bg-[#1857D8]/20 dark:hover:bg-[#1857D8]/30 dark:text-[#8fb3f0]",
  "dark:border dark:border-[#1857D8]/30 dark:shadow-none",
  "disabled:opacity-60 disabled:cursor-not-allowed",
  "flex items-center justify-center gap-2",
].join(" ")

// ─── Strong password ──────────────────────────────────────────────
const PASSWORD_RULES = [
  { id: "len", test: (p: string) => p.length >= 8, en: "At least 8 characters", kh: "យ៉ាងតិច 8 តួអក្សរ" },
  { id: "lower", test: (p: string) => /[a-z]/.test(p), en: "One lowercase letter (a-z)", kh: "អក្សរតូច (a-z)" },
  { id: "upper", test: (p: string) => /[A-Z]/.test(p), en: "One uppercase letter (A-Z)", kh: "អក្សរធំ (A-Z)" },
  { id: "num", test: (p: string) => /\d/.test(p), en: "One number (0-9)", kh: "លេខ (0-9)" },
  { id: "sym", test: (p: string) => /[^A-Za-z0-9]/.test(p), en: "One symbol (!@#$%...)", kh: "និមិត្តសញ្ញា (!@#$%...)" },
]

const isStrongPassword = (p: string) => PASSWORD_RULES.every(r => r.test(p))

const PasswordStrength = ({ password, isKh, hasError }: { password: string; isKh: boolean; hasError?: boolean }) => {
  if (!password) return null
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length
  const level =
    passed <= 2 ? { label: isKh ? "ខ្សោយ" : "Weak", color: "bg-rose-500", text: "text-rose-500" }
      : passed <= 4 ? { label: isKh ? "មធ្យម" : "Medium", color: "bg-amber-500", text: "text-amber-500" }
        : { label: isKh ? "រឹងមាំ" : "Strong", color: "bg-emerald-500", text: "text-emerald-500" }

  return (
    <div className={cn(
      "space-y-2 rounded-lg border p-3 transition-colors",
      hasError
        ? "border-rose-300 dark:border-rose-500/40 bg-rose-50/60 dark:bg-rose-500/[0.06]"
        : "border-gray-100 dark:border-white/[0.08] bg-gray-50/70 dark:bg-white/[0.03]"
    )}>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {PASSWORD_RULES.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < passed ? level.color : "bg-gray-200 dark:bg-white/10"
              )}
            />
          ))}
        </div>
        <span className={cn("text-[12px] font-bold", level.text)}>{level.label}</span>
      </div>
      <ul className="grid grid-cols-1 gap-1">
        {PASSWORD_RULES.map(r => {
          const ok = r.test(password)
          return (
            <li key={r.id} className={cn(
              "flex items-center gap-1.5 text-[12px] transition-colors",
              ok
                ? "text-emerald-600 dark:text-emerald-400"
                : hasError
                  ? "text-rose-500 dark:text-rose-400 font-medium"
                  : "text-gray-500 dark:text-white/30"
            )}>
              {ok ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
              {isKh ? r.kh : r.en}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

class ApiError extends Error {
  errors?: Record<string, string[]>
  constructor(message: string, errors?: Record<string, string[]>) {
    super(message)
    this.errors = errors
  }
}

export default function ForgotPasswordPage() {
  const { systemName } = useSettings()
  const { i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ new?: string; confirm?: string }>({})
  const [resendCooldown, setResendCooldown] = useState(0)

  const clearError = () => setError("")

  const apiPost = async (path: string, body: object) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      if (data.errors) {
        const first = Object.values(data.errors as Record<string, string[]>)[0]?.[0]
        throw new ApiError(first ?? data.message ?? "Error", data.errors)
      }
      throw new ApiError(data.message ?? "Error")
    }
    return data
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault(); if (!email) return
    setIsLoading(true); clearError()
    try { await apiPost("/forgot-password/send-otp", { email }); setStep(2); startCooldown() }
    catch (err: any) { setError(err.message) }
    finally { setIsLoading(false) }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault(); if (otp.length < 6) return
    setIsLoading(true); clearError()
    try { await apiPost("/forgot-password/verify", { email, otp }); setStep(3) }
    catch (err: any) { setError(err.message) }
    finally { setIsLoading(false) }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); clearError(); setFieldErrors({})

    const fe: { new?: string; confirm?: string } = {}
    if (!newPass)
      fe.new = isKh ? "សូមបញ្ចូលលេខសម្ងាត់ថ្មី" : "New password is required"
    else if (!isStrongPassword(newPass))
      fe.new = isKh
        ? "លេខសម្ងាត់មិនទាន់រឹងមាំគ្រប់គ្រាន់ សូមបំពេញលក្ខខណ្ឌទាំងអស់"
        : "Password is not strong enough. Please meet all requirements."

    if (!confirmPass)
      fe.confirm = isKh ? "សូមបញ្ជាក់លេខសម្ងាត់ថ្មី" : "Please confirm your new password"
    else if (newPass && newPass !== confirmPass)
      fe.confirm = isKh ? "លេខសម្ងាត់មិនត្រូវគ្នា" : "Passwords do not match"

    if (Object.keys(fe).length > 0) { setFieldErrors(fe); return }

    setIsLoading(true)
    try {
      await apiPost("/forgot-password/reset", { email, otp, new_password: newPass, new_password_confirmation: confirmPass })
      setStep(4)
    }
    catch (err: any) {
      if (err instanceof ApiError && err.errors) {
        const e2 = err.errors
        setFieldErrors({ new: e2.new_password?.[0], confirm: e2.new_password_confirmation?.[0] })
        if (!e2.new_password && !e2.new_password_confirmation) setError(err.message)
      } else {
        setError(err.message)
      }
    }
    finally { setIsLoading(false) }
  }

  const startCooldown = () => {
    setResendCooldown(60)
    const timer = setInterval(() => {
      setResendCooldown(prev => { if (prev <= 1) { clearInterval(timer); return 0 } return prev - 1 })
    }, 1000)
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setIsLoading(true); clearError(); setOtp("")
    try { await apiPost("/forgot-password/send-otp", { email }); startCooldown() }
    catch (err: any) { setError(err.message) }
    finally { setIsLoading(false) }
  }

  const stepTitles = isKh
    ? ["ភ្លេចលេខសម្ងាត់?", "ផ្ទៀងផ្ទាត់ OTP", "ប្តូរលេខសម្ងាត់ថ្មី", "ជោគជ័យ!"]
    : ["Forgot Password?", "Verify OTP", "Set New Password", "Success!"]
  const stepIcons = [Mail, KeyRound, Lock, CheckCircle]
  const StepIcon = stepIcons[step - 1]

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#F7F7FB] dark:bg-[#0D0F1A] p-6 transition-colors duration-300"
      style={SORA} >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35] dark:opacity-100"
        style={{
          backgroundImage: "linear-gradient(rgba(24,87,216,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(24,87,216,0.05) 1px,transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
        }}
      />
      <div className="pointer-events-none fixed -top-28 -right-28 w-[26rem] h-[26rem] rounded-full bg-[#1857D8]/20 dark:bg-[#1857D8]/[0.12] blur-[110px]" />
      <div className="pointer-events-none fixed -bottom-28 -left-28 w-[20rem] h-[20rem] rounded-full bg-[#03624C]/[0.16] dark:bg-[#03624C]/[0.1] blur-[100px]" />

      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }} >
        <div className="relative bg-white/70 dark:bg-[#161927]/70 backdrop-blur-2xl border border-white/60 dark:border-white/[0.08] rounded-2xl shadow-[0_16px_50px_-15px_rgba(24,87,216,0.2)] dark:shadow-[0_16px_50px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="h-[3px] w-full bg-[linear-gradient(90deg,#03624C_0%,#1857D8_50%,#03624C_100%)] bg-[length:200%_100%] animate-[shimmer_6s_linear_infinite]" />
          <div className="px-8 pt-7 pb-5">
            {step < 4 && (
              <motion.div
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08, ease: "easeOut" as const }} >
                <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] text-gray-600 dark:text-white/30 hover:text-[#1857D8] dark:hover:text-[#4d8cf5] transition-colors mb-5">
                  <ArrowLeft className="w-3.5 h-3.5" />{isKh ? "ត្រឡប់ទៅ Login" : "Back to Login"}
                </Link>
              </motion.div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={`icon-${step}`}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border",
                  step === 4
                    ? "bg-[#03624C]/10 border-[#03624C]/20"
                    : "bg-[#1857D8]/10 border-[#1857D8]/20"
                )} >
                <StepIcon className={cn("w-5 h-5", step === 4 ? "text-[#03624C] dark:text-[#2ea88a]" : "text-[#1857D8] dark:text-[#4d8cf5]")} />
              </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div
                key={`title-${step}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" as const }} >
                <h1 className="text-[20px] font-bold text-gray-800 dark:text-white/90 leading-tight">{stepTitles[step - 1]}</h1>
                <p className="text-[12px] text-gray-400 dark:text-white/30 mt-1.5 leading-relaxed">
                  {step === 1 && (isKh ? "សូមបញ្ចូល Email ដើម្បីទទួលលេខកូដ OTP សម្រាប់ប្តូរលេខសម្ងាត់ថ្មី។" : "Enter your email to receive an OTP code to reset your password.")}
                  {step === 2 && (isKh ? `យើងបានផ្ញើលេខកូដ ៦ ខ្ទង់ទៅកាន់ ${email}` : `We sent a 6-digit code to ${email}`)}
                  {step === 3 && (isKh ? "សូមបញ្ចូលលេខសម្ងាត់ថ្មីរបស់អ្នក" : "Enter your new password")}
                  {step === 4 && (isKh ? "លេខសម្ងាត់របស់អ្នកត្រូវបានប្តូររួចរាល់ហើយ!" : "Your password has been reset successfully!")}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          {step < 4 && (
            <div className="flex items-center gap-1.5 px-8 mb-5">
              {[1, 2, 3].map(s => (
                <motion.div
                  key={s}
                  animate={{ opacity: step >= s ? 1 : 0.3 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    step >= s ? "bg-[#1857D8]" : "bg-gray-100 dark:bg-white/[0.08]"
                  )}
                />
              ))}
            </div>
          )}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form key="step1" {...stepAnim} onSubmit={handleSendOTP} className="px-8 pb-8 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    {isKh ? "អាសយដ្ឋានអ៊ីមែល" : "Email Address"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/20" />
                    <input type="email" required className={cn(inputCls, "pl-10")}
                      placeholder={isKh ? "បញ្ចូលអ៊ីមែលរបស់អ្នក" : "Enter your email"}
                      value={email} onChange={e => { setEmail(e.target.value); clearError() }} disabled={isLoading} />
                  </div>
                </div>
                {error && <ErrMsg msg={error} />}
                <motion.button type="submit" whileTap={{ scale: 0.98 }} disabled={isLoading || !email}
                  className={btnCls}>
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{isKh ? "កំពុងផ្ញើ..." : "Sending..."}</>
                    : <><Send className="w-4 h-4" />{isKh ? "ផ្ញើលេខកូដ OTP" : "Send OTP Code"}</>}
                </motion.button>
              </motion.form>
            )}
            {step === 2 && (
              <motion.form key="step2" {...stepAnim} onSubmit={handleVerifyOTP} className="px-8 pb-8 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    {isKh ? "បញ្ចូលលេខកូដ ៦ ខ្ទង់" : "Enter the 6-digit code"}
                  </label>
                  <motion.input
                    initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, ease: "easeOut" as const }}
                    type="text" maxLength={6} required
                    className={cn(inputCls, "h-14 text-center text-[22px] font-bold tracking-[0.5em]")}
                    placeholder="000000" value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, "")); clearError() }}
                    disabled={isLoading}
                  />
                  <p className="text-[11px] text-gray-400 dark:text-white/30 text-center">{email}</p>
                </div>
                {error && <ErrMsg msg={error} />}
                <motion.button type="submit" whileTap={{ scale: 0.98 }} disabled={isLoading || otp.length < 6}
                  className={btnCls}>
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{isKh ? "កំពុងផ្ទៀងផ្ទាត់..." : "Verifying..."}</>
                    : <><KeyRound className="w-4 h-4" />{isKh ? "ផ្ទៀងផ្ទាត់ OTP" : "Verify OTP"}</>}
                </motion.button>
                <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || isLoading}
                  className="w-full text-[12px] font-semibold text-gray-400 dark:text-white/30 hover:text-[#1857D8] dark:hover:text-[#4d8cf5] transition-colors py-1 disabled:opacity-50 disabled:cursor-not-allowed">
                  {resendCooldown > 0
                    ? (isKh ? `ផ្ញើឡើងវិញបាន ក្នុង ${resendCooldown}s` : `Resend available in ${resendCooldown}s`)
                    : (isKh ? "មិនបានទទួលលេខកូដ? ផ្ញើឡើងវិញ" : "Didn't receive a code? Resend")}
                </button>
              </motion.form>
            )}
            {step === 3 && (
              <motion.form key="step3" {...stepAnim} onSubmit={handleReset} className="px-8 pb-8 space-y-4">
                <div className="space-y-1.5">
                  <label className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40",
                    fieldErrors.new && "text-rose-500 dark:text-rose-400"
                  )}>
                    {isKh ? "លេខសម្ងាត់ថ្មី" : "New Password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/20" />
                    <input type={showPass ? "text" : "password"}
                      className={cn(inputCls, "pl-10 pr-11", fieldErrors.new && inputErrCls)}
                      placeholder={isKh ? "យ៉ាងហោចណាស់ ៨ តួអក្សរ" : "At least 8 characters"} value={newPass}
                      onChange={e => { setNewPass(e.target.value); setFieldErrors(p => ({ ...p, new: undefined })); clearError() }} disabled={isLoading} />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.new && <FieldErr msg={fieldErrors.new} />}
                  <PasswordStrength password={newPass} isKh={isKh} hasError={!!fieldErrors.new} />
                </div>
                <div className="space-y-1.5">
                  <label className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40",
                    fieldErrors.confirm && "text-rose-500 dark:text-rose-400"
                  )}>
                    {isKh ? "បញ្ជាក់លេខសម្ងាត់" : "Confirm Password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/20" />
                    <input type={showConf ? "text" : "password"}
                      className={cn(inputCls, "pl-10 pr-11", fieldErrors.confirm && inputErrCls)}
                      placeholder={isKh ? "បញ្ជាក់លេខសម្ងាត់ម្តងទៀត" : "Confirm your new password"} value={confirmPass}
                      onChange={e => { setConfirm(e.target.value); setFieldErrors(p => ({ ...p, confirm: undefined })); clearError() }} disabled={isLoading} />
                    <button type="button" onClick={() => setShowConf(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors">
                      {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirm && <FieldErr msg={fieldErrors.confirm} />}
                </div>
                {error && <ErrMsg msg={error} />}
                <motion.button type="submit" whileTap={{ scale: 0.98 }} disabled={isLoading || !newPass || !confirmPass}
                  className={btnCls}>
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{isKh ? "កំពុងប្តូរ..." : "Updating..."}</>
                    : <><Lock className="w-4 h-4" />{isKh ? "ប្តូរលេខសម្ងាត់" : "Reset Password"}</>}
                </motion.button>
              </motion.form>
            )}
            {step === 4 && (
              <motion.div key="step4" {...stepAnim} className="px-8 pb-8 space-y-4">
                <div className="flex flex-col items-center py-4 gap-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 280, damping: 16, delay: 0.1 }}
                    className="w-16 h-16 rounded-2xl bg-[#03624C]/10 border border-[#03624C]/20 flex items-center justify-center" >
                    <CheckCircle className="w-8 h-8 text-[#03624C] dark:text-[#2ea88a]" />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, ease: "easeOut" as const }}
                    className="text-[13px] text-center text-gray-500 dark:text-white/40 leading-relaxed" >
                    {isKh
                      ? <>លេខសម្ងាត់ត្រូវបានប្តូររួចរាល់។<br />សូម Login ម្តងទៀតដោយប្រើលេខសម្ងាត់ថ្មី។</>
                      : <>Your password has been reset.<br />Please log in again with your new password.</>}
                  </motion.p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, ease: "easeOut" as const }} >
                  <Link href="/login" className={btnCls}>
                    {isKh ? "ចូល Login" : "Go to Login"}
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center text-[10px] text-gray-400 dark:text-white/20 font-medium mt-5" >
          &copy; 2026 {systemName} Management System. All rights reserved.
        </motion.p>
      </motion.div>
      <style jsx global>{`
        @keyframes shimmer {
          0%   { background-position: 0% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}