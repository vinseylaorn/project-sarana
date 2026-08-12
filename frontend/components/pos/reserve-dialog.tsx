"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  Clock, X, CheckSquare, Square, AlertTriangle,
  User, Phone, CalendarDays, Minus, Plus, Trash2, Loader2,
  UtensilsCrossed, BadgePercent, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { menuCategoriesApi, menuItemsApi, tablesApi } from "@/lib/api"
import { discountsApi } from "@/lib/api/discount"
import { reservationsApi } from "@/lib/api/reservations"
import type { Table, MenuCategory, MenuItem, Reservation } from "@/types"
import { toast } from "sonner"

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }

interface PreOrderItem {
  id:             string
  name:           string
  price:          number
  original_price: number
  quantity:       number
  image?:         string | null
  discount?: {
    name:       string
    value:      number
    value_type: "percentage" | "flat"
  } | null
}

interface ReserveDialogProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  language:     string
  editData?:    Reservation | null
  onSuccess?:   () => void
}

const Field = ({
  icon: Icon, value, onChange, placeholder, error, type = "text",
}: {
  icon:         React.ElementType
  value:        string
  onChange:     (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  error?:       string
  type?:        string
}) => (
  <div className="relative">
    <Icon className={cn(
      "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors",
      error ? "text-rose-400" : "text-gray-300 dark:text-white/20",
    )} />
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn(
        "w-full h-9 pl-9 pr-3 text-[14px] font-medium rounded-lg outline-none transition-all",
        "bg-white dark:bg-white/[0.04]",
        "text-gray-800 dark:text-white/90",
        "placeholder:text-gray-500 dark:placeholder:text-white/20",
        error
          ? "border border-rose-400/60 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10"
          : "border border-gray-200 dark:border-white/[0.08] focus:border-[#03624C] dark:focus:border-[#4dab8e] focus:ring-2 focus:ring-[#03624C]/10 dark:focus:ring-[#4dab8e]/10",
      )}
    />
    {error && (
      <p className="flex items-center gap-1 mt-1 text-[12px] text-rose-500">
        <AlertTriangle className="w-3 h-3 shrink-0" />{error}
      </p>
    )}
  </div>
)

const pad = (n: number) => String(n).padStart(2, "0")

const toLocalInputValue = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

const getMinDatetime = () => {
  const d = new Date()
  d.setSeconds(0, 0)
  d.setMinutes(d.getMinutes() + 10)
  return toLocalInputValue(d)
}

const getMaxDatetime = () => {
  const d = new Date()
  d.setSeconds(0, 0)
  d.setDate(d.getDate() + 30)
  return toLocalInputValue(d)
}

export function ReserveDialog({
  open, onOpenChange, language, editData, onSuccess,
}: ReserveDialogProps) {
  const isKh   = language === "khmer"
  const isEdit = !!editData
  const [customerName,    setCustomerName]    = useState("")
  const [customerPhone,   setCustomerPhone]   = useState("")
  const [arrivalDatetime, setArrivalDatetime] = useState("")
  const [selectedIds,     setSelectedIds]     = useState<number[]>([])
  const [preItems,        setPreItems]        = useState<PreOrderItem[]>([])
  const [errors,          setErrors]          = useState<{ name?: string; phone?: string; datetime?: string }>({})
  const [submitting,      setSubmitting]      = useState(false)
  const [tableError,      setTableError]      = useState<string | null>(null)
  const [tables,     setTables]     = useState<Table[]>([])
  const [menuItems,  setMenuItems]  = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [activeTab,  setActiveTab]  = useState("all")
  const [loading,    setLoading]    = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setTableError(null)
    setActiveTab("all")

    if (editData) {
      setCustomerName(editData.customer_name ?? "")
      setCustomerPhone(editData.customer_phone ?? "")
      setArrivalDatetime(
        editData.arrival_datetime
          ? String(editData.arrival_datetime).slice(0, 16)
          : ""
      )
      setSelectedIds(editData.tables?.map(t => t.id) ?? [])
      setPreItems(
        editData.items?.map(i => ({
          id:             String(i.menu_item_id),
          name:           i.name,
          price:          Number(i.price),
          original_price: Number(i.original_price ?? i.price),
          quantity:       i.quantity,
          image:          null,
          discount:       i.discount_name ? {
            name:       i.discount_name,
            value:      Number(i.discount_value ?? 0),
            value_type: (i.discount_type ?? "percentage") as "percentage" | "flat",
          } : null,
        })) ?? []
      )
    } else {
      setCustomerName(""); setCustomerPhone("")
      setArrivalDatetime(""); setSelectedIds([]); setPreItems([])
    }

    setLoading(true)
    Promise.all([
      tablesApi.list(),
      menuItemsApi.list(),
      menuCategoriesApi.list(),
      discountsApi.list(),
    ]).then(([t, m, c, discounts]) => {

      const editTableIds = editData?.tables?.map(tb => tb.id) ?? []

      setTables(
        isEdit
          ? (t as Table[]).filter(tb =>
              tb.status === "available" ||
              editTableIds.includes(tb.id)
            )
          : (t as Table[]).filter(tb => tb.status === "available")
      )

      setCategories(c as MenuCategory[])

      const today = new Date().toISOString().slice(0, 10)
      const activeDiscounts = (discounts as any[]).filter(d => {
        if (d.status !== "active") return false
        if (d.start_date && d.start_date > today) return false
        if (d.end_date   && d.end_date   < today) return false
        return true
      })

      const withDiscount = (m as MenuItem[]).map(item => {
        if (item.discounted_price != null) return item
        const catDiscount = activeDiscounts.find(d => {
          if (d.scope !== "category") return false
          const ids: number[] = Array.isArray(d.target_ids) ? d.target_ids : d.target_id ? [d.target_id] : []
          return ids.includes(Number(item.category_id))
        })
        if (!catDiscount) return item
        const discounted_price = catDiscount.value_type === "percentage"
          ? parseFloat((item.price * (1 - catDiscount.value / 100)).toFixed(2))
          : parseFloat((item.price - catDiscount.value).toFixed(2))
        return {
          ...item,
          discount: { id: catDiscount.id, name: catDiscount.name, value: catDiscount.value, value_type: catDiscount.value_type },
          discounted_price: Math.max(0, discounted_price),
        }
      })
      setMenuItems(withDiscount)
    }).catch(() => {
      toast.error(isKh ? "មិនអាចផ្ទុកទិន្នន័យបានទេ" : "Failed to load data")
    }).finally(() => setLoading(false))
  }, [open, editData])

  const totalPrice = preItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalSaved = preItems.reduce((s, i) => s + Math.max(0, i.original_price - i.price) * i.quantity, 0)
  const filteredItems = activeTab === "all"
    ? menuItems
    : menuItems.filter(i => String(i.category_id) === activeTab)

  const toggleTable = (id: number) => {
    setTableError(null) 
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const addItem = (item: MenuItem) => {
    const effectivePrice = item.discounted_price != null ? item.discounted_price : item.price
    setPreItems(prev => {
      const ex = prev.find(i => i.id === String(item.id))
      if (ex) return prev.map(i => i.id === String(item.id) ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, {
        id: String(item.id), name: item.name,
        price: effectivePrice, original_price: item.price,
        quantity: 1, image: item.image,
        discount: item.discount ? {
          name: item.discount.name, value: item.discount.value,
          value_type: item.discount.value_type as "percentage" | "flat",
        } : null,
      }]
    })
  }

  const changeQty = (id: string, delta: number) =>
    setPreItems(prev =>
      prev.map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0)
    )

  const removeItem = (id: string) => setPreItems(prev => prev.filter(i => i.id !== id))

  const validate = () => {
    const e: { name?: string; phone?: string; datetime?: string } = {}
    if (!customerName.trim())
      e.name = isKh ? "សូមបញ្ចូលឈ្មោះអ្នកកក់" : "Please enter customer name"
    if (!customerPhone.trim())
      e.phone = isKh ? "សូមបញ្ចូលលេខទូរស័ព្ទ" : "Please enter phone number"
    else {
      const phoneDigits = customerPhone.replace(/\D/g, "")
      if (phoneDigits.length !== 9 && phoneDigits.length !== 10)
        e.phone = isKh
          ? "លេខទូរស័ព្ទត្រូវមាន ៩ ឬ ១០ ខ្ទង់ (ឧ. 012 345 678 ឬ 012 34 56 789)"
          : "Phone must be 9 or 10 digits (e.g. 012 345 678 or 012 34 56 789)"
    }

    if (arrivalDatetime) {
      const selected = new Date(arrivalDatetime)
      const minTime  = new Date(); minTime.setSeconds(0, 0); minTime.setMinutes(minTime.getMinutes() + 10)
      const maxTime  = new Date(); maxTime.setSeconds(0, 0); maxTime.setDate(maxTime.getDate() + 30)
      if (selected < minTime)
        e.datetime = isKh ? "ត្រូវតែកក់ទុកមុនយ៉ាងហោចណាស់ ១០ នាទី" : "Must be at least 10 minutes from now"
      else if (selected > maxTime)
        e.datetime = isKh ? "មិនអាចកក់លើស ៣០ ថ្ងៃ" : "Cannot book more than 30 days ahead"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleConfirm = async () => {
    if (!validate()) return

    if (selectedIds.length === 0) {
      setTableError(isKh ? "សូមជ្រើសតុយ៉ាងតិច ១" : "Please select at least one table")
      return
    }

    setSubmitting(true)
    setTableError(null)
    try {
      const payload = {
        customer_name:    customerName.trim(),
        customer_phone:   customerPhone.trim(),
        arrival_datetime: arrivalDatetime || undefined,
        table_ids:        selectedIds,
        items:            preItems.map(i => ({ id: Number(i.id), quantity: i.quantity })),
      }
      if (isEdit && editData) {
        await reservationsApi.update(editData.id, payload)
        toast.success(isKh ? "កែប្រែជោគជ័យ!" : "Reservation updated!")
      } else {
        const result = await reservationsApi.create(payload)
        toast.success(isKh ? `កក់តុជោគជ័យ! លេខ #${result.reservation.id}` : `Reservation #${result.reservation.id} created!`)
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      if (err?.unavailable_tables?.length) {
        setTableError(
          isKh
            ? `តុ ${err.unavailable_tables.join(", ")} មិនទំនេរ`
            : `Table(s) ${err.unavailable_tables.join(", ")} are no longer available`
        )
        const freshTables = await tablesApi.list().catch(() => []) as Table[]
        const editTableIds = editData?.tables?.map(tb => tb.id) ?? []
        setTables(
          isEdit
            ? (freshTables).filter(tb => tb.status === "available" || editTableIds.includes(tb.id))
            : (freshTables).filter(tb => tb.status === "available")
        )
        setSelectedIds(prev => prev.filter(id =>
          !err.unavailable_tables.includes(
            freshTables.find(t => t.id === id)?.name ?? ""
          )
        ))
      } else {
        toast.error(err.message ?? (isKh ? "មិនអាចរក្សាទុកបាន" : "Failed to save reservation"))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const lbl = {
    title:    isEdit ? (isKh ? "កែប្រែការកក់" : "Edit Reservation") : (isKh ? "កក់តុថ្មី" : "New Reservation"),
    confirm:  isEdit ? (isKh ? "រក្សាទុក" : "Save Changes") : (isKh ? "បញ្ជាក់ការកក់" : "Confirm Reservation"),
    all:      isKh ? "ទាំងអស់" : "All",
    noTables: isKh ? "មិនមានតុទំនេរ" : "No available tables",
    noItems:  isKh ? "មិនទាន់មានមុខម្ហូប" : "No items added yet",
    noMenu:   isKh ? "មិនមានមុខម្ហូប" : "No menu items",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[1060px] h-[88vh] flex flex-col p-0 overflow-hidden rounded-lg border border-gray-200 dark:border-white/[0.10] shadow-2xl [&>button]:hidden bg-white dark:bg-[#1a1d2e]"
        style={SORA} >
        <DialogTitle className="sr-only">{lbl.title}</DialogTitle>
        <div className="relative shrink-0 bg-[#03624C] dark:bg-[#03624C] overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="absolute -right-16 -top-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
                <Clock className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-[15px] font-black text-white tracking-tight leading-tight">{lbl.title}</h2>
                <p className="text-[11px] text-white/55 font-medium mt-0.5">
                  {isKh ? "ប្រព័ន្ធគ្រប់គ្រងការកក់" : "Reservation Management System"}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all text-white" >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex flex-1 min-h-0 bg-gray-50 dark:bg-[#13151f]">
          <div className="w-[290px] shrink-0 flex flex-col bg-white dark:bg-[#1a1d2e] border-r border-gray-100 dark:border-white/[0.06]">
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
              <div className="space-y-3">
                <p className="text-[14px] font-black uppercase  text-gray-600 dark:text-white/25 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {isKh ? "ព័ត៌មានអ្នកកក់" : "Customer Info"}
                </p>
                <Field
                  icon={User} value={customerName} error={errors.name}
                  placeholder={isKh ? "ឈ្មោះអ្នកកក់..." : "Full name..."}
                  onChange={e => { setCustomerName(e.target.value); setErrors(p => ({ ...p, name: undefined })) }}
                />
                <Field
                  icon={Phone} value={customerPhone} error={errors.phone}
                  placeholder="012 345 678"
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
                    const fmt =
                      digits.length <= 3 ? digits :
                      digits.length <= 6 ? `${digits.slice(0,3)} ${digits.slice(3)}` :
                      digits.length <= 9 ? `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}` :
                      `${digits.slice(0,3)} ${digits.slice(3,5)} ${digits.slice(5,7)} ${digits.slice(7,10)}`
                    setCustomerPhone(fmt)
                    setErrors(p => ({ ...p, phone: undefined }))
                  }}
                />
                <div className="space-y-1">
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 dark:text-white/20 pointer-events-none" />
                    <input
                      type="datetime-local"
                      value={arrivalDatetime}
                      min={getMinDatetime()}
                      max={getMaxDatetime()}
                      onChange={e => {
                        setArrivalDatetime(e.target.value)
                        setErrors(p => ({ ...p, datetime: undefined }))
                      }}
                      className={cn(
                        "w-full h-9 pl-9 pr-3 text-[12px] font-medium rounded-lg outline-none transition-all",
                        "bg-white dark:bg-white/[0.04] text-gray-800 dark:text-white/90",
                        errors.datetime
                          ? "border border-rose-400/60 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10"
                          : "border border-gray-200 dark:border-white/[0.08] focus:border-[#03624C] dark:focus:border-[#4dab8e] focus:ring-2 focus:ring-[#03624C]/10 dark:focus:ring-[#4dab8e]/10"
                      )}
                    />
                  </div>
                  {errors.datetime && (
                    <p className="flex items-center gap-1 text-[10.5px] text-rose-500">
                      <AlertTriangle className="w-3 h-3 shrink-0" />{errors.datetime}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-300 dark:text-white/20 pl-1">
                    {isKh ? "អាចកក់ទុកមុន ១០ នាទី ដល់ ៣០ ថ្ងៃ" : "Book 10 minutes to 30 days ahead"}
                  </p>
                </div>
              </div>
              <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-black uppercase tracking-[1.5px] text-gray-600 dark:text-white/25">
                    {isKh ? "ជ្រើសរើសតុ" : "Select Tables"}
                  </p>
                  {selectedIds.length > 0 && (
                    <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-[#03624C]/10 dark:bg-[#4dab8e]/10 text-[#03624C] dark:text-[#4dab8e]">
                      {selectedIds.length} {isKh ? "បានជ្រើស" : "selected"}
                    </span>
                  )}
                </div>
                {tableError && (
                  <p className="flex items-center gap-1.5 text-[10.5px] text-rose-500 px-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />{tableError}
                  </p>
                )}
                {loading ? (
                  <div className="flex justify-center py-5">
                    <Loader2 className="w-4 h-4 animate-spin text-[#03624C] dark:text-[#4dab8e]" />
                  </div>
                ) : tables.length === 0 ? (
                  <div className="text-center py-5 rounded-xl border border-dashed border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.02]">
                    <p className="text-[11px] text-gray-400 dark:text-white/25">{lbl.noTables}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-0.5">
                    {tables.map(tbl => {
                      const sel = selectedIds.includes(tbl.id)
                      const isReservedByThis = isEdit && tbl.status === "reserved" && editData?.tables?.some(et => et.id === tbl.id)
                      return (
                        <button
                          key={tbl.id}
                          onClick={() => toggleTable(tbl.id)}
                          className={cn(
                            "relative flex items-center gap-2 px-2.5 py-2 rounded-lg border text-[12px] font-semibold transition-all duration-150",
                            sel
                              ? "bg-[#03624C]/[0.08] dark:bg-[#4dab8e]/[0.10] border-[#03624C]/25 dark:border-[#4dab8e]/25 text-[#03624C] dark:text-[#4dab8e]"
                              : "bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.07] text-gray-500 dark:text-white/40 hover:border-[#03624C]/20 dark:hover:border-[#4dab8e]/20 hover:bg-[#03624C]/[0.04] dark:hover:bg-[#4dab8e]/[0.05]"
                          )}  >
                          {sel
                            ? <CheckSquare className="w-3.5 h-3.5 shrink-0 text-[#03624C] dark:text-[#4dab8e]" />
                            : <Square className="w-3.5 h-3.5 text-gray-300 dark:text-white/20 shrink-0" />
                          }
                          <span className="truncate">{tbl.name}</span>
                          {isReservedByThis && !sel && (
                            <span className="absolute top-1 right-1 text-[7px] font-black px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                              {isKh ? "កក់" : "rsv"}
                            </span>
                          )}
                          {sel && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#03624C] dark:bg-[#4dab8e]" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-400 dark:text-white/25 flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3 h-3" />
                    {isKh ? "មុខម្ហូបបានកក់" : "Pre-order"}
                  </p>
                  {preItems.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#03624C]/10 dark:bg-[#4dab8e]/10 text-[#03624C] dark:text-[#4dab8e]">
                      {preItems.length} {isKh ? "មុខ" : "items"}
                    </span>
                  )}
                </div>
                {preItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 rounded-xl border border-dashed border-gray-200 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
                    <UtensilsCrossed className="w-6 h-6 text-gray-200 dark:text-white/10 mb-1.5" />
                    <p className="text-[11px] text-gray-300 dark:text-white/20">{lbl.noItems}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                    {preItems.map(item => {
                      const hasDisc = item.original_price > item.price
                      return (
                        <div key={item.id} className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] overflow-hidden">
                          <div className="flex items-center gap-2 px-3 py-2.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold text-gray-800 dark:text-white/85 truncate leading-tight">{item.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {hasDisc && (
                                  <span className="text-[10px] line-through text-gray-300 dark:text-white/20">
                                    ${item.original_price.toFixed(2)}
                                  </span>
                                )}
                                <span className={cn("text-[11px] font-bold", hasDisc ? "text-emerald-600 dark:text-emerald-400" : "text-[#03624C] dark:text-[#4dab8e]")}>
                                  ${item.price.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-white/25">× {item.quantity}</span>
                                <span className="ml-auto text-[11px] font-black text-gray-700 dark:text-white/70">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-[12px] font-black text-gray-700 dark:text-white/80">{item.quantity}</span>
                              <button onClick={() => changeQty(item.id, +1)} className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                              <button onClick={() => removeItem(item.id)} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors ml-0.5">
                                <Trash2 className="w-3 h-3 text-rose-400" />
                              </button>
                            </div>
                          </div>
                          {hasDisc && item.discount && (
                            <div className="px-3 pb-2">
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                <BadgePercent className="w-2.5 h-2.5" />
                                {item.discount.name}
                                {" "}{item.discount.value_type === "percentage" ? `-${item.discount.value}%` : `-$${item.discount.value}`}
                                {" "}-${((item.original_price - item.price) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="shrink-0 p-4 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-[#13151f] space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/25 mb-0.5">
                    {isKh ? "សរុប" : "Total"}
                  </p>
                  <p className="text-[24px] font-black leading-tight text-[#03624C] dark:text-[#4dab8e]">
                    ${totalPrice.toFixed(2)}
                  </p>
                  {totalSaved > 0 && (
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      💰 {isKh ? "សន្សំបាន" : "Saved"} ${totalSaved.toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="text-right space-y-0.5 pb-1">
                  <p className="text-[11px] text-gray-400 dark:text-white/25 font-medium">
                    {selectedIds.length} {isKh ? "តុ" : "tables"}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-white/25 font-medium">
                    {preItems.reduce((s, i) => s + i.quantity, 0)} {isKh ? "មុខ" : "items"}
                  </p>
                </div>
              </div>
              <div className="relative group">
                <button
                  disabled={selectedIds.length === 0 || submitting}
                  onClick={handleConfirm}
                  className={cn(
                    "w-full h-10 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all duration-200",
                    "text-white bg-[#03624C] dark:bg-[#4dab8e] hover:opacity-90 active:scale-[0.98]",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    "shadow-md shadow-[#03624C]/20 dark:shadow-[#4dab8e]/10",
                  )} >
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{isKh ? "កំពុងរក្សាទុក..." : "Saving..."}</>
                    : <>{lbl.confirm}<ChevronRight className="w-4 h-4" /></>
                  }
                </button>
                {selectedIds.length === 0 && !submitting && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-gray-800 dark:bg-white/90 text-white dark:text-gray-800 text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                    {isKh ? "សូមជ្រើសតុមុន" : "Select at least one table first"}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800 dark:border-t-white/90" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="shrink-0 px-5 pt-4 pb-0 bg-white dark:bg-[#1a1d2e] border-b border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#03624C] dark:text-[#4dab8e]" />
                <h3 className="text-[13px] font-black text-gray-700 dark:text-white/80">
                  {isKh ? "ជ្រើសរើសមុខម្ហូប" : "Choose Items"}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-3 no-scrollbar">
                {[{ id: "all", name: lbl.all }, ...categories.map(c => ({ id: String(c.id), name: c.name }))].map(cat => {
                  const isActive = activeTab === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTab(cat.id)}
                      className={cn(
                        "shrink-0 h-7 px-3.5 rounded-lg text-[11px] font-semibold transition-all duration-150 whitespace-nowrap",
                        isActive
                          ? "bg-[#03624C] dark:bg-[#4dab8e] text-white shadow-sm shadow-[#03624C]/20 dark:shadow-[#4dab8e]/15"
                          : "text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-white/60"
                      )} >
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-[#03624C] dark:text-[#4dab8e]" />
                  <p className="text-[11px] text-gray-400 dark:text-white/25">
                    {isKh ? "កំពុងផ្ទុក..." : "Loading..."}
                  </p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <UtensilsCrossed className="w-10 h-10 text-gray-200 dark:text-white/10" />
                  <p className="text-[12px] text-gray-400 dark:text-white/25">{lbl.noMenu}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-max">
                  {filteredItems.filter(i => i.available !== false).map(item => {
                    const inCart       = preItems.find(p => p.id === String(item.id))
                    const qty          = inCart?.quantity ?? 0
                    const hasDisc      = item.discounted_price != null && item.discounted_price < item.price
                    const displayPrice = item.discounted_price != null ? item.discounted_price : item.price
                    const discLabel    = hasDisc && item.discount
                      ? item.discount.value_type === "percentage" ? `-${item.discount.value}%` : `-$${item.discount.value}`
                      : null
                    return (
                      <div
                        key={item.id}
                        onClick={() => addItem(item)}
                        className={cn(
                          "group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-150 flex flex-col",
                          "bg-white dark:bg-[#22263a]",
                          "border shadow-sm dark:shadow-none",
                          qty > 0
                            ? "border-[#03624C]/30 dark:border-[#4dab8e]/30 shadow-[#03624C]/10 dark:shadow-[#4dab8e]/5 ring-1 ring-[#03624C]/10 dark:ring-[#4dab8e]/10"
                            : "border-gray-100 dark:border-white/[0.07] hover:border-[#03624C]/20 dark:hover:border-[#4dab8e]/20 hover:-translate-y-0.5",
                        )} >
                        <div className="relative h-24 shrink-0 overflow-hidden bg-gray-100 dark:bg-white/[0.04]">
                          <img
                            src={item.image ?? "/placeholder.svg"} alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {qty > 0 && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#03624C] dark:bg-[#4dab8e] text-white text-[10px] font-black flex items-center justify-center shadow-md">
                              {qty}
                            </div>
                          )}
                          {hasDisc && discLabel && (
                            <div className="absolute top-2 left-2">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500 text-white shadow">
                                {discLabel}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-[#03624C]/10 dark:bg-[#4dab8e]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow scale-75 group-hover:scale-100 transition-transform duration-200">
                              <Plus className="w-4 h-4 text-[#03624C] dark:text-[#4dab8e]" />
                            </div>
                          </div>
                        </div>
                        <div className="px-2.5 py-2 flex flex-col gap-0.5">
                          <p className="text-[12px] font-semibold text-gray-800 dark:text-white/85 truncate leading-tight">{item.name}</p>
                          <div className="flex items-center gap-1.5">
                            {hasDisc && (
                              <span className="text-[10px] line-through text-gray-300 dark:text-white/20">
                                ${item.price.toFixed(2)}
                              </span>
                            )}
                            <span className={cn("text-[12px] font-black", hasDisc ? "text-emerald-600 dark:text-emerald-400" : "text-[#03624C] dark:text-[#4dab8e]")}>
                              ${displayPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}