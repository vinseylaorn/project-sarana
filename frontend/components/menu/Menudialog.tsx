"use client"

import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import {
   Dialog, DialogContent, DialogHeader, DialogTitle,
   DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
   Select, SelectContent, SelectItem,
   SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ImageIcon, Edit2, Eye, Plus, X, Crop, Loader2, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MenuItem, MenuCategory, InventoryItem } from "@/types"
import { SORA, INPUT, SEL_T, SEL_C, SEL_I, UNITS, DialogMode, RecipeItem, getMenuTranslations } from "./menu.config"
import { MenuImageCropDialog } from "./Imagecropdialog"
import { motion, AnimatePresence } from "framer-motion"

interface Props {
   open: boolean
   mode: DialogMode
   editItem: MenuItem | null
   categories: MenuCategory[]
   inventory: InventoryItem[]
   isKh: boolean
   saving: boolean
   onClose: () => void
   onSave: (payload: {
      name: string
      price: number
      category_id: number
      available: boolean
      image: string | null
      recipe: { inventory_id: number; deduct_qty: number }[]
   }, isEdit: boolean) => Promise<void>
}

const ROField = ({ children, className }: { children: React.ReactNode; className?: string }) => (
   <div className={cn(INPUT, "flex items-center select-none cursor-default opacity-70 pointer-events-none", className)}>
      {children}
   </div>
)

interface ComboboxProps {
   value: string
   label: string
   inventory: InventoryItem[]
   isKh: boolean
   displayUnit: (unit?: string) => string
   placeholder: string
   onChange: (id: string, name: string) => void
}

function IngredientCombobox({ value, label, inventory, isKh, displayUnit, placeholder, onChange }: ComboboxProps) {
   const [search, setSearch] = useState("")
   const [dropOpen, setDropOpen] = useState(false)

   const filtered = inventory.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
   )
   return (
      <div className="relative flex-1">
         <div className="relative">
            <Package className={cn(
               "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none shrink-0",
               value && !dropOpen ? "text-violet-500" : "text-gray-300 dark:text-white/20"
            )} />
            <input
               type="text"
               autoComplete="off"
               className={cn(
                  "w-full pl-8 pr-8 h-8 rounded-lg border text-[11.5px] outline-none transition-all",
                  "bg-white dark:bg-white/[0.04]",
                  "text-gray-800 dark:text-white/85 placeholder:text-gray-400 dark:placeholder:text-white/25",
                  "focus:ring-1",
                  "border-gray-200 dark:border-white/[0.08] focus:border-gray-300 dark:focus:border-white/20 focus:ring-gray-200 dark:focus:ring-white/10",
               )}
               placeholder={dropOpen ? (isKh ? "វាយឈ្មោះដើម្បីស្វែងរក..." : "Type to search...") : placeholder}
               value={dropOpen ? search : (label || "")}
               onFocus={() => { setSearch(""); setDropOpen(true) }}
               onChange={e => {
                  setSearch(e.target.value)
                  setDropOpen(true)
                  if (value) onChange("", "")
               }}
            />
            {value && !dropOpen ? (
               <button
                  type="button"
                  onClick={() => { onChange("", ""); setSearch(""); setDropOpen(true) }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:text-white/25 dark:hover:text-white/50 transition-colors" >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
               </button>
            ) : (
               <svg
                  className={cn("absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-400 dark:text-white/25 transition-transform", dropOpen && "rotate-180")}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
               </svg>
            )}
         </div>
         <AnimatePresence>
            {dropOpen && (
               <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.13 }}
                  className="absolute z-[9999] top-full mt-1.5 left-0 right-0 rounded-xl border border-gray-100 dark:border-white/[0.10] bg-white dark:bg-[#22263a] shadow-xl overflow-hidden"
                  style={SORA} >
                  <div className="max-h-[180px] overflow-y-auto py-1">
                     {filtered.length === 0 ? (
                        <div className="px-3 py-4 text-center text-[11px] text-gray-400 dark:text-white/25">
                           {isKh ? "រកមិនឃើញ" : "No results"}
                        </div>
                     ) : filtered.map(p => (
                        <button
                           key={p.id}
                           type="button"
                           onMouseDown={e => e.preventDefault()}
                           onClick={() => {
                              onChange(String(p.id), p.name)
                              setDropOpen(false)
                              setSearch("")
                           }}
                           className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                              "hover:bg-gray-50 dark:hover:bg-white/[0.05]",
                              value === String(p.id) && "bg-gray-50 dark:bg-white/[0.05]"
                           )} >
                           <div className="w-7 h-7 rounded-md bg-violet-500 flex items-center justify-center shrink-0">
                              <Package className="w-3.5 h-3.5 text-white" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-[11.5px] text-gray-800 dark:text-white/85 truncate">{p.name}</p>
                              <p className="text-[10px] text-gray-400 dark:text-white/30">
                                 {isKh ? "ឯកតា:" : "Unit:"} {displayUnit(p.unit)}
                              </p>
                           </div>
                           {value === String(p.id) && (
                              <svg className="w-3.5 h-3.5 shrink-0 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                           )}
                        </button>
                     ))}
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
         {dropOpen && (
            <div className="fixed inset-0 z-[9998]" onClick={() => { setDropOpen(false); setSearch("") }} />
         )}
      </div>
   )
}

export function MenuItemDialog({
   open, mode, editItem, categories, inventory, isKh, saving, onClose, onSave,
}: Props) {
   const lT = getMenuTranslations(isKh)
   const isView = mode === "view"

   const nameRef = useRef<HTMLInputElement>(null)
   const priceRef = useRef<HTMLInputElement>(null)
   const fileInputRef = useRef<HTMLInputElement>(null)

   const [selectedCat, setSelectedCat] = useState("")
   const [isAvailable, setIsAvailable] = useState(true)
   const [recipe, setRecipe] = useState<RecipeItem[]>([])
   const [imagePreview, setImagePreview] = useState<string | null>(null)
   const [cropSrc, setCropSrc] = useState<string | null>(null)
   const [errors, setErrors] = useState<{ name?: string; price?: string; category?: string }>({})

   const [recipeLabels, setRecipeLabels] = useState<Record<number, string>>({})

   const displayUnit = (unit?: string) =>
      unit
         ? UNITS.find(u => u.en === unit || u.kh === unit)?.[isKh ? "kh" : "en"] ?? unit
         : ""

   const getInventoryUnit = (id: string) => {
      const inv = inventory.find(i => String(i.id) === id)
      return inv?.unit ? displayUnit(inv.unit) : ""
   }

   useEffect(() => {
      if (!open) return
      setSelectedCat(editItem ? String(editItem.category_id) : (categories[0] ? String(categories[0].id) : ""))
      setIsAvailable(editItem?.available ?? true)
      const rows = editItem?.recipe.map(r => ({ inventoryId: String(r.inventory_id), deductQty: r.deduct_qty })) ?? []
      setRecipe(rows)
      const labels: Record<number, string> = {}
      rows.forEach((r, i) => {
         const inv = inventory.find(p => String(p.id) === r.inventoryId)
         if (inv) labels[i] = inv.name
      })
      setRecipeLabels(labels)
      setImagePreview(editItem?.image ?? null)
      setErrors({})
   }, [open, editItem])

   const handleSave = () => {
      const name = nameRef.current?.value?.trim() || ""
      const priceVal = priceRef.current?.value || ""
      const errs: typeof errors = {}
      if (!name) errs.name = isKh ? "សូមបញ្ចូលឈ្មោះ" : "Name is required"
      if (!priceVal || Number(priceVal) <= 0) errs.price = isKh ? "សូមបញ្ចូលតម្លៃ" : "Valid price required"
      if (!selectedCat) errs.category = isKh ? "សូមជ្រើសប្រភេទ" : "Category required"
      if (Object.keys(errs).length) { setErrors(errs); return }

      onSave({
         name,
         price: Number(priceVal),
         category_id: Number(selectedCat),
         available: isAvailable,
         image: imagePreview,
         recipe: recipe
            .filter(r => r.inventoryId && Number(r.deductQty) > 0)
            .map(r => ({ inventory_id: Number(r.inventoryId), deduct_qty: Number(r.deductQty) })),
      }, !!editItem)
   }

   const dialogIcon = {
      add: <ImageIcon className="w-4 h-4 text-violet-500" />,
      edit: <Edit2 className="w-4 h-4 text-violet-500" />,
      view: <Eye className="w-4 h-4 text-violet-500" />,
   }

   return (
      <>
         <Dialog open={open} onOpenChange={v => !saving && !v && onClose()}>
            <DialogContent className="max-w-lg p-0 border border-gray-200 dark:border-white/[0.13] shadow-lg rounded-lg bg-white dark:bg-[#1e2235] flex flex-col max-h-[90vh] [&>button]:hidden" style={SORA}>
               <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0 bg-gray-50 dark:bg-[#22263a] rounded-t-3xl">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2.5">
                        <div>
                           <DialogTitle className="text-[16px]  text-gray-800 dark:text-white/90 leading-tight">
                              {lT.dialogTitle[mode]}
                           </DialogTitle>
                           <DialogDescription className="text-[12px] text-gray-400 dark:text-white/30 font-medium">
                              {isView ? lT.readOnly : "Menu item form"}
                           </DialogDescription>
                        </div>
                     </div>
                     {isView && (
                        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-all">
                           <X className="w-3.5 h-3.5" />
                        </button>
                     )}
                  </div>
               </DialogHeader>
               <div className="flex-1 overflow-y-auto px-6 space-y-4">
                  <div className="space-y-1.5">
                     <Label className={cn("text-[14px] text-gray-600 dark:text-white/40", errors.name && "text-rose-500")}>
                        {lT.itemName}{!isView && " "} <span className="text-red-500">*</span>
                     </Label>
                     {isView ? <ROField>{editItem?.name}</ROField> : (
                        <>
                           <input ref={nameRef} defaultValue={editItem?.name}
                              onChange={() => setErrors(e => ({ ...e, name: undefined }))}
                              className={cn(INPUT, errors.name && "border-rose-400")} placeholder="e.g. Grilled Salmon..." />
                           {errors.name && <p className="text-[14px] text-rose-500">{errors.name}</p>}
                        </>
                     )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <Label className={cn("text-[14px]  text-gray-600 dark:text-white/40", errors.category && "text-rose-500")}>
                           {lT.category}{!isView && " "} <span className="text-red-500">*</span>
                        </Label>
                        {isView ? (
                           <ROField>{categories.find(c => c.id === editItem?.category_id)?.name ?? editItem?.category}</ROField>
                        ) : (
                           <>
                              <Select value={selectedCat} onValueChange={v => { setSelectedCat(v); setErrors(e => ({ ...e, category: undefined })) }}>
                                 <SelectTrigger className={cn(SEL_T, "w-full", errors.category && "border-rose-400")}>
                                    <SelectValue placeholder={isKh ? "ជ្រើសរើស" : "Select"} />
                                 </SelectTrigger>
                                 <SelectContent className={SEL_C} style={SORA}>
                                    {categories.map(c => <SelectItem key={c.id} value={String(c.id)} className={SEL_I}>{c.name}</SelectItem>)}
                                 </SelectContent>
                              </Select>
                              {errors.category && <p className="text-[11px] text-rose-500">{errors.category}</p>}
                           </>
                        )}
                     </div>
                     <div className="space-y-1.5">
                        <Label className={cn("text-[14px]  text-gray-600 dark:text-white/40", errors.price && "text-rose-500")}>
                           {lT.price}{!isView && " "} <span className="text-red-500">*</span>
                        </Label>
                        {isView ? (
                           <ROField className=" text-violet-600 dark:text-violet-400">${editItem?.price.toFixed(2)}</ROField>
                        ) : (
                           <>
                              <input type="number" step="any" ref={priceRef} defaultValue={editItem?.price}
                                 onChange={() => setErrors(e => ({ ...e, price: undefined }))}
                                 className={cn(INPUT, errors.price && "border-rose-400")} placeholder="0.00" />
                              {errors.price && <p className="text-[11px] text-rose-500">{errors.price}</p>}
                           </>
                        )}
                     </div>
                  </div>
                  <div className="flex items-center justify-between px-1">
                     <Label className="text-[14px] text-gray-600 dark:text-white/40">{lT.available}</Label>
                     <Switch checked={isView ? (editItem?.available ?? false) : isAvailable}
                        onCheckedChange={isView ? undefined : setIsAvailable} disabled={isView}
                        className={isView ? "opacity-70 cursor-not-allowed" : ""} />
                  </div>
                  <div className="border border-gray-100 dark:border-white/[0.10] rounded-lg bg-gray-50 dark:bg-white/[0.03] p-4 space-y-3">
                     <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-white/[0.08]">
                        <Label className="text-[14px] text-[#03624C] dark:text-[#1857D8]">{lT.ingredients}</Label>
                        {!isView && (
                           <button
                              onClick={() => {
                                 setRecipe(p => [...p, { inventoryId: "", deductQty: "" }])
                              }}
                              className="h-7 px-2.5 flex items-center gap-1 rounded-lg text-[14px] text-[#03624C] dark:text-[#1857D8] hover:bg-[#03624C]/10 dark:hover:bg-violet-500/15 transition-all" >
                              <Plus className="w-3 h-3" /> {lT.addIngredient}
                           </button>
                        )}
                     </div>
                     {isView ? (
                        !editItem?.recipe.length
                           ? <p className="text-[12px] text-gray-400 dark:text-white/25 text-center py-2">{lT.noIngredient}</p>
                           : (
                              <div className={cn("space-y-2", editItem.recipe.length > 2 && "max-h-[136px] overflow-y-auto pr-1")}>
                                 {editItem.recipe.map((r, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                       <div className={cn(SEL_T, "flex-1 h-8 text-[12px] px-3 flex items-center opacity-70 pointer-events-none")}>
                                          {r.inventory_name}<span className="text-gray-400 ml-1.5">({displayUnit(r.unit)})</span>
                                       </div>
                                       <div className={cn(INPUT, "w-24 h-8 text-[12px] text-center opacity-70 pointer-events-none flex items-center justify-center gap-1")}>
                                          <span className="">{r.deduct_qty}</span>
                                          <span className="text-[9px] uppercase  text-gray-400">{displayUnit(r.unit)}</span>
                                       </div>
                                       <div className="w-7 h-7 shrink-0" />
                                    </div>
                                 ))}
                              </div>
                           )
                     ) : (
                        !recipe.length
                           ? <p className="text-[14px] text-gray-400 dark:text-white/25 text-center py-2">{lT.noIngredient}</p>
                           : (
                              <div className={cn("space-y-2", recipe.length > 2 && "max-h-[160px] overflow-y-auto pr-1")}>
                                 {recipe.map((r, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                       <IngredientCombobox
                                          value={r.inventoryId}
                                          label={recipeLabels[i] || ""}
                                          inventory={inventory}
                                          isKh={isKh}
                                          displayUnit={displayUnit}
                                          placeholder={lT.selectIngredient}
                                          onChange={(id, name) => {
                                             setRecipe(p => {
                                                const n = [...p]
                                                n[i] = { ...n[i], inventoryId: id }
                                                return n
                                             })
                                             setRecipeLabels(prev => ({ ...prev, [i]: name }))
                                          }}
                                       />
                                       <div className="relative w-24">
                                          <input
                                             value={r.deductQty}
                                             onChange={e => setRecipe(p => { const n = [...p]; n[i] = { ...n[i], deductQty: e.target.value }; return n })}
                                             className={cn(INPUT, "h-8 text-[11.5px] pr-8 text-center")}
                                             placeholder="0"
                                          />
                                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400  pointer-events-none uppercase">
                                             {getInventoryUnit(r.inventoryId)}
                                          </span>
                                       </div>
                                       <button
                                          onClick={() => {
                                             setRecipe(p => p.filter((_, idx) => idx !== i))
                                             setRecipeLabels(prev => {
                                                const next: Record<number, string> = {}
                                                Object.entries(prev).forEach(([k, v]) => {
                                                   const ki = Number(k)
                                                   if (ki < i) next[ki] = v
                                                   else if (ki > i) next[ki - 1] = v
                                                })
                                                return next
                                             })
                                          }}
                                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all shrink-0"
                                       >
                                          <X className="w-3.5 h-3.5" />
                                       </button>
                                    </div>
                                 ))}
                              </div>
                           )
                     )}
                  </div>
                  <div className="space-y-1.5">
                     <div className="flex items-center justify-between">
                        <Label className="text-[14px]  text-gray-500 dark:text-white/40">{lT.image}</Label>
                        {!isView && <span className="flex items-center gap-1 text-[14px] text-gray-600 font-medium"><Crop className="w-3 h-3" />{lT.cropHint}</span>}
                     </div>
                     <div
                        onClick={isView ? undefined : () => fileInputRef.current?.click()}
                        className={cn(
                           "border-2 border-dashed border-gray-200 dark:border-white/[0.12] rounded-lg aspect-square relative overflow-hidden max-w-[200px] mx-auto transition-all bg-gray-100 dark:bg-gray-800",
                           !isView && "cursor-pointer hover:border-violet-400 group",
                           isView && "opacity-80 pointer-events-none"
                        )} >
                        {imagePreview ? (
                           <>
                              <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                              {!isView && (
                                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 text-white transition-opacity">
                                    <Crop className="w-5 h-5" /><p className="text-[12px]">{lT.changeImg}</p>
                                 </div>
                              )}
                           </>
                        ) : (
                           <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-white/20 px-4">
                              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                              <p className="text-[12px] uppercase tracking-wide">{isView ? lT.noImage : lT.uploadImg}</p>
                              {!isView && <p className="text-[10px] mt-1 opacity-60">320 × 320 px</p>}
                           </div>
                        )}
                     </div>
                     {!isView && (
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*"
                        onChange={e => {
                           const f = e.target.files?.[0]; if (!f) return
                           const reader = new FileReader()
                           reader.onloadend = () => setCropSrc(reader.result as string)
                           reader.readAsDataURL(f); e.target.value = ""
                        }} />
                     )}
                  </div>
               </div>
               <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#1e2235] shrink-0 rounded-b-3xl">
                  <div className="flex justify-end gap-2 w-full">
                     <button onClick={onClose} disabled={saving}
                        className="h-9 px-5 rounded-lg text-[14px]  border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-all">
                        {isView ? lT.close : lT.cancelBtn}
                     </button>
                     {!isView && (
                        <button onClick={handleSave} disabled={saving}
                           className="h-9 px-6 rounded-lg text-[14px] bg-[#03624C] hover:bg-[#03624C]/90 text-white shadow-md shadow-[#03624C]/20 dark:bg-[#1857D8] dark:hover:bg-[#1857D8]/80 dark:text-white dark:border dark:border-[#1857D8] disabled:opacity-60 flex items-center gap-2 transition-all">
                           {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                           {saving ? lT.saving : lT.save}
                        </button>
                     )}
                  </div>
               </DialogFooter>
            </DialogContent>
         </Dialog>
         <MenuImageCropDialog
            src={cropSrc ?? ""}
            open={!!cropSrc}
            onDone={cropped => { setImagePreview(cropped); setCropSrc(null) }}
            onCancel={() => setCropSrc(null)}
         />
      </>
   )
}