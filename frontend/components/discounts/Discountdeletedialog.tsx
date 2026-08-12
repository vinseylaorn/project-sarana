"use client"

import { useEffect, useState } from "react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"
import type { Discount } from "@/types"
import { SORA } from "./Discount.config"

export function DiscountDeleteDialog({ open, onClose, item, isKh, onConfirm, deleting }: {
  open:      boolean
  onClose:   () => void
  item:      Discount | null
  isKh:      boolean
  onConfirm: () => void
  deleting:  boolean
}) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent
        className="rounded-2xl border-0 bg-white dark:bg-[#22263a] shadow-2xl p-0 max-w-[400px] overflow-hidden"
        style={{ ...SORA, fontSize: isKh ? "16px" : undefined }}
      >
        <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-rose-400" />
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            </div>
            <div className="pt-0.5">
              <AlertDialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 mb-1">
                {isKh ? "បញ្ជាក់ការលុប" : "Confirm Delete"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[14px] text-gray-500 dark:text-white/40 leading-relaxed">
                {isKh ? "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។" : "This action cannot be undone."}
              </AlertDialogDescription>
            </div>
          </div>
          {item?.name && (
            <div className="mb-5 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-500/[0.08] border border-rose-100 dark:border-rose-500/20 flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-[14px] font-semibold text-rose-600 dark:text-rose-300 truncate">{item.name}</span>
            </div>
          )}
          <AlertDialogFooter className="gap-2 flex-row justify-end">
            <AlertDialogCancel onClick={onClose} style={SORA}
              className="h-9 px-5 rounded-xl text-[14px] font-bold border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all">
              {isKh ? "បោះបង់" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} disabled={deleting} style={SORA}
              className="h-9 px-5 rounded-xl text-[14px] font-semibold flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border dark:border-rose-500/30 dark:shadow-none disabled:opacity-60 transition-all">
              {deleting
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{isKh ? "កំពុងលុប..." : "Deleting..."}</>
                : <><Trash2 className="w-3.5 h-3.5" />{isKh ? "លុបចោល" : "Delete"}</>
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}