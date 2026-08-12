"use client"

import { Star } from "lucide-react"
import { fmt } from "./types"

interface TopItem {
  name:    string
  orders:  number
  revenue: number
}

interface Props {
  items: TopItem[]
  isKh:  boolean
}

export function TopItems({ items, isKh }: Props) {
  return (
    <div className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/[0.07] shadow-sm dark:shadow-none rounded-lg overflow-hidden h-full">
      <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex justify-between items-center">
          <h3 className="text-[14px] font-bold text-gray-600 dark:text-white/40 uppercase tracking-[0.2em]">
            {isKh ? "មុខម្ហូបលក់ដាច់" : "Top Items"}
          </h3>
          <Star className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
        </div>
      </div>
      <div className="p-4">
        {items.length > 0 ? (
          <div className="space-y-1.5">
            {items.map((item, idx) => (
              <div
                key={item.name}
                className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-white/[0.03]" >
                <span className="text-[14px] font-black text-[#03624C] dark:text-[#1857D8] w-5 shrink-0">
                  #{idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-gray-800 dark:text-white/80 truncate">
                    {item.name}
                  </p>
                  <div className="h-1 rounded-full bg-gray-200 dark:bg-white/[0.06] mt-0.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-[#03624C] dark:bg-[#1857D8]"
                      style={{ width: `${(item.orders / items[0].orders) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-black text-[#03624C] dark:text-[#1857D8]">
                    {fmt(item.revenue)}
                  </p>
                  <p className="text-[12px] text-gray-400 dark:text-white/40">
                    ×{item.orders}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-sm text-gray-400 dark:text-white/30">
            {isKh ? "គ្មានទិន្នន័យ" : "No items"}
          </div>
        )}
      </div>
    </div>
  )
}