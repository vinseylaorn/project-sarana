"use client";

import { Search, ShoppingBag, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuItem, MenuCategory } from "@/types";

interface MenuPanelProps {
  isKh: boolean;
  categories: MenuCategory[];
  filteredMenu: MenuItem[];
  activeCategory: string;
  searchQuery: string;
  onCategoryChange: (id: string) => void;
  onSearchChange: (q: string) => void;
  onAddItem: (item: MenuItem) => void;
}

export function MenuPanel({
  isKh,
  categories,
  filteredMenu,
  activeCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
  onAddItem,
}: MenuPanelProps) {
  return (
    <div className="flex-[1.7] flex flex-col bg-gray-50 border-r border-gray-200">
      <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-2.5 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-[14px] text-gray-800 placeholder:text-gray-600 focus:outline-none focus:border-[#03624C] focus:ring-2 focus:ring-[#03624C]/15 transition-all"
            placeholder={isKh ? "ស្វែងរកមុខម្ហូប..." : "Search in products..."}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="px-4 py-2.5 bg-white border-b border-gray-100 flex items-center gap-1.5 flex-wrap shrink-0">
        <button
          onClick={() => onCategoryChange("all")}
          className={cn(
            "h-7 px-4 rounded-full text-[14px] font-semibold transition-all",
            activeCategory === "all"
              ? "bg-[#03624C]/100 text-white"
              : "border border-gray-200 bg-white text-gray-600 hover:border-[#03624C]/30 hover:text-[#03624C]"
          )} >
          {isKh ? "ទាំងអស់" : "Show All"}
        </button>
        {categories.map((c, i) => (
          <button
            key={i}
            onClick={() => onCategoryChange(String(c.id))}
            className={cn(
              "h-7 px-4 rounded-full text-[14px] transition-all",
              activeCategory === String(c.id)
                ? "bg-[#03624C]/100 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:border-[#03624C]/30 hover:text-[#03624C]"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMenu.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600">
            <ShoppingBag className="w-10 h-10" />
            <p className="text-[14px] font-medium">
              {isKh ? "មិនមានមុខម្ហូប" : "No menu items"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 auto-rows-max">
            {filteredMenu.map((item, i) => (
              <MenuItemCard key={i} item={item} onAdd={onAddItem} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItemCard({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}) {
  return (
    <div
      onClick={() => onAdd(item)}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-[#03624C] hover:shadow-md transition-all group flex flex-col relative" >
      <div className="aspect-square shrink-0 overflow-hidden bg-gray-100 relative">
        <img
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {item.discounted_price && (
          <div className="absolute top-1.5 right-1.5">
            <span className="px-1.5 py-0.5 rounded-md text-[12px] font-black bg-[#03624C] text-white shadow">
              {item.discount?.value_type === "percentage"
                ? `-${item.discount.value}%`
                : `-$${item.discount?.value}`}
            </span>
          </div>
        )}
      </div>
      <div className="absolute bottom-[5px] right-2 w-5 h-5 rounded-full bg-[#03624C]/100 text-white 
        flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
        <Plus className="w-3 h-3" />
      </div>
      <div className="px-2.5 py-2 flex flex-col gap-0.5">
        <p className="text-[14px] border-b border-gray-200 font-semibold text-gray-800 truncate">{item.name}</p>
        {item.discounted_price ? (
          <>
            <span className="text-[14px] line-through text-gray-400">
              ${item.price.toFixed(2)}
            </span>
            <span className="text-[14px] font-bold text-[#03624C]">
              ${item.discounted_price.toFixed(2)}
            </span>
          </>
        ) : (
          <p className="text-[16px] font-bold text-[#03624C]">${item.price.toFixed(2)}</p>
        )}
      </div>
    </div>
  );
}