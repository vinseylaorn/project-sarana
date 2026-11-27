"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { useSettings } from "@/lib/settings-context"
import { useTranslation } from "react-i18next"
import { Sidebar } from "@/components/sidebar"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
   Trash2, Upload, Loader2, Lock, ShieldCheck, Globe,
   Building2, Camera, CheckCircle, Moon, Sun, Monitor,
   Palette, Sparkles, Settings2,
} from "lucide-react"
import { ChangePasswordDialog } from "@/components/change-password-dialog"
import { ExchangeRateSection } from "@/components/settings/exchange-rate-setting"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { systemSettingApi } from "@/lib/api"
import { PrinterSection } from "@/components/settings/print-setting"

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }

const ACCENT = {
   text: "text-[#03624C] dark:text-[#1857D8]",
   bg: "bg-[#03624C] dark:bg-[#1857D8]",
   border: "border-[#03624C]/30 dark:border-[#1857D8]/30",
   iconBg: "bg-[#03624C] dark:bg-[#1857D8]",
   subtle: "bg-[#03624C]/[0.08] dark:bg-[#1857D8]/[0.15]",
   subtleBorder: "border-[#03624C]/20 dark:border-[#1857D8]/25",
}

const compressImage = (file: File, maxSize = 256): Promise<string> => {
   return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
         const img = new Image()
         img.onload = () => {
            const canvas = document.createElement("canvas")
            const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1)
            canvas.width = Math.round(img.width * ratio)
            canvas.height = Math.round(img.height * ratio)
            const ctx = canvas.getContext("2d")
            if (!ctx) { reject(new Error("Canvas error")); return }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            resolve(canvas.toDataURL("image/jpeg", 0.82))
         }
         img.onerror = reject
         img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
   })
}

const INPUT =
   "w-full h-9 px-3 text-[14px] font-medium rounded-lg outline-none transition-all " +
   "bg-white dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] " +
   "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/20 " +
   "focus:border-[#03624C] dark:focus:border-[#1857D8] focus:ring-2 focus:ring-[#03624C]/10 " +
   "dark:focus:ring-[#1857D8]/10 shadow-sm dark:shadow-none"

const SEL_C = "bg-white dark:bg-[#22263a] border-gray-100 dark:border-white/[0.12] rounded-lg"
const SEL_I = "text-[14px] text-gray-800 dark:text-white focus:bg-[#03624C]/10 dark:focus:bg-[#1857D8]/10 dark:focus:text-[#6b9fff]"

const Section = ({
   children, delay = 0, className,
}: {
   children: React.ReactNode
   delay?: number
   className?: string
}) => (
   <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn(
         "bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-white/[0.06] shadow-sm dark:shadow-none overflow-hidden",
         className
      )}
   >
      {children}
   </motion.div>
)

const SectionHeader = ({
   icon: Icon, title, subtitle,
}: {
   icon: React.ElementType
   title: string
   subtitle: string
}) => (
   <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] rounded-t-2xl">
      <div className="flex items-center gap-2.5">
         <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", ACCENT.iconBg)}>
            <Icon className="w-4 h-4 text-white" />
         </div>
         <div>
            <p className="text-[14px] font-bold text-gray-800 dark:text-white/90 leading-tight">{title}</p>
            <p className="text-[12px] text-gray-600 dark:text-white/30 leading-tight mt-0.5">{subtitle}</p>
         </div>
      </div>
   </div>
)

export default function GeneralSettings() {
   const { systemName, systemLogo, updateSettings } = useSettings()
   const { t, i18n } = useTranslation("common")
   const { theme, setTheme } = useTheme()
   const isKh = i18n.language === "kh"

   const [mounted, setMounted] = useState(false)
   const [tempName, setTempName] = useState(systemName ?? "")
   const [tempLogo, setTempLogo] = useState<string | null>(systemLogo)
   const [tempLanguage, setTempLanguage] = useState(i18n.language)
   const [isSaving, setIsSaving] = useState(false)
   const [saveSuccess, setSaveSuccess] = useState(false)
   const [saveError, setSaveError] = useState("")
   const [isLoadingSettings, setIsLoadingSettings] = useState(true)
   const [showChangePassword, setShowChangePassword] = useState(false)
   const [isDragging, setIsDragging] = useState(false)
   const [logoError, setLogoError] = useState("")
   const fileInputRef = useRef<HTMLInputElement>(null)

   useEffect(() => { setMounted(true) }, [])

   const loadSettings = useCallback(async () => {
      try {
         setIsLoadingSettings(true)
         const res = await systemSettingApi.get()
         if (res.success) {
            const name = res.data.system_name ?? ""
            setTempName(name)
            setTempLogo(res.data.system_logo ?? null)
            updateSettings(name, res.data.system_logo ?? "")
         }
      } catch (err) {
         console.error("Failed to load settings:", err)
      } finally {
         setIsLoadingSettings(false)
      }
   }, [updateSettings])

   useEffect(() => { loadSettings() }, [loadSettings])
   useEffect(() => { setTempLanguage(i18n.language) }, [i18n.language])

   const handleSave = async () => {
      setIsSaving(true)
      setSaveError("")
      try {
         const res = await systemSettingApi.update({
            system_name: tempName.trim(),
            system_logo: tempLogo || null,
         })
         if (res.success) {
            // sync with what the backend actually saved (it may apply the default name)
            setTempName(res.data.system_name ?? "")
            updateSettings(res.data.system_name ?? "", res.data.system_logo ?? "")
            await i18n.changeLanguage(tempLanguage)
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 2500)
         }
      } catch (err: unknown) {
         setSaveError(err instanceof Error ? err.message : "Failed to save settings.")
      } finally {
         setIsSaving(false)
      }
   }

   const handleRemoveLogo = async () => {
      try {
         await systemSettingApi.removeLogo()
         setTempLogo(null)
         setLogoError("")
      } catch (err: unknown) {
         setLogoError(err instanceof Error ? err.message : "Failed to remove logo.")
      }
   }

   const handleFileRead = async (file: File) => {
      setLogoError("")
      if (!file.type.startsWith("image/")) {
         setLogoError("Please upload an image file (PNG, JPG)"); return
      }
      try {
         const compressed = await compressImage(file, 256)
         if (compressed.length > 500_000) {
            setLogoError("Image too large. Please use a smaller file."); return
         }
         setTempLogo(compressed)
      } catch {
         setLogoError("Failed to process image. Please try another file.")
      }
   }

   if (isLoadingSettings) {
      return (
         <div className="flex h-screen bg-gray-50 dark:bg-[#13151f]" style={SORA}>
            <Sidebar />
            <div className="flex-1 flex items-center justify-center flex-col gap-4">
               <Loader2 className={cn("w-5 h-5 animate-spin", ACCENT.text)} />
               <span className={cn("text-[14px] font-bold uppercase tracking-[0.2em] animate-pulse", ACCENT.text)}>
                  {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
               </span>
            </div>
         </div>
      )
   }

   const statCards = [
      {
         label: isKh ? "ភាសា" : "Language",
         value: tempLanguage === "kh" ? "ខ្មែរ" : "English",
         icon: Globe,
         bg: "bg-[#03624C]/[0.08] dark:bg-[#1857D8]/[0.15]",
         border: "border-[#03624C]/20 dark:border-[#1857D8]/25",
         text: "text-[#03624C] dark:text-[#6b9fff]",
         lbl: "text-[#03624C] dark:text-[#6b9fff]/70",
         ibg: "bg-[#03624C]/10 dark:bg-[#1857D8]/20",
         blob: "bg-[#03624C]/10 dark:bg-[#1857D8]/10",
      },
      {
         label: isKh ? "រូបរាង" : "Appearance",
         value: !mounted ? "—"
            : theme === "light" ? (isKh ? "ភ្លឺ" : "Light")
               : theme === "dark" ? (isKh ? "ងងឹត" : "Dark")
                  : (isKh ? "ប្រព័ន្ធ" : "System"),
         icon: Palette,
         bg: "bg-[#1857D8]/[0.15] dark:bg-[#1857D8]/[0.25]",
         border: "border-[#1857D8]/20 dark:border-[#1857D8]/25",
         text: "text-[#1857D8] dark:text-[#6b9fff]",
         lbl: "text-gray-800 dark:text-[#6b9fff]/70",
         ibg: "bg-[#1857D8]/10 dark:bg-[#1857D8]/20",
         blob: "bg-[#1857D8]/10 dark:bg-[#1857D8]/10",
      },
      {
         label: isKh ? "សុវត្ថិភាព" : "Security",
         value: isKh ? "ការពារ" : "Protected",
         icon: ShieldCheck,
         bg: "bg-emerald-50 dark:bg-emerald-900/20",
         border: "border-emerald-200 dark:border-emerald-500/20",
         text: "text-emerald-800 dark:text-emerald-100",
         lbl: "text-gray-800 dark:text-emerald-300",
         ibg: "bg-emerald-100 dark:bg-emerald-500/20",
         blob: "bg-emerald-200/40 dark:bg-emerald-500/10",
      },
   ]

   return (
      <div
         className={cn(
            "flex h-screen bg-gray-50 dark:bg-[#13151f] overflow-hidden transition-colors duration-300",
            isKh && "font-khmer"
         )}
         style={SORA} >
         <Sidebar />
         <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-16 bg-white dark:bg-[#1a1d2e] border-b border-gray-100 dark:border-white/[0.06] flex items-center px-6 justify-between shrink-0 shadow-sm dark:shadow-none transition-colors">
               <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", ACCENT.iconBg)}>
                     <Settings2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                     <h1 className="text-[16px] font-bold text-gray-900 dark:text-white leading-tight">{t("settings")}</h1>
                     <p className="text-[12px] text-gray-600 dark:text-white/30 leading-tight">
                        {isKh ? "គ្រប់គ្រងការកំណត់ប្រព័ន្ធ" : "Manage your system preferences"}
                     </p>
                  </div>
               </div>
            </div>

            <main className="flex-1 overflow-auto p-5">
               <div className="max-w-full mx-auto space-y-4">

                  {/* Stat cards */}
                  <div className="grid grid-cols-3 gap-3 shrink-0">
                     {statCards.map((s, i) => (
                        <motion.div
                           key={s.label}
                           initial={{ opacity: 0, y: 14 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ duration: 0.35, delay: i * 0.07 }}
                           whileHover={{ y: -3, transition: { duration: 0.18 } }} >
                           <div className={cn("relative overflow-hidden border shadow-sm rounded-lg h-full", s.bg, s.border)}>
                              <div className={cn("absolute -top-6 -right-6 w-28 h-28 rounded-full blur-2xl opacity-40", s.blob)} />
                              <div className="p-4 relative z-10 flex items-start justify-between gap-2">
                                 <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 mb-2">
                                       <Sparkles className={cn("w-3 h-3 opacity-60", s.lbl)} />
                                       <p className={cn("text-[14px] font-black uppercase tracking-[0.15em] truncate opacity-70", s.lbl)}>
                                          {s.label}
                                       </p>
                                    </div>
                                    <p className={cn("text-[22px] font-black leading-tight truncate", s.text)}>{s.value}</p>
                                 </div>
                                 <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", s.ibg)}>
                                    <s.icon className={cn("w-5 h-5", s.lbl)} />
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                     ))}
                  </div>

                  {/* ════════ Row 1: Branding + Exchange rate ════════ */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">

                     {/* Branding */}
                     <Section delay={0.22} className="h-full flex flex-col">
                        <SectionHeader
                           icon={Building2}
                           title={isKh ? "ស្លាកសញ្ញា" : "Branding"}
                           subtitle={isKh ? "កំណត់អត្តសញ្ញាណប្រព័ន្ធ" : "Customize your system identity"}
                        />
                        <div className="p-6 space-y-6 flex-1">
                           <div className="flex items-center gap-5">
                              <div
                                 className={cn(
                                    "relative group w-20 h-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center cursor-pointer transition-all duration-200 shrink-0",
                                    isDragging
                                       ? "border-[#03624C] dark:border-[#1857D8] bg-[#03624C]/5 dark:bg-[#1857D8]/10 scale-105"
                                       : "border-dashed border-gray-200 dark:border-white/[0.10] bg-gray-50 dark:bg-white/[0.04] hover:border-[#03624C]/50 dark:hover:border-[#1857D8]/50 hover:bg-[#03624C]/5 dark:hover:bg-[#1857D8]/5"
                                 )}
                                 onClick={() => fileInputRef.current?.click()}
                                 onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                 onDragLeave={() => setIsDragging(false)}
                                 onDrop={(e) => {
                                    e.preventDefault(); setIsDragging(false)
                                    const file = e.dataTransfer.files?.[0]
                                    if (file) handleFileRead(file)
                                 }} >
                                 {tempLogo
                                    ? <img src={tempLogo} alt="Logo" className="w-full h-full object-cover" />
                                    : <span className="text-3xl font-extrabold text-gray-200 dark:text-white/10 uppercase select-none">
                                       {tempName?.charAt(0) || "A"}
                                    </span>
                                 }
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                                    <Camera className="w-5 h-5 text-white" />
                                 </div>
                              </div>
                              <div className="flex flex-col gap-2 min-w-0">
                                 <p className="text-[14px] font-bold text-gray-700 dark:text-white/70">
                                    {isKh ? "រូបតំណាងប្រព័ន្ធ" : "System Logo"}
                                 </p>
                                 <p className="text-[12px] text-gray-600 dark:text-white/30 leading-relaxed">
                                    {isKh ? "PNG, JPG រហូតដល់ 2MB។ ណែនាំ 256×256px" : "PNG, JPG up to 2MB. Recommended 256×256px."}
                                 </p>
                                 {logoError && (
                                    <p className="text-[14px] text-rose-500 dark:text-rose-400 font-medium">{logoError}</p>
                                 )}
                                 <div className="flex gap-2 mt-1">
                                    <button
                                       onClick={() => fileInputRef.current?.click()}
                                       className={cn(
                                          "inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-all",
                                          "text-[#03624C] dark:text-[#6b9fff]",
                                          "bg-[#03624C]/5 dark:bg-[#1857D8]/10",
                                          "hover:bg-[#03624C]/10 dark:hover:bg-[#1857D8]/20",
                                          "border-[#03624C]/20 dark:border-[#1857D8]/30",
                                       )} >
                                       <Upload className="w-3 h-3" /> {isKh ? "ផ្ទុកឡើង" : "Upload"}
                                    </button>
                                    {tempLogo && (
                                       <button
                                          onClick={handleRemoveLogo}
                                          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition px-3 py-1.5 rounded-lg border " >
                                          <Trash2 className="w-3 h-3" /> {isKh ? "លុប" : "Remove"}
                                       </button>
                                    )}
                                 </div>
                                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*"
                                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileRead(file) }} />
                              </div>
                           </div>
                           <div className="border-t border-gray-100 dark:border-white/[0.06]" />
                           <div className="flex items-center justify-between gap-4">
                              <div className="space-y-0.5 min-w-0">
                                 <Label className="text-[14px] font-black uppercase tracking-wider text-gray-600 dark:text-white/30">
                                    {isKh ? "ឈ្មោះប្រព័ន្ធ" : "System Name"}
                                 </Label>
                                 <p className="text-[12px] text-gray-600 dark:text-white/30">
                                    {isKh ? "ឈ្មោះបង្ហាញនៅទូទាំងប្រព័ន្ធ" : "The name displayed across the platform"}
                                 </p>
                              </div>
                              <input
                                 className={cn(INPUT, "w-44 shrink-0")}
                                 value={tempName}
                                 onChange={(e) => setTempName(e.target.value)}
                                 placeholder={isKh ? "ឧ. ប្រព័ន្ធរបស់ខ្ញុំ" : "e.g. My System"}
                              />
                           </div>
                           <div className="flex items-center justify-between gap-4">
                              <div className="space-y-0.5 min-w-0">
                                 <div className="flex items-center gap-1.5">
                                    <Globe className={cn("w-3.5 h-3.5", ACCENT.text)} />
                                    <Label className="text-[14px] font-black uppercase tracking-wider text-gray-600 dark:text-white/30">
                                       {isKh ? "ភាសា" : "Language"}
                                    </Label>
                                 </div>
                                 <p className="text-[12px] text-gray-600 dark:text-white/30 pl-5">
                                    {isKh ? "ភាសាបង្ហាញចំណុចប្រទាក់" : "Interface display language"}
                                 </p>
                              </div>
                              <Select value={tempLanguage} onValueChange={(val) => setTempLanguage(val)}>
                                 <SelectTrigger className="w-44 shrink-0 h-9 text-[14px] font-medium rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.05] text-gray-700 dark:text-white/70 shadow-sm">
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent style={SORA} className={SEL_C}>
                                    <SelectItem value="en" className={SEL_I}>🇺🇸 English</SelectItem>
                                    <SelectItem value="kh" className={SEL_I}>🇰🇭 ភាសាខ្មែរ</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 dark:bg-[#1e2235] border-t border-gray-100 dark:border-white/[0.07] flex items-center justify-between gap-3 rounded-b-2xl">
                           <div className="flex items-center gap-3 min-w-0">
                              <button
                                 onClick={() => {
                                    setTempName(systemName ?? "")
                                    setTempLogo(systemLogo)
                                    setTempLanguage(i18n.language)
                                    setLogoError("")
                                    setSaveError("")
                                 }}
                                 className="text-[14px] font-semibold text-gray-600 dark:text-white/30 hover:text-gray-800 dark:hover:text-white/60 transition" >
                                 {isKh ? "កំណត់ឡើងវិញ" : "Reset changes"}
                              </button>
                              {saveError && (
                                 <p className="text-[14px] text-rose-500 dark:text-rose-400 font-medium truncate">{saveError}</p>
                              )}
                           </div>
                           <button
                              onClick={handleSave}
                              disabled={isSaving || saveSuccess}
                              className={cn(
                                 "h-9 px-6 rounded-lg text-[14px] font-bold flex items-center gap-2 transition-all disabled:opacity-60 active:scale-[0.97] text-white shrink-0",
                                 saveSuccess
                                    ? "bg-emerald-500 shadow-sm shadow-emerald-500/20"
                                    : "bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90"
                              )} >
                              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              {saveSuccess && <CheckCircle className="w-3.5 h-3.5" />}
                              {saveSuccess
                                 ? (isKh ? "រក្សាទុករួច!" : "Saved!")
                                 : isSaving
                                    ? (isKh ? "កំពុងរក្សា..." : "Saving...")
                                    : t("save")
                              }
                           </button>
                        </div>
                     </Section>

                     {/* Exchange rate */}
                     <div className="flex flex-col h-full [&>*]:flex-1 [&>*]:flex [&>*]:flex-col [&>*>:nth-child(2)]:flex-1">
                        <ExchangeRateSection isKh={isKh} delay={0.29} />
                     </div>
                  </div>

                  {/* ════════ Row 2: Security + Printer ════════ */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                     {/* Security */}
                     <Section delay={0.5} className="h-full flex flex-col">
                        <SectionHeader
                           icon={ShieldCheck}
                           title={isKh ? "សុវត្ថិភាព" : "Security"}
                           subtitle={isKh ? "ការពារគណនីរបស់អ្នក" : "Keep your account protected"}
                        />
                        <div className="p-4 flex-1 flex flex-col gap-5">
                           <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 min-w-0">
                                 <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                    "bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20",
                                 )}>
                                    <Lock className="w-4 h-4 text-orange-500" />
                                 </div>
                                 <div className="space-y-0.5 min-w-0">
                                    <p className="text-[16px] font-bold text-gray-800 dark:text-white/90">{t("changePassword")}</p>
                                    <p className="text-[14px] text-gray-600 dark:text-white/30">
                                       {isKh ? "ផ្លាស់ប្ដូរពាក្យសម្ងាត់ជាទៀងទាត់" : "Update your password regularly"}
                                    </p>
                                 </div>
                              </div>
                              <button
                                 onClick={() => setShowChangePassword(true)}
                                 className={cn(
                                    "h-9 px-5 rounded-lg text-[14px] font-bold transition-all active:scale-[0.97] shrink-0",
                                    "border border-gray-200 dark:border-white/[0.10]",
                                    "text-gray-600 dark:text-white/50",
                                    "hover:bg-gray-100 dark:hover:bg-white/[0.06]",
                                    "bg-white dark:bg-transparent shadow-sm dark:shadow-none",
                                 )} >
                                 {t("edit")}
                              </button>
                           </div>

                           <div className="border-t border-gray-100 dark:border-white/[0.06]" />

                           <div className="space-y-3">
                              <p className="text-[14px] font-bold text-gray-700 dark:text-white/70">
                                 {isKh ? "គន្លឹះសុវត្ថិភាព" : "Security tips"}
                              </p>
                              <ul className="space-y-2.5">
                                 {[
                                    isKh
                                       ? "ប្រើពាក្យសម្ងាត់យ៉ាងតិច 8 តួអក្សរ ដោយលាយអក្សរ លេខ និងនិមិត្តសញ្ញា"
                                       : "Use at least 8 characters, mixing letters, numbers and symbols.",
                                    isKh
                                       ? "កុំប្រើពាក្យសម្ងាត់ដដែលនឹងគណនីផ្សេងៗ"
                                       : "Don't reuse a password you use on other accounts.",
                                    isKh
                                       ? "កុំចែករំលែកពាក្យសម្ងាត់ ឬលេខ PIN របស់អ្នកជាមួយអ្នកដទៃ"
                                       : "Never share your password or POS PIN with anyone.",
                                    isKh
                                       ? "ចាកចេញពីគណនីជានិច្ច នៅពេលប្រើឧបករណ៍រួមគ្នា"
                                       : "Log out whenever you use a shared device.",
                                    isKh
                                       ? "ប្តូរពាក្យសម្ងាត់ភ្លាមៗ បើសង្ស័យថាមានអ្នកដទៃដឹង"
                                       : "Change your password right away if you suspect it's been exposed.",
                                 ].map((tip) => (
                                    <li key={tip} className="flex items-start gap-2.5">
                                       <CheckCircle className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", ACCENT.text)} />
                                       <span className="text-[13px] leading-relaxed text-gray-600 dark:text-white/40">{tip}</span>
                                    </li>
                                 ))}
                              </ul>
                           </div>
                        </div>
                     </Section>
                     <PrinterSection isKh={isKh} delay={0.5} />
                  </div>

                  {/* Appearance */}
                  <Section delay={0.43} className="h-full flex flex-col">
                     <SectionHeader
                        icon={Palette}
                        title={isKh ? "រូបរាង" : "Appearance"}
                        subtitle={isKh ? "ប្ដូររវាងរបៀបភ្លឺ និងងងឹត" : "Switch between light and dark modes"}
                     />
                     <div className="p-2 grid gap-3 flex-1">
                        {[
                           { id: "light", label: isKh ? "ភ្លឺ" : "Light", icon: Sun, preview: "bg-white border-gray-200" },
                           { id: "dark", label: isKh ? "ងងឹត" : "Dark", icon: Moon, preview: "bg-[#13151f] border-white/10" },
                           { id: "system", label: isKh ? "ប្រព័ន្ធ" : "System", icon: Monitor, preview: "bg-gradient-to-r from-white to-[#13151f] border-gray-200" },
                        ].map((item) => {
                           const isActive = mounted && theme === item.id
                           return (
                              <button
                                 key={item.id}
                                 onClick={() => setTheme(item.id)}
                                 className={cn(
                                    "relative flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all duration-200",
                                    isActive
                                       ? "border-[#03624C] dark:border-[#1857D8] bg-[#03624C]/5 dark:bg-[#1857D8]/10 shadow-md shadow-[#03624C]/10 dark:shadow-[#1857D8]/10"
                                       : "border-gray-100 dark:border-white/[0.06] hover:border-gray-200 dark:hover:border-white/[0.12]"
                                 )} >
                                 <div className={cn(
                                    "w-full h-10 rounded-xl flex items-center justify-center border transition-all",
                                    item.preview,
                                 )}>
                                    <item.icon className={cn(
                                       "w-5 h-5 transition-colors",
                                       isActive
                                          ? "text-[#03624C] dark:text-[#6b9fff]"
                                          : "text-gray-300 dark:text-white/20",
                                    )} />
                                 </div>
                                 <span className={cn(
                                    "text-[14px] font-bold uppercase tracking-wider",
                                    isActive
                                       ? "text-[#03624C] dark:text-[#6b9fff]"
                                       : "text-gray-600 dark:text-white/30",
                                 )}>
                                    {item.label}
                                 </span>
                              </button>
                           )
                        })}
                     </div>
                  </Section>
               </div>
            </main>
         </div>
         <ChangePasswordDialog open={showChangePassword} onOpenChange={setShowChangePassword} />
      </div>
   )
}