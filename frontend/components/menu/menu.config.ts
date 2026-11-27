import React from "react"

export const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }
export const UNITS: { en: string; kh: string }[] = [
  { en: "pcs", kh: "គ្រាប់/ដុំ" },
  { en: "dozen", kh: "ដូហ្សែន" },
  { en: "tray", kh: "ថាស" },
  { en: "box", kh: "ប្រអប់" },
  { en: "kg", kh: "គីឡូក្រាម" },
  { en: "g", kh: "ក្រាម" },
  { en: "l", kh: "លីត្រ" },
  { en: "ml", kh: "មីលីលីត្រ" },
  { en: "can", kh: "កំប៉ុង" },
  { en: "bottle", kh: "ដប" },
  { en: "pack", kh: "កញ្ចប់" },
  { en: "bag", kh: "ថង់" },
  { en: "carton", kh: "កេស" },
]
export const INPUT =
  "w-full h-9 px-3 text-[14px] rounded-lg outline-none transition-all " +
  "bg-white dark:bg-[#22263a] border border-gray-200/80 dark:border-white/[0.08] " +
  "text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-white/20 " +
  "focus:border-[#03624C] dark:focus:border-[#1857D8]  focus:ring-[#03624C] " +
  "dark:focus:ring-[#1857D8]/10 shadow-sm dark:shadow-none"

export const SEL_T =
  "h-9 text-[14px] rounded-lg border border-gray-200/80 dark:border-white/[0.08] " +
  "bg-white dark:bg-[#22263a] text-gray-700 dark:text-white/70 shadow-sm dark:shadow-none"

export const SEL_C =
  "bg-white dark:bg-[#22263a] border border-gray-100 dark:border-white/[0.10] rounded-lg shadow-lg"

export const SEL_I =
  "text-[14px] text-gray-800 dark:text-white/80 rounded-lg focus:bg-violet-50 dark:focus:bg-violet-500/10 dark:focus:text-violet-100"

export const TAB_BASE =
  "h-8 px-4 rounded-lg border text-[14px] transition-all whitespace-nowrap " +
  "border-gray-200 dark:border-white/[0.10] text-gray-500 dark:text-white/45 bg-white dark:bg-[#22263a]"

export const TAB_ACTIVE =
  "bg-[#03624C] dark:bg-[#1857D8]/20 border-[#03624C]/5 dark:border-[#1857D8]/5 text-white dark:text-violet-300"

export type DialogMode = "add" | "edit" | "view"

export interface RecipeItem {
  inventoryId: string
  deductQty: string | number
}

export const getMenuTranslations = (isKh: boolean) =>
  isKh ? {
    search: "ស្វែងរកមុខម្ហូប...",
    allStatus: "ស្ថានភាពទាំងអស់",
    available: "មានក្នុងស្តុក",
    unavailable: "អស់ពីស្តុក",
    itemName: "ឈ្មោះមុខម្ហូប",
    category: "ប្រភេទ",
    price: "តម្លៃ ($)",
    ingredients: "គ្រឿងផ្សំកាត់ស្តុក",
    addIngredient: "បន្ថែម",
    selectIngredient: "រើសគ្រឿងផ្សំ...",
    noIngredient: "មិនទាន់មានគ្រឿងផ្សំ",
    image: "រូបភាពមុខម្ហូប",
    uploadImg: "ជ្រើសរើសរូបភាព",
    changeImg: "ចុចដើម្បីប្តូររូបភាព",
    confirmDelete: "លុបមុខម្ហូបនេះ?",
    deleteDesc: "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។",
    deleteBtn: "លុបចោល",
    cancelBtn: "បោះបង់",
    cropHint: "ទំហំ: 320×320px",
    outOfStock: "អស់ពីស្តុក",
    noItems: "មិនមានមុខម្ហូប",
    noImage: "គ្មានរូបភាព",
    dialogTitle: { add: "បន្ថែមមុខម្ហូប", edit: "កែប្រែមុខម្ហូប", view: "មើលព័ត៌មានមុខម្ហូប" },
    readOnly: "អានតែប៉ុណ្ណោះ · មិនអាចកែប្រែ",
    close: "បិទ",
    saving: "កំពុងរក្សា...",
    save: "រក្សាទុក",
    loading: "កំពុងផ្ទុក...",
    noChanges: "មិនមានការផ្លាស់ប្តូរ",
    noChangesDesc: "សូមកែប្រែ",
    addedOk: "បន្ថែមបានជោគជ័យ",
    updatedOk: "កែប្រែបានជោគជ័យ",
    deletedOk: "លុបបានសម្រេច",
    errLoad: "ទាញទិន្នន័យមិនបាន",
    errDelete: "លុបមិនបាន",
  } : {
    search: "Search menu...",
    allStatus: "All Status",
    available: "Available",
    unavailable: "Out of Stock",
    itemName: "Item Name",
    category: "Category",
    price: "Price ($)",
    ingredients: "Inventory Deduction",
    addIngredient: "Add",
    selectIngredient: "Select material...",
    noIngredient: "No ingredients added",
    image: "Item Image",
    uploadImg: "Upload Image",
    changeImg: "Click to change",
    confirmDelete: "Delete this item?",
    deleteDesc: "This action cannot be undone.",
    deleteBtn: "Delete",
    cancelBtn: "Cancel",
    cropHint: "Size: 320×320px",
    outOfStock: "Out of Stock",
    noItems: "No menu items found",
    noImage: "No image",
    dialogTitle: { add: "Add New Item", edit: "Edit Item", view: "View Item" },
    readOnly: "Read-only · Cannot edit",
    close: "Close",
    saving: "Saving...",
    save: "Save",
    loading: "Loading...",
    noChanges: "No changes detected",
    noChangesDesc: "Please make changes",
    addedOk: "Added Successfully",
    updatedOk: "Updated Successfully",
    deletedOk: "Deleted",
    errLoad: "Failed to load data",
    errDelete: "Failed to delete",
  }