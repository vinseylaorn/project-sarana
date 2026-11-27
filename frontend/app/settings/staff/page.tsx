"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { useTranslation } from "react-i18next"
import {
   Dialog, DialogContent, DialogHeader, DialogTitle,
   DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
   Search, Plus, Eye, Edit2, Trash2, Loader2,
   RotateCcw, AlertTriangle, Phone, DollarSign, Camera,
   ImagePlus, Users, Filter, UserCheck, UserMinus, Check,
   Mail, CalendarDays, Sparkles, KeyRound, EyeOff,
   ShieldCheck, ShieldAlert, MonitorPlay, Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Cropper from "react-easy-crop"
import type { Staff } from "@/types"
import { usePermission } from "@/lib/role-context"
import { toastSuccess, toastError, toastWarn } from "@/lib/toast"
import { DatePicker } from "@/components/ui/DatePicker"
import { useStaffList, useStaffMutations } from "@/hooks/settings/use-staff"

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }

const ACCENT = {
   text: "text-[#03624C] dark:text-[#6b9fff]",
   bg: "bg-[#03624C] dark:bg-[#1857D8]",
   border: "border-[#03624C]/30 dark:border-[#1857D8]/30",
   light: "bg-[#03624C]/10 dark:bg-[#1857D8]/10",
}

const INPUT_BASE =
   "w-full h-9 px-3 text-[14px] rounded-lg outline-none transition-all " +
   "bg-white dark:bg-[#22263a] border border-gray-200/80 dark:border-white/[0.08] " +
   "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/20 " +
   "focus:border-[#03624C] dark:focus:border-[#1857D8] focus:ring-2 focus:ring-[#03624C]/10 " +
   "dark:focus:ring-[#1857D8]/10 shadow-sm dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"

const SEL_C = "bg-white dark:bg-[#22263a] border-gray-100 dark:border-white/[0.12] rounded-lg"
const SEL_I = "text-[14px] text-gray-800 dark:text-white focus:bg-[#03624C]/10 dark:focus:bg-[#1857D8]/10 dark:focus:text-[#6b9fff]"
const INPUT_ERR = "border-rose-400 dark:border-rose-500/50 focus:border-rose-400 dark:focus:border-rose-500/50"

const KH_PHONE_RE = /^0[1-9]\d{7,8}$/

const formatPhone = (raw: string): string => {
   const digits = raw.replace(/\D/g, "").slice(0, 10)
   if (digits.length <= 3) return digits
   if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
   if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
   return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
}

const isValidKhPhone = (formatted: string): boolean =>
   KH_PHONE_RE.test(formatted.replace(/\s/g, ""))

const getCroppedImg = (imageSrc: string, pixelCrop: any): Promise<string> => {
   const image = new Image()
   image.src = imageSrc
   return new Promise((resolve) => {
      image.onload = () => {
         const canvas = document.createElement("canvas")
         canvas.width = pixelCrop.width
         canvas.height = pixelCrop.height
         const ctx = canvas.getContext("2d")
         if (ctx) ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
         resolve(canvas.toDataURL("image/jpeg"))
      }
   })
}

const ErrMsg = ({ msg }: { msg: string }) => (
   <p className="flex items-center gap-1 text-[14px] text-rose-500 dark:text-rose-400 mt-1 font-medium">
      <AlertTriangle className="w-3 h-3 shrink-0" />{msg}
   </p>
)

const AV_COLORS = [
   "bg-[#E1F5EE] text-[#085041] dark:bg-[#085041] dark:text-[#9FE1CB]",
   "bg-[#c8eadd] text-[#04342C] dark:bg-[#04342C] dark:text-[#5DCAA5]",
   "bg-[#d4efe4] text-[#0F6E56] dark:bg-[#0F6E56] dark:text-[#E1F5EE]",
   "bg-[#b8e4d4] text-[#04342C] dark:bg-[#085041] dark:text-[#9FE1CB]",
]
const getAvatarColor = (name: string) => AV_COLORS[name.charCodeAt(0) % AV_COLORS.length]

type CanFn = ReturnType<typeof usePermission>["can"]

function StaffCard({
   item, isKh, can, onView, onEdit, onDelete,
}: {
   item: Staff
   isKh: boolean
   can: CanFn
   onView: () => void
   onEdit: () => void
   onDelete: () => void
}) {
   return (
      <motion.div
         initial={{ opacity: 0, y: 12 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, scale: 0.95 }}
         whileHover={{ y: -3, transition: { duration: 0.16 } }}
         layout >
         <div
            className={cn(
               "bg-white dark:bg-[#1a1d2e] border border-gray-100 dark:border-white/[0.07] rounded-2xl overflow-hidden flex flex-col transition-all",
               "hover:border-[#03624C]/30 dark:hover:border-[#1857D8]/30",
               item.status !== "Active" && "opacity-60",
            )} >
            <div className="relative flex items-center justify-center bg-[#03624C]/10 dark:bg-[#03624C]/30 h-[160px] overflow-hidden">
               {item.image ? (
                  <img
                     src={item.image}
                     className="w-full h-full object-cover object-top absolute inset-0"
                     referrerPolicy="no-referrer"
                     onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
               ) : (
                  <span className="text-[52px] font-black text-[#03624C] dark:text-[#9FE1CB] tracking-tight select-none">
                     {item.name.slice(0, 2).toUpperCase()}
                  </span>
               )}
               <div
                  className={cn(
                     "absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                     item.can_use_pos && item.has_pin
                        ? "bg-[#03624C]/20 dark:bg-[#1857D8]/30 border-[#03624C]/30 dark:border-[#1857D8]/40 text-[#03624C] dark:text-[#1857D8]"
                        : item.can_use_pos && !item.has_pin
                           ? "bg-amber-500/10 border-amber-400/30 text-amber-600 dark:text-amber-400"
                           : "bg-white/30 dark:bg-white/[0.06] border-white/20 dark:border-white/10 text-gray-500 dark:text-white/30",
                  )} >
                  {item.can_use_pos && item.has_pin ? (
                     <><ShieldCheck className="w-2.5 h-2.5" /> POS</>
                  ) : item.can_use_pos && !item.has_pin ? (
                     <><ShieldAlert className="w-2.5 h-2.5" /> {isKh ? "គ្មាន PIN" : "No PIN"}</>
                  ) : (
                     <><MonitorPlay className="w-2.5 h-2.5" /> {isKh ? "ពុំប្រើ" : "No POS"}</>
                  )}
               </div>
            </div>
            <div className="flex flex-col gap-2.5 p-3">

               <p className="text-[14px] font-bold text-gray-800 dark:text-white text-center leading-tight">
                  {item.name}
               </p>
               <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span className={cn(
                     "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                     item.status === "Active"
                        ? "bg-[#E1F5EE] text-[#085041] dark:bg-[#03624C]/20 dark:text-[#9FE1CB]"
                        : "bg-gray-100 text-gray-400 dark:bg-white/[0.06] dark:text-white/25",
                  )}>
                     <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        item.status === "Active"
                           ? "bg-[#03624C] dark:bg-[#9FE1CB] animate-pulse"
                           : "bg-gray-300 dark:bg-white/20",
                     )} />
                     {isKh
                        ? (item.status === "Active" ? "កំពុងធ្វើការ" : "ឈប់ហើយ")
                        : item.status}
                  </span>
                  <span className={cn(
                     "px-2 py-0.5 rounded-full text-[10px] font-bold",
                     item.gender === "Male"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                        : "bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400",
                  )}>
                     {item.gender === "Male" ? "♂" : "♀"}{" "}
                     {isKh ? (item.gender === "Male" ? "ប្រុស" : "ស្រី") : item.gender}
                  </span>
               </div>
               <div className="bg-gray-50 dark:bg-[#22263a] rounded-xl overflow-hidden border border-gray-100 dark:border-white/[0.05]">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-white/[0.05]">
                     <span className="text-[12px] text-gray-600 dark:text-white/30 flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3" />
                        {isKh ? "តួនាទី" : "Position"}
                     </span>
                     <span className="text-[12px] font-semibold text-gray-700 dark:text-white/70 truncate max-w-[90px] text-right">
                        {item.position || "—"}
                     </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-white/[0.05]">
                     <span className="text-[12px] text-gray-600 dark:text-white/30 flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3" />
                        {isKh ? "ប្រាក់ខែ" : "Salary"}
                     </span>
                     <span className="text-[12px] font-bold text-[#03624C] dark:text-[#6b9fff] font-mono">
                        ${Number(item.salary || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                     </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                     <span className="text-[12px] text-gray-600 dark:text-white/30 flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        {isKh ? "ទូរស័ព្ទ" : "Phone"}
                     </span>
                     <span className="text-[12px] font-mono text-gray-600 dark:text-white/60">
                        {formatPhone(item.phone || "") || "—"}
                     </span>
                  </div>
               </div>
               <div className="flex gap-1.5">
                  {can("delete") && (
                     <button
                        onClick={onDelete}
                        className="w-9 h-8 flex items-center justify-center rounded-lg border border-rose-400/50 dark:border-rose-500/40 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all shrink-0"
                        aria-label="Delete"
                     >
                        <Trash2 className="w-3.5 h-3.5" />
                     </button>
                  )}
                  <button
                     onClick={onView}
                     className="flex-1 h-8 rounded-lg text-[12px] font-bold border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all flex items-center justify-center gap-1"
                  >
                     <Eye className="w-3 h-3" /> {isKh ? "មើល" : "View"}
                  </button>
                  {can("edit") && (
                     <button
                        onClick={onEdit}
                        className="flex-1 h-8 rounded-lg text-[12px] font-bold bg-[#03624C] dark:bg-[#1857D8] text-white hover:opacity-90 transition-all flex items-center justify-center gap-1"
                     >
                        <Edit2 className="w-3 h-3" /> {isKh ? "កែ" : "Edit"}
                     </button>
                  )}
               </div>
            </div>
         </div>
      </motion.div>
   )
}

function PosToggle({
   checked,
   onChange,
   disabled,
   isKh,
}: {
   checked: boolean
   onChange: (v: boolean) => void
   disabled?: boolean
   isKh: boolean
}) {
   return (
      <button
         type="button"
         disabled={disabled}
         onClick={() => !disabled && onChange(!checked)}
         className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left",
            checked
               ? "border-[#03624C] dark:border-[#1857D8] bg-[#03624C]/5 dark:bg-[#1857D8]/10"
               : "border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#22263a]",
            disabled && "cursor-default opacity-80",
         )} >
         <div className={cn(
            "w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all shrink-0",
            checked
               ? "bg-[#03624C] dark:bg-[#1857D8] border-[#03624C] dark:border-[#1857D8]"
               : "border-gray-300 dark:border-white/20 bg-white dark:bg-transparent",
         )}>
            {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
         </div>

         <div className="flex-1 min-w-0">
            <p className={cn(
               "text-[14px] leading-tight",
               checked ? "text-[#03624C] dark:text-[#6b9fff]" : "text-gray-600 dark:text-white/50",
            )}>
               {isKh ? "អនុញ្ញាតឲប្រើ POS" : "Allow POS Access"}
            </p>
            <p className="text-[12px] text-gray-600 dark:text-white/25 mt-0.5">
               {isKh
                  ? "Staff នេះអាចចូលប្រើប្រាស់ POS System បាន"
                  : "This staff can log in to the POS system"
               }
            </p>
         </div>

         <div className={cn(
            "shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold",
            checked
               ? "bg-[#03624C]/10 dark:bg-[#1857D8]/20 text-[#03624C] dark:text-[#6b9fff]"
               : "bg-gray-100 dark:bg-white/[0.05] text-gray-400 dark:text-white/25",
         )}>
            {checked ? (isKh ? "បើក" : "ON") : (isKh ? "បិទ" : "OFF")}
         </div>
      </button>
   )
}

export default function StaffPage() {
   const { t, i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"
   const { can } = usePermission("staff")
   const fileRef = useRef<HTMLInputElement>(null)
   const originalSnapshot = useRef<string>("")

   const { data: staff = [], isLoading: loading, isFetching } = useStaffList()
   const { create, update, remove } = useStaffMutations()
   const saving = create.isPending || update.isPending
   const deleting = remove.isPending

   const [search, setSearch] = useState("")
   const [isDialogOpen, setIsDialogOpen] = useState(false)
   const [isViewMode, setIsViewMode] = useState(false)
   const [currentStaff, setCurrentStaff] = useState<any>(null)
   const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
   const [itemToDelete, setItemToDelete] = useState<any>(null)
   const [errors, setErrors] = useState<Record<string, string>>({})
   const [currentPage, setCurrentPage] = useState(1)
   const [imageToCrop, setImageToCrop] = useState<string | null>(null)
   const [crop, setCrop] = useState({ x: 0, y: 0 })
   const [zoom, setZoom] = useState(1)
   const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
   const [genderFilter, setGenderFilter] = useState<"All" | "Male" | "Female">("All")
   const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All")
   const [showPin, setShowPin] = useState(false)
   const itemsPerPage = 12

   useEffect(() => { setCurrentPage(1) }, [search, genderFilter, statusFilter])

   const handleOpenAdd = () => {
      setIsViewMode(false)
      setShowPin(false)
      setCurrentStaff({
         name: "", gender: "Male", phone: "", email: "",
         position: "", status: "Active", salary: "", date: "", image: "",
         user_id: null, user_name: null, user_email: null,
         can_use_pos: false, pin_code: "",
      })
      setErrors({})
      originalSnapshot.current = ""
      setIsDialogOpen(true)
   }

   const handleOpenEdit = (item: any) => {
      setIsViewMode(false)
      setShowPin(false)
      setCurrentStaff({ ...item, phone: formatPhone(item.phone || ""), pin_code: "" })
      setErrors({})
      originalSnapshot.current = JSON.stringify({
         name: item.name, gender: item.gender, phone: item.phone, email: item.email,
         position: item.position, salary: item.salary, status: item.status,
         image: item.image, date: item.date, user_id: item.user_id,
         can_use_pos: item.can_use_pos,
      })
      setIsDialogOpen(true)
   }

   const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhone(e.target.value)
      setCurrentStaff((prev: any) => ({ ...prev, phone: formatted }))
      setErrors((prev) => ({ ...prev, phone: "" }))
   }

   const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels)
   }, [])

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
         const reader = new FileReader()
         reader.onload = () => setImageToCrop(reader.result as string)
         reader.readAsDataURL(file)
      }
      e.target.value = ""
   }

   const handleApplyCrop = async () => {
      if (imageToCrop && croppedAreaPixels) {
         const cropped = await getCroppedImg(imageToCrop, croppedAreaPixels)
         setCurrentStaff((prev: any) => ({ ...prev, image: cropped }))
         setImageToCrop(null)
      }
   }

   const handleSave = async () => {
      const newErrors: Record<string, string> = {}

      if (!currentStaff?.name?.trim())
         newErrors.name = isKh ? "សូមបញ្ចូលឈ្មោះ" : "Name is required"

      if (!currentStaff?.phone?.trim())
         newErrors.phone = isKh ? "សូមបញ្ចូលលេខទូរស័ព្ទ" : "Phone is required"
      else if (!isValidKhPhone(currentStaff.phone))
         newErrors.phone = isKh
            ? "លេខទូរស័ព្ទកម្ពុជាមិនត្រឹមត្រូវ (ឧ: 012 345 678)"
            : "Invalid Cambodian phone (e.g. 012 345 678)"

      if (currentStaff?.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(currentStaff.email))
         newErrors.email = isKh ? "អ៊ីមែលមិនត្រឹមត្រូវ" : "Invalid email format"

      if (currentStaff?.can_use_pos) {
         if (currentStaff?.pin_code && !/^\d{6}$/.test(currentStaff.pin_code))
            newErrors.pin_code = isKh ? "PIN ត្រូវជា 6 ខ្ទង់លេខ" : "PIN must be exactly 6 digits"
         if (!currentStaff?.id && !currentStaff?.pin_code?.trim())
            newErrors.pin_code = isKh ? "សូមបញ្ចូល PIN Code (6 ខ្ទង់)" : "PIN Code is required for new POS staff"
         if (currentStaff?.id && !currentStaff?.has_pin && !currentStaff?.pin_code?.trim())
            newErrors.pin_code = isKh ? "សូមបញ្ចូល PIN Code (6 ខ្ទង់)" : "PIN Code is required to enable POS"
      }

      if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

      if (currentStaff.id) {
         const phoneRaw = currentStaff.phone.replace(/\s/g, "")
         const snap = JSON.stringify({
            name: currentStaff.name, gender: currentStaff.gender, phone: phoneRaw,
            email: currentStaff.email, position: currentStaff.position, salary: currentStaff.salary,
            status: currentStaff.status, image: currentStaff.image, date: currentStaff.date,
            user_id: currentStaff.user_id, can_use_pos: currentStaff.can_use_pos,
         })
         if (snap === originalSnapshot.current && !currentStaff.pin_code) {
            toastWarn(
               isKh ? "មិនមានការផ្លាស់ប្តូរ" : "No changes detected",
               isKh ? "សូមកែប្រែមុនរក្សាទុក" : "Please make changes before saving",
            )
            return
         }
      }

      const phoneRaw = currentStaff.phone.replace(/\s/g, "")
      const payload: any = {
         name: currentStaff.name,
         gender: currentStaff.gender,
         phone: phoneRaw,
         email: currentStaff.email || null,
         position: currentStaff.position || null,
         salary: currentStaff.salary || "0",
         status: currentStaff.status,
         image: currentStaff.image || null,
         date: currentStaff.date || null,
         user_id: currentStaff.user_id || null,
         can_use_pos: currentStaff.can_use_pos ?? false,
      }
      if (currentStaff.pin_code?.trim()) payload.pin_code = currentStaff.pin_code.trim()

      try {
         if (currentStaff.id) {
            const updated = await update.mutateAsync({ id: currentStaff.id, payload })
            toastSuccess(
               isKh ? "កែប្រែបានជោគជ័យ" : "Updated successfully",
               isKh ? `បុគ្គលិក "${updated.name}" បានកែប្រែ` : `Staff "${updated.name}" updated`,
            )
         } else {
            const created = await create.mutateAsync(payload)
            toastSuccess(
               isKh ? "បន្ថែមបានជោគជ័យ" : "Added successfully",
               isKh ? `បុគ្គលិក "${created.name}" បានបន្ថែម` : `Staff "${created.name}" added`,
            )
         }
         setIsDialogOpen(false)
      } catch (err: any) {
         toastError(isKh ? "រក្សាទុកមិនបាន" : "Save failed", err?.message)
      }
   }

   const confirmDelete = async () => {
      if (!itemToDelete) return
      try {
         await remove.mutateAsync(itemToDelete.id)
         toastSuccess(
            isKh ? "លុបបានជោគជ័យ" : "Deleted successfully",
            isKh ? `បុគ្គលិក "${itemToDelete.name}" បានលុប` : `Staff "${itemToDelete.name}" deleted`,
         )
      } catch (err: any) {
         toastError(isKh ? "លុបមិនបាន" : "Delete failed", err?.message)
      } finally {
         setIsDeleteAlertOpen(false)
         setItemToDelete(null)
      }
   }

   const processedData = useMemo(() =>
      staff.filter((s: Staff) => {
         const q = search.toLowerCase()
         const phoneNorm = (s.phone || "").replace(/\s/g, "")
         const matchSearch =
            s.name.toLowerCase().includes(q) ||
            phoneNorm.includes(q.replace(/\s/g, "")) ||
            (s.email || "").toLowerCase().includes(q) ||
            (s.user_name || "").toLowerCase().includes(q) ||
            (s.position || "").toLowerCase().includes(q)
         const matchGender = genderFilter === "All" || s.gender === genderFilter
         const matchStatus = statusFilter === "All" || s.status === statusFilter
         return matchSearch && matchGender && matchStatus
      }),
      [staff, search, genderFilter, statusFilter],
   )

   const hasFilter = search || genderFilter !== "All" || statusFilter !== "All"
   const pagedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
   const totalPages = Math.ceil(processedData.length / itemsPerPage) || 1

   const showInitialLoading = loading && staff.length === 0

   const statCards = [
      {
         label: isKh ? "បុគ្គលិកសរុប" : "Total Staff",
         value: staff.length,
         icon: Users,
         textColor: "!text-[#03624C] dark:!text-[#6b9fff]",
         bgColor: "bg-white dark:bg-[#22263a]",
         borderColor: "border-white dark:border-[#22263a]",
         iconBg: "bg-[#03624C]/10 dark:bg-[#1857D8]/20",
         lbl: "text-gray-600 dark:text-gray-200",
      },
      {
         label: isKh ? "កំពុងធ្វើការ" : "Active",
         value: staff.filter((s: Staff) => s.status === "Active").length,
         icon: UserCheck,
         textColor: "!text-emerald-700 dark:!text-emerald-300",
         bgColor: "bg-white dark:bg-[#22263a]",
         borderColor: "border-white dark:border-[#22263a]",
         iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
         lbl: "text-gray-600 dark:text-gray-200",
      },
      {
         label: isKh ? "ឈប់ហើយ" : "Inactive",
         value: staff.filter((s: Staff) => s.status === "Inactive").length,
         icon: UserMinus,
         textColor: "!text-rose-700 dark:!text-rose-300",
         bgColor: "bg-white dark:bg-[#22263a]",
         borderColor: "border-white dark:border-[#22263a]",
         iconBg: "bg-rose-100 dark:bg-rose-500/20",
         lbl: "text-gray-600 dark:text-gray-200",
      },
      {
         label: isKh ? "ប្រើ POS" : "POS Access",
         value: staff.filter((s: Staff) => s.can_use_pos && s.has_pin).length,
         icon: MonitorPlay,
         textColor: "!text-violet-700 dark:!text-violet-300",
         bgColor: "bg-white dark:bg-[#22263a]",
         borderColor: "border-white dark:border-[#22263a]",
         iconBg: "bg-violet-100 dark:bg-violet-500/20",
         lbl: "text-gray-600 dark:text-gray-200",
      },
   ]
   return (
      <div className="flex h-screen bg-gray-50 dark:bg-[#13151f] overflow-hidden transition-colors duration-300" style={SORA}>
         <AnimatePresence>
            {isFetching && !loading && (
               <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed top-0 left-0 right-0 h-[2px] bg-[#03624C] dark:bg-[#1857D8] origin-left z-[100]"
               />
            )}
         </AnimatePresence>
         <Sidebar />
         <div className="flex-1 flex flex-col overflow-hidden">
            <Header
               title={isKh ? "គ្រប់គ្រងបុគ្គលិក" : "Staff Directory"}
               subtitle={isKh ? "បញ្ជីឈ្មោះ និងព័ត៌មានបុគ្គលិកទាំងអស់" : "Manage employee profiles and POS access"}
            />
            {showInitialLoading ? (
               <div className="flex-1 flex items-center justify-center flex-col gap-4">
                  <Loader2 className={cn("w-5 h-5 animate-spin", ACCENT.text)} />
                  <span className={cn("text-[14px] font-bold uppercase tracking-[0.2em] animate-pulse", ACCENT.text)}>
                     {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
                  </span>
               </div>
            ) : (
               <main className="flex-1 p-5 space-y-4 overflow-y-auto">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                     {statCards.map((s, i) => (
                        <motion.div key={s.label}
                           initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                           transition={{ duration: 0.35, delay: i * 0.07, ease: "easeOut" }}
                           whileHover={{ y: -3, transition: { duration: 0.18 } }}>
                           <div className={cn("border rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40", s.bgColor, s.borderColor)}>
                              <div className="p-2">
                                 <div className="flex items-center justify-between gap-3 mb-4">
                                    <p className={cn("flex items-center gap-1.5 min-w-0 text-[14px] font-bold uppercase", s.lbl)}>
                                       <span className="truncate">{s.label}</span>
                                    </p>
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", s.iconBg)}>
                                       <s.icon className={cn("w-4 h-4", s.textColor)} />
                                    </div>
                                 </div>
                                 <p className={cn("text-[22px] font-bold text-center leading-none tabular-nums mb-2.5", s.textColor)}>
                                    {s.value}
                                 </p>
                                 <div className="flex items-center gap-1.5">
                                    <p className={cn("text-[14px]", s.lbl)}>{isKh ? "នាក់" : "people"}</p>
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                     ))}
                  </div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.22 }}
                     className="flex items-center justify-between gap-3 flex-wrap" >
                     <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 dark:text-white/25 pointer-events-none" />
                           <input
                              className={cn(INPUT_BASE, "w-56 pl-8")}
                              placeholder={isKh ? "ស្វែងរក..." : "Search staff..."}
                              value={search}
                              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                           />
                        </div>
                        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07]" />
                        <Select value={genderFilter} onValueChange={v => { setGenderFilter(v as any); setCurrentPage(1) }}>
                           <SelectTrigger className="w-36 h-9 text-[14px] rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] text-gray-700 dark:text-white/70 shadow-sm flex items-center gap-1.5">
                              <Filter className={cn("w-3.5 h-3.5 shrink-0", ACCENT.text)} />
                              <SelectValue placeholder={isKh ? "ភេទ" : "Gender"} />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="All" className={SEL_I}>{isKh ? "ភេទទាំងអស់" : "All Gender"}</SelectItem>
                              <SelectItem value="Male" className={SEL_I}>{isKh ? "ប្រុស" : "Male"}</SelectItem>
                              <SelectItem value="Female" className={SEL_I}>{isKh ? "ស្រី" : "Female"}</SelectItem>
                           </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v as any); setCurrentPage(1) }}>
                           <SelectTrigger className="w-36 h-9 text-[14px] rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] text-gray-700 dark:text-white/70 shadow-sm flex items-center gap-1.5">
                              <Filter className={cn("w-3.5 h-3.5 shrink-0", ACCENT.text)} />
                              <SelectValue placeholder={isKh ? "ស្ថានភាព" : "Status"} />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="All" className={SEL_I}>{isKh ? "ស្ថានភាពទាំងអស់" : "All Status"}</SelectItem>
                              <SelectItem value="Active" className={SEL_I}>{isKh ? "កំពុងធ្វើការ" : "Active"}</SelectItem>
                              <SelectItem value="Inactive" className={SEL_I}>{isKh ? "ឈប់ហើយ" : "Inactive"}</SelectItem>
                           </SelectContent>
                        </Select>
                        <AnimatePresence>
                           {hasFilter && (
                              <motion.button
                                 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                 onClick={() => { setSearch(""); setGenderFilter("All"); setStatusFilter("All") }}
                                 className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
                              >
                                 <RotateCcw className="w-3.5 h-3.5" />
                              </motion.button>
                           )}
                        </AnimatePresence>
                     </div>
                     <div className="flex items-center gap-3">
                        {can("create") && (
                           <button
                              onClick={handleOpenAdd}
                              className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] text-white transition-all active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                              <Plus className="w-3.5 h-3.5" /> {isKh ? "បន្ថែមបុគ្គលិក" : "Add Staff"}
                           </button>
                        )}
                     </div>
                  </motion.div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.3 }} >
                     {pagedData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                           <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#22263a] flex items-center justify-center mb-4">
                              <Users className="w-8 h-8 text-gray-300 dark:text-white/15" />
                           </div>
                           <p className="text-[14px] font-semibold text-gray-600 dark:text-white/25">
                              {isKh ? "រកមិនឃើញបុគ្គលិក" : "No staff found"}
                           </p>
                           <p className="text-[12px] text-gray-600 dark:text-white/15 mt-1">
                              {isKh ? "សូមផ្លាស់ប្តូរការស្វែងរក" : "Try adjusting your search or filters"}
                           </p>
                        </div>
                     ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                           <AnimatePresence mode="popLayout">
                              {pagedData.map((item) => (
                                 <StaffCard
                                    key={item.id}
                                    item={item}
                                    isKh={isKh}
                                    can={can}
                                    onView={() => { setCurrentStaff(item); setIsViewMode(true); setIsDialogOpen(true) }}
                                    onEdit={() => handleOpenEdit(item)}
                                    onDelete={() => { setItemToDelete(item); setIsDeleteAlertOpen(true) }}
                                 />
                              ))}
                           </AnimatePresence>
                        </div>
                     )}
                  </motion.div>
                  {totalPages > 1 && (
                     <div className="flex items-center justify-between pt-2">
                        <span className="text-[12px] text-gray-600 dark:text-white/25">
                           {isKh ? "ទំព័រ" : "Page"} {currentPage} / {totalPages}
                        </span>
                        <div className="flex items-center gap-1.5">
                           <button
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="h-8 px-3 rounded-lg text-[14px] font-medium border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-[#22263a] disabled:opacity-30 disabled:cursor-not-allowed transition-all" >
                              {isKh ? "មុន" : "Prev"}
                           </button>
                           {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                              const page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage + i - 2
                              if (page > totalPages) return null
                              return (
                                 <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                       "w-8 h-8 rounded-lg text-[14px] font-medium transition-all",
                                       currentPage === page
                                          ? "bg-[#03624C] dark:bg-[#1857D8] text-white"
                                          : "border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-[#22263a]",
                                    )} >
                                    {page}
                                 </button>
                              )
                           })}
                           <button
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              className="h-8 px-3 rounded-lg text-[14px] font-medium border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-[#22263a] disabled:opacity-30 disabled:cursor-not-allowed transition-all" >
                              {isKh ? "បន្ទាប់" : "Next"}
                           </button>
                        </div>
                     </div>
                  )}
               </main>
            )}
         </div>
         <Dialog open={isDialogOpen} onOpenChange={v => !saving && setIsDialogOpen(v)}>
            <DialogContent className="max-w-md p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-2xl bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden" style={SORA}>
               <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0 bg-gray-50 dark:bg-[#22263a] rounded-t-2xl">
                  <div className="flex items-center gap-2.5">
                     <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#03624C] dark:bg-[#1857D8]">
                        <Users className="w-4 h-4 text-white" />
                     </div>
                     <div>
                        <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                           {isViewMode
                              ? (isKh ? "ព័ត៌មានលម្អិត" : "Staff Details")
                              : currentStaff?.id
                                 ? (isKh ? "កែប្រែព័ត៌មាន" : "Edit Profile")
                                 : (isKh ? "បន្ថែមបុគ្គលិកថ្មី" : "Add New Staff")}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Staff form</DialogDescription>
                     </div>
                  </div>
               </DialogHeader>
               <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
                  <div className="flex flex-col items-center gap-2">
                     <div
                        onClick={() => !isViewMode && fileRef.current?.click()}
                        className={cn(
                           "group relative w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/[0.10] overflow-hidden bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center transition-all",
                           !isViewMode && "cursor-pointer hover:border-[#03624C] dark:hover:border-[#1857D8]",
                        )}  >
                        {currentStaff?.image
                           ? <img src={currentStaff.image} className="w-full h-full object-cover object-top" referrerPolicy="no-referrer" />
                           : <div className="flex flex-col items-center text-gray-300 dark:text-white/10 group-hover:text-[#03624C] dark:group-hover:text-[#6b9fff] transition-colors">
                              <Camera className="w-8 h-8 mb-1" />
                              <span className="text-[10px] font-bold uppercase tracking-tighter">Photo</span>
                           </div>
                        }
                        {!isViewMode && (
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                              <ImagePlus className="w-6 h-6 text-white" />
                           </div>
                        )}
                     </div>
                     {!isViewMode && (
                        <p className="text-[12px] text-[#03624C]/70 dark:text-[#6b9fff]/70 font-medium">
                           {isKh ? "ប្រើរូបបួនជ្រុងស្មើ (1:1)" : "Use square (1:1) image for best result"}
                        </p>
                     )}
                     <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", errors.name && "text-rose-500")}>
                           {isKh ? "ឈ្មោះពេញ" : "Full Name"} {!isViewMode && <span className="text-rose-500">*</span>}
                        </Label>
                        <input
                           placeholder="Ex: Dara Chan" disabled={isViewMode}
                           className={cn(INPUT_BASE, errors.name && INPUT_ERR)}
                           value={currentStaff?.name || ""}
                           onChange={e => { setCurrentStaff({ ...currentStaff, name: e.target.value }); setErrors({ ...errors, name: "" }) }}
                        />
                        {errors.name && <ErrMsg msg={errors.name} />}
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[14px]  text-gray-600 dark:text-white/30">{isKh ? "ភេទ" : "Gender"}</Label>
                        <Select disabled={isViewMode} value={currentStaff?.gender || "Male"} onValueChange={v => setCurrentStaff({ ...currentStaff, gender: v })}>
                           <SelectTrigger className="h-9 text-[14px] font-medium rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] text-gray-900 dark:text-white shadow-sm gap-2">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="Male" className={SEL_I}>♂ Male</SelectItem>
                              <SelectItem value="Female" className={SEL_I}>♀ Female</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <Label className={cn("text-[14px]  text-gray-600 dark:text-white/30", errors.phone && "text-rose-500")}>
                           {isKh ? "លេខទូរស័ព្ទ" : "Phone"} {!isViewMode && <span className="text-rose-500">*</span>}
                        </Label>
                        {isViewMode ? (
                           <div className={cn(INPUT_BASE, "flex items-center gap-2 cursor-default")}>
                              <Phone className="w-3.5 h-3.5 text-gray-300 dark:text-white/20 shrink-0" />
                              <span className="font-mono tracking-wide">{formatPhone(currentStaff?.phone || "") || "—"}</span>
                           </div>
                        ) : (
                           <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 dark:text-white/20 pointer-events-none" />
                              <input
                                 inputMode="numeric" placeholder="012 345 678"
                                 className={cn(INPUT_BASE, "pl-8 font-mono tracking-wide", errors.phone && INPUT_ERR)}
                                 value={currentStaff?.phone || ""}
                                 onChange={handlePhoneChange}
                              />
                           </div>
                        )}
                        {errors.phone && <ErrMsg msg={errors.phone} />}
                        {!isViewMode && !errors.phone && (
                           <p className="text-[12px] text-gray-600 dark:text-white/20 mt-0.5">
                              {isKh ? "9-10 ខ្ទង់ · ចាប់ 0" : "9–10 digits · starts with 0"}
                           </p>
                        )}
                     </div>
                     <div className="space-y-1.5">
                        <Label className={cn("text-[14px]  text-gray-600 dark:text-white/30", errors.email && "text-rose-500")}>
                           {isKh ? "អ៊ីមែល" : "Email"}
                        </Label>
                        <div className="relative">
                           <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 dark:text-white/20" />
                           <input
                              type="email" placeholder="email@example.com" disabled={isViewMode}
                              className={cn(INPUT_BASE, "pl-8", errors.email && INPUT_ERR)}
                              value={currentStaff?.email || ""}
                              onChange={e => { setCurrentStaff({ ...currentStaff, email: e.target.value }); setErrors({ ...errors, email: "" }) }}
                           />
                        </div>
                        {errors.email && <ErrMsg msg={errors.email} />}
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <Label className="text-[14px]  text-gray-600 dark:text-white/30">{isKh ? "តួនាទី" : "Position"}</Label>
                        <input
                           placeholder="Ex: Cashier" disabled={isViewMode}
                           className={INPUT_BASE} value={currentStaff?.position || ""}
                           onChange={e => setCurrentStaff({ ...currentStaff, position: e.target.value })}
                        />
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[14px]  text-gray-600 dark:text-white/30">{isKh ? "ប្រាក់ខែ" : "Salary"}</Label>
                        <div className="relative">
                           <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
                           <input
                              placeholder="0.00" disabled={isViewMode} type="number"
                              className={cn(INPUT_BASE, "pl-8")} value={currentStaff?.salary || ""}
                              onChange={e => setCurrentStaff({ ...currentStaff, salary: e.target.value })}
                           />
                        </div>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <Label className="text-[14px]  text-gray-600 dark:text-white/30">
                           {isKh ? "ថ្ងៃចូលធ្វើការ" : "Join Date"}
                        </Label>
                        {isViewMode ? (
                           <div className={cn(INPUT_BASE, "flex items-center gap-2 cursor-default")}>
                              <CalendarDays className="w-3.5 h-3.5 text-gray-300 dark:text-white/20 shrink-0" />
                              <span className="text-[14px] text-gray-600 dark:text-white/50">{currentStaff?.date || "—"}</span>
                           </div>
                        ) : (
                           <DatePicker
                              value={currentStaff?.date || ""}
                              onChange={v => setCurrentStaff({ ...currentStaff, date: v })}
                              placeholder={isKh ? "ជ្រើសរើសថ្ងៃ" : "Select date"}
                              maxDate={new Date().toISOString().split("T")[0]}
                           />
                        )}
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[14px]  text-gray-600 dark:text-white/30">{isKh ? "ស្ថានភាព" : "Status"}</Label>
                        <Select disabled={isViewMode} value={currentStaff?.status || "Active"} onValueChange={v => setCurrentStaff({ ...currentStaff, status: v })}>
                           <SelectTrigger className="w-full h-9 text-[14px] font-medium rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#22263a] shadow-sm">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="Active" className={SEL_I}><span className="text-emerald-600 font-bold">● Active</span></SelectItem>
                              <SelectItem value="Inactive" className={SEL_I}><span className="text-rose-500 font-bold">● Inactive</span></SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[14px]  text-gray-600 dark:text-white/30 flex items-center gap-1.5">
                        <MonitorPlay className="w-3 h-3" />
                        {isKh ? "ការចូល POS" : "POS Access"}
                     </Label>
                     {isViewMode ? (
                        <div className={cn(
                           "flex items-center gap-3 px-4 py-3 rounded-xl border",
                           currentStaff?.can_use_pos && currentStaff?.has_pin
                              ? "bg-[#E1F5EE] dark:bg-[#1857D8]/20 border-[#03624C]/20 dark:border-[#1857D8]/30"
                              : currentStaff?.can_use_pos && !currentStaff?.has_pin
                                 ? "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20"
                                 : "bg-gray-50 dark:bg-white/[0.03] border-gray-100 dark:border-white/[0.07]",
                        )}>
                           {currentStaff?.can_use_pos && currentStaff?.has_pin ? (
                              <>
                                 <ShieldCheck className="w-4 h-4 text-[#03624C] dark:text-[#6b9fff] shrink-0" />
                                 <div>
                                    <p className="text-[14px] text-[#085041] dark:text-[#6b9fff]">
                                       {isKh ? "អនុញ្ញាតចូល POS · PIN បានកំណត់" : "POS enabled · PIN is set"}
                                    </p>
                                    <p className="text-[12px] text-[#0F6E56]/70 dark:text-[#6b9fff]/60 mt-0.5">••••••</p>
                                 </div>
                              </>
                           ) : currentStaff?.can_use_pos && !currentStaff?.has_pin ? (
                              <>
                                 <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                                 <p className="text-[14px] text-amber-600 dark:text-amber-400">
                                    {isKh ? "អនុញ្ញាតPOS · PIN មិនទាន់កំណត់" : "POS enabled · PIN not set yet"}
                                 </p>
                              </>
                           ) : (
                              <>
                                 <MonitorPlay className="w-4 h-4 text-gray-300 dark:text-white/20 shrink-0" />
                                 <p className="text-[14px] text-gray-600 dark:text-white/25">
                                    {isKh ? "Staff នេះពុំប្រើ POS" : "POS access disabled"}
                                 </p>
                              </>
                           )}
                        </div>
                     ) : (
                        <>
                           <PosToggle
                              checked={!!currentStaff?.can_use_pos}
                              onChange={v => {
                                 setCurrentStaff({ ...currentStaff, can_use_pos: v, pin_code: v ? (currentStaff?.pin_code || "") : "" })
                                 setErrors({ ...errors, pin_code: "" })
                              }}
                              isKh={isKh}
                           />
                           <AnimatePresence>
                              {currentStaff?.can_use_pos && (
                                 <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden" >
                                    <div className="space-y-1.5 pt-1">
                                       <Label className={cn(
                                          "text-[14px]  flex items-center gap-1.5",
                                          errors.pin_code ? "text-rose-500" : "text-gray-600 dark:text-white/30",
                                       )}>
                                          <KeyRound className="w-3 h-3" />
                                          {isKh ? "PIN Code (6 ខ្ទង់)" : "PIN Code (6 digits)"}
                                          <span className="text-rose-500">*</span>
                                       </Label>
                                       <div className="relative">
                                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#03624C] dark:text-[#6b9fff]" />
                                          <input
                                             type={showPin ? "text" : "password"}
                                             inputMode="numeric"
                                             maxLength={6}
                                             placeholder={
                                                currentStaff?.id && currentStaff?.has_pin
                                                   ? (isKh ? "ទុកចោលបើមិនចង់ប្តូរ" : "Leave blank to keep current")
                                                   : (isKh ? "បញ្ចូល PIN 6 ខ្ទង់" : "Enter 6-digit PIN")
                                             }
                                             className={cn(
                                                INPUT_BASE,
                                                "pl-8 pr-10 tracking-[0.3em] font-mono",
                                                errors.pin_code && INPUT_ERR,
                                             )}
                                             value={currentStaff?.pin_code || ""}
                                             onChange={e => {
                                                const val = e.target.value.replace(/\D/g, "").slice(0, 6)
                                                setCurrentStaff({ ...currentStaff, pin_code: val })
                                                setErrors({ ...errors, pin_code: "" })
                                             }}
                                          />
                                          <button
                                             type="button" tabIndex={-1}
                                             onClick={() => setShowPin(p => !p)}
                                             className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" >
                                             {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                          </button>
                                       </div>
                                       {errors.pin_code && <ErrMsg msg={errors.pin_code} />}
                                       {currentStaff?.pin_code && (
                                          <div className="flex items-center gap-1 mt-1">
                                             {Array.from({ length: 6 }).map((_, i) => (
                                                <div key={i} className={cn(
                                                   "h-1 flex-1 rounded-full transition-all duration-200",
                                                   i < (currentStaff?.pin_code?.length || 0)
                                                      ? "bg-[#03624C] dark:bg-[#1857D8]"
                                                      : "bg-gray-200 dark:bg-white/[0.08]",
                                                )} />
                                             ))}
                                          </div>
                                       )}
                                       {currentStaff?.id && currentStaff?.has_pin && !currentStaff?.pin_code && (
                                          <p className="text-[12px] text-[#03624C]/70 dark:text-[#6b9fff]/60 flex items-center gap-1">
                                             <ShieldCheck className="w-3 h-3" />
                                             {isKh ? "PIN បានកំណត់រួចហើយ — វាយថ្មីដើម្បីប្តូរ" : "PIN already set — type new one to change"}
                                          </p>
                                       )}
                                    </div>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </>
                     )}
                  </div>
               </div>
               {!isViewMode && (
                  <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-2xl shrink-0">
                     <div className="flex justify-end gap-2 w-full">
                        <button
                           onClick={() => setIsDialogOpen(false)} disabled={saving}
                           className="h-9 px-5 rounded-lg text-[14px] border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-all" >
                           {t("cancel")}
                        </button>
                        <button
                           onClick={handleSave} disabled={saving}
                           className="h-9 px-6 rounded-lg text-[14px] text-white flex items-center gap-2 transition-all disabled:opacity-60 active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                           {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                           {saving ? (isKh ? "កំពុងរក្សា..." : "Saving...") : t("save")}
                        </button>
                     </div>
                  </DialogFooter>
               )}
            </DialogContent>
         </Dialog>
         <Dialog open={!!imageToCrop} onOpenChange={() => setImageToCrop(null)}>
            <DialogContent className="max-w-md p-0 border-0 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
               <DialogHeader className="sr-only"><DialogTitle>Crop Image</DialogTitle><DialogDescription>Adjust photo</DialogDescription></DialogHeader>
               <div className="relative h-[350px] w-full bg-black">
                  <Cropper image={imageToCrop || ""} crop={crop} zoom={zoom} aspect={1}
                     onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
               </div>
               <div className="p-5 space-y-4 bg-white dark:bg-[#22263a]" style={SORA}>
                  <div className="space-y-2">
                     <div className="flex justify-between text-[12px] font-bold text-gray-600 uppercase tracking-widest">
                        <span>Zoom</span><span>{Math.round(zoom * 100)}%</span>
                     </div>
                     <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={v => setZoom(v[0])} />
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setImageToCrop(null)}
                        className="flex-1 h-10 rounded-xl text-[14px] font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all border border-gray-200 dark:border-white/[0.08]">
                        Cancel
                     </button>
                     <button onClick={handleApplyCrop}
                        className="flex-1 h-10 rounded-xl text-[14px] font-bold bg-[#03624C] dark:bg-[#1857D8] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" /> Apply Crop
                     </button>
                  </div>
               </div>
            </DialogContent>
         </Dialog>
         <ConfirmDialog
            open={isDeleteAlertOpen}
            onOpenChange={v => { setIsDeleteAlertOpen(v); if (!v) setItemToDelete(null) }}
            onConfirm={confirmDelete}
            loading={deleting}
            variant="danger"
            icon={Trash2}
            title={isKh ? "បញ្ជាក់ការលុប" : "Confirm Delete"}
            description={isKh ? "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។" : "This action cannot be undone."}
            highlight={itemToDelete?.name}
            confirmLabel={isKh ? "លុបចោល" : "Delete"}
            cancelLabel={isKh ? "បោះបង់" : "Cancel"}
         />
      </div>
   )
}