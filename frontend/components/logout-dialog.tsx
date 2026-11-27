"use client"

import { useTranslation } from "react-i18next"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LogOut } from "lucide-react"

const SORA: React.CSSProperties = { fontFamily: "'Sora', sans-serif" }

interface LogoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function LogoutDialog({ open, onOpenChange, onConfirm }: LogoutDialogProps) {
  const { t, i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="rounded-2xl border-0 bg-white dark:bg-[#22263a] shadow-2xl p-0 max-w-[400px] overflow-hidden"
        style={SORA} >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#03624C]/[0.08] 
              border border-[#03624C]/20 dark:bg-[#1857D8]/[0.12] dark:border-[#1857D8]/25" >
              <LogOut className="w-5 h-5 text-[#03624C] dark:text-[#6b9fff]" />
            </div>
            <div className="pt-0.5">
              <AlertDialogTitle className="text-[14px] font-bold text-gray-800 dark:text-white/90 mb-1">
                {isKh ? "បញ្ជាក់ការចាកចេញ" : "Confirm Logout"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[12px] text-gray-500 dark:text-white/40 leading-relaxed">
                {isKh
                  ? "តើអ្នកប្រាកដថាចង់ចាកចេញមែនទេ? អ្នកត្រូវចូលម្តងទៀតដើម្បីប្រើប្រព័ន្ធ។"
                  : "Are you sure you want to logout? You will need to sign in again to access the system."}
              </AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter className="gap-2 flex-row justify-end">
            <AlertDialogCancel
              style={SORA}
              className="h-9 px-5 rounded-xl text-[12px] font-bold border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            >
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              style={SORA}
              className="h-9 px-5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all active:scale-[0.97] text-white bg-[#03624C] hover:bg-[#024a3a] shadow-sm shadow-[#03624C]/25 dark:bg-[#1857D8] dark:hover:opacity-90 dark:shadow-[#1857D8]/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t("logout")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}