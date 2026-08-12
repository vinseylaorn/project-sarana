"use client"
 
import { useState } from "react"
import { Settings, KeyRound, Languages } from "lucide-react"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next"
import { ChangePasswordDialog } from "@/components/change-password-dialog"
import { LanguageSwitcher } from "@/components/language-switcher"
 
const SORA: React.CSSProperties = { fontFamily: "'Sora', sans-serif" }
const DMI = "text-[12px] font-semibold py-2.5 px-3 rounded-lg cursor-pointer"
 
export function SettingsDropdown() {
  const { t } = useTranslation("common")
  const [showChangePassword,  setShowChangePassword]  = useState(false)
  const [showLanguageSwitcher, setShowLanguageSwitcher] = useState(false)
 
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.08] hover:text-gray-600 dark:hover:text-white/80 transition-all outline-none" >
            <Settings className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-white dark:bg-[#22263a] border border-gray-100 dark:border-white/[0.12] shadow-xl min-w-[180px] p-1 rounded-xl"
          style={SORA} >
          <div className="px-3 py-2 mb-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">
              {t("settings")}
            </p>
          </div>
          <DropdownMenuSeparator className="bg-gray-100 dark:bg-white/[0.08] mb-1" />
          <DropdownMenuItem
            className={`${DMI} text-amber-600 dark:text-amber-400 focus:bg-amber-50 dark:focus:bg-amber-500/10`}
            onClick={() => setShowChangePassword(true)} >
            <KeyRound className="w-3.5 h-3.5 mr-2.5 shrink-0" />
            {t("changePassword")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className={`${DMI} text-indigo-600 dark:text-indigo-400 focus:bg-indigo-50 dark:focus:bg-indigo-500/10`}
            onClick={() => setShowLanguageSwitcher(true)} >
            <Languages className="w-3.5 h-3.5 mr-2.5 shrink-0" />
            {t("switchLanguage")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangePasswordDialog open={showChangePassword}   onOpenChange={setShowChangePassword} />
      <LanguageSwitcher     open={showLanguageSwitcher} onOpenChange={setShowLanguageSwitcher} />
    </>
  )
}