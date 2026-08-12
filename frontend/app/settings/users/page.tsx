"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { DataTableCustom } from "@/components/ui/table"
import {
   Dialog, DialogContent, DialogHeader, DialogTitle,
   DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toastSuccess, toastError, toastWarn } from "@/lib/toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Slider } from "@/components/ui/slider"
import {
   Search, Plus, Eye, EyeOff, Edit2, Trash2, X,
   Loader2, Mail, AlertTriangle, Check, User as UserIcon, Lock,
   Users, Shield, CalendarDays, Camera, RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { User } from "@/types"
import { usePermission } from "@/lib/role-context"
import { getAvatarUrl } from "@/lib/avatar"
import Cropper from "react-easy-crop"
import { useUsersList, useUsersMutations } from "@/hooks/settings/use-users"
import { useRolesList } from "@/hooks/settings/use-roles"

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }

const ACCENT = {
   text: "text-[#03624C] dark:text-[#1857D8]",
   iconBg: "bg-[#03624C] dark:bg-[#1857D8]",
}

const INPUT =
   "w-full h-9 px-3 text-[14px] rounded-lg outline-none transition-all " +
   "bg-white dark:bg-[#22263a] border border-gray-200/80 dark:border-white/[0.08] " +
   "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/20 " +
   "focus:border-[#03624C] dark:focus:border-[#1857D8] focus:ring-2 focus:ring-[#03624C]/10 " +
   "dark:focus:ring-[#1857D8]/10 shadow-sm dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"

const INPUT_ERR = "border-rose-400 dark:border-rose-500/50 focus:border-rose-400 dark:focus:border-rose-500/50"

const SEL_T =
   "h-9 text-[14px] rounded-lg border border-gray-200/80 dark:border-white/[0.08] " +
   "bg-white dark:bg-[#22263a] text-gray-700 dark:text-white/70 shadow-sm dark:shadow-none"

const SEL_C = "bg-white dark:bg-[#22263a] border-gray-100 dark:border-white/[0.12] rounded-xl"
const SEL_I = "text-[14px] text-gray-800 dark:text-white/80 focus:bg-[#03624C]/10 dark:focus:bg-[#1857D8]/10"
const DMI = "text-[14px] font-semibold py-2.5 px-3 rounded-lg cursor-pointer"

const isAdminUser = (u: User | { role?: string | null }) =>
   ["administrator", "admin"].includes((u.role ?? "").toLowerCase())

const isValidEmail = (email: string) =>
   /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())

const getCroppedImg = (imageSrc: string, pixelCrop: any): Promise<string> => {
   const image = new Image(); image.src = imageSrc
   return new Promise(resolve => {
      image.onload = () => {
         const canvas = document.createElement("canvas")
         canvas.width = pixelCrop.width; canvas.height = pixelCrop.height
         const ctx = canvas.getContext("2d")
         if (ctx) ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
         resolve(canvas.toDataURL("image/jpeg"))
      }
   })
}

function formatDate(iso: string) {
   const d = new Date(iso)
   return {
      date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`,
      time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
   }
}

const ErrMsg = ({ msg }: { msg: string }) => (
   <p className="flex items-center gap-1 text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-medium">
      <AlertTriangle className="w-3 h-3 shrink-0" />{msg}
   </p>
)

interface UserForm {
   id?: number
   username: string
   email: string
   role: string
   status: string
   image?: string | null
   password: string
   confirmPassword: string
   created_at?: string
   createdAt?: string
}
export default function UsersPage() {
   const { t, i18n } = useTranslation("common")
   const isKh = i18n.language === "kh"
   const { can } = usePermission("users")

   const { data: users = [], isLoading: usersLoading, isFetching: usersFetching } = useUsersList()
   const { data: roles = [], isLoading: rolesLoading, isFetching: rolesFetching } = useRolesList()
   const loading = usersLoading || rolesLoading
   const isFetching = usersFetching || rolesFetching
   const { create, update, remove } = useUsersMutations()
   const saving = create.isPending || update.isPending
   const deleting = remove.isPending

   const [search, setSearch] = useState("")
   const [currentPage, setCurrentPage] = useState(1)
   const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" })
   const itemsPerPage = 10
   const [isDialogOpen, setIsDialogOpen] = useState(false)
   const [currentUser, setCurrentUser] = useState<UserForm | null>(null)
   const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
   const [itemToDelete, setItemToDelete] = useState<User | null>(null)
   const [showRoleWarning, setShowRoleWarning] = useState(false)
   const [errors, setErrors] = useState<Record<string, string>>({})
   const [showPass, setShowPass] = useState(false)
   const [showConfirm, setShowConfirm] = useState(false)
   const fileInputRef = useRef<HTMLInputElement>(null)
   const originalSnapshot = useRef<string>("")
   const [imagePreview, setImagePreview] = useState<string>("")
   const [imageToCrop, setImageToCrop] = useState<string | null>(null)
   const [crop, setCrop] = useState({ x: 0, y: 0 })
   const [zoom, setZoom] = useState(1)
   const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
   const onCropComplete = useCallback((_: any, px: any) => setCroppedAreaPixels(px), [])

   useEffect(() => { setCurrentPage(1) }, [search])
   const adminCount = useMemo(() => users.filter(isAdminUser).length, [users])
   const canDeleteUser = (item: User) => !isAdminUser(item) || adminCount >= 2
   const isLastAdmin = (item: UserForm | null): boolean => {
      if (!item?.id) return false
      const orig = users.find(u => u.id === item.id)
      return !!orig && isAdminUser(orig) && adminCount <= 1
   }

   const isRemovingAdminRole = (item: UserForm | null): boolean => {
      if (!item?.id) return false
      const orig = users.find(u => u.id === item.id)
      return !!orig && isAdminUser(orig) && !["administrator", "admin"].includes((item.role ?? "").toLowerCase())
   }

   const handleOpenAdd = () => {
      setErrors({}); setShowPass(false); setShowConfirm(false)
      setImagePreview(""); setImageToCrop(null); setZoom(1)
      setCurrentUser({ username: "", email: "", role: roles[0]?.name ?? "", status: "Active", image: "", password: "", confirmPassword: "" })
      originalSnapshot.current = ""
      setIsDialogOpen(true)
   }

   const handleOpenEdit = (item: User) => {
      setErrors({}); setShowPass(false); setShowConfirm(false)
      setImagePreview(""); setImageToCrop(null); setZoom(1)
      setCurrentUser({
         id: item.id, username: item.username, email: item.email,
         role: item.role ?? "", status: item.status, image: item.image,
         password: "", confirmPassword: "",
         created_at: item.created_at, createdAt: item.created_at,
      })
      originalSnapshot.current = JSON.stringify({ username: item.username, email: item.email, role: item.role ?? "", status: item.status, image: item.image || "" })
      setIsDialogOpen(true)
   }

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
         const reader = new FileReader()
         reader.onload = () => { setImageToCrop(reader.result as string); setZoom(1); setCrop({ x: 0, y: 0 }) }
         reader.readAsDataURL(file)
      }
      e.target.value = ""
   }

   const handleApplyCrop = async () => {
      if (imageToCrop && croppedAreaPixels) {
         const cropped = await getCroppedImg(imageToCrop, croppedAreaPixels)
         setImagePreview(cropped)
         setCurrentUser(prev => prev ? { ...prev, image: cropped } : prev)
         setImageToCrop(null)
      }
   }

   const handleSave = async (forceRoleChange = false) => {
      const err: Record<string, string> = {}
      if (!currentUser?.username?.trim())
         err.username = isKh ? "សូមបញ្ចូលឈ្មោះអ្នកប្រើ" : "Username is required"
      if (!currentUser?.email?.trim())
         err.email = isKh ? "សូមបញ្ចូលអ៊ីមែល" : "Email is required"
      else if (!isValidEmail(currentUser.email))
         err.email = isKh ? "អ៊ីមែលមិនត្រឹមត្រូវ" : "Invalid email format"
      else if (users.some(u => u.email?.toLowerCase() === currentUser.email.toLowerCase().trim() && u.id !== currentUser.id))
         err.email = isKh ? "អ៊ីមែលនេះមានរួចហើយ" : "Email already exists"
      if (!currentUser?.id && !currentUser?.password)
         err.password = isKh ? "សូមបញ្ចូលលេខសម្ងាត់" : "Password required"
      if (currentUser?.password && currentUser.password !== currentUser.confirmPassword)
         err.confirmPassword = isKh ? "លេខសម្ងាត់មិនដូចគ្នា" : "Passwords do not match"
      if (Object.keys(err).length > 0) { setErrors(err); return }

      if (isLastAdmin(currentUser) && isRemovingAdminRole(currentUser)) {
         toastError(isKh ? "មិនអាចផ្លាស់ប្តូរបាន" : "Cannot change role", isKh ? "អ្នកគឺជា Administrator តែមួយ" : "You are the last Administrator.")
         return
      }
      if (!forceRoleChange && adminCount >= 2 && isRemovingAdminRole(currentUser)) {
         setShowRoleWarning(true); return
      }
      if (currentUser?.id) {
         const cur = JSON.stringify({ username: currentUser.username, email: currentUser.email, role: currentUser.role, status: currentUser.status, image: currentUser.image || "" })
         if (cur === originalSnapshot.current && !currentUser.password) {
            toastWarn(
               isKh ? "មិនមានការផ្លាស់ប្តូរ" : "No changes detected", isKh ? "សូមកែប្រែមុននឹងរក្សាទុក" : "Please make changes before saving")
            return
         }
      }

      try {
         const roleObj = roles.find(r => r.name === currentUser!.role)
         if (currentUser!.id) {
            const payload: any = { name: currentUser!.username, email: currentUser!.email, role_id: roleObj?.id ?? null, status: currentUser!.status, image: currentUser!.image || null }
            if (currentUser!.password) payload.password = currentUser!.password
            await update.mutateAsync({ id: currentUser!.id, payload })
            toastSuccess(
               isKh ? "កែប្រែបានជោគជ័យ" : "Updated successfully",
               isKh ? `អ្នកប្រើ "${currentUser!.username}" បានកែប្រែដោយជោគជ័យ` : `User "${currentUser!.username}" has been updated successfully`
            )
         } else {
            const payload: any = { name: currentUser!.username, email: currentUser!.email, password: currentUser!.password, role_id: roleObj?.id ?? null, status: currentUser!.status, image: currentUser!.image || null }
            await create.mutateAsync(payload)
            toastSuccess(
               isKh ? "បន្ថែមបានជោគជ័យ" : "Added successfully",
               isKh ? `អ្នកប្រើ "${currentUser!.username}" បានបន្ថែមដោយជោគជ័យ` : `User "${currentUser!.username}" has been added successfully`
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
            isKh ? `អ្នកប្រើ "${itemToDelete.username}" បានលុបដោយជោគជ័យ` : `User "${itemToDelete.username}" has been deleted successfully`
         )
      } catch (err: any) {
         toastError(isKh ? "លុបមិនបាន" : "Delete failed", err?.message)
      } finally { setIsDeleteAlertOpen(false); setItemToDelete(null) }
   }

   const processedData = useMemo(() =>
      users.filter(u =>
         (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
         (u.email || "").toLowerCase().includes(search.toLowerCase())
      ), [users, search])

   const dialogAvatarSrc = imagePreview || (getAvatarUrl(currentUser?.image) ?? "")
   const showInitialLoading = loading && users.length === 0

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
               title={isKh ? "អ្នកប្រើប្រាស់" : "Users"}
               subtitle={isKh ? "គ្រប់គ្រងបញ្ជីឈ្មោះអ្នកប្រើប្រាស់ប្រព័ន្ធ" : "Manage system user accounts"}
            />
            {showInitialLoading ? (
               <div className="flex-1 flex items-center justify-center flex-col gap-4">
                  <Loader2 className={cn("w-5 h-5 animate-spin", ACCENT.text)} />
                  <span className={cn("text-[11px] font-bold uppercase tracking-[0.2em] animate-pulse", ACCENT.text)}>
                     {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
                  </span>
               </div>
            ) : (
               <main className="flex-1 p-5 space-y-4 overflow-hidden flex flex-col">
                  <motion.div
                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.25 }}
                     className="flex items-center justify-between gap-3 shrink-0" >
                     <div className="flex items-center gap-2">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white/25 pointer-events-none" />
                           <input
                              className={cn(INPUT, "w-60 pl-8")}
                              placeholder={isKh ? "ស្វែងរកឈ្មោះ ឬអ៊ីមែល..." : "Search by name or email..."}
                              value={search}
                              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                           />
                        </div>
                        <AnimatePresence>
                           {search && (
                              <motion.button
                                 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                 onClick={() => setSearch("")}
                                 className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
                              >
                                 <RotateCcw className="w-4 h-4" />
                              </motion.button>
                           )}
                        </AnimatePresence>
                     </div>
                     {can("create") && (
                        <motion.button
                           whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                           whileTap={{ scale: 0.97 }}
                           onClick={handleOpenAdd}
                           className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-[14px] text-white transition-all bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                           <Plus className="w-4 h-4" />{isKh ? "បន្ថែមអ្នកប្រើ" : "Add User"}
                        </motion.button>
                     )}
                  </motion.div>
                  <motion.div
                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.32 }}
                     className="flex-1 overflow-hidden" >
                     <Card className="h-full border-0 shadow-none bg-transparent flex flex-col">
                        <DataTableCustom
                           data={processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                           sortConfig={sortConfig}
                           onSort={key => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }))}
                           columns={[
                              {
                                 key: "no", header: isKh ? "ល.រ" : "No.",
                                 render: (_: any, idx: number) => (
                                    <span className="text-[14px] text-gray-600 dark:text-white/25 tabular-nums">
                                       {String((currentPage - 1) * itemsPerPage + idx + 1).padStart(2, "0")}
                                    </span>
                                 ),
                              },
                              {
                                 key: "user", header: isKh ? "ព័ត៌មានអ្នកប្រើក្នុងប្រព័ន្ធ" : "User Info Systems",
                                 render: (item: User) => (
                                    <div className="flex items-center gap-3 py-1">
                                       <HoverCard openDelay={150}>
                                          <HoverCardTrigger asChild>
                                             <div className="shrink-0 cursor-pointer group">
                                                <Avatar className="w-9 h-9 rounded-xl border border-gray-100 dark:border-white/[0.08] shadow-sm group-hover:ring-2 group-hover:ring-[#03624C]/30 dark:group-hover:ring-[#1857D8]/40 transition-all">
                                                   <AvatarImage src={getAvatarUrl(item.image) || undefined} className="object-cover" referrerPolicy="no-referrer" />
                                                   <AvatarFallback className={cn("text-[14px] font-bold uppercase rounded-xl bg-[#03624C]/10 dark:bg-[#1857D8]/20", ACCENT.text)}>
                                                      {(item.username || "?").charAt(0)}
                                                   </AvatarFallback>
                                                </Avatar>
                                             </div>
                                          </HoverCardTrigger>
                                          <HoverCardContent side="right" align="start" className="w-56 p-0 border-0 shadow-2xl rounded-2xl overflow-hidden bg-white dark:bg-[#22263a]">
                                             <div className="relative h-56 w-full bg-gray-50 dark:bg-white/[0.02]">
                                                {getAvatarUrl(item.image)
                                                   ? <img src={getAvatarUrl(item.image)} className="w-full h-full object-cover" alt={item.username} referrerPolicy="no-referrer" />
                                                   : <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 dark:text-white/5 gap-2">
                                                      <UserIcon className="w-12 h-12" />
                                                      <span className="text-[14px] font-bold uppercase tracking-widest">{isKh ? "គ្មានរូបភាព" : "No Photo"}</span>
                                                   </div>
                                                }
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                <div className="absolute bottom-4 left-4">
                                                   <p className="text-white text-[14px] font-bold leading-tight">{item.username}</p>
                                                   <p className="text-white/60 text-[12px] uppercase font-bold tracking-wider">{item.role || "—"}</p>
                                                </div>
                                             </div>
                                          </HoverCardContent>
                                       </HoverCard>
                                       <div className="flex flex-col">
                                          <span className="text-gray-700 dark:text-white/80 text-[14px]">{item.username}</span>
                                          <span className="text-[12px] text-gray-600 dark:text-white/30 flex items-center gap-1">
                                             <Mail className="w-2.5 h-2.5" />{item.email}
                                          </span>
                                       </div>
                                    </div>
                                 ),
                              },
                              {
                                 key: "role", header: isKh ? "តួនាទី & សិទ្ធិចូលប្រើប្រាស់" : "Role & Permission",
                                 render: (item: User) => (
                                    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border w-fit", "bg-[#03624C]/[0.08] dark:bg-[#1857D8]/[0.12] border-[#03624C]/20 dark:border-[#1857D8]/25")}>
                                       <Shield className={cn("w-3 h-3", ACCENT.text)} />
                                       <span className={cn("text-[14px]", ACCENT.text)}>{item.role || "—"}</span>
                                    </div>
                                 ),
                              },
                              {
                                 key: "createdAt", header: isKh ? "កាលបរិច្ឆេទ" : "Created At",
                                 render: (item: User) => {
                                    const raw = (item as any).created_at || (item as any).createdAt
                                    if (!raw) return <span className="text-gray-300 dark:text-white/20 text-[11px]">—</span>
                                    const { date, time } = formatDate(raw)
                                    return (
                                       <div className="flex flex-col gap-0.5">
                                          <span className="text-[14px] text-gray-700 dark:text-white/70">{date}</span>
                                          <span className="text-[12px] text-gray-600 dark:text-white/30">{time}</span>
                                       </div>
                                    )
                                 },
                              },
                              {
                                 key: "updatedAt", header: isKh ? "កែប្រែចុងក្រោយ" : "Last Updated",
                                 render: (item: User) => {
                                    const raw = (item as any).updated_at
                                    if (!raw) return <span className="text-gray-300 dark:text-white/20 text-[11px]">—</span>
                                    const { date, time } = formatDate(raw)
                                    return (
                                       <div className="flex flex-col gap-0.5">
                                          <span className="text-[14px] text-gray-700 dark:text-white/70">{date}</span>
                                          <span className="text-[12px] text-gray-600 dark:text-white/30">{time}</span>
                                       </div>
                                    )
                                 },
                              },
                              {
                                 key: "status", header: isKh ? "ស្ថានភាព" : "Status",
                                 render: (item: User) => (
                                    <div className={cn(
                                       "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[14px] border",
                                       item.status === "Active"
                                          ? "bg-emerald-50 text-[#03624C] border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                          : "bg-gray-50 text-gray-600 border-gray-100 dark:bg-white/5 dark:text-white/20 dark:border-white/10"
                                    )}>
                                       <div className={cn("w-1.5 h-1.5 rounded-full", item.status === "Active" ? "bg-[#03624C]" : "bg-gray-400")} />
                                       {item.status}
                                    </div>
                                 ),
                              },
                              {
                                 key: "actions",
                                 header: isKh ? "សកម្មភាព" : "Actions",
                                 className: "text-right",
                                 render: (item: User) => {
                                    const canEdit = can("edit");
                                    const canDel = can("delete") && canDeleteUser(item);
                                    const isLastAdmin = can("delete") && !canDeleteUser(item);

                                    if (!canEdit && !can("delete")) {
                                       return (
                                          <div className="flex justify-end">
                                             <span className="text-[11px] text-gray-600 dark:text-white/30 px-2">
                                                {isKh ? "គ្មានសិទ្ធិ" : "No permission"}
                                             </span>
                                          </div>
                                       );
                                    }
                                    return (
                                       <div className="flex items-center justify-end gap-1.5">
                                          {canEdit && (
                                             <button
                                                onClick={() => handleOpenEdit(item)}
                                                className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                                                text-amber-700 bg-amber-50 border border-amber-200
                                                hover:bg-amber-100 hover:border-amber-300
                                                dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-700/40
                                                dark:hover:bg-amber-900/40 dark:hover:border-amber-500
                                                transition-all duration-150"
                                                title={isKh ? "កែប្រែ" : "Edit"} >
                                                <Edit2 className="w-4 h-4" />
                                             </button>
                                          )}
                                          {canDel && (
                                             <button
                                                onClick={() => { setItemToDelete(item); setIsDeleteAlertOpen(true) }}
                                                className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                                                text-rose-700 bg-rose-50 border border-rose-200
                                                hover:bg-rose-100 hover:border-rose-300
                                                dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-700/40
                                                dark:hover:bg-rose-900/40 dark:hover:border-rose-500
                                                transition-all duration-150"
                                                title={isKh ? "លុបចោល" : "Delete"} >
                                                <Trash2 className="w-4 h-4" />
                                             </button>
                                          )}
                                          {isLastAdmin && (
                                             <button
                                                disabled
                                                className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                                                text-gray-600 dark:text-white/20 bg-gray-100 dark:bg-white/[0.05] border 
                                                border-gray-200 dark:border-white/[0.06] cursor-not-allowed opacity-60"
                                                title={isKh ? "Admin ចុងក្រោយ មិនអាចលុបបាន" : "Last admin cannot be deleted"} >
                                                <Trash2 className="w-4 h-4" />
                                             </button>
                                          )}
                                       </div>
                                    );
                                 },
                              },
                           ]}
                           currentPage={currentPage}
                           totalPages={Math.ceil(processedData.length / itemsPerPage) || 1}
                           onPageChange={setCurrentPage}
                           itemsPerPage={itemsPerPage}
                           totalItems={processedData.length}
                           language={i18n.language as any}
                        />
                     </Card>
                  </motion.div>
               </main>
            )}
         </div>
         <Dialog open={isDialogOpen} onOpenChange={v => { if (!saving) setIsDialogOpen(v) }}>
            <DialogContent className="max-w-md p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden" style={SORA}>
               <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0 bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
                  <div className="flex items-center gap-2.5">
                     <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", ACCENT.iconBg)}>
                        <UserIcon className="w-4 h-4 text-white" />
                     </div>
                     <div>
                        <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                           {currentUser?.id ? (isKh ? "កែប្រែអ្នកប្រើ" : "Edit User") : (isKh ? "បន្ថែមអ្នកប្រើថ្មី" : "Add New User")}
                        </DialogTitle>
                        <DialogDescription className="sr-only">User form</DialogDescription>
                     </div>
                  </div>
               </DialogHeader>
               <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
                  <div className="flex flex-col items-center gap-2 pb-1">
                     <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/[0.10] overflow-hidden bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center cursor-pointer hover:border-[#03624C] dark:hover:border-[#1857D8] transition-all"
                     >
                        {dialogAvatarSrc
                           ? <img src={dialogAvatarSrc} className="w-full h-full object-cover object-top" referrerPolicy="no-referrer" />
                           : <div className="flex flex-col items-center text-gray-300 dark:text-white/10 group-hover:text-[#03624C] dark:group-hover:text-[#1857D8] transition-colors">
                              <UserIcon className="w-7 h-7 mb-1" />
                           </div>
                        }
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <Camera className="w-5 h-5 text-white" />
                        </div>
                     </div>
                     <p className="text-[10px] text-gray-600 dark:text-white/30">
                        {isKh ? "ចុចដើម្បី crop រូបភាព" : "Click to upload & crop image"}
                     </p>
                     <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <Label className={cn("text-[14px]  text-gray-600 dark:text-white/30", errors.username && "text-rose-500")}>
                           {isKh ? "ឈ្មោះអ្នកប្រើ" : "Username"}
                        </Label>
                        <div className="relative">
                           <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/20" />
                           <input className={cn(INPUT, "pl-9", errors.username && INPUT_ERR)}
                              placeholder={isKh ? "បញ្ចូលឈ្មោះ..." : "Enter username..."}
                              value={currentUser?.username || ""}
                              onChange={e => { setCurrentUser(prev => prev ? { ...prev, username: e.target.value } : prev); setErrors(p => ({ ...p, username: "" })) }} />
                        </div>
                        {errors.username && <ErrMsg msg={errors.username} />}
                     </div>
                     <div className="space-y-1.5">
                        <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", errors.email && "text-rose-500")}>
                           {isKh ? "អ៊ីមែល" : "Email"}
                        </Label>
                        <div className="relative">
                           <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/20" />
                           <input className={cn(INPUT, "pl-9", errors.email && INPUT_ERR)}
                              placeholder={isKh ? "បញ្ចូលអ៊ីមែល..." : "Enter email..."}
                              value={currentUser?.email || ""}
                              onChange={e => { setCurrentUser(prev => prev ? { ...prev, email: e.target.value } : prev); setErrors(p => ({ ...p, email: "" })) }} />
                        </div>
                        {errors.email && <ErrMsg msg={errors.email} />}
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", errors.password && "text-rose-500")}>
                           {isKh ? "លេខសម្ងាត់" : "Password"}{!currentUser?.id && <span className="text-rose-500 ml-0.5">*</span>}
                        </Label>
                        <div className="relative">
                           <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/20" />
                           <input type={showPass ? "text" : "password"}
                              className={cn(INPUT, "pl-9 pr-9", errors.password && INPUT_ERR)}
                              placeholder={currentUser?.id ? (isKh ? "ទុកចោល..." : "Leave blank...") : (isKh ? "បញ្ចូល..." : "Enter...")}
                              value={currentUser?.password || ""}
                              onChange={e => { setCurrentUser(prev => prev ? { ...prev, password: e.target.value } : prev); setErrors(p => ({ ...p, password: "" })) }} />
                           <button type="button" onClick={() => setShowPass(!showPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-white/30 hover:text-gray-600 transition-colors">
                              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                           </button>
                        </div>
                        {errors.password && <ErrMsg msg={errors.password} />}
                     </div>
                     <div className="space-y-1.5">
                        <Label className={cn("text-[14px] text-gray-600 dark:text-white/30", errors.confirmPassword && "text-rose-500")}>
                           {isKh ? "បញ្ជាក់" : "Confirm"}
                        </Label>
                        <div className="relative">
                           <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/20" />
                           <input type={showConfirm ? "text" : "password"}
                              className={cn(INPUT, "pl-9 pr-9", errors.confirmPassword && INPUT_ERR)}
                              placeholder={isKh ? "បញ្ជាក់..." : "Confirm..."}
                              value={currentUser?.confirmPassword || ""}
                              onChange={e => { setCurrentUser(prev => prev ? { ...prev, confirmPassword: e.target.value } : prev); setErrors(p => ({ ...p, confirmPassword: "" })) }} />
                           <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-white/30 hover:text-gray-600 transition-colors">
                              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                           </button>
                        </div>
                        {errors.confirmPassword && <ErrMsg msg={errors.confirmPassword} />}
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <Label className="text-[14px] text-gray-600 dark:text-white/30">{isKh ? "តួនាទី" : "Role"}</Label>
                        <div className="relative">
                           <Select
                              value={currentUser?.role ?? ""}
                              disabled={isLastAdmin(currentUser)}
                              onValueChange={v => setCurrentUser(prev => prev ? { ...prev, role: v } : prev)} >
                              <SelectTrigger
                                 className={cn(
                                    SEL_T, "w-full",
                                    isLastAdmin(currentUser) && "opacity-50 cursor-not-allowed",
                                    currentUser?.id && currentUser?.role && !isLastAdmin(currentUser) && "[&>svg]:hidden"
                                 )} >
                                 <SelectValue placeholder={isKh ? "ជ្រើស..." : "Select..."} />
                              </SelectTrigger>
                              <SelectContent className={SEL_C} style={SORA}>
                                 {roles.length === 0
                                    ? <SelectItem value="__none__" disabled className={SEL_I}>{isKh ? "គ្មានតួនាទី" : "No roles"}</SelectItem>
                                    : roles.map(r => (
                                       <SelectItem key={r.id} value={r.name} className={SEL_I}>
                                          <span className="flex items-center gap-1.5"><Shield className={cn("w-3 h-3", ACCENT.text)} />{r.name}</span>
                                       </SelectItem>
                                    ))
                                 }
                              </SelectContent>
                           </Select>
                           {currentUser?.id && currentUser?.role && !isLastAdmin(currentUser) && (
                              <button
                                 type="button"
                                 onClick={() => setCurrentUser(prev => prev ? { ...prev, role: "" } : prev)}
                                 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
                                 flex items-center justify-center z-10
                                 text-gray-300 hover:text-rose-500 hover:bg-rose-50
                                 dark:text-white/20 dark:hover:text-rose-400 dark:hover:bg-rose-500/10
                                 transition-all"
                                 title={isKh ? "លុប Role" : "Clear role"} >
                                 <X className="w-3 h-3" />
                              </button>
                           )}
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[14px] text-gray-600 dark:text-white/30">{isKh ? "ស្ថានភាព" : "Status"}</Label>
                        <Select value={currentUser?.status ?? ""} onValueChange={v => setCurrentUser(prev => prev ? { ...prev, status: v } : prev)}>
                           <SelectTrigger className={cn(SEL_T, "w-full")}>
                              <SelectValue placeholder={isKh ? "ជ្រើស..." : "Select..."} />
                           </SelectTrigger>
                           <SelectContent className={SEL_C} style={SORA}>
                              <SelectItem value="Active" className={SEL_I}><span className="text-emerald-600 font-bold">Active</span></SelectItem>
                              <SelectItem value="Inactive" className={SEL_I}><span className="text-rose-500 font-bold">Inactive</span></SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
                  {currentUser?.id && (currentUser?.created_at || currentUser?.createdAt) && (
                     <div className="space-y-1.5">
                        <Label className="text-[14px] text-gray-600 dark:text-white/30">{isKh ? "កាលបរិច្ឆេទបង្កើត" : "Created At"}</Label>
                        <div className="h-9 px-3 flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.08] text-[14px] text-gray-600 dark:text-white/40 opacity-70">
                           <CalendarDays className={cn("w-4 h-4 shrink-0", ACCENT.text)} />
                           {(() => { const { date, time } = formatDate(currentUser.created_at || currentUser.createdAt || ""); return `${date}  ${time}` })()}
                        </div>
                     </div>
                  )}
                  {currentUser?.id && (currentUser as any).updated_at && (
                     <div className="space-y-1.5">
                        <Label className="text-[14px] font-black text-gray-600 dark:text-white/30">
                           {isKh ? "កែប្រែចុងក្រោយ" : "Last Updated"}
                        </Label>
                        <div className="h-9 px-3 flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.08] text-[12px] text-gray-500 dark:text-white/40 opacity-70">
                           <CalendarDays className={cn("w-4 h-4 shrink-0", ACCENT.text)} />
                           {(() => { const { date, time } = formatDate((currentUser as any).updated_at); return `${date}  ${time}` })()}
                        </div>
                     </div>
                  )}
               </div>
               <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg shrink-0">
                  <div className="flex justify-end gap-2 w-full">
                     <button onClick={() => setIsDialogOpen(false)} disabled={saving}
                        className="h-9 px-5 rounded-lg text-[14px] font-bold transition-all border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50" >
                        {t("cancel")}
                     </button>
                     <button onClick={() => handleSave(false)} disabled={saving}
                        className="h-9 px-6 rounded-lg text-[14px] font-bold text-white flex items-center gap-2 transition-all disabled:opacity-60 active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? (isKh ? "កំពុងរក្សា..." : "Saving...") : t("save")}
                     </button>
                  </div>
               </DialogFooter>
            </DialogContent>
         </Dialog>
         <Dialog open={!!imageToCrop} onOpenChange={() => setImageToCrop(null)}>
            <DialogContent className="max-w-md p-0 border-0 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
               <DialogHeader className="sr-only"><DialogTitle>Crop Image</DialogTitle><DialogDescription>Adjust profile picture</DialogDescription></DialogHeader>
               <div className="relative h-[350px] w-full bg-black">
                  <Cropper image={imageToCrop || ""} crop={crop} zoom={zoom} aspect={1}
                     onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
               </div>
               <div className="p-5 space-y-4 bg-white dark:bg-[#22263a]" style={SORA}>
                  <div className="space-y-2">
                     <div className="flex justify-between text-[10px] font-bold text-gray-600 dark:text-white/30 uppercase tracking-widest">
                        <span>Zoom</span><span>{Math.round(zoom * 100)}%</span>
                     </div>
                     <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={v => setZoom(v[0])} />
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setImageToCrop(null)}
                        className="flex-1 h-10 rounded-lg text-[12px] font-bold text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all border border-gray-200 dark:border-white/[0.10]">
                        {t("cancel")}
                     </button>
                     <button onClick={handleApplyCrop}
                        className="flex-1 h-10 rounded-lg text-[12px] font-bold text-white flex items-center justify-center gap-2 transition-all bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90">
                        <Check className="w-4 h-4" />{isKh ? "អនុវត្ត Crop" : "Apply Crop"}
                     </button>
                  </div>
               </div>
            </DialogContent>
         </Dialog>
         <ConfirmDialog
            open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}
            onConfirm={confirmDelete} loading={deleting} variant="danger" icon={Trash2}
            title={isKh ? "បញ្ជាក់ការលុប" : "Confirm Delete"}
            description={isKh ? "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។" : "This action cannot be undone."}
            highlight={itemToDelete?.username}
            confirmLabel={isKh ? "លុបចោល" : t("delete")} cancelLabel={t("cancel")}
         />
         <ConfirmDialog
            open={showRoleWarning} onOpenChange={setShowRoleWarning}
            onConfirm={() => { setShowRoleWarning(false); handleSave(true) }}
            variant="warning" icon={Check}
            title={isKh ? "បញ្ជាក់ការផ្លាស់ប្តូរ Role" : "Confirm Role Change"}
            description={isKh
               ? `អ្នកកំពុងផ្លាស់ប្តូរ "${currentUser?.username}" ពី Administrator ទៅ Role ផ្សេង។`
               : `You are changing "${currentUser?.username}" from Administrator to another role.`}
            confirmLabel={isKh ? "បញ្ជាក់" : "Confirm"} cancelLabel={t("cancel")}
         />
      </div>
   )
}