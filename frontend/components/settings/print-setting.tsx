"use client"
import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Printer, Plus, Trash2, Loader2, CheckCircle,
  RefreshCw, Wifi, WifiOff, AlertCircle, AlertTriangle, Edit2,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { menuCategoriesApi } from "@/lib/api"
import { printerApi }        from "@/lib/api/printer"
import type { MenuCategory } from "@/types"

export interface PrinterCategory {
  id: string
  name: string
  nameKh: string
  color: string
}

export interface PrinterDevice {
  id: string
  name: string
  ipAddress: string
  status: "online" | "offline"
  categories: string[]
}

const ACCENT = {
  bg:     "bg-[#03624C] dark:bg-[#1857D8]",
  iconBg: "bg-[#03624C] dark:bg-[#1857D8]",
  text:   "text-[#03624C] dark:text-[#6b9fff]",
  border: "border-[#03624C]/20 dark:border-[#1857D8]/30",
  subtle: "bg-[#03624C]/5 dark:bg-[#1857D8]/10",
  subtleHover: "hover:bg-[#03624C]/10 dark:hover:bg-[#1857D8]/20",
}

const CATEGORY_COLORS: Record<string, string> = {
  drink:    "#378ADD",
  cocktail: "#7F77DD",
  wine:     "#D4537E",
  food:     "#639922",
  hotfood:  "#BA7517",
  dessert:  "#D85A30",
  snack:    "#1D9E75",
  takeaway: "#888780",
}

const DEFAULT_COLORS = [
  "#378ADD", "#7F77DD", "#D4537E", "#639922",
  "#BA7517", "#D85A30", "#1D9E75", "#888780",
  "#E67E22", "#9B59B6", "#1ABC9C", "#E74C3C",
]

const INPUT =
  "w-full h-9 px-3 text-[14px] font-medium rounded-lg outline-none transition-all " +
  "bg-white dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] " +
  "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/20 " +
  "focus:border-[#03624C] dark:focus:border-[#1857D8] focus:ring-2 focus:ring-[#03624C]/10 " +
  "dark:focus:ring-[#1857D8]/10 shadow-sm dark:shadow-none"

function apiCatToPrinterCat(cat: MenuCategory, idx: number): PrinterCategory {
  const slug = cat.name.toLowerCase().replace(/\s+/g, "")
  return {
    id:     String(cat.id),
    name:   cat.name,
    nameKh: cat.name,
    color:  CATEGORY_COLORS[slug] ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
  }
}

function CategoryRow({
  category, checked, disabled, onToggle, isKh,
}: {
  category: PrinterCategory
  checked: boolean
  disabled: boolean
  onToggle: () => void
  isKh: boolean
}) {
  return (
    <div className={cn(
      "flex items-center justify-between px-3 py-2 rounded-lg border transition-all",
      checked
        ? "border-[#03624C]/30 dark:border-[#1857D8]/30 bg-[#03624C]/[0.04] dark:bg-[#1857D8]/[0.06]"
        : "border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]",
      disabled && !checked && "opacity-40 cursor-not-allowed",
    )}>
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: category.color }} />
        <span className="text-[14px] font-medium text-gray-700 dark:text-white/70">
          {isKh ? category.nameKh : category.name}
        </span>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled && !checked}
        aria-label={`Toggle ${category.name}`}
        className={cn(
          "relative w-8 h-[18px] rounded-full transition-colors duration-200 flex-shrink-0",
          checked ? "bg-[#03624C] dark:bg-[#1857D8]" : "bg-gray-200 dark:bg-white/[0.12]",
          disabled && !checked && "cursor-not-allowed",
        )} >
        <span className={cn(
          "absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all duration-200 shadow-sm",
          checked ? "left-[18px]" : "left-[2px]",
        )} />
      </button>
    </div>
  )
}

function PrinterCard({
  printer, allPrinters, categories, isKh, onUpdate, onPing, onDeleteClick, onEditClick,
}: {
  printer: PrinterDevice
  allPrinters: PrinterDevice[]
  categories: PrinterCategory[]
  isKh: boolean
  onUpdate: (updated: PrinterDevice) => void
  onPing: (id: string) => void
  onDeleteClick: (printer: PrinterDevice) => void
  onEditClick: (printer: PrinterDevice) => void
}) {
  const assignedElsewhere = (catId: string) =>
    allPrinters.some(p => p.id !== printer.id && p.categories.includes(catId))

  const toggleCategory = (catId: string) => {
    const has = printer.categories.includes(catId)
    onUpdate({
      ...printer,
      categories: has
        ? printer.categories.filter(c => c !== catId)
        : [...printer.categories, catId],
    })
  }

  const selectedCount = printer.categories.length

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden transition-all",
      selectedCount > 0
        ? "border-[#03624C]/40 dark:border-[#1857D8]/30"
        : "border-gray-100 dark:border-white/[0.06]",
    )}>
      <div className="px-4 py-3 bg-gray-50 dark:bg-[#22263a] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
            printer.status === "online"
              ? "bg-[#03624C]/10 dark:bg-[#1857D8]/10"
              : "bg-gray-100 dark:bg-white/[0.05]",
          )}>
            <Printer className={cn(
              "w-3.5 h-3.5",
              printer.status === "online"
                ? "text-[#03624C] dark:text-[#6b9fff]"
                : "text-gray-300 dark:text-white/20",
            )} />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-gray-800 dark:text-white/90 truncate leading-tight">
              {printer.name}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-white/30 font-mono leading-tight">
              {printer.ipAddress}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => onPing(printer.id)}>
            {printer.status === "online" ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E1F5EE] text-[#0F6E56] border border-[#9FE1CB] cursor-pointer hover:opacity-80 transition dark:bg-[#1857D8]/20 dark:text-[#6b9fff] dark:border-[#1857D8]/30">
                <Wifi className="w-2.5 h-2.5" />
                {isKh ? "តភ្ជាប់" : "Online"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FCEBEB] text-[#A32D2D] border border-[#F7C1C1] cursor-pointer hover:opacity-80 transition dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
                <WifiOff className="w-2.5 h-2.5" />
                {isKh ? "ផ្ដាច់" : "Offline"}
              </span>
            )}
          </button>
          <button
            onClick={() => onEditClick(printer)}
            aria-label="Edit printer"
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 dark:text-white/20 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all" >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDeleteClick(printer)}
            aria-label="Delete printer"
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 dark:text-white/20 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all" >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 dark:text-white/30">
            {isKh ? "ប្រភេទ" : "Categories"}
          </span>
          <span className={cn(
            "text-[10px] font-bold",
            selectedCount > 0 ? "text-[#03624C] dark:text-[#6b9fff]" : "text-gray-300 dark:text-white/20",
          )}>
            {selectedCount} {isKh ? "ជ្រើស" : "selected"}
          </span>
        </div>
        {categories.length === 0 ? (
          <p className="text-[14px] text-gray-300 dark:text-white/20 text-center py-4">
            {isKh ? "មិនទាន់មាន Category" : "No categories found"}
          </p>
        ) : (
          categories.map(cat => (
            <CategoryRow
              key={cat.id}
              category={cat}
              checked={printer.categories.includes(cat.id)}
              disabled={assignedElsewhere(cat.id)}
              onToggle={() => toggleCategory(cat.id)}
              isKh={isKh}
            />
          ))
        )}
      </div>
    </div>
  )
}

function PrinterDialog({
  open, isKh, printer, onDone, onClose,
}: {
  open: boolean
  isKh: boolean
  printer: PrinterDevice | null
  onDone: (p: PrinterDevice) => void
  onClose: () => void
}) {
  const isEdit = !!printer?.id && !printer.id.startsWith("printer_new")
  const [name,    setName]    = useState("")
  const [ip,      setIp]      = useState("")
  const [error,   setError]   = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(printer?.name    ?? "")
      setIp(printer?.ipAddress ?? "")
      setError("")
    }
  }, [open, printer])

  const handleClose = () => {
    setName(""); setIp(""); setError("")
    onClose()
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError(isKh ? "សូមដាក់ឈ្មោះ printer" : "Printer name is required"); return }
    if (!ip.trim())   { setError(isKh ? "សូមដាក់ IP address"    : "IP address is required");   return }
    setLoading(true)
    try {
      if (isEdit && printer) {
        const updated = await printerApi.update(printer.id, { name: name.trim(), ip_address: ip.trim() })
        onDone(updated)
      } else {
        const created = await printerApi.create({ name: name.trim(), ip_address: ip.trim() })
        onDone(created)
      }
      setName(""); setIp(""); setError("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (isKh ? "មានបញ្ហា" : "Something went wrong"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a]">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", ACCENT.iconBg)}>
              {isEdit ? <Edit2 className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
            </div>
            <div>
              <DialogTitle className="text-[16px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                {isEdit
                  ? (isKh ? "កែប្រែ Printer" : "Edit printer")
                  : (isKh ? "បន្ថែម Printer" : "Add printer")}
              </DialogTitle>
              <DialogDescription className="text-[14px] text-gray-400 dark:text-white/30 leading-tight mt-0">
                {isEdit
                  ? (isKh ? "កែប្រែព័ត៌មាន printer" : "Update printer information")
                  : (isKh ? "ភ្ជាប់ printer ថ្មី"    : "Connect a new printer")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[14px] font-black text-gray-600 dark:text-white/30">
              {isKh ? "ឈ្មោះ Printer" : "Printer name"}
            </label>
            <input
              className={INPUT}
              value={name}
              onChange={e => { setName(e.target.value); setError("") }}
              placeholder={isKh ? "ឧ. Bar Printer" : "e.g. Bar Printer"}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[14px] font-black  text-gray-600 dark:text-white/30">
              IP Address
            </label>
            <input
              className={INPUT}
              value={ip}
              onChange={e => { setIp(e.target.value); setError("") }}
              placeholder="192.168.1.xxx"
            />
          </div>
          {error && (
            <div className="flex items-center gap-1.5 text-[14px] text-rose-500 dark:text-rose-400 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
        <DialogFooter className="px-5 py-4 bg-gray-50 dark:bg-[#1e2235] border-t border-gray-100 dark:border-white/[0.07] sm:justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="h-9 px-4 rounded-lg text-[14px] font-semibold text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition disabled:opacity-50" >
            {isKh ? "បោះបង់" : "Cancel"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={cn(
              "h-9 px-5 rounded-lg text-[14px] font-bold text-white flex items-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-60",
              ACCENT.bg,
            )} >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{isKh ? "កំពុងរក្សា..." : "Saving..."}</>
            ) : isEdit ? (
              <><CheckCircle className="w-4 h-4" />{isKh ? "រក្សាទុក" : "Save changes"}</>
            ) : (
              <><Plus className="w-4 h-4" />{isKh ? "បន្ថែម" : "Add printer"}</>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ScanResultDialog({
  open, devices, isKh, onSave, onClose,
}: {
  open: boolean
  devices: { ip_address: string; name: string; status: string; categories: string[] }[]
  isKh: boolean
  onSave: (devices: { ip_address: string; name: string }[]) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    if (open) setSelected(devices.map(d => d.ip_address))
  }, [open, devices])

  const toggle = (ip: string) =>
    setSelected(prev => prev.includes(ip) ? prev.filter(i => i !== ip) : [...prev, ip])

  const handleSave = async () => {
    const toSave = devices.filter(d => selected.includes(d.ip_address))
    setSaving(true)
    try { await onSave(toSave) } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a]">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", ACCENT.iconBg)}>
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-[14px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                {isKh ? "រកឃើញ Printer" : "Printers found"}
              </DialogTitle>
              <DialogDescription className="text-[14px] text-gray-400 dark:text-white/30 leading-tight mt-0">
                {devices.length} {isKh ? "គ្រឿង" : "devices on network"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
          {devices.length === 0 ? (
            <p className="text-[14px] text-gray-400 dark:text-white/30 text-center py-6">
              {isKh ? "មិនរកឃើញ Printer ណាមួយ" : "No printers found on network"}
            </p>
          ) : (
            devices.map(d => (
              <div
                key={d.ip_address}
                onClick={() => toggle(d.ip_address)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-all",
                  selected.includes(d.ip_address)
                    ? "border-[#03624C]/30 dark:border-[#1857D8]/30 bg-[#03624C]/[0.04] dark:bg-[#1857D8]/[0.06]"
                    : "border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]",
                )} >
                <div className="flex items-center gap-2.5">
                  <Printer className={cn(
                    "w-3.5 h-3.5",
                    selected.includes(d.ip_address)
                      ? "text-[#03624C] dark:text-[#6b9fff]"
                      : "text-gray-300 dark:text-white/20",
                  )} />
                  <div>
                    <p className="text-[14px] font-bold text-gray-800 dark:text-white/90">{d.name}</p>
                    <p className="text-[12px] font-mono text-gray-400 dark:text-white/30">{d.ip_address}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[12px] font-bold px-2 py-0.5 rounded-full bg-[#E1F5EE] text-[#0F6E56] border border-[#9FE1CB] dark:bg-[#1857D8]/20 dark:text-[#6b9fff] dark:border-[#1857D8]/30">
                  <Wifi className="w-2.5 h-2.5" />
                  {isKh ? "តភ្ជាប់" : "Online"}
                </span>
              </div>
            ))
          )}
        </div>
        <DialogFooter className="px-5 py-4 bg-gray-50 dark:bg-[#1e2235] border-t border-gray-100 dark:border-white/[0.07] sm:justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-[14px]  font-semibold text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition" >
            {isKh ? "បោះបង់" : "Cancel"}
          </button>
          <button
            onClick={handleSave}
            disabled={selected.length === 0 || saving}
            className={cn(
              "h-9 px-5 rounded-lg text-[14px] font-bold text-white flex items-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-60",
              ACCENT.bg,
            )} >
            {saving
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{isKh ? "កំពុងរក្សា..." : "Saving..."}</>
              : <><CheckCircle className="w-3.5 h-3.5" />{isKh ? `បន្ថែម (${selected.length})` : `Add (${selected.length})`}</>
            }
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export interface PrinterSectionProps {
  isKh: boolean
  delay?: number
}

export function PrinterSection({ isKh, delay = 0 }: PrinterSectionProps) {
  const [printers,     setPrinters]     = useState<PrinterDevice[]>([])
  const [categories,   setCategories]   = useState<PrinterCategory[]>([])
  const [catLoading,   setCatLoading]   = useState(true)
  const [prtLoading,   setPrtLoading]   = useState(true)
  const [isScanning,   setIsScanning]   = useState(false)
  const [isSaving,     setIsSaving]     = useState(false)
  const [saveSuccess,  setSaveSuccess]  = useState(false)
  const [saveError,    setSaveError]    = useState("")
  const [showDialog,   setShowDialog]   = useState(false)
  const [editTarget,   setEditTarget]   = useState<PrinterDevice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PrinterDevice | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [scanDevices,  setScanDevices]  = useState<{ ip_address: string; name: string; status: string; categories: string[] }[]>([])
  const [showScan,     setShowScan]     = useState(false)

  useEffect(() => {
    printerApi.list()
      .then(setPrinters)
      .catch(() => setPrinters([]))
      .finally(() => setPrtLoading(false))

    menuCategoriesApi.list()
      .then(data => setCategories(data.map(apiCatToPrinterCat)))
      .catch(() => setCategories([]))
      .finally(() => setCatLoading(false))
  }, [])

  const openAdd  = () => { setEditTarget(null); setShowDialog(true) }
  const openEdit = (p: PrinterDevice) => { setEditTarget(p); setShowDialog(true) }
  const openDelete = (p: PrinterDevice) => { setDeleteTarget(p); setIsDeleteOpen(true) }

  const handleDialogDone = (p: PrinterDevice) => {
    setPrinters(prev => {
      const exists = prev.find(x => x.id === p.id)
      return exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]
    })
    setShowDialog(false)
    setEditTarget(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await printerApi.delete(deleteTarget.id)
      setPrinters(prev => prev.filter(p => p.id !== deleteTarget.id))
      setIsDeleteOpen(false)
      setDeleteTarget(null)
    } catch {
      setSaveError(isKh ? "លុបមិនបាន" : "Failed to delete printer")
    } finally {
      setDeleting(false)
    }
  }

  const handleScan = useCallback(async () => {
    setIsScanning(true)
    try {
      const result = await printerApi.scan()
      setScanDevices(result.devices)
      setShowScan(true)
    } catch {
      setSaveError(isKh ? "Scan មិនបាន" : "Scan failed")
    } finally {
      setIsScanning(false)
    }
  }, [isKh])

  const handleSaveScan = async (devices: { ip_address: string; name: string }[]) => {
    const saved = await printerApi.saveScan(devices)
    setPrinters(prev => {
      const ids = new Set(prev.map(p => p.id))
      return [...prev, ...saved.filter(s => !ids.has(s.id))]
    })
    setShowScan(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError("")
    try {
      await Promise.all(
        printers.map(p =>
          printerApi.update(p.id, { categories: p.categories, status: p.status })
        )
      )
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : (isKh ? "រក្សាមិនបាន" : "Failed to save."))
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = (updated: PrinterDevice) =>
    setPrinters(prev => prev.map(p => p.id === updated.id ? updated : p))

  const handlePing = async (id: string) => {
    try {
      const result = await printerApi.ping(id)
      setPrinters(prev => prev.map(p =>
        p.id === id ? { ...p, status: result.status as "online" | "offline" } : p
      ))
    } catch {
      setSaveError(isKh ? "Ping មិនបាន" : "Failed to ping printer")
    }
  }

  const isLoading = prtLoading || catLoading

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-white/[0.06] shadow-sm dark:shadow-none overflow-hidden" >
      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", ACCENT.iconBg)}>
            <Printer className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[16px] font-bold text-gray-800 dark:text-white/90 leading-tight">
              {isKh ? "ការកំណត់ Printer" : "Printer configuration"}
            </p>
            <p className="text-[12px] text-gray-400 dark:text-white/30 leading-tight mt-0.5">
              {isKh ? "ភ្ជាប់ Printer និង Assign Category" : "Connect printers and assign food categories"}
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[14px] text-gray-600 dark:text-white/30">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {isKh
              ? "Category មួយ assign បាន printer តែមួយ"
              : "Each category can only be assigned to one printer"}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[14px] font-bold transition-all border disabled:opacity-50",
                ACCENT.text,
                ACCENT.subtle,
                ACCENT.subtleHover,
                ACCENT.border,
              )} >
              <RefreshCw className={cn("w-3 h-3", isScanning && "animate-spin")} />
              {isScanning
                ? (isKh ? "កំពុង Scan..." : "Scanning...")
                : (isKh ? "Scan Printer" : "Scan printers")}
            </button>
            <button
              onClick={openAdd}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[14px] font-bold text-white transition-all active:scale-[0.97]",
                ACCENT.bg,
              )} >
              <Plus className="w-3 h-3" />
              {isKh ? "បន្ថែម" : "Add printer"}
            </button>
          </div>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-[14px] text-gray-400 dark:text-white/30">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {isKh ? "កំពុងទាញទិន្នន័យ..." : "Loading..."}
          </div>
        )}
        {!isLoading && printers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center">
              <Printer className="w-6 h-6 text-gray-300 dark:text-white/20" />
            </div>
            <p className="text-[16px] font-bold text-gray-400 dark:text-white/30">
              {isKh ? "មិនទាន់មាន Printer" : "No printers yet"}
            </p>
            <p className="text-[14px] text-gray-300 dark:text-white/20">
              {isKh ? "Scan ឬ Add Printer ថ្មី" : "Scan the network or add one manually"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {printers.map(p => (
              <PrinterCard
                key={p.id}
                printer={p}
                allPrinters={printers}
                categories={categories}
                isKh={isKh}
                onUpdate={handleUpdate}
                onPing={handlePing}
                onDeleteClick={openDelete}
                onEditClick={openEdit}
              />
            ))}
          </div>
        )}
      </div>
      <div className="px-6 py-4 bg-gray-50 dark:bg-[#1e2235] border-t border-gray-100 dark:border-white/[0.07] flex items-center justify-between rounded-b-2xl">
        <div>
          {saveError && (
            <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">
              {saveError}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || saveSuccess || isLoading}
          className={cn(
            "h-9 px-6 rounded-lg text-[14px] font-bold flex items-center gap-2 transition-all disabled:opacity-60 active:scale-[0.97] text-white",
            saveSuccess
              ? "bg-emerald-500 shadow-sm shadow-emerald-500/20"
              : "bg-[#03624C] dark:bg-[#1857D8] hover:opacity-90",
          )} >
          {isSaving    && <Loader2     className="w-3.5 h-3.5 animate-spin" />}
          {saveSuccess && <CheckCircle className="w-3.5 h-3.5" />}
          {saveSuccess
            ? (isKh ? "រក្សាទុករួច!" : "Saved!")
            : isSaving
            ? (isKh ? "កំពុងរក្សា..." : "Saving...")
            : (isKh ? "រក្សាទុក" : "Save config")}
        </button>
      </div>
      <PrinterDialog
        open={showDialog}
        isKh={isKh}
        printer={editTarget}
        onDone={handleDialogDone}
        onClose={() => { setShowDialog(false); setEditTarget(null) }}
      />
      <ScanResultDialog
        open={showScan}
        devices={scanDevices}
        isKh={isKh}
        onSave={handleSaveScan}
        onClose={() => setShowScan(false)}
      />
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-0 bg-white dark:bg-[#22263a] shadow-2xl p-0 max-w-[400px] overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-rose-400" />
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
              </div>
              <div className="pt-0.5">
                <AlertDialogTitle className="text-[14px] font-bold text-gray-800 dark:text-white/90 mb-1">
                  {isKh ? "បញ្ជាក់ការលុប" : "Confirm Delete"}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[12px] text-gray-500 dark:text-white/40 leading-relaxed">
                  {isKh ? "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។" : "This action cannot be undone."}
                </AlertDialogDescription>
              </div>
            </div>
            {deleteTarget && (
              <div className="mb-5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/[0.08] border border-rose-100 dark:border-rose-500/20 flex items-center gap-2">
                <Printer className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-rose-600 dark:text-rose-300 truncate">
                    {deleteTarget.name}
                  </p>
                  <p className="text-[10px] font-mono text-rose-400 dark:text-rose-400/70 truncate">
                    {deleteTarget.ipAddress}
                  </p>
                </div>
              </div>
            )}
            <AlertDialogFooter className="gap-2 flex-row justify-end">
              <AlertDialogCancel
                onClick={() => { setIsDeleteOpen(false); setDeleteTarget(null) }}
                className="h-9 px-5 rounded-xl text-[12px] font-bold border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all" >
                {isKh ? "បោះបង់" : "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="h-9 px-5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border dark:border-rose-500/30 dark:shadow-none disabled:opacity-60 transition-all" >
                {deleting
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{isKh ? "កំពុងលុប..." : "Deleting..."}</>
                  : <><Trash2 className="w-3.5 h-3.5" />{isKh ? "លុបចោល" : "Delete"}</>
                }
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}