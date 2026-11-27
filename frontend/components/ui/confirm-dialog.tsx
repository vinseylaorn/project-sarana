"use client"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Loader2, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const SORA: React.CSSProperties = { fontFamily: "'Sora', sans-serif" }

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: () => void
  loading?: boolean
  title: string
  description?: string
  highlight?: string
  variant?: "danger" | "warning" | "info" | "success"
  confirmLabel?: string
  cancelLabel?: string
  icon?: LucideIcon
}

const VARIANTS = {
  danger: {
    iconBg: "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20",
    icon: "text-rose-500 dark:text-rose-400",
    hl: "bg-rose-50 dark:bg-rose-500/[0.08] border-rose-100 dark:border-rose-500/20",
    hlText: "text-rose-600 dark:text-rose-300",
    btn: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border dark:border-rose-500/30",
  },

  warning: {
    iconBg: "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
    icon: "text-amber-500 dark:text-amber-400",
    hl: "bg-amber-50 dark:bg-amber-500/[0.08] border-amber-100 dark:border-amber-500/20",
    hlText: "text-amber-600 dark:text-amber-300",
    btn: "bg-amber-500 hover:bg-amber-600 text-white shadow-sm dark:bg-amber-500/15 dark:hover:bg-amber-500/25 dark:text-amber-300 dark:border dark:border-amber-500/30",
  },

  info: {
    iconBg: "bg-[#03624C]/[0.08] dark:bg-[#03624C]/[0.15] border-[#03624C]/20 dark:border-[#03624C]/25",
    icon: "text-[#03624C] dark:text-[#4dab8e]",
    hl: "bg-[#03624C]/[0.06] dark:bg-[#4dab8e]/[0.08] border-[#03624C]/20 dark:border-[#4dab8e]/20",
    hlText: "text-[#03624C] dark:text-[#4dab8e]",
    btn: "bg-[#03624C] hover:bg-[#024d3c] text-white shadow-sm shadow-[#03624C]/20 dark:bg-[#4dab8e]/20 dark:hover:bg-[#4dab8e]/30 dark:text-[#4dab8e] dark:border dark:border-[#4dab8e]/30",
  },

  success: {
    iconBg: "bg-[#03624C]/[0.08] dark:bg-[#03624C]/[0.15] border-[#03624C]/20 dark:border-[#03624C]/25",
    icon: "text-[#03624C] dark:text-[#4dab8e]",
    hl: "bg-[#03624C]/[0.06] dark:bg-[#4dab8e]/[0.08] border-[#03624C]/20 dark:border-[#4dab8e]/20",
    hlText: "text-[#03624C] dark:text-[#4dab8e]",
    btn: "bg-[#03624C] hover:bg-[#024d3c] text-white shadow-sm shadow-[#03624C]/20 dark:bg-[#4dab8e]/20 dark:hover:bg-[#4dab8e]/30 dark:text-[#4dab8e] dark:border dark:border-[#4dab8e]/30",
  },
}

export function ConfirmDialog({
  open, onOpenChange, onConfirm, loading = false,
  title, description, highlight,
  variant = "danger",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  icon: Icon = AlertTriangle,
}: ConfirmDialogProps) {
  const v = VARIANTS[variant]

  return (
    <AlertDialog open={open} onOpenChange={v2 => { if (!loading) onOpenChange(v2) }}>
      <AlertDialogContent
        className="rounded-2xl border-0 bg-white dark:bg-[#22263a] shadow-2xl p-0 max-w-[400px] overflow-hidden"
        style={SORA}
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={cn("w-11 h-11 rounded-xl border flex items-center justify-center shrink-0", v.iconBg)}>
              <Icon className={cn("w-5 h-5", v.icon)} />
            </div>
            <div className="pt-0.5">
              <AlertDialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 mb-1">
                {title}
              </AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="text-[13px] text-gray-500 dark:text-white/40 leading-relaxed">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
          {highlight && (
            <div className={cn("mb-5 px-3 py-2 rounded-lg border flex items-center gap-2", v.hl)}>
              <Icon className={cn("w-3.5 h-3.5 shrink-0", v.icon)} />
              <span className={cn("text-[14px] truncate", v.hlText)}>
                {highlight}
              </span>
            </div>
          )}
          <AlertDialogFooter className="gap-2 flex-row justify-end">
            <AlertDialogCancel
              disabled={loading}
              onClick={() => onOpenChange(false)}
              className="h-9 px-5 rounded-lg text-[14px] font-semibold border border-gray-200 dark:border-white/[0.12] text-gray-600 dark:text-white/55 bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all disabled:opacity-50"
              style={SORA}
            >
              {cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                "h-9 px-5 rounded-lg text-[14px] font-semibold transition-all flex items-center gap-1.5 disabled:opacity-60 dark:shadow-none",
                v.btn
              )}
              style={SORA}
            >
              {loading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{cancelLabel === "បោះបង់" ? "កំពុងដំណើរការ..." : "Processing..."}</>
                : confirmLabel
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}