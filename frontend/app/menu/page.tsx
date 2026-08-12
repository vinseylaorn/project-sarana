"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Trash2 } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header }  from "@/components/header"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useTranslation } from "react-i18next"
import type { MenuItem } from "@/types"
import { usePermission } from "@/lib/role-context"
import { toastSuccess, toastError, toastWarn } from "@/lib/toast"
import { MenuToolbar }      from "@/components/menu/Menutoolbar"
import { MenuCategoryTabs } from "@/components/menu/Menucategorytabs"
import { MenuItemGrid }     from "@/components/menu/Menugrid"
import { MenuItemDialog }   from "@/components/menu/Menudialog"
import { SORA, DialogMode, getMenuTranslations } from "@/components/menu/menu.config"

import { useMenuItemsWithDiscounts } from "@/hooks/menus/use-menu-with-discounts"
import { useMenuItemMutations }      from "@/hooks/menus/use-menu-item-mutations"
import { useMenuCategories }         from "@/hooks/discount/use-menu-data"
import { useInventory }              from "@/hooks/menus/use-inventory"

const AC = {
  text: "text-[#03624C] dark:text-[#1857D8]",
  bar:  "bg-[#03624C] dark:bg-[#1857D8]",
}

export default function MenuPage() {
  const { t, i18n } = useTranslation("common")
  const isKh = i18n.language === "kh"
  const lT   = getMenuTranslations(isKh)
  const { can } = usePermission("menu")

  const { data: menuItems = [], isLoading: loadingItems, isFetching: fetchingItems } = useMenuItemsWithDiscounts()
  const { data: categories = [], isLoading: loadingCategories, isFetching: fetchingCategories } = useMenuCategories()
  const { data: inventory = [],  isLoading: loadingInventory, isFetching: fetchingInventory }  = useInventory()
  const { create, update, remove, toggleAvailable } = useMenuItemMutations()

  const loading = loadingItems || loadingCategories || loadingInventory
  const isFetching = fetchingItems || fetchingCategories || fetchingInventory

  const [search,         setSearch]         = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [availability,   setAvailability]   = useState("all")

  const [dialogOpen,  setDialogOpen]  = useState(false)
  const [dialogMode,  setDialogMode]  = useState<DialogMode>("add")
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  const [deleteOpen,   setDeleteOpen]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null)

  const itemsCountByCategory = useMemo(() => {
    const map = new Map<number, number>()
    menuItems.forEach((item) =>
      map.set(Number(item.category_id), (map.get(Number(item.category_id)) || 0) + 1)
    )
    return map
  }, [menuItems])

  const filteredItems = useMemo(() =>
    menuItems.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
      const matchCat    = activeCategory === "all" || String(item.category_id) === activeCategory
      const matchAvail  =
        availability === "all" ? true
        : availability === "available" ? item.available
        : !item.available
      return matchSearch && matchCat && matchAvail
    }),
    [menuItems, search, activeCategory, availability]
  )

  const openAdd  = ()               => { setDialogMode("add");  setEditingItem(null); setDialogOpen(true) }
  const openEdit = (item: MenuItem) => { setDialogMode("edit"); setEditingItem(item); setDialogOpen(true) }
  const openView = (item: MenuItem) => { setDialogMode("view"); setEditingItem(item); setDialogOpen(true) }

  const handleSave = async (
    payload: {
      name: string; price: number; category_id: number
      available: boolean; image: string | null
      recipe: { inventory_id: number; deduct_qty: number }[]
    },
    isEdit: boolean
  ) => {
    if (isEdit && editingItem) {
      const current  = JSON.stringify({
        name: payload.name, price: payload.price, category_id: payload.category_id,
        available: payload.available, image: payload.image, recipe: payload.recipe,
      })
      const original = JSON.stringify({
        name: editingItem.name, price: editingItem.price, category_id: editingItem.category_id,
        available: editingItem.available, image: editingItem.image,
        recipe: editingItem.recipe.map((r) => ({ inventory_id: r.inventory_id, deduct_qty: r.deduct_qty })),
      })
      if (current === original) { toastWarn(lT.noChanges, lT.noChangesDesc); return }
    }

    try {
      if (isEdit && editingItem) {
        await update.mutateAsync({ id: editingItem.id, payload })
        toastSuccess(
          isKh ? "កែប្រែដោយជោគជ័យ" : "Updated Successfully",
          isKh
            ? `មុខម្ហូប "${payload.name}" ត្រូវបានកែប្រែដោយជោគជ័យ`
            : `Menu "${payload.name}" has been updated successfully`,
        )
      } else {
        await create.mutateAsync(payload)
        toastSuccess(
          isKh ? "បន្ថែមដោយជោគជ័យ" : "Added Successfully",
          isKh
            ? `មុខម្ហូប "${payload.name}" ត្រូវបានបន្ថែមដោយជោគជ័យ`
            : `Menu "${payload.name}" has been added successfully`,
        )
      }
      setDialogOpen(false)
    } catch (err: any) {
      toastError(err?.message ?? "Error")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await remove.mutateAsync(deleteTarget.id)
      toastSuccess(
        isKh ? "បានលុបដោយជោគជ័យ" : "Deleted Successfully",
        isKh
          ? `មុខម្ហូប "${deleteTarget.name}" ត្រូវបានលុបដោយជោគជ័យ`
          : `Menu "${deleteTarget.name}" has been deleted successfully`,
      )
      setDeleteOpen(false)
      setDeleteTarget(null)
    } catch (err: any) {
      toastError(err?.message ?? lT.errDelete)
    }
  }

  const handleToggle = async (item: MenuItem) => {
    try {
      await toggleAvailable.mutateAsync(item)
    } catch (err: any) {
      toastError(err?.message ?? "Error")
    }
  }

  const showInitialLoading = loading && menuItems.length === 0 && categories.length === 0

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#13151f] overflow-hidden transition-colors duration-300" style={SORA}>
      <AnimatePresence>
        {isFetching && !loading && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-0 left-0 right-0 h-[2px] ${AC.bar} origin-left z-[100]`}
          />
        )}
      </AnimatePresence>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={isKh ? "គ្រប់គ្រងមុខម្ហូប" : "Menu Management"} 
        subtitle={isKh ? "គ្រប់គ្រងមុខម្ហូបរបស់លោកអ្នក" : "Manage your menu Iteam"}
        />
        {showInitialLoading ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500 dark:text-white/25 animate-pulse">
              {lT.loading}
            </span>
          </div>
        ) : (
        <main className="flex-1 flex flex-col min-h-0 p-5 gap-4 overflow-hidden">

          <MenuToolbar
            search={search}
            availability={availability}
            canCreate={can("create")}
            isKh={isKh}
            lT={lT}
            tAdd={t("add")}
            onSearch={setSearch}
            onAvailability={setAvailability}
            onReset={() => { setSearch(""); setAvailability("all") }}
            onAdd={openAdd}
          />

          <MenuCategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            itemsCount={itemsCountByCategory}
            totalCount={menuItems.length}
            isKh={isKh}
            onSelect={setActiveCategory}
          />

          <MenuItemGrid
            items={filteredItems}
            categories={categories}
            canEdit={can("edit")}
            canDelete={can("delete")}
            isKh={isKh}
            lT={lT}
            onEdit={openEdit}
            onDelete={(item) => { setDeleteTarget(item); setDeleteOpen(true) }}
            onView={openView}
            onToggle={handleToggle}
          />
        </main>
        )}
      </div>
      <MenuItemDialog
        open={dialogOpen}
        mode={dialogMode}
        editItem={editingItem}
        categories={categories}
        inventory={inventory}
        isKh={isKh}
        saving={create.isPending || update.isPending}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        loading={remove.isPending}
        variant="danger"
        icon={Trash2}
        title={lT.confirmDelete}
        description={lT.deleteDesc}
        highlight={deleteTarget?.name ?? ""}
        confirmLabel={lT.deleteBtn}
        cancelLabel={lT.cancelBtn}
      />
    </div>
  )
}