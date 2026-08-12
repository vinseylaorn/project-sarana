'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'


export function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="relative w-full">
      <table className={cn('w-full caption-bottom text-sm border-separate border-spacing-0', className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      className={cn(
        'bg-gray-100 dark:bg-[#242847]',
        '[&>tr>th:first-child]:rounded-tl-xl [&>tr>th:last-child]:rounded-tr-xl',
        className
      )}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

export function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors border-b border-gray-100 dark:border-white/[0.08]',
        className
      )}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        'sticky top-0 z-30 py-0 px-0 text-left align-middle font-bold bg-gray-100 dark:bg-[#242847]',
        className
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      className={cn('py-2.5 px-4 align-middle whitespace-nowrap text-gray-800 dark:text-white/85 font-normal', className)}
      {...props}
    />
  )
}

interface DataTableProps<T> {
  data: T[]
  columns: any[]
  sortConfig: { key: string | null; direction: 'asc' | 'desc' }
  onSort: (key: string) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage: number
  totalItems: number
  language: 'khmer' | 'english'
}

export function DataTableCustom<T>({
  data,
  columns,
  sortConfig,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  language,
}: DataTableProps<T>) {
  return (
    <div className="flex flex-col h-full border border-gray-200 dark:border-white/[0.08] rounded-xl overflow-hidden bg-white dark:bg-[#1e2235]">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-2 border-gray-200 dark:border-white/[0.12]">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  onClick={() => col.sortable && onSort(col.key)}
                  className={cn(col.sortable && 'cursor-pointer group', col.className)} >
                  <div
                    className={cn(
                      'flex items-center h-10 px-4 transition-colors text-[15px] ',
                      col.sortable && 'hover:bg-gray-200/60 dark:hover:bg-white/[0.1]',
                      col.className?.includes('text-right') && 'justify-end'
                    )} >
                    <span className="text-gray-800 dark:text-white/90 font-black tracking-wide">
                      {col.header}
                    </span>
                    {col.sortable && (
                      sortConfig.key === col.key ? (
                        sortConfig.direction === 'asc' ? (
                          <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-gray-600 dark:text-white/70" />
                        ) : (
                          <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-gray-600 dark:text-white/70" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-gray-300 dark:text-white/20 group-hover:text-gray-400 dark:group-hover:text-white/40 transition-colors" />
                      )
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length > 0 ? (
              <>
                {data.map((item, idx) => (
                  <TableRow key={idx} className="h-11">
                    {columns.map((col) => (
                      <TableCell key={col.key} className={cn('text-[13px]', col.className)}>
                        {col.render ? col.render(item, idx) : (item as any)[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            ) : (
              Array.from({ length: itemsPerPage }).map((_, i) => (
                <TableRow key={`none-${i}`} className="h-11 hover:bg-transparent relative">
                  {i === Math.floor(itemsPerPage / 2) ? (
                    <TableCell
                      colSpan={columns.length}
                      className="absolute inset-0 flex items-center justify-center border-none text-[12px] font-medium text-gray-300 dark:text-white/20"
                    >
                      {language === 'khmer' ? 'មិនមានទិន្នន័យ' : 'No results'}
                    </TableCell>
                  ) : (
                    columns.map((col) => (
                      <TableCell key={`none-cell-${i}-${col.key}`}>&nbsp;</TableCell>
                    ))
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-white/[0.08] shrink-0">
        <p className="text-[12px] text-gray-400 dark:text-white/35">
          {language === 'khmer' ? 'បង្ហាញ' : 'Showing'}{' '}
          <span className="font-medium text-gray-600 dark:text-white/60">
            {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
          </span>
          {' – '}
          <span className="font-medium text-gray-600 dark:text-white/60">
            {Math.min(currentPage * itemsPerPage, totalItems || 0)}
          </span>
          {' '}{language === 'khmer' ? 'នៃ' : 'of'}{' '}
          <span className="font-medium text-gray-600 dark:text-white/60">{totalItems || 0}</span>
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:text-gray-700 dark:hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <div className="px-2.5 h-7 flex items-center justify-center text-[12px] font-medium text-gray-500 dark:text-white/45 min-w-[48px]">
            {currentPage} / {totalPages || 1}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:text-gray-700 dark:hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}