"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, AlertTriangle, Loader2, Grid3X3, Package, Percent, DollarSign, Sparkles, Tag, X, Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { discountsApi } from "@/lib/api/discount"
import type { Discount, MenuCategory, MenuItem } from "@/types"
import { toastSuccess, toastError, toastWarn } from "@/lib/toast"
import { MultiSelectDialog } from "./Multiselectdialog "
import { SORA, DiscountForm, EMPTY_FORM, getAccent } from "./Discount.config"

const INPUT_BASE =
  "w-full h-9 px-3 text-[14px] rounded-lg outline-none transition-all " +
  "bg-white dark:bg-[#22263a] border border-gray-200/80 dark:border-white/[0.08] " +
  "text-gray-800 dark:text-white " +
  "placeholder:text-gray-400 dark:placeholder:text-white/20 shadow-sm dark:shadow-none"

const toLocalInputValue = (isoStr?: string | null): string => {
  if (!isoStr) return ""
  const match = isoStr.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  if (match) return `${match[1]}T${match[2]}`
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const fromLocalInputValue = (val: string): string => {
  if (!val) return ""
  return val.length === 16 ? `${val}:00` : val
}
const isAfter = (a: string, b: string): boolean => {
  if (!a || !b) return false
  return new Date(a).getTime() > new Date(b).getTime()
}

// Converts a 24-hour "HH:mm" string into 12-hour format with AM/PM, e.g. "14:05" -> "2:05 PM"
const to12Hour = (timePart: string): string => {
  const [hStr, mStr] = timePart.split(":")
  let h = parseInt(hStr, 10)
  const period = h >= 12 ? "PM" : "AM"
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${mStr} ${period}`
}

// Converts the stored "YYYY-MM-DDTHH:mm" value into a display string "dd/mm/yyyy  h:mm AM/PM"
const formatDisplayDateTime = (val: string): string => {
  if (!val) return ""
  const [datePart, timePart] = val.split("T")
  if (!datePart) return ""
  const [y, m, d] = datePart.split("-")
  return `${d}/${m}/${y}${timePart ? `  ${to12Hour(timePart)}` : ""}`
}

// Wrapper around the native datetime-local input.
// The native input stays fully functional (for the OS/browser picker),
// but is made invisible; the text the user actually sees is rendered by us
// in dd/mm/yyyy HH:mm format, regardless of browser/OS locale.
function DateTimeLocalInput({
  value,
  onChange,
  error,
  accent,
  placeholder,
}: {
  value: string
  onChange: (val: string) => void
  error?: boolean
  accent: string
  placeholder: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)

  const openPicker = () => {
    const el = inputRef.current
    if (!el) return
    if (typeof (el as any).showPicker === "function") {
      try {
        ;(el as any).showPicker()
      } catch {
        el.focus()
      }
    } else {
      el.focus()
    }
  }

  return (
    <div className="relative">
      <div
        onClick={openPicker}
        className={cn(
          INPUT_BASE,
          "flex items-center justify-between cursor-pointer select-none",
          error && "border-rose-400 dark:border-rose-500/50"
        )}
        style={focused ? { borderColor: accent, boxShadow: `0 0 0 2px ${accent}15` } : undefined}
      >
        <span className={cn(!value && "text-gray-400 dark:text-white/20")}>
          {value ? formatDisplayDateTime(value) : placeholder}
        </span>
        <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-white/30 shrink-0" />
      </div>
      <input
        ref={inputRef}
        type="datetime-local"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        tabIndex={-1}
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
      />
    </div>
  )
}

export function DiscountDialog({
  open, onClose, editData, categories, menuItems, isKh, onSuccess,
}: {
  open: boolean
  onClose: () => void
  editData: Discount | null
  categories: MenuCategory[]
  menuItems: MenuItem[]
  isKh: boolean
  onSuccess: () => void
}) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = !mounted || resolvedTheme === "dark"
  const accent = getAccent(isDark)

  const [form,             setForm]             = useState<DiscountForm>(EMPTY_FORM)
  const [submitting,       setSubmitting]       = useState(false)
  const [targetPickerOpen, setTargetPickerOpen] = useState(false)
  const [statusOpen,       setStatusOpen]       = useState(false)
  const [errors,           setErrors]           = useState<Partial<Record<keyof DiscountForm, string>>>({})
  const originalSnapshot                        = useRef<string>("")
  const statusRef                                = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!statusOpen) return
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [statusOpen])

  useEffect(() => {
    if (!open) return
    if (editData) {
      const filled: DiscountForm = {
        name:             editData.name ?? "",
        scope:            editData.scope ?? "category",
        value_type:       editData.value_type ?? "percentage",
        value:            String(editData.value ?? ""),
        target_ids:       editData.target_ids?.map(String) ?? [],
        start_date:       toLocalInputValue(editData.start_date),
        end_date:         toLocalInputValue(editData.end_date),
        status:           editData.status ?? "active",
        min_order_amount: String(editData.min_order_amount ?? ""),
        description:      editData.description ?? "",
      }
      setForm(filled)
      originalSnapshot.current = JSON.stringify(filled)
    } else {
      setForm(EMPTY_FORM)
      originalSnapshot.current = ""
    }
    setErrors({})
  }, [open, editData])

  const set = (key: keyof DiscountForm) => (val: string) => {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(p => ({ ...p, [key]: undefined }))
  }

  const validate = () => {
    const e: Partial<Record<keyof DiscountForm, string>> = {}
    if (!form.name.trim())
      e.name = isKh ? "សូមបញ្ចូលឈ្មោះ" : "Name is required"
    if (!form.value || isNaN(Number(form.value)) || Number(form.value) <= 0)
      e.value = isKh ? "សូមបញ្ចូលតម្លៃត្រឹមត្រូវ" : "Enter a valid value"
    if (form.value_type === "percentage" && Number(form.value) > 100)
      e.value = isKh ? "ភាគរយមិនអាចលើស 100%" : "Percentage cannot exceed 100%"
    if (form.target_ids.length === 0)
      e.target_ids = isKh ? "សូមជ្រើសរើសយ៉ាងហោចណាស់មួយ" : "Please select at least one"
    if (form.start_date && form.end_date && isAfter(form.start_date, form.end_date))
      e.end_date = isKh ? "ថ្ងៃផុតកំណត់ត្រូវក្រោយថ្ងៃចាប់ផ្ដើម" : "End date/time must be after start"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    if (editData && JSON.stringify(form) === originalSnapshot.current) {
      toastWarn(
        isKh ? "មិនមានការផ្លាស់ប្តូរ" : "No changes detected",
        isKh ? "សូមកែប្រែមុនពេលរក្សាទុក" : "Please make changes before saving"
      )
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name:             form.name.trim(),
        scope:            form.scope,
        value_type:       form.value_type,
        value:            Number(form.value),
        target_ids:       form.target_ids.map(Number),
        start_date:       form.start_date ? fromLocalInputValue(form.start_date) : undefined,
        end_date:         form.end_date ? fromLocalInputValue(form.end_date) : undefined,
        status:           (form.status === "expired" ? "inactive" : form.status) as "active" | "inactive" | "scheduled",
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : undefined,
        description:      form.description.trim() || undefined,
      }
      if (editData) {
        await discountsApi.update(editData.id, payload)
        toastSuccess(
          isKh ? "កែប្រែជោគជ័យ" : "Updated successfully",
          isKh
            ? `ការបញ្ចុះ: ${form.name} ត្រូវបានកែប្រែដោយជោគជ័យ`
            : `Discount: ${form.name} has been updated successfully`
        )
      } else {
        await discountsApi.create(payload)
        toastSuccess(
          isKh ? "បន្ថែមជោគជ័យ" : "Created successfully",
          isKh
            ? `ការបញ្ចុះ: ${form.name} ត្រូវបានបន្ថែមដោយជោគជ័យ`
            : `Discount: ${form.name} has been created successfully`
        )
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      toastError(
        isKh ? "មានបញ្ហា" : "Something went wrong",
        err?.message ?? (isKh ? "សូមព្យាយាមម្តងទៀត" : "Please try again")
      )
    } finally {
      setSubmitting(false)
    }
  }

  const statusOptions = [
    { value: "active",    label: isKh ? "សកម្ម" : "Active" },
    { value: "inactive",  label: isKh ? "អសកម្ម" : "Inactive" },
    { value: "scheduled", label: isKh ? "កំណត់ពេល" : "Scheduled" },
    ...(form.status === "expired" ? [{ value: "expired", label: isKh ? "ផុតកំណត់" : "Expired" }] : []),
  ]
  const statusLabel = statusOptions.find(o => o.value === form.status)?.label ?? form.status

  const targetOptions = form.scope === "category"
    ? categories.map(c => ({ id: String(c.id), label: c.name }))
    : menuItems.map(m => ({ id: String(m.id), label: m.name, image: m.image }))

  const selectedLabels = targetOptions
    .filter(o => form.target_ids.includes(o.id))
    .map(o => o.label)

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
        style={{ ...SORA, fontSize: isKh ? "16px" : undefined }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.22 }}
          className="w-full max-w-[560px] bg-white dark:bg-[#1e2235] rounded-lg shadow-2xl border border-gray-100 dark:border-white/[0.08] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${accent}15` }}
              >
                <Tag className="w-4 h-4" style={{ color: accent }} />
              </div>
              <div>
                <p className="text-[16px] font-bold text-gray-800 dark:text-white/90">
                  {editData ? (isKh ? "កែប្រែការបញ្ចុះ" : "Edit Discount") : (isKh ? "បន្ថែមការបញ្ចុះ" : "Add Discount")}
                </p>
                <p className="text-[14px] text-gray-400 dark:text-white/30">
                  {isKh ? "ការបញ្ចុះតម្លៃ category ឬ product" : "Category or product level discount"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-all"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-white/40" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

            <div className="space-y-1.5">
              <label className="text-[12px] text-gray-600 dark:text-white/30">
                {isKh ? "ឈ្មោះការបញ្ចុះ" : "Discount Name"} <span className="text-red-500"> * </span>
              </label>
              <input
                className={cn(INPUT_BASE, errors.name && "border-rose-400 dark:border-rose-500/50")}
                placeholder={isKh ? "ឧ. បញ្ចុះតម្លៃ Drinks ខែក្រក្កដា" : "e.g. Summer Drinks Sale"}
                value={form.name}
                onChange={e => set("name")(e.target.value)}
                onFocus={e => { if (!errors.name) { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}15` } }}
                onBlur={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = "" }}
              />
              {errors.name && (
                <p className="text-[12px] text-rose-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />{errors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] text-gray-600 dark:text-white/30">
                {isKh ? "ប្រភេទការបញ្ចុះ" : "Discount Scope"} <span className="text-red-500"> * </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["category", "product"] as const).map(scope => {
                  const isActive = form.scope === scope
                  return (
                    <button
                      key={scope}
                      onClick={() => { set("scope")(scope); setForm(p => ({ ...p, scope, target_ids: [] })) }}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all",
                        isActive
                          ? "bg-gray-50 dark:bg-white/[0.04]"
                          : "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08]"
                      )}
                      style={isActive ? { borderColor: accent } : undefined}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          !isActive && "bg-gray-100 dark:bg-white/[0.06]"
                        )}
                        style={isActive ? { background: `${accent}18` } : undefined}
                      >
                        {scope === "category"
                          ? <Grid3X3 className="w-4 h-4" style={{ color: isActive ? accent : undefined }} />
                          : <Package  className="w-4 h-4" style={{ color: isActive ? accent : undefined }} />
                        }
                      </div>
                      <div>
                        <p
                          className={cn("text-[14px]", !isActive && "text-gray-700 dark:text-white/70")}
                          style={isActive ? { color: accent } : undefined}
                        >
                          {scope === "category" ? "Category" : "Product"}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-white/30">
                          {scope === "category"
                            ? (isKh ? "បញ្ចុះទាំង category" : "All items in category")
                            : (isKh ? "បញ្ចុះ product តែមួយ" : "Single product only")}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] text-gray-600 dark:text-white/30">
                {form.scope === "category"
                  ? (isKh ? "ជ្រើស Category" : "Select Category")
                  : (isKh ? "ជ្រើស Product" : "Select Product")} <span className="text-red-500"> * </span>
              </label>
              <button
                type="button"
                onClick={() => setTargetPickerOpen(true)}
                className={cn(
                  "w-full min-h-[40px] px-3 py-2 rounded-lg border text-left transition-all flex items-center gap-2 flex-wrap",
                  errors.target_ids
                    ? "border-rose-400 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-500/5"
                    : "border-gray-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.04]"
                )}
                onMouseEnter={e => { if (!errors.target_ids) e.currentTarget.style.borderColor = accent }}
                onMouseLeave={e => { if (!errors.target_ids) e.currentTarget.style.borderColor = "" }}  >
                {selectedLabels.length === 0 ? (
                  <span className="text-[12px] text-gray-400 dark:text-white/20 flex-1">
                    {form.scope === "category"
                      ? (isKh ? "ចុចដើម្បីជ្រើស Category..." : "Click to select categories...")
                      : (isKh ? "ចុចដើម្បីជ្រើស Product..." : "Click to select products...")}
                  </span>
                ) : (
                  <>
                    {selectedLabels.slice(0, 3).map(lbl => (
                      <span
                        key={lbl}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border"
                        style={{ background: `${accent}10`, borderColor: `${accent}30`, color: accent }}
                      >
                        {lbl}
                      </span>
                    ))}
                    {selectedLabels.length > 3 && (
                      <span className="text-[11px]" style={{ color: accent }}>
                        +{selectedLabels.length - 3} {isKh ? "ទៀត" : "more"}
                      </span>
                    )}
                  </>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-white/30 ml-auto shrink-0" />
              </button>
              {errors.target_ids && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />{errors.target_ids}
                </p>
              )}
            </div>

            <MultiSelectDialog
              open={targetPickerOpen}
              onClose={() => setTargetPickerOpen(false)}
              options={targetOptions}
              selected={form.target_ids}
              onConfirm={ids => setForm(p => ({ ...p, target_ids: ids }))}
              title={form.scope === "category"
                ? (isKh ? "ជ្រើស Category" : "Select Categories")
                : (isKh ? "ជ្រើស Product" : "Select Products")}
              isKh={isKh}
            />

            <div className="space-y-1.5">
              <label className="text-[12px] text-gray-600 dark:text-white/30">
                {isKh ? "ប្រភេទ និងតម្លៃការបញ្ចុះ" : "Discount Type & Value"} <span className="text-red-500"> * </span>
              </label>
              <div className="flex gap-2">
                {(["percentage", "amount"] as const).map(vt => {
                  const isActive = form.value_type === vt
                  return (
                    <button
                      key={vt}
                      onClick={() => set("value_type")(vt)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] transition-all",
                        isActive
                          ? "bg-gray-50 dark:bg-white/[0.04]"
                          : "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/40 hover:border-gray-300"
                      )}
                      style={isActive ? { borderColor: accent, color: accent } : undefined}
                    >
                      {vt === "percentage"
                        ? <Percent    className="w-3.5 h-3.5" style={{ color: isActive ? accent : undefined }} />
                        : <DollarSign className="w-3.5 h-3.5" style={{ color: isActive ? accent : undefined }} />
                      }
                      {vt === "percentage" ? (isKh ? "ភាគរយ" : "Percentage") : (isKh ? "តម្លៃពិត ($)" : "Amount ($)")}
                    </button>
                  )
                })}
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={0}
                    max={form.value_type === "percentage" ? 100 : undefined}
                    className={cn(INPUT_BASE, "pl-8", errors.value && "border-rose-400 dark:border-rose-500/50")}
                    placeholder={form.value_type === "percentage" ? "0 – 100" : "0.00"}
                    value={form.value}
                    onChange={e => set("value")(e.target.value)}
                    onFocus={e => { if (!errors.value) { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}15` } }}
                    onBlur={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = "" }}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 dark:text-white/30">
                    {form.value_type === "percentage" ? "%" : "$"}
                  </span>
                </div>
              </div>
              {errors.value && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />{errors.value}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] text-gray-600 dark:text-white/30 flex items-center gap-1">
                  {isKh ? "ថ្ងៃ/ម៉ោង ចាប់ផ្ដើម" : "Start Date & Time"}
                </label>
                <DateTimeLocalInput
                  value={form.start_date}
                  onChange={set("start_date")}
                  error={!!errors.start_date}
                  accent={accent}
                  placeholder={isKh ? "ជ្រើសកាលបរិច្ឆេទ" : "dd/mm/yyyy --:--"}
                />
                {errors.start_date && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />{errors.start_date}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-600 dark:text-white/30 flex items-center gap-1">
                  {isKh ? "ថ្ងៃ/ម៉ោង ផុតកំណត់" : "End Date & Time"}
                </label>
                <DateTimeLocalInput
                  value={form.end_date}
                  onChange={set("end_date")}
                  error={!!errors.end_date}
                  accent={accent}
                  placeholder={isKh ? "ជ្រើសកាលបរិច្ឆេទ" : "dd/mm/yyyy --:--"}
                />
                {errors.end_date && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />{errors.end_date}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 relative" ref={statusRef}>
                <label className="text-[12px] text-gray-600 dark:text-white/30">
                  {isKh ? "ស្ថានភាព" : "Status"}
                </label>
                <button
                  type="button"
                  onClick={() => setStatusOpen(o => !o)}
                  className={cn(INPUT_BASE, "flex items-center justify-between cursor-pointer")}>
                  <span>{statusLabel}</span>
                  <ChevronDown className={cn(
                    "w-3.5 h-3.5 text-gray-400 dark:text-white/30 transition-transform duration-150 shrink-0",
                    statusOpen && "rotate-180"
                  )} />
                </button>
                <AnimatePresence>
                  {statusOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-20 top-full left-0  w-full bg-white dark:bg-[#22263a] border border-gray-200 dark:border-white/[0.08] rounded-lg shadow-lg overflow-hidden" >
                      {statusOptions.map(opt => {
                        const isSelected = form.status === opt.value
                        const isDisabled = opt.value === "expired"
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => { set("status")(opt.value); setStatusOpen(false) }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium transition-all",
                              isDisabled
                                ? "text-gray-300 dark:text-white/20 cursor-not-allowed"
                                : "text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                            )} >
                            {opt.label}
                            {isSelected && <Check className="w-3.5 h-3.5" style={{ color: accent }} />}
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-gray-600 dark:text-white/30">
                {isKh ? "ចំណាំ" : "Description"}
              </label>
              <textarea
                rows={2}
                className={cn(INPUT_BASE, "h-auto pt-2.5 resize-none")}
                placeholder={isKh ? "ចំណាំបន្ថែម..." : "Optional note..."}
                value={form.description}
                onChange={e => set("description")(e.target.value)}
                onFocus={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}15` }}
                onBlur={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = "" }}
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="h-9 px-5 rounded-lg text-[14px] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all" >
              {isKh ? "បោះបង់" : "Cancel"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-9 px-5 rounded-lg text-[14px] text-white disabled:opacity-50 transition-all flex items-center gap-1.5 active:scale-[0.97]"
              style={{ background: accent, boxShadow: `0 4px 14px ${accent}30` }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.opacity = "0.88" }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}
            >
              {submitting
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{isKh ? "កំពុងរក្សាទុក..." : "Saving..."}</>
                : <><Sparkles className="w-3.5 h-3.5" />{editData ? (isKh ? "រក្សាទុក" : "Save Changes") : (isKh ? "បន្ថែម" : "Add Discount")}</>
              }
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}