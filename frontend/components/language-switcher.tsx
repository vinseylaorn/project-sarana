"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const SORA: React.CSSProperties = { fontFamily: "'Sora', sans-serif" }

type Lang = "en" | "kh"
interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}
export function LanguageSwitcher({ open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation("common")
  const current = (i18n.language === "kh" ? "kh" : "en") as Lang
  const [selected, setSelected] = useState<Lang>(current)
  const handleApply = () => {
    i18n.changeLanguage(selected)
    onOpenChange(false)
  }
  const options: { value: Lang; label: string; sub: string; flag: string }[] = [
    { value: "en", label: "English", sub: "English language", flag: "🇺🇸" },
    { value: "kh", label: "ខ្មែរ (Khmer)", sub: "ភាសាខ្មែរ", flag: "🇰🇭" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-2xl bg-white dark:bg-[#22263a] [&>button]:hidden"
        style={SORA} >
        <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.10]">
          <DialogTitle className="text-[15px] font-bold text-gray-800 dark:text-white/90">
            {t("switchLanguage")}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-gray-400 dark:text-white/30 mt-0.5">
            {current === "kh"
              ? "ជ្រើសរើសភាសាដែលចូលចិត្តរបស់អ្នក"
              : "Choose your preferred language"}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-2.5">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                selected === opt.value
                  ? "border-[#03624C] dark:border-indigo-500/50 bg-[#03624C]/[0.06] dark:bg-indigo-500/10"
                  : "border-gray-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.06]"
              )} >
              <span className="text-xl leading-none">{opt.flag}</span>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-[13px] font-semibold",
                  selected === opt.value
                    ? "text-[#03624C] dark:text-indigo-400"
                    : "text-gray-700 dark:text-white/80"
                )} >
                  {opt.label}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-white/30 mt-0.5">
                  {opt.sub}
                </p>
              </div>
              {selected === opt.value && (
                <div className="w-5 h-5 rounded-full bg-[#03624C] dark:bg-indigo-500 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
        <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.10] bg-gray-50 dark:bg-[#1e2235] rounded-b-2xl">
          <div className="flex justify-end gap-2 w-full">
            <button
              onClick={() => onOpenChange(false)}
              className="h-9 px-5 rounded-lg text-[12px] font-semibold transition-all border border-gray-200 dark:border-white/[0.12] text-gray-600 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06]" >
              {t("cancel")}
            </button>
            <button
              onClick={handleApply}
              className="h-9 px-6 rounded-lg text-[12px] font-semibold transition-all bg-[#03624C] hover:bg-[#03624C]/80 text-white shadow-md shadow-[#03624C]/20 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 dark:text-indigo-300 dark:border dark:border-indigo-500/30 dark:shadow-none" >
              {t("apply")}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}