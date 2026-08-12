"use client"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LayoutGrid } from "lucide-react"

const SORA: React.CSSProperties = { fontFamily: "'Sora', sans-serif" }

interface GoToAdminDialogProps {
  isKh:         boolean
  open:         boolean
  onOpenChange: (open: boolean) => void
  onConfirm:    () => void
}

export function GoToAdminDialog({ isKh, open, onOpenChange, onConfirm }: GoToAdminDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="rounded-2xl border-0 bg-white dark:bg-[#22263a] shadow-2xl p-0 max-w-[400px] overflow-hidden"
        style={SORA} >
        <div className="h-1 w-full bg-gradient-to-r from-[#03624C] to-[#059669] dark:from-[#1857D8] dark:to-[#1857D8]/60" />
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#03624C]/[0.08]
              border border-[#03624C]/20 dark:bg-[#1857D8]/[0.12] dark:border-[#1857D8]/25" >
              <LayoutGrid className="w-5 h-5 text-[#03624C] dark:text-[#6b9fff]" />
            </div>
            <div className="pt-0.5">
              <AlertDialogTitle className="text-[14px] font-bold text-gray-800 dark:text-white/90 mb-1">
                {isKh ? "បញ្ជាក់ការចេញទៅទំព័រគ្រប់គ្រង" : "Confirm Go To Admin"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[12px] text-gray-500 dark:text-white/40 leading-relaxed">
                {isKh
                  ? "តើអ្នកប្រាកដថាចង់ចេញពី POS ទៅកាន់ទំព័រគ្រប់គ្រងមែនទេ?"
                  : "Are you sure you want to leave POS and go to the Admin dashboard?"}
              </AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter className="gap-2 flex-row justify-end">
            <AlertDialogCancel
              style={SORA}
              className="h-9 px-5 rounded-xl text-[12px] font-bold border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            >
              {isKh ? "បោះបង់" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              style={SORA}
              className="h-9 px-5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all active:scale-[0.97] text-white bg-[#03624C] hover:bg-[#024a3a] shadow-sm shadow-[#03624C]/25 dark:bg-[#1857D8] dark:hover:opacity-90 dark:shadow-[#1857D8]/20"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {isKh ? "ទៅទំព័រគ្រប់គ្រង" : "Go To Admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}