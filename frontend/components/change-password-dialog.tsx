"use client"

import { useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"
import { Lock, Eye, EyeOff, AlertTriangle, Check, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const SORA: React.CSSProperties = { fontFamily: "'Sora', sans-serif" }

if (typeof document !== "undefined" && !document.getElementById("__toast_kf")) {
  const s = document.createElement("style"); s.id = "__toast_kf"
  s.textContent = `@keyframes toastIn{from{opacity:0;transform:translateY(-14px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}`
  document.head.appendChild(s)
}

const toastBase: React.CSSProperties = {
  fontFamily: "'Sora',sans-serif", display: "flex", alignItems: "flex-start",
  gap: 12, padding: "13px 16px", borderRadius: 12, width: 420,
  animation: "toastIn 0.36s cubic-bezier(0.34,1.45,0.64,1) forwards",
}
const iconBase: React.CSSProperties = {
  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
  display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
}

function ToastIcon({ color, children }: { color: string; children: React.ReactNode }) {
  return <div style={{ ...iconBase, background: color }}>{children}</div>
}

function toastSuccess(msg: string, desc?: string) {
  toast.custom(id => (
    <div style={{ ...toastBase, background: "#e8f5e9", border: "1px solid #c8e6c9" }}>
      <ToastIcon color="#c8e6c9"><Check className="w-4 h-4 text-[#388e3c]" /></ToastIcon>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#2e7d32", margin: 0, lineHeight: 1.3 }}>{msg}</p>
        {desc && <p style={{ fontSize: 12, color: "#4caf50", margin: "4px 0 0", lineHeight: 1.5 }}>{desc}</p>}
      </div>
      <button onClick={() => toast.dismiss(id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2e7d32", opacity: 0.4, fontSize: 18, lineHeight: 1, padding: 0, marginTop: 2 }}>×</button>
    </div>
  ), { duration: 3000 })
}

// Light-mode focus color now uses the brand green (#03624C) instead of indigo;
// dark mode keeps its own accent.
const inputCls = "w-full h-9 px-3 text-[14px] rounded-lg outline-none transition-colors bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.10] text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 focus:border-[#03624C] dark:focus:border-indigo-500/50 shadow-sm dark:shadow-none"
const inputErrCls = "border-rose-400 dark:border-rose-500/50 focus:border-rose-400 dark:focus:border-rose-500/50"

const ErrMsg = ({ msg }: { msg: string }) => (
  <p className="flex items-center gap-1 text-[12px] text-rose-500 dark:text-rose-400 mt-1 font-medium">
    <AlertTriangle className="w-3 h-3 shrink-0" />
    {msg}
  </p>
)

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
        : "border-gray-100 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03]"
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

type FieldKey = "current" | "new" | "confirm"

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { t, i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Partial<Record<FieldKey | "general", string>>>({})
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleClose = () => {
    if (saving) return
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    setErrors({}); setShowCurrent(false); setShowNew(false); setShowConfirm(false)
    onOpenChange(false)
  }

  const clearError = (key: FieldKey) =>
    setErrors(p => ({ ...p, [key]: "", general: "" }))

  const handleSave = async () => {
    const err: Partial<Record<FieldKey, string>> = {}

    if (!currentPassword)
      err.current = isKh ? "សូមបញ្ចូលលេខសម្ងាត់បច្ចុប្បន្ន" : "Current password is required"

    if (!newPassword)
      err.new = isKh ? "សូមបញ្ចូលលេខសម្ងាត់ថ្មី" : "New password is required"
    else if (!isStrongPassword(newPassword))
      err.new = isKh
        ? "លេខសម្ងាត់មិនទាន់រឹងមាំគ្រប់គ្រាន់ សូមបំពេញលក្ខខណ្ឌទាំងអស់"
        : "Password is not strong enough. Please meet all requirements."
    else if (currentPassword && currentPassword === newPassword)
      err.new = isKh
        ? "លេខសម្ងាត់ថ្មីត្រូវតែខុសពីលេខសម្ងាត់បច្ចុប្បន្ន"
        : "New password must differ from current password"

    if (!confirmPassword)
      err.confirm = isKh ? "សូមបញ្ជាក់លេខសម្ងាត់ថ្មី" : "Please confirm your new password"
    else if (newPassword && newPassword !== confirmPassword)
      err.confirm = isKh ? "លេខសម្ងាត់មិនដូចគ្នា" : "Passwords do not match"

    if (Object.keys(err).length > 0) { setErrors(err); return }

    setErrors({})
    setSaving(true)
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
      const token = localStorage.getItem("auth_token")

      const res = await fetch(`${BASE_URL}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.errors) {
          // map backend field errors to the matching input
          const e = data.errors as Record<string, string[]>
          setErrors({
            current: e.current_password?.[0],
            new: e.new_password?.[0],
            confirm: e.new_password_confirmation?.[0],
            general: !e.current_password && !e.new_password && !e.new_password_confirmation
              ? Object.values(e)[0]?.[0] ?? "Validation error"
              : "",
          })
        } else {
          setErrors({ general: data.message ?? (isKh ? "មានបញ្ហា សូមព្យាយាមម្តងទៀត" : "Something went wrong") })
        }
        return
      }
      toastSuccess(
        isKh ? "ជោគជ័យ" : "Password changed",
        isKh ? "ផ្លាស់ប្តូរលេខសម្ងាត់ដោយជោគជ័យ" : "Your password has been updated successfully"
      )
      handleClose()
    } catch {
      setErrors({ general: isKh ? "មិនអាចភ្ជាប់ទៅServer បាន" : "Cannot connect to server" })
    } finally {
      setSaving(false)
    }
  }

  const fields: {
    key: FieldKey
    label: string
    value: string
    set: (v: string) => void
    show: boolean
    toggle: () => void
  }[] = [
      { key: "current", label: t("currentPassword"), value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
      { key: "new", label: t("newPassword"), value: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(v => !v) },
      { key: "confirm", label: t("confirmPassword"), value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
    ]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-sm p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-lg bg-white dark:bg-[#22263a] flex flex-col [&>button]:hidden"
        style={SORA} >
        <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.10] shrink-0">
          <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90">
            {t("changePassword")}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-gray-400 dark:text-white/30 mt-0.5">
            {isKh
              ? "បញ្ចូលលេខសម្ងាត់បច្ចុប្បន្ននិងជ្រើសរើសលេខសម្ងាត់ថ្មី"
              : "Enter your current password and choose a new one"}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {fields.map(f => {
            const fieldError = errors[f.key]
            return (
              <div key={f.key} className="space-y-1.5">
                <Label className={cn("text-[14px] text-gray-600 dark:text-white/40", fieldError && "text-rose-500 dark:text-rose-400")}>
                  {f.label}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 dark:text-white/20" />
                  <input
                    type={f.show ? "text" : "password"}
                    disabled={saving}
                    className={cn(inputCls, "pl-9 pr-9", fieldError && inputErrCls)}
                    value={f.value}
                    onChange={e => { f.set(e.target.value); clearError(f.key) }}
                    onKeyDown={e => e.key === "Enter" && handleSave()}
                    placeholder={isKh ? "បញ្ជូលពាក្យសំងាត់..." : "Enter your password"} />
                  <button
                    type="button"
                    onClick={f.toggle}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors" >
                    {f.show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {fieldError && <ErrMsg msg={fieldError} />}
                {f.key === "new" && (
                  <PasswordStrength password={newPassword} isKh={isKh} hasError={!!errors.new} />
                )}
              </div>
            )
          })}
          {errors.general && <ErrMsg msg={errors.general} />}
        </div>
        <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.10] bg-gray-50 dark:bg-[#1e2235] rounded-b-2xl">
          <div className="flex justify-end gap-2 w-full">
            <button
              onClick={handleClose}
              disabled={saving}
              className="h-9 px-5 rounded-lg text-[14px] transition-all border border-gray-200 dark:border-white/[0.12] text-gray-600 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50" >
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-6 rounded-lg text-[14px] transition-all bg-[#03624C] hover:bg-[#03624C]/80 text-white shadow-md shadow-[#03624C]/20 dark:bg-[#1857D8] dark:hover:bg-[#1857D8]/80 dark:text-white dark:border dark:border-[#1857D8] dark:shadow-none disabled:opacity-60 flex items-center gap-2" >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? (isKh ? "កំពុងរក្សា..." : "Saving...") : t("changePassword")}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}