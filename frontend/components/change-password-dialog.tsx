"use client"

import { useState } from "react"
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"
import { Lock, Eye, EyeOff, AlertTriangle, Check, Loader2 } from "lucide-react"
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

const inputCls    = "w-full h-9 px-3 text-[14px] rounded-lg outline-none transition-colors bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.10] text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 focus:border-indigo-400 dark:focus:border-indigo-500/50 shadow-sm dark:shadow-none"
const inputErrCls = "border-rose-400 dark:border-rose-500/50 focus:border-rose-400 dark:focus:border-rose-500/50"

const ErrMsg = ({ msg }: { msg: string }) => (
  <p className="flex items-center gap-1 text-[14px] text-rose-500 dark:text-rose-400 mt-1">
    <AlertTriangle className="w-3 h-3 shrink-0" />
    {msg}
  </p>
)

interface ChangePasswordDialogProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { t, i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword,     setNewPassword]     = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error,           setError]           = useState("")
  const [saving,          setSaving]          = useState(false)
  const [showCurrent,     setShowCurrent]     = useState(false)
  const [showNew,         setShowNew]         = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)

  const handleClose = () => {
    if (saving) return
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    setError(""); setShowCurrent(false); setShowNew(false); setShowConfirm(false)
    onOpenChange(false)
  }

  const handleSave = async () => {
    setError("")
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(isKh ? "ត្រូវបំពេញវាលទាំងអស់" : "All fields are required"); return
    }
    if (newPassword !== confirmPassword) {
      setError(isKh ? "លេខសម្ងាត់ថ្មីមិនផ្គូផ្គង" : "New passwords do not match"); return
    }
    if (newPassword.length < 6) {
      setError(isKh ? "លេខសម្ងាត់ត្រូវតែមានយ៉ាងហោចណាស់ ៦ តួអក្សរ" : "Password must be at least 6 characters"); return
    }
    if (currentPassword === newPassword) {
      setError(isKh ? "លេខសម្ងាត់ថ្មីត្រូវតែខុសពីលេខសម្ងាត់បច្ចុប្បន្ន" : "New password must differ from current password"); return
    }

    setSaving(true)
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
      const token    = localStorage.getItem("auth_token")

      const res = await fetch(`${BASE_URL}/auth/change-password`, {
        method:  "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept:         "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          current_password:          currentPassword,
          new_password:              newPassword,
          new_password_confirmation: confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.errors) {
          const firstMsg = Object.values(data.errors as Record<string, string[]>)[0]?.[0]
          setError(firstMsg ?? "Validation error")
        } else {
          setError(data.message ?? (isKh ? "មានបញ្ហា សូមព្យាយាមម្តងទៀត" : "Something went wrong"))
        }
        return
      }
      toastSuccess(
        isKh ? "ជោគជ័យ"                       : "Password changed",
        isKh ? "ផ្លាស់ប្តូរលេខសម្ងាត់ដោយជោគជ័យ" : "Your password has been updated successfully"
      )
      handleClose()
    } catch {
      setError(isKh ? "មិនអាចភ្ជាប់ទៅServer បាន" : "Cannot connect to server")
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { label: t("currentPassword"), value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v), id: "cur" },
    { label: t("newPassword"),     value: newPassword,     set: setNewPassword,     show: showNew,     toggle: () => setShowNew(v => !v),     id: "new" },
    { label: t("confirmPassword"), value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v), id: "con" },
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
        <div className="px-6 py-5 space-y-4">
          {fields.map(f => (
            <div key={f.id} className="space-y-1.5">
              <Label className="text-[14px] text-gray-600 dark:text-white/40">
                {f.label}
              </Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 dark:text-white/20" />
                <input
                  type={f.show ? "text" : "password"}
                  disabled={saving}
                  className={cn(inputCls, "pl-9 pr-9", error && !f.value && inputErrCls)}
                  value={f.value}
                  onChange={e => { f.set(e.target.value); setError("") }}
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                  placeholder={isKh ? "បញ្ជូលពាក្យសំងាត់..." : "Enter your password"} />
                <button
                  type="button"
                  onClick={f.toggle}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors" >
                  {f.show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
          {error && <ErrMsg msg={error} />}
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