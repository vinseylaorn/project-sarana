"use client"

import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar, navigation, NavItem } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { DataTableCustom } from "@/components/ui/table"
import {
   Dialog, DialogContent, DialogHeader, DialogTitle,
   DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toastSuccess, toastError, toastWarn } from "@/lib/toast"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
   Search, Plus, Eye, Edit2, Trash2, Loader2,
   Shield, Users, RotateCcw, AlertTriangle, ChevronRight, Check,
   UserX, Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { rolesApi } from "@/lib/api"
import type { User as ApiUser } from "@/types"
import { usePermission, useRole } from "@/lib/role-context"
import { getAvatarUrl } from "@/lib/avatar"
import { useRolesList, useRolesMutations } from "@/hooks/settings/use-roles"
import { useUsersList } from "@/hooks/settings/use-users"

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

const INPUT_ERR = "border-rose-400 dark:border-rose-500/50"

const KPI = {
   total: {
      bg: "bg-white dark:bg-[#22263a]",
      border: "border-white dark:border-[#22263a]",
      text: "!text-[#03624C] dark:!text-emerald-300",
      label: "text-gray-600 dark:text-gray-200",
      icon: "text-[#03624C] dark:text-emerald-300",
      iconBg: "bg-[#03624C]/10 dark:bg-emerald-400/20",
   },
   users: {
      bg: "bg-white dark:bg-[#22263a]",
      border: "border-white dark:border-[#22263a]",
      text: "!text-[#1857D8] dark:!text-[#6b9fff]",
      label: "text-gray-600 dark:text-gray-200",
      icon: "text-[#1857D8] dark:text-[#6b9fff]",
      iconBg: "bg-[#1857D8]/10 dark:bg-[#1857D8]/20",
   },
   admin: {
      bg: "bg-white dark:bg-[#22263a]",
      border: "border-white dark:border-[#22263a]",
      text: "!text-amber-700 dark:!text-amber-300",
      label: "text-gray-600 dark:text-gray-200",
      icon: "text-amber-600 dark:text-amber-300",
      iconBg: "bg-amber-100 dark:bg-amber-400/20",
   },
}

type PermKey = "view" | "create" | "edit" | "delete"
const PERMS: PermKey[] = ["view", "create", "edit", "delete"]

/**
 * Dependency នេះផ្តល់តែ "view" នៃ page មេ (ដើម្បីឲ្យ menu/route ចូលបាន)
 * វាមិនផ្តល់ create/edit/delete ទេ។
 */
const PAGE_DEPS: Record<string, { requires: string[]; label: string; labelKh: string }> = {
   reports: { requires: ["finance", "inventory", "orders"], label: "Reports", labelKh: "របាយការណ៍" },
   "overview-report": { requires: ["finance", "inventory", "orders"], label: "Overview Report", labelKh: "របាយការណ៍ទូទៅ" },
   "shift-report": { requires: ["finance", "inventory", "orders"], label: "Shift Report", labelKh: "របាយការណ៍វេន" },
   "inventory-report": { requires: ["finance", "inventory", "orders"], label: "Inventory Report", labelKh: "របាយការណ៍ស្តុក" },
   roles: { requires: ["settings"], label: "Role Management", labelKh: "កំណត់សិទ្ធិ" },
   staff: { requires: ["settings"], label: "Staff", labelKh: "បុគ្គលិក" },
   users: { requires: ["settings"], label: "Users", labelKh: "អ្នកប្រើប្រាស់" },
   workshifts: { requires: ["settings"], label: "Working Shifts", labelKh: "វេនធ្វើការ" },
}

/** pageKey ដែលមានតែ View (Dashboard + Reports ទាំង៣) */
const VIEW_ONLY_PAGES = [
   "dashboard",
   "reports",
   "overview-report",
   "shift-report",
   "inventory-report",
   "orders-history",
   "transactions",
]

/** href ដែលមានតែ View — សូមពិនិត្យឲ្យត្រូវនឹង href ពិតក្នុង sidebar */
const VIEW_ONLY_HREFS = [
   "/sale/transactions",
   "/order-history",
   "/stock-history",
]

/** Page ដែលលាក់ពី UI (រក្សាទិន្នន័យសិទ្ធិដើម មិនលុប) */
const HIDDEN_PAGE_KEYS = ["pos"]
const HIDDEN_HREFS = ["/pos"]
const isHiddenPage = (p: any) =>
   HIDDEN_PAGE_KEYS.includes(p.pageKey) ||
   HIDDEN_HREFS.some(h => p.href?.startsWith(h))

const isViewOnlyPage = (p: any) =>
   VIEW_ONLY_PAGES.includes(p.pageKey) ||
   VIEW_ONLY_HREFS.some(h => p.href?.includes(h))

const extractSystemPages = () => {
   const pages: any[] = []
   const seenKeys = new Set<string>()

   const addPage = (item: NavItem, parentLabel?: string, parentLabelKh?: string) => {
      if (!item.pageKey || !item.href) return
      const uniqueKey = `${item.pageKey}::${item.href}`
      if (seenKeys.has(uniqueKey)) return
      seenKeys.add(uniqueKey)
      pages.push({
         page: item.pageKey,
         pageKey: item.pageKey,
         permKey: uniqueKey,
         label: item.name,
         labelKh: item.labelKh || item.name,
         section: parentLabel || null,
         sectionKh: parentLabelKh || null,
         href: item.href,
         isDashboard: item.pageKey === "dashboard",
      })
   }

   navigation.forEach(item => {
      if (item.isDropdown && item.subItems) {
         item.subItems.forEach(sub => addPage(sub, item.name, item.labelKh))
      } else {
         addPage(item)
      }
   })

   return pages
}

export const SYSTEM_PAGES = extractSystemPages()

const isAdminRole = (name: string) => ["administrator", "admin"].includes(name?.toLowerCase())

const emptyPerms = () => ({ view: false, create: false, edit: false, delete: false })

function mergeWithSystemPages(savedPages: any[]): any[] {
   const savedMap = new Map<string, any>()
   for (const p of savedPages) {
      const k = p.permKey || p.pageKey || p.page
      if (!savedMap.has(k)) savedMap.set(k, p)
      if (p.pageKey && !savedMap.has(p.pageKey)) savedMap.set(p.pageKey, p)
   }
   return SYSTEM_PAGES.map(sp => {
      const saved = savedMap.get(sp.permKey) || savedMap.get(sp.pageKey)
      const perms = { ...emptyPerms(), ...(saved?.permissions ?? {}) }
      // សម្អាត permission ចាស់ ក្នុង page ដែលមានតែ View
      if (isViewOnlyPage(sp)) {
         perms.create = false
         perms.edit = false
         perms.delete = false
      }
      return { ...sp, permissions: perms }
   })
}

const hasAnyPerm = (p: any) => PERMS.some(k => p.permissions?.[k])

/** បើ page ណាមួយមាន permission ណាមួយ => ផ្តល់ view ដល់ page ដែលវាពឹងផ្អែក (view តែប៉ុណ្ណោះ) */
function applyPageDependencies(pages: any[], changedPageKey: string): { pages: any[]; autoGrantedLabels: string[] } {
   const dep = PAGE_DEPS[changedPageKey]
   if (!dep) return { pages, autoGrantedLabels: [] }
   const autoGrantedLabels: string[] = []
   const updated = pages.map(p => {
      if (!dep.requires.includes(p.pageKey)) return p
      if (p.permissions.view) return p
      autoGrantedLabels.push(p.labelKh || p.label)
      return { ...p, permissions: { ...p.permissions, view: true } }
   })
   return { pages: updated, autoGrantedLabels }
}

function ensureAllDependencies(pages: any[]): any[] {
   // page ណាមានសិទ្ធិណាមួយ => ត្រូវមាន View ជានិច្ច
   pages = pages.map(p =>
      hasAnyPerm(p) && !p.permissions.view
         ? { ...p, permissions: { ...p.permissions, view: true } }
         : p
   )
   let result = [...pages]
   for (const pg of pages) {
      if (!hasAnyPerm(pg)) continue
      const dep = PAGE_DEPS[pg.pageKey]
      if (!dep) continue
      result = result.map(p =>
         dep.requires.includes(p.pageKey) && !p.permissions.view
            ? { ...p, permissions: { ...p.permissions, view: true } }
            : p
      )
   }
   return result
}

const ErrMsg = ({ msg }: { msg: string }) => (
   <p className="flex items-center gap-1 text-[14px] text-rose-500 dark:text-rose-400 mt-1 font-medium">
      <AlertTriangle className="w-3 h-3 shrink-0" />{msg}
   </p>
)

function KpiCard({
   label, value, sub, style, icon: Icon, delay,
}: {
   label: string; value: number; sub?: string
   style: typeof KPI.total; icon: React.ElementType; delay: number
}) {
   return (
      <motion.div
         initial={{ opacity: 0, y: 14 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.35, delay, ease: "easeOut" }}
         whileHover={{ y: -3, transition: { duration: 0.18 } }}
         className="flex-1 min-w-[160px]" >
         <Card className={cn("border rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40", style.bg, style.border)}>
            <CardContent className="p-2">
               <div className="flex items-center justify-between gap-3 mb-4">
                  <p className={cn("flex items-center gap-1.5 min-w-0 text-[14px] font-bold uppercase", style.label)}>
                     <span className="truncate">{label}</span>
                  </p>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", style.iconBg)}>
                     <Icon className={cn("w-4 h-4", style.icon)} />
                  </div>
               </div>
               <p className={cn("text-[22px] font-bold text-center leading-none tabular-nums mb-2.5", style.text)}>
                  {value}
               </p>
               {sub && (
                  <div className="flex items-center gap-1.5">
                     <p className={cn("text-[14px]", style.label)}>{sub}</p>
                  </div>
               )}
            </CardContent>
         </Card>
      </motion.div>
   )
}

const formatDateCell = (raw?: string) => {
   if (!raw) return <span className="text-gray-300 dark:text-white/20 text-[14px]">—</span>
   const d = new Date(raw)
   const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
   const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
   return (
      <div className="flex flex-col gap-0.5">
         <span className="text-[14px] text-gray-700 dark:text-white/70">{date}</span>
         <span className="text-[12px] text-gray-600 dark:text-white/30">{time}</span>
      </div>
   )
}

export default function RolePage() {
   const { i18n } = useTranslation()
   const isKh = i18n.language === "kh" || i18n.language === "khmer"
   const { t } = useTranslation("common")
   const { can } = usePermission("roles")
   const { user: currentUser, refreshUser } = useRole()

   const { data: roles = [], isLoading: rolesLoading } = useRolesList()
   const { data: allUsers = [], isLoading: usersLoading } = useUsersList()
   const loading = rolesLoading || usersLoading
   const { create, update, remove } = useRolesMutations()
   const saving = create.isPending || update.isPending
   const deleting = remove.isPending

   const [search, setSearch] = useState("")
   const [isDialogOpen, setIsDialogOpen] = useState(false)
   const [isViewMode, setIsViewMode] = useState(false)
   const [editingRole, setEditingRole] = useState<any>(null)
   const [dialogLoading, setDialogLoading] = useState(false)
   const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
   const [roleToDelete, setRoleToDelete] = useState<any>(null)
   const [nameError, setNameError] = useState<string | undefined>()
   const [depInfo, setDepInfo] = useState<string[]>([])
   const originalSnapshot = useRef<string>("")
   // ឈ្មោះ role ដើមមុនកែ (សម្រាប់ប្រៀបធៀបជាមួយ user ឥឡូវ)
   const originalRoleName = useRef<string>("")
   const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false)
   const [usersDialogRole, setUsersDialogRole] = useState<any>(null)
   const [roleUsers, setRoleUsers] = useState<ApiUser[]>([])
   const [usersLoading2, setUsersLoading2] = useState(false)
   const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({
      key: null, direction: "asc",
   })

   const getUsersForRole = (roleName: string) => allUsers.filter(u => u.role === roleName)

   const handleOpenAdd = () => {
      setIsViewMode(false); setNameError(undefined); setDepInfo([])
      const newRole = {
         name: "", description: "",
         pages: SYSTEM_PAGES.map(p => ({ ...p, permissions: emptyPerms() })),
      }
      originalRoleName.current = ""
      setEditingRole(newRole)
      originalSnapshot.current = JSON.stringify(newRole)
      setIsDialogOpen(true)
   }

   const handleOpenEdit = async (role: any, viewOnly = false) => {
      setIsViewMode(viewOnly); setNameError(undefined); setDepInfo([])
      setIsDialogOpen(true); setDialogLoading(true)
      originalRoleName.current = role?.name ?? ""
      try {
         const full = await rolesApi.get(role.id)
         originalRoleName.current = full?.name ?? role?.name ?? ""
         const clone = { ...full, pages: mergeWithSystemPages(full.pages ?? []) }
         setEditingRole(clone)
         originalSnapshot.current = JSON.stringify(clone)
      } catch {
         const fallback = { ...role, pages: mergeWithSystemPages(role.pages ?? []) }
         setEditingRole(fallback)
         originalSnapshot.current = JSON.stringify(fallback)
         toastWarn(isKh ? "ប្រើទិន្នន័យ cache" : "Using cached data")
      } finally { setDialogLoading(false) }
   }

   const handleOpenUsers = async (role: any) => {
      setUsersDialogRole(role); setIsUsersDialogOpen(true); setUsersLoading2(true)
      try { setRoleUsers(await rolesApi.users(role.id)) }
      catch { setRoleUsers(getUsersForRole(role.name)) }
      finally { setUsersLoading2(false) }
   }

   /**
    * permission នីមួយៗឯករាជ្យ។
    * Page ដែលមានតែ View មិនអាចបើក create/edit/delete បានទេ។
    */
   const handleTogglePerm = (pageIdx: number, perm: PermKey) => {
      if (isViewMode) return
      const pg = editingRole.pages[pageIdx]
      if (isViewOnlyPage(pg) && perm !== "view") return
      const newVal = !pg.permissions[perm]

      // tick Create/Edit/Delete => View នៃ page ដដែល auto tick
      let newPages = editingRole.pages.map((p: any, i: number) =>
         i !== pageIdx
            ? p
            : {
               ...p,
               permissions: {
                  ...p.permissions,
                  [perm]: newVal,
                  ...(newVal && perm !== "view" ? { view: true } : {}),
               },
            }
      )

      if (newVal) {
         const { pages: withDeps, autoGrantedLabels } = applyPageDependencies(newPages, pg.pageKey)
         newPages = withDeps
         if (autoGrantedLabels.length > 0) {
            const msg = isKh
               ? `បន្ថែម View ស្វ័យប្រវត្តិ: ${autoGrantedLabels.join(", ")}`
               : `Auto-granted View on: ${autoGrantedLabels.join(", ")}`
            setDepInfo([msg])
            toastWarn(msg, isKh ? "ចាំបាច់សម្រាប់ page នេះ" : "Required by this page")
         } else { setDepInfo([]) }
      } else { setDepInfo([]) }

      setEditingRole({ ...editingRole, pages: newPages })
   }

   const toggleAllInColumn = (perm: PermKey) => {
      if (isViewMode) return
      const isLocked = (p: any) => isHiddenPage(p) || (isViewOnlyPage(p) && perm !== "view")
      const eligible = editingRole.pages.filter((p: any) => !isLocked(p))
      const allChecked = eligible.every((p: any) => p.permissions[perm])

      let newPages = editingRole.pages.map((p: any) =>
         isLocked(p)
            ? p
            : {
               ...p,
               permissions: {
                  ...p.permissions,
                  [perm]: !allChecked,
                  ...(!allChecked && perm !== "view" ? { view: true } : {}),
               },
            }
      )

      if (!allChecked) newPages = ensureAllDependencies(newPages)
      setDepInfo([])
      setEditingRole({ ...editingRole, pages: newPages })
   }

   const handleSave = async () => {
      if (!editingRole?.name?.trim()) {
         setNameError(isKh ? "សូមបញ្ចូលឈ្មោះតួនាទី" : "Role name is required")
         return
      }
      if (editingRole.id && JSON.stringify(editingRole) === originalSnapshot.current) {
         toastWarn(isKh ? "មិនមានការផ្លាស់ប្តូរ" : "No changes detected")
         return
      }
      // សម្អាត create/edit/delete នៃ page ដែលមានតែ View មុនផ្ញើទៅ backend
      const finalPages = ensureAllDependencies(editingRole.pages).map((p: any) =>
         isViewOnlyPage(p)
            ? { ...p, permissions: { ...p.permissions, create: false, edit: false, delete: false } }
            : p
      )
      const payload = {
         name: editingRole.name,
         description: editingRole.description ?? "",
         pages: finalPages,
      }
      try {
         if (editingRole.id) {
            const updated = await update.mutateAsync({ id: editingRole.id, payload })
            toastSuccess(
               isKh ? "ធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ" : "Updated successfully",
               isKh ? `សិទ្ធ "${updated.name}" ធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ` : `Role "${updated.name}" has been updated successfully`
            )
            // បើកែ role ដែលខ្លួនឯងកំពុងប្រើ => ទាញ permission ថ្មី
            if (currentUser?.role && (currentUser.role === originalRoleName.current || currentUser.role === updated.name)) {
               await refreshUser()
            }
         } else {
            const created = await create.mutateAsync(payload)
            toastSuccess(
               isKh ? "បង្កើតដោយជោគជ័យ" : "Created successfully",
               isKh ? `សិទ្ធ "${created.name}" បានបង្កើតដោយជោគជ័យ` : `Role "${created.name}" has been created successfully`
            )
         }
         setIsDialogOpen(false)
      } catch (err: any) {
         toastError(isKh ? "រក្សាទុកមិនបាន" : "Save failed", err?.response?.data?.message ?? err?.message)
      }
   }

   const confirmDelete = async () => {
      if (!roleToDelete) return
      if ((roleToDelete.users_count ?? 0) > 0) {
         toastError(
            isKh ? "មិនអាចលុបបាន" : "Cannot delete",
            isKh
               ? `Role "${roleToDelete.name}" មាន ${roleToDelete.users_count} នាក់កំពុងប្រើ។ សូមផ្លាស់ប្តូរ Role អ្នកប្រើទាំងនោះមុននឹងលុប។`
               : `Role "${roleToDelete.name}" has ${roleToDelete.users_count} user(s) assigned. Please reassign them before deleting.`
         )
         setIsDeleteAlertOpen(false)
         return
      }

      try {
         await remove.mutateAsync(roleToDelete.id)
         toastSuccess(
            isKh ? "លុបដោយជោគជ័យ" : "Deleted successfully",
            isKh ? `លុប "${roleToDelete.name}" បានដោយជោគជ័យ` : `Role "${roleToDelete.name}" has been deleted successfully`
         )
      } catch (err: any) {
         toastError(isKh ? "លុបមិនបាន" : "Delete failed", err?.response?.data?.message ?? err?.message)
      } finally { setIsDeleteAlertOpen(false); setRoleToDelete(null) }
   }

   const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
   const adminCount = allUsers.filter(u => ["admin", "administrator"].includes(u.role?.toLowerCase() ?? "")).length

   const columns = [
      {
         key: "no", header: isKh ? "ល.រ" : "No.",
         render: (_: any, idx: number) => (
            <span className="text-[14px] text-gray-600 dark:text-white/25 tabular-nums">
               {String(idx + 1).padStart(2, "0")}
            </span>
         ),
      },
      {
         key: "name", header: isKh ? "ឈ្មោះតួនាទី" : "Role Name",
         render: (item: any) => (
            <div className="flex items-center gap-2.5">
               <div>
                  <p className="text-[14px] text-gray-700 dark:text-white/80">{item.name}</p>
                  {item.description && <p className="text-[12px] text-gray-600 dark:text-white/30">{item.description}</p>}
               </div>
            </div>
         ),
      },
      {
         key: "users", header: isKh ? "អ្នកប្រើប្រាស់" : "Users System",
         render: (item: any) => {
            const localUsers = getUsersForRole(item.name)
            const count = item.users_count ?? localUsers.length
            return (
               <button onClick={() => handleOpenUsers(item)}
                  className={cn(
                     "flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit transition-all group",
                     "bg-gray-50 dark:bg-white/[0.04] border-gray-100 dark:border-white/[0.06]",
                     "hover:bg-[#03624C]/[0.08] dark:hover:bg-[#1857D8]/[0.12]",
                     "hover:border-[#03624C]/20 dark:hover:border-[#1857D8]/25"
                  )}>
                  <Users className="w-3.5 h-3.5 text-gray-400 transition-colors group-hover:text-[#03624C] dark:group-hover:text-[#1857D8]" />
                  <span className="text-[14px] text-gray-600 dark:text-gray-400 transition-colors group-hover:text-[#03624C] dark:group-hover:text-[#1857D8]">{count}</span>
                  {localUsers.length > 0 && (
                     <div className="flex -space-x-1.5 ml-1">
                        {localUsers.slice(0, 3).map((u: any) => (
                           <Avatar key={u.id} className="w-5 h-5 rounded-full border-2 border-white dark:border-[#1e2235]">
                              <AvatarImage src={getAvatarUrl(u.image) || undefined} className="object-cover" />
                              <AvatarFallback className={cn("text-[8px] rounded-full bg-[#03624C]/10 dark:bg-[#1857D8]/20", ACCENT.text)}>
                                 {(u.username || "?").charAt(0).toUpperCase()}
                              </AvatarFallback>
                           </Avatar>
                        ))}
                     </div>
                  )}
               </button>
            )
         },
      },
      { key: "createdAt", header: isKh ? "កាលបរិច្ឆេទ" : "Created At", render: (item: any) => formatDateCell(item.created_at) },
      { key: "updatedAt", header: isKh ? "កែប្រែចុងក្រោយ" : "Last Updated", render: (item: any) => formatDateCell(item.updated_at) },
      {
         key: "actions", header: isKh ? "សកម្មភាព" : "Actions", className: "text-right",
         render: (item: any) => (
            <div className="flex items-center justify-end gap-1">
               {can("view") && (
                  <button
                     onClick={() => handleOpenEdit(item, true)}
                     className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                     text-blue-700 bg-blue-50 border border-blue-200
                     hover:bg-blue-100 hover:border-blue-300
                     dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-700/40
                     dark:hover:bg-blue-900/40 dark:hover:border-blue-500
                     transition-all duration-150"
                     title={isKh ? "មើលលម្អិត" : "View Details"}
                  >
                     <Eye className="w-3.5 h-3.5" />
                  </button>
               )}
               {can("edit") && (
                  <button
                     onClick={() => handleOpenEdit(item, false)}
                     className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                     text-amber-700 bg-amber-50 border border-amber-200
                     hover:bg-amber-100 hover:border-amber-300
                     dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-700/40
                     dark:hover:bg-amber-900/40 dark:hover:border-amber-500
                     transition-all duration-150"
                     title={isKh ? "កែប្រែ" : "Edit"}
                  >
                     <Edit2 className="w-3.5 h-3.5" />
                  </button>
               )}
               {can("delete") && !isAdminRole(item.name) && (
                  <button
                     onClick={() => { setRoleToDelete(item); setIsDeleteAlertOpen(true) }}
                     title={isKh ? "លុបចោល" : "Delete"}
                     className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                     text-rose-700 bg-rose-50 border border-rose-200
                     hover:bg-rose-100 hover:border-rose-300
                     dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-700/40
                     dark:hover:bg-rose-900/40 dark:hover:border-rose-500
                     transition-all duration-150"
                  >
                     <Trash2 className="w-3.5 h-3.5" />
                  </button>
               )}
            </div>
         ),
      },
   ]

   if (loading) return (
      <div className="h-screen bg-gray-50 dark:bg-[#13151f] flex items-center justify-center flex-col gap-4" style={SORA}>
         <Loader2 className={cn("w-5 h-5 animate-spin", ACCENT.text)} />
         <span className={cn("text-[14px] font-bold uppercase tracking-[0.2em] animate-pulse", ACCENT.text)}>
            {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
         </span>
      </div>
   )

   return (
      <div className="flex h-screen bg-gray-50 dark:bg-[#13151f] overflow-hidden transition-colors duration-300" style={SORA}>
         <Sidebar />
         <div className="flex-1 flex flex-col overflow-hidden">
            <Header
               title={isKh ? "គ្រប់គ្រងតួនាទី" : "Role Management"}
               subtitle={isKh ? "កំណត់សិទ្ធិប្រើប្រាស់" : "Manage staff access permissions"}
            />
            <main className="flex-1 p-5 space-y-4 overflow-hidden flex flex-col">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
                  <KpiCard label={isKh ? "តួនាទីសរុប" : "Total Roles"} value={roles.length} sub={isKh ? "តួនាទី" : "roles"} style={KPI.total} icon={Shield} delay={0} />
                  <KpiCard label={isKh ? "អ្នកប្រើប្រាស់" : "Total Users"} value={allUsers.length} sub={isKh ? "នាក់" : "users"} style={KPI.users} icon={Users} delay={0.07} />
                  <KpiCard label={isKh ? "Admin សរុប" : "Total Admins"} value={adminCount} sub={isKh ? "Admin" : "admins"} style={KPI.admin} icon={Shield} delay={0.14} />
               </div>
               <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.22 }}
                  className="flex justify-between items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 dark:text-white/25 pointer-events-none" />
                        <input
                           className={cn(INPUT, "w-60 pl-8")}
                           placeholder={isKh ? "ស្វែងរកតួនាទី..." : "Search by role name..."}
                           value={search}
                           onChange={e => setSearch(e.target.value)}
                        />
                     </div>
                     <AnimatePresence>
                        {search && (
                           <motion.button
                              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                              onClick={() => setSearch("")}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
                           >
                              <RotateCcw className="w-3.5 h-3.5" />
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
                        <Plus className="w-3.5 h-3.5" />{isKh ? "បន្ថែមតួនាទី" : "Add Role"}
                     </motion.button>
                  )}
               </motion.div>
               <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="flex-1 overflow-hidden" >
                  <Card className="h-full border-0 shadow-none bg-transparent flex flex-col">
                     <DataTableCustom
                        data={filteredRoles} columns={columns} totalItems={filteredRoles.length}
                        totalPages={1} currentPage={1} onPageChange={() => { }} itemsPerPage={10}
                        language={i18n.language as any} sortConfig={sortConfig}
                        onSort={key => setSortConfig(prev => ({
                           key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
                        }))}
                     />
                  </Card>
               </motion.div>
            </main>
         </div>

         {/* ───────── Role dialog ───────── */}
         <Dialog open={isDialogOpen} onOpenChange={v => { if (!saving) setIsDialogOpen(v) }}>
            <DialogContent
               className="max-w-lg max-h-[90vh] p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] flex flex-col overflow-hidden [&>button]:hidden"
               style={SORA} >
               <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0 bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
                  <div className="flex items-center gap-2.5">
                     <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", ACCENT.iconBg)}>
                        <Shield className="w-4 h-4 text-white" />
                     </div>
                     <div>
                        <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                           {isViewMode
                              ? (isKh ? "ព័ត៌មានលម្អិត" : "Details")
                              : editingRole?.id
                                 ? (isKh ? "កែប្រែតួនាទី" : "Edit Role")
                                 : (isKh ? "បន្ថែមតួនាទីថ្មី" : "Add New Role")}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Role form</DialogDescription>
                     </div>
                  </div>
               </DialogHeader>
               {dialogLoading ? (
                  <div className="flex items-center justify-center py-20 gap-3">
                     <Loader2 className={cn("w-6 h-6 animate-spin", ACCENT.text)} />
                     <span className="text-[14px] text-gray-600 dark:text-white/30 font-medium">
                        {isKh ? "កំពុងទាញ..." : "Loading permissions..."}
                     </span>
                  </div>
               ) : (
                  <div className="p-6 space-y-5 flex-1 min-h-0 flex flex-col">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                        <div className="space-y-1.5">
                           <Label className={cn("text-[14px] uppercase tracking-wider text-gray-600 dark:text-white/30", nameError && "text-rose-500")}>
                              {isKh ? "ឈ្មោះតួនាទី" : "Role Name"}
                              {!isViewMode && <span className="text-rose-500 ml-0.5">*</span>}
                           </Label>
                           <input
                              disabled={isViewMode}
                              className={cn(INPUT, nameError && INPUT_ERR)}
                              placeholder={isKh ? "ឧ. Administrator..." : "e.g. Administrator..."}
                              value={editingRole?.name || ""}
                              onChange={e => { setEditingRole({ ...editingRole, name: e.target.value }); setNameError(undefined) }}
                           />
                           {nameError && <ErrMsg msg={nameError} />}
                        </div>
                        <div className="space-y-1.5">
                           <Label className="text-[14px] uppercase tracking-wider text-gray-600 dark:text-white/30">
                              {isKh ? "ការពិពណ៌នា" : "Description"}
                           </Label>
                           <input
                              disabled={isViewMode}
                              className={INPUT}
                              placeholder={isKh ? "ពណ៌នាអំពីតួនាទី..." : "Describe this role..."}
                              value={editingRole?.description || ""}
                              onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                           />
                        </div>
                     </div>
                     {depInfo.length > 0 && (
                        <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3 shrink-0">
                           <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                           <div className="space-y-1">
                              {depInfo.map((msg, i) => (
                                 <p key={i} className="text-[12px] text-amber-700 dark:text-amber-300 font-medium">{msg}</p>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Scroll តែក្នុង table — header (View/Create/Edit/Delete) ជាប់ខាងលើជានិច្ច */}
                     <div className="rounded-xl border border-gray-100 dark:border-white/[0.08] overflow-auto min-h-0 flex-1 max-h-[50vh]">
                        <table className="w-full text-[14px] border-separate border-spacing-0">
                           <thead className="text-gray-600 dark:text-white/40 font-bold uppercase text-[12px] tracking-wider">
                              <tr>
                                 <th className="sticky top-0 z-20 px-4 py-3 text-left border-b border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-[#252a3d]">
                                    {isKh ? "ឈ្មោះទំព័រ" : "Page / Module"}
                                 </th>
                                 {PERMS.map(p => (
                                    <th key={p} className="sticky top-0 z-20 px-3 py-3 text-center border-b border-gray-100 dark:border-white/[0.06] w-16 bg-gray-50 dark:bg-[#252a3d]">
                                       <button
                                          disabled={isViewMode}
                                          onClick={() => toggleAllInColumn(p)}
                                          className={cn(
                                             "uppercase outline-none transition-colors",
                                             isViewMode ? "cursor-default opacity-50" : "cursor-pointer hover:opacity-70",
                                             ACCENT.text
                                          )}
                                       >
                                          {isKh
                                             ? (p === "view" ? "មើល" : p === "create" ? "បង្កើត" : p === "edit" ? "កែ" : "លុប")
                                             : p}
                                       </button>
                                    </th>
                                 ))}
                              </tr>
                           </thead>
                           <tbody className="bg-white dark:bg-transparent">
                              {(() => {
                                 const visiblePages = (editingRole?.pages ?? [])
                                    .map((pg: any, idx: number) => ({ pg, idx }))
                                    .filter(({ pg }: any) => !isHiddenPage(pg))
                                 return visiblePages.map(({ pg, idx }: any, vi: number) => {
                                    const prevPg = visiblePages[vi - 1]?.pg
                                    const showSection = pg.section && pg.section !== prevPg?.section
                                    const isViewOnly = isViewOnlyPage(pg)
                                    return (
                                       <React.Fragment key={pg.permKey || pg.pageKey}>
                                          {showSection && (
                                             <tr className="bg-gray-50/80 dark:bg-white/[0.02]">
                                                <td colSpan={5} className="px-4 py-1.5 border-b border-gray-100 dark:border-[#22263a]">
                                                   <span className={cn("text-[11px] font-black uppercase tracking-[2px]", ACCENT.text)}>
                                                      {isKh ? pg.sectionKh : pg.section}
                                                   </span>
                                                </td>
                                             </tr>
                                          )}
                                          <tr>
                                             <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-[#22263a]">
                                                <div className="flex items-center gap-2">
                                                   <ChevronRight className={cn("w-3 h-3 shrink-0 opacity-40", ACCENT.text)} />
                                                   <span className="text-[14px]">{isKh ? pg.labelKh : pg.label}</span>
                                                </div>
                                             </td>
                                             {PERMS.map(perm => {
                                                if (isViewOnly && perm !== "view") {
                                                   return (
                                                      <td key={perm} className="px-3 py-2.5 text-center border-b border-gray-100 dark:border-[#22263a]">
                                                         <span className="text-[14px] text-gray-200 dark:text-white/10 font-bold select-none">—</span>
                                                      </td>
                                                   )
                                                }
                                                return (
                                                   <td key={perm} className="px-3 py-2.5 text-center border-b border-gray-100 dark:border-[#22263a]">
                                                      <button
                                                         disabled={isViewMode}
                                                         onClick={() => handleTogglePerm(idx, perm)}
                                                         className={cn(
                                                            "w-6 h-6 rounded-md border mx-auto flex items-center justify-center transition-all",
                                                            pg.permissions[perm]
                                                               ? "bg-[#03624C] dark:bg-[#1857D8] text-white border-[#03624C] dark:border-[#1857D8] shadow-sm"
                                                               : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20",
                                                            isViewMode && "opacity-50 cursor-not-allowed pointer-events-none",
                                                         )}
                                                      >
                                                         {pg.permissions[perm] && <Check className="w-3 h-3" strokeWidth={3} />}
                                                      </button>
                                                   </td>
                                                )
                                             })}
                                          </tr>
                                       </React.Fragment>
                                    )
                                 })
                              })()}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}
               <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg shrink-0">
                  <div className="flex justify-end gap-2 w-full">
                     <button
                        onClick={() => setIsDialogOpen(false)}
                        disabled={saving}
                        className="h-9 px-5 rounded-lg text-[14px] font-bold transition-all border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50" >
                        {isKh ? "បោះបង់" : "Cancel"}
                     </button>
                     {!isViewMode && (
                        <button
                           onClick={handleSave}
                           disabled={saving || dialogLoading}
                           className="h-9 px-6 rounded-lg text-[14px] font-bold text-white flex items-center gap-2 transition-all disabled:opacity-60 active:scale-[0.97] bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90" >
                           {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                           {saving ? (isKh ? "កំពុងរក្សា..." : "Saving...") : t("save")}
                        </button>
                     )}
                  </div>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         {/* ───────── Users dialog ───────── */}
         <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
            <DialogContent className="max-w-sm p-0 border border-gray-200 dark:border-white/[0.13] shadow-2xl rounded-lg bg-white dark:bg-[#1e2235] flex flex-col [&>button]:hidden" style={SORA}>
               <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0 bg-gray-50 dark:bg-[#22263a] rounded-t-lg">
                  <div className="flex items-center gap-2.5">
                     <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", ACCENT.iconBg)}>
                        <Shield className="w-4 h-4 text-white" />
                     </div>
                     <div>
                        <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                           {usersDialogRole?.name}
                        </DialogTitle>
                        <p className="text-[12px] text-gray-600 dark:text-white/30 mt-0.5">
                           {isKh ? "បញ្ជីអ្នកប្រើប្រាស់" : "Users assigned to this role"}
                        </p>
                     </div>
                  </div>
                  <DialogDescription className="sr-only">Users list</DialogDescription>
               </DialogHeader>
               <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
                  {usersLoading2 ? (
                     <div className="flex items-center justify-center py-10 gap-2">
                        <Loader2 className={cn("w-5 h-5 animate-spin", ACCENT.text)} />
                        <span className="text-[14px] text-gray-600 dark:text-white/30">{isKh ? "កំពុងទាញ..." : "Loading..."}</span>
                     </div>
                  ) : roleUsers.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.07] flex items-center justify-center">
                           <UserX className="w-5 h-5 text-gray-300 dark:text-white/20" />
                        </div>
                        <p className="text-[14px] text-gray-600 dark:text-white/30 font-medium">
                           {isKh ? "គ្មានអ្នកប្រើប្រាស់" : "No users assigned"}
                        </p>
                     </div>
                  ) : (
                     <div className="space-y-1 py-1">
                        {roleUsers.map((u: any) => (
                           <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                              <Avatar className="w-9 h-9 rounded-xl border border-gray-100 dark:border-white/[0.08] shrink-0">
                                 <AvatarImage src={getAvatarUrl(u.image) || undefined} className="object-cover" />
                                 <AvatarFallback className={cn("text-[12px] font-bold rounded-xl bg-[#03624C]/10 dark:bg-[#1857D8]/20", ACCENT.text)}>
                                    {(u.username || "?").charAt(0).toUpperCase()}
                                 </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                 <p className="text-[14px] font-semibold text-gray-700 dark:text-white/80 truncate">{u.username}</p>
                                 {u.email && <p className="text-[12px] text-gray-600 dark:text-white/30 truncate">{u.email}</p>}
                              </div>
                              <span className={cn(
                                 "text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                                 u.status === "Active"
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                    : "bg-gray-50 text-gray-400 border-gray-100 dark:bg-white/5 dark:text-white/30 dark:border-white/10"
                              )}>
                                 {u.status}
                              </span>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
               <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] rounded-b-lg">
                  <button
                     onClick={() => setIsUsersDialogOpen(false)}
                     className="h-9 px-5 rounded-lg text-[14px] font-bold transition-all border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06]" >
                     {isKh ? "បិទ" : "Close"}
                  </button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         <ConfirmDialog
            open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}
            onConfirm={confirmDelete} loading={deleting} variant="danger" icon={Trash2}
            title={isKh ? "បញ្ជាក់ការលុប" : "Confirm Delete"}
            description={isKh ? "សកម្មភាពនេះមិនអាចត្រឡប់វិញ" : "This action cannot be undone."}
            highlight={roleToDelete?.name}
            confirmLabel={isKh ? "លុបចោល" : "Delete"}
            cancelLabel={isKh ? "បោះបង់" : "Cancel"}
         />
      </div>
   )
}